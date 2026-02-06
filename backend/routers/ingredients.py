# routers/ingredients.py
from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host, bedca_collection,embeddings_collection,images_collection,food_portions_collection
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from fastapi import Query
from bson.json_util import dumps
import re

#VOLVER A PONER PARA EL DESPLIEGUE

from utils.food_utils import remove_stop_words, convert_objectid, get_pixabay_image_api, actualizar_imagen_alimento
#comentar para hacer pruebas sin torch '''
from sentence_transformers import SentenceTransformer, util
import numpy as np
import torch
#comentar para hacer pruebas sin torch '''


router = APIRouter(tags=["Ingredients"])

alimentos_collection = bedca_collection

#VOLVER A PONER PARA EL DESPLIEGUE

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

# Para obetener nombre de alimentos en español de una categorías en concreta del BedCA 
# 1. Usamos :path para permitir nombres con "/"
@router.get("/por_categoria/{categoria:path}")
async def get_alimentos_por_categoria(
    categoria: str,
    salt: str = Query(None),
    sug: str = Query(None),
    total_fat: str = Query(None),
    trans: str = Query(None)
):
    categoria_clean = categoria.strip()
    filtros = {"category_esp": re.compile(f"^{re.escape(categoria_clean)}$", re.IGNORECASE)}

    # Filtros nutricionales (mantenemos los tuyos...)
    if salt: filtros["oms_lights.salt"] = salt
    # ... resto de filtros ...

    alimentos_cursor = alimentos_collection.find(filtros, {"name_esp": 1, "_id": 0})
    resultado = []

    async for item in alimentos_cursor:
        nombre_esp = item.get("name_esp")
        
        # BUSCAMOS SOLO SI YA EXISTE. NO DESCARGAMOS.
        image_doc = images_collection.find_one({"name_esp": nombre_esp})
        image_url = image_doc.get("image_url") if image_doc else None

        resultado.append({
            "nombre": nombre_esp,
            "image_url": image_url # Puede ser None
        })

    resultado.sort(key=lambda x: x["nombre"])
    return {"alimentos": resultado}
# 2. Aseguramos que solo se devuelvan categorías que tienen alimentos
@router.get("/all_categories")
async def get_all_categories():
    try:
        # distinct() en MongoDB solo devuelve valores que realmente están en los documentos activos
        categorias = await alimentos_collection.distinct("category_esp")
        # Filtramos posibles valores nulos o vacíos
        categorias_limpias = [c for c in categorias if c and c.strip()]
        categorias_limpias.sort()
        
        return {"categories": categorias_limpias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")

# Para obetener imagen del alimento por categoría y guardar en base de datos
@router.get("/por_categoria_imagen/{categoria}")
async def get_alimentos_por_categoria_imagen(categoria: str):
    categoria = unidecode(categoria.lower().strip())

    alimentos_cursor = alimentos_collection.find()
    resultado = []

    async for item in alimentos_cursor:
        cat = item.get("category_esp", "")
        if unidecode(cat.lower().strip()) == categoria:
            nombre = item.get("name_esp", "")
            image_url = await get_pixabay_image_api(nombre)

            resultado.append({
                "name_esp": nombre,
                "image_url": image_url
            })

    resultado.sort(key=lambda x: x["name_esp"])
    return {"alimentos": resultado}

async def _sugerir_alimentos_logic(nombre: str, limit: int = 10):
    #comentar para hacer pruebas sin torch '''
    nombre_normalizado = unidecode(nombre.strip().lower())

    embedding_input = model.encode(nombre_normalizado)
    embedding_input = torch.tensor(embedding_input, dtype=torch.float32)

    docs = list(
        embeddings_collection.find(
            {},
            {"_id": 0, "name_esp": 1, "category_esp": 1, "embedding": 1}
        )
    )

    similarities = []

    for doc in docs:
        doc_name_normalized = unidecode(doc["name_esp"].strip().lower())
        if doc_name_normalized == nombre_normalizado:
            continue

        emb = torch.tensor(np.array(doc["embedding"]), dtype=torch.float32)
        sim = util.cos_sim(embedding_input, emb)[0][0].item()

        similarities.append((sim, doc, doc["category_esp"]))

    if not similarities:
        return []

    top = sorted(similarities, key=lambda x: x[0], reverse=True)[:limit]

    categoria_objetivo = next(
        (
            doc["category_esp"]
            for doc in docs
            if unidecode(doc["name_esp"].strip().lower()) == nombre_normalizado
        ),
        None
    )

    top_ordenado = sorted(
        top,
        key=lambda x: x[2] != categoria_objetivo
    )

    return [
        {
            "nombre": doc["name_esp"],
            "category_esp": categoria_doc,
            "similitud": round(sim, 4)
        }
        for sim, doc, categoria_doc in top_ordenado
    ]
    #comentar para hacer pruebas sin torch '''
    #return [ ]

@router.get("/sugerir_alimentos/{nombre}")
async def sugerir_alimentos(nombre: str, limit: int = 10):
    resultados = await _sugerir_alimentos_logic(nombre, limit)

    if not resultados:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron sugerencias"
        )

    return resultados


