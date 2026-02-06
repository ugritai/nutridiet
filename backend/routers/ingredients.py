# routers/ingredients.py
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks  # ✅ Añadido BackgroundTasks
from database.connection import recipe_db_host, bedca_collection, embeddings_collection, images_collection, food_portions_collection
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
import re
import unicodedata
import numpy as np
import torch

# VOLVER A PONER PARA EL DESPLIEGUE
from utils.food_utils import remove_stop_words, convert_objectid, get_pixabay_image_api, actualizar_imagen_alimento
from sentence_transformers import SentenceTransformer, util

router = APIRouter(tags=["Ingredients"])
alimentos_collection = bedca_collection

model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

@router.post("/actualizar_imagen/{name_esp}")
async def actualizar_imagen_endpoint(name_esp: str):
    url_actualizada = await actualizar_imagen_alimento(name_esp)
    return {"message": f"Imagen actualizada para {name_esp}", "image_url": url_actualizada}

@router.get("/ingredient_categories")
async def get_ingredient_categories():
    collections = ['all_ingredients']
    categories = set()

    try:
        existing_collections = await recipe_db_host.list_collection_names()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo colecciones: {e}")

    for collection_name in collections:
        if collection_name in existing_collections:
            try:
                collection = recipe_db_host[collection_name]
                category_data = await collection.distinct("category_esp")
                categories.update(category_data)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al acceder a {collection_name}: {e}")
        else:
            raise HTTPException(status_code=404, detail=f"Colección {collection_name} no encontrada.")

    if not categories:
        raise HTTPException(status_code=404, detail="No se encontraron categorías.")

    sorted_categories = sorted(categories)
    return {"categories": sorted_categories}

# --- LISTADO POR CATEGORÍA CON CARGA EN SEGUNDO PLANO ---
@router.get("/por_categoria/{categoria:path}")
async def get_alimentos_por_categoria(
    categoria: str,
    background_tasks: BackgroundTasks,  # ✅ Inyectamos tareas en segundo plano
    salt: str = Query(None),
    sug: str = Query(None),
    total_fat: str = Query(None),
    trans: str = Query(None)
):
    categoria_clean = categoria.strip()
    # MongoDB Regex para ignorar mayúsculas/minúsculas y manejar "/"
    filtros = {"category_esp": re.compile(f"^{re.escape(categoria_clean)}$", re.IGNORECASE)}

    if salt: filtros["oms_lights.salt"] = salt
    if sug: filtros["oms_lights.sug"] = sug
    if total_fat: filtros["oms_lights.total_fat"] = total_fat
    if trans: filtros["oms_lights.trans"] = trans

    alimentos_cursor = alimentos_collection.find(filtros, {"name_esp": 1, "_id": 0})
    resultado = []

    async for item in alimentos_cursor:
        nombre_esp = item.get("name_esp")
        
        # 1. Buscar si ya existe en la colección de imágenes
        image_doc = images_collection.find_one({"name_esp": nombre_esp})
        
        if image_doc:
            image_url = image_doc.get("image_url")
        else:
            # 2. Si no existe, usamos placeholder...
            image_url = "/img/placeholder-food.jpg"
            # 3. ...y programamos la descarga real SIN bloquear al usuario
            background_tasks.add_task(actualizar_imagen_alimento, nombre_esp)

        resultado.append({
            "nombre": nombre_esp,
            "image_url": image_url
        })

    resultado.sort(key=lambda x: x["nombre"])
    return {"alimentos": resultado}

