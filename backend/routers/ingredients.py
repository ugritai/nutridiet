# routers/ingredients.py
import os
import requests
from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host, bedca_collection,embeddings_collection,images_collection
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from pathlib import Path
from fastapi import Query


from utils.food_utils import remove_stop_words, convert_objectid, get_pixabay_image_api, actualizar_imagen_alimento
from sentence_transformers import SentenceTransformer, util
import numpy as np
import torch


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

# Para obetener nombre de alimentos en español de una categorías en concreta del BedCA 
@router.get("/por_categoria/{categoria}")
async def get_alimentos_por_categoria(
    categoria: str,
    salt: str = Query(None),
    sug: str = Query(None),
    total_fat: str = Query(None),
    trans: str = Query(None)
):
    categoria = unidecode(categoria.lower().strip())
    filtros = {}

    if salt:
        filtros["oms_lights.salt"] = salt
    if sug:
        filtros["oms_lights.sug"] = sug
    if total_fat:
        filtros["oms_lights.total_fat"] = total_fat
    if trans:
        filtros["oms_lights.trans"] = trans

    alimentos_cursor = alimentos_collection.find(filtros)
    resultado = []

    async for item in alimentos_cursor:
        cat = item.get("category_esp", "")
        if unidecode(cat.lower().strip()) == categoria:
            nombre_esp = item.get("name_esp")
            image_doc = images_collection.find_one({"name_esp": nombre_esp})
            image_url = image_doc.get("image_url") if image_doc else None

            resultado.append({
                "nombre": nombre_esp,
                "image_url": image_url
            })

    resultado.sort(key=lambda x: x["nombre"])
    return {"alimentos": resultado}

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

@router.get("/sugerir_alimentos/{nombre}")
async def sugerir_alimentos(nombre: str, limit: int = 10):
    nombre_normalizado = unidecode(nombre.strip().lower())
    
    embedding_input = model.encode(nombre_normalizado)
    embedding_input = torch.tensor(embedding_input, dtype=torch.float32)

    # Obtener todos los documentos de la base de datos
    docs = list(embeddings_collection.find({}, {"_id": 0, "name_esp": 1, "category_esp": 1, "embedding": 1}))
    
    similarities = []

    for doc in docs:
        doc_name_normalized = unidecode(doc["name_esp"].strip().lower())
        if doc_name_normalized == nombre_normalizado:
            continue
        
        categoria_doc = doc["category_esp"]
        emb = np.array(doc["embedding"])
        emb = torch.tensor(emb, dtype=torch.float32)
        sim = util.cos_sim(embedding_input, emb)[0][0].item()

        similarities.append((sim, doc, categoria_doc))

    if not similarities:
        raise HTTPException(status_code=404, detail="No se encontraron sugerencias")
    
    # Ordenar primero por similitud (de mayor a menor)
    top = sorted(similarities, key=lambda x: x[0], reverse=True)[:limit]

    # Obtener la categoría del término de búsqueda (nombre ingresado)
    categoria_objetivo = None
    for doc in docs:
        doc_name_normalized = unidecode(doc["name_esp"].strip().lower())
        if doc_name_normalized == nombre_normalizado:
            categoria_objetivo = doc["category_esp"]
            break
    
    # Ahora ordenamos para mostrar primero los elementos de la misma categoría
    top_ordenado = sorted(top, key=lambda x: x[2] != categoria_objetivo, reverse=False)

    # Generar los resultados finales
    resultados = [
        {
            "nombre": doc["name_esp"],
            "category_esp": categoria_doc,
            "similitud": round(sim, 4)
        }
        for sim, doc, categoria_doc in top_ordenado
    ]
    
    # Si no hay sugerencias después de filtrar el término exacto
    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron sugerencias distintas al término de búsqueda")

    return resultados

@router.get("/detalle_alimento/{nombre}")
async def get_alimento_detalle(nombre: str):
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

# Para obetener todas las categorías de alimentos del BedCA
@router.get("/all_categories")
async def get_all_categories():
    try:
        categorias = await alimentos_collection.distinct("category_esp")
        
        return {"categories": categorias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")
    
@router.get("/buscar_alimentos/{nombre}")
async def buscar_alimentos(nombre: str, limit: int = 5):
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