'''
@router.get("/detalle_alimento/{nombre}")
async def get_alimento_detalle(nombre: str):

    doc = await alimentos_collection.find_one(
    { "name_esp": { "$regex": "^Alioli$", "$options": "i" } },
    { "_id": 0 }
    )

    print("DOC:", doc)    

    nombre_normalizado = unidecode(nombre.strip().lower())
    
    cursor = alimentos_collection.find({}, {"_id": 0})
    async for doc in cursor:
        nombre_doc = doc.get("name_esp", "")
        nombre_doc_normalizado = unidecode(nombre_doc.strip().lower())
        if nombre_normalizado == nombre_doc_normalizado:
            result = doc
            break
    else:
        sugeridos = await sugerir_alimentos(nombre)
        if sugeridos:
            suggested_names = [alimento["nombre"] for alimento in sugeridos]
            return {
                "message": "No se encontró el alimento exacto. Pero puede que le interese alguno de estos alimentos:",
                "sugeridos": suggested_names
            }
        else:
            raise HTTPException(status_code=404, detail="Alimento no encontrado")

    result = convert_objectid(result)

    sugeridos = await sugerir_alimentos(nombre)
    
    image_url = None
    for image in images_collection.find({}):  # Aquí no es asíncrono porque estamos usando pymongo
        nombre_img_normalizado = unidecode(image.get("name_esp", "").strip().lower())
        if nombre_img_normalizado == nombre_normalizado:
            image_url = image.get("image_url")
            break
        
    if not image_url:
        print("No se encontró imagen para el alimento.")  # Depuración

    sugeridos = await sugerir_alimentos(nombre)

    return {
        "alimento": jsonable_encoder(result),
        "sugeridos": sugeridos,
        "image_url": image_url,
    }
'''

# routers/ingredients.py (continuación)

@router.get("/detalle_alimento/{nombre:path}")
async def get_alimento_detalle(nombre: str):
    nombre_limpio = nombre.strip()
    nombre_normalizado = unidecode(nombre_limpio.lower())

    pattern = re.compile(f"^{re.escape(nombre_limpio)}$", re.IGNORECASE)

    doc = await alimentos_collection.find_one(
        {"name_esp": pattern},
        {"_id": 0}
    )

    if not doc:
        sugeridos = await _sugerir_alimentos_logic(nombre)
        if sugeridos:
            return {
                "message": "No se encontró el alimento exacto.",
                "sugeridos": [a["nombre"] for a in sugeridos]
            }
        raise HTTPException(status_code=404, detail="Alimento no encontrado")

    # 🔧 FIX REAL
    doc = convert_objectid(doc)

    image_doc = images_collection.find_one(
        {"name_esp": pattern},
        {"_id": 0, "image_url": 1}
    )
    image_url = image_doc.get("image_url") if image_doc else None

    sugeridos = await _sugerir_alimentos_logic(nombre)

    return {
        "alimento": doc,
        "sugeridos": sugeridos,
        "image_url": image_url
    }


@router.get("/buscar_alimentos/{nombre}")
async def buscar_alimentos(nombre: str, limit: int = 10):
    palabras = remove_stop_words(nombre)
    
    alimentos_sugeridos = set()  # eliminar repetidos
    
    for palabra in palabras:
        cursor = alimentos_collection.find()
        
        async for doc in cursor:
            name_esp = doc.get("name_esp", "")
            name_sin_tildes = unidecode(name_esp.lower()) 

            if palabra in name_sin_tildes:
                alimentos_sugeridos.add(name_esp)
            
            if len(alimentos_sugeridos) >= limit:
                break  
        
        if len(alimentos_sugeridos) >= limit:
            break

    alimentos_sugeridos = list(alimentos_sugeridos)
    print(alimentos_sugeridos)
    if alimentos_sugeridos:
        return [{"nombre": nombre} for nombre in alimentos_sugeridos[:limit]] 
    else:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")

import unicodedata

def normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFD", texto)
    return ''.join(c for c in texto if unicodedata.category(c) != "Mn")

@router.get("/porcion_estandar/{food}")
async def obtener_porciones(food: str):
    food_normalizado = food.strip().lower()
    print(f"\n🔍 Buscando por: '{food_normalizado}'")

    palabras = [p.strip() for p in food_normalizado.replace(',', ' ').split() if p]
    regex = re.compile(r'.*' + r'.*'.join(palabras) + r'.*', re.IGNORECASE)

    posibles = list(food_portions_collection.find(
        { "food": { "$regex": regex } },
        { "_id": 0, "food": 1, "standard_portion": 1, "units": 1, "household_measures": 1 }
    ))

    print(f"✅ Posibles encontrados ({len(posibles)}): {[d['food'] for d in posibles]}")

    if not posibles:
        return {
            "food": food,
            "standard_portion": [],
            "units": [],
            "household_measures": []
        }

    def score(doc):
        nombre = doc["food"].lower()
        puntuacion = 0
        if food_normalizado in nombre:
            puntuacion += 2
        if doc.get("standard_portion"):
            puntuacion += 1
        return puntuacion

    mejor_match = max(posibles, key=score)
    print(f"🏆 Mejor coincidencia: {mejor_match['food']}")

    return {
        "food": mejor_match.get("food", food),
        "standard_portion": mejor_match.get("standard_portion", []),
        "units": mejor_match.get("units", []),
        "household_measures": mejor_match.get("household_measures", [])
    }