@router.get("/all_categories")
async def get_all_categories():
    try:
        categorias = await alimentos_collection.distinct("category_esp")
        categorias_limpias = [c for c in categorias if c and c.strip()]
        categorias_limpias.sort()
        return {"categories": categorias_limpias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")

async def _sugerir_alimentos_logic(nombre: str, limit: int = 10):
    nombre_normalizado = unidecode(nombre.strip().lower())
    embedding_input = model.encode(nombre_normalizado)
    embedding_input = torch.tensor(embedding_input, dtype=torch.float32)

    docs = list(embeddings_collection.find({}, {"_id": 0, "name_esp": 1, "category_esp": 1, "embedding": 1}))
    similarities = []

    for doc in docs:
        doc_name_normalized = unidecode(doc["name_esp"].strip().lower())
        if doc_name_normalized == nombre_normalizado: continue
        emb = torch.tensor(np.array(doc["embedding"]), dtype=torch.float32)
        sim = util.cos_sim(embedding_input, emb)[0][0].item()
        similarities.append((sim, doc, doc["category_esp"]))

    if not similarities: return []
    top = sorted(similarities, key=lambda x: x[0], reverse=True)[:limit]
    
    categoria_objetivo = next((doc["category_esp"] for doc in docs if unidecode(doc["name_esp"].strip().lower()) == nombre_normalizado), None)
    top_ordenado = sorted(top, key=lambda x: x[2] != categoria_objetivo)

    return [{"nombre": doc["name_esp"], "category_esp": categoria_doc, "similitud": round(sim, 4)} for sim, doc, categoria_doc in top_ordenado]

@router.get("/sugerir_alimentos/{nombre}")
async def sugerir_alimentos(nombre: str, limit: int = 10):
    resultados = await _sugerir_alimentos_logic(nombre, limit)
    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron sugerencias")
    return resultados

# --- DETALLE DE ALIMENTO CON CARGA EN SEGUNDO PLANO ---
@router.get("/detalle_alimento/{nombre:path}")
async def get_alimento_detalle(nombre: str, background_tasks: BackgroundTasks):
    nombre_limpio = nombre.strip()
    pattern = re.compile(f"^{re.escape(nombre_limpio)}$", re.IGNORECASE)

    doc = await alimentos_collection.find_one({"name_esp": pattern}, {"_id": 0})

    if not doc:
        sugeridos = await _sugerir_alimentos_logic(nombre)
        return {
            "message": "No se encontró el alimento exacto.",
            "sugeridos": [a["nombre"] for a in sugeridos] if sugeridos else []
        }

    doc = convert_objectid(doc)

    # Buscar imagen
    image_doc = images_collection.find_one({"name_esp": pattern}, {"_id": 0, "image_url": 1})
    
    if image_doc:
        image_url = image_doc.get("image_url")
    else:
        # Si entran al detalle y no hay imagen, intentamos descargarla ahora
        image_url = "/img/placeholder-food.jpg"
        background_tasks.add_task(actualizar_imagen_alimento, nombre_limpio)

    sugeridos = await _sugerir_alimentos_logic(nombre)

    return {
        "alimento": doc,
        "sugeridos": sugeridos,
        "image_url": image_url
    }

@router.get("/buscar_alimentos/{nombre}")
async def buscar_alimentos(nombre: str, limit: int = 10):
    palabras = remove_stop_words(nombre)
    alimentos_sugeridos = set()
    
    for palabra in palabras:
        cursor = alimentos_collection.find()
        async for doc in cursor:
            name_esp = doc.get("name_esp", "")
            name_sin_tildes = unidecode(name_esp.lower())
            if palabra in name_sin_tildes:
                alimentos_sugeridos.add(name_esp)
            if len(alimentos_sugeridos) >= limit: break
        if len(alimentos_sugeridos) >= limit: break

    if alimentos_sugeridos:
        return [{"nombre": n} for n in list(alimentos_sugeridos)[:limit]]
    raise HTTPException(status_code=404, detail="Alimento no encontrado")

def normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    return ''.join(c for c in texto if unicodedata.category(c) != "Mn")

@router.get("/porcion_estandar/{food}")
async def obtener_porciones(food: str):
    food_normalizado = food.strip().lower()
    palabras = [p.strip() for p in food_normalizado.replace(',', ' ').split() if p]
    regex = re.compile(r'.*' + r'.*'.join(palabras) + r'.*', re.IGNORECASE)

    posibles = list(food_portions_collection.find(
        { "food": { "$regex": regex } },
        { "_id": 0, "food": 1, "standard_portion": 1, "units": 1, "household_measures": 1 }
    ))

    if not posibles:
        return {"food": food, "standard_portion": [], "units": [], "household_measures": []}

    def score(doc):
        nombre = doc["food"].lower()
        puntuacion = 0
        if food_normalizado in nombre: puntuacion += 2
        if doc.get("standard_portion"): puntuacion += 1
        return puntuacion

    mejor_match = max(posibles, key=score)
    return {
        "food": mejor_match.get("food", food),
        "standard_portion": mejor_match.get("standard_portion", []),
        "units": mejor_match.get("units", []),
        "household_measures": mejor_match.get("household_measures", [])
    }