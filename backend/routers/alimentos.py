# routers/ingredients.py
import os
import requests
from fastapi import APIRouter, HTTPException
from database.connection import ingredient_categories_collection, recipe_db_host, bedca_collection
from models.schemas import IngredientCategory
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import re
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Ingredients"])
@router.get("/pixabay_search")
async def get_pixabay_image(search_term: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Pixabay API key not found in environment variables.")

    # 准备请求
    url = "https://pixabay.com/api/"
    params = {
        "key": api_key,
        "q": search_term,
        "image_type": "photo",
        "safesearch": "true",
        "per_page": 3,  # 最多拿3张，够用了
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("totalHits", 0) == 0 or not data.get("hits"):
            raise HTTPException(status_code=404, detail="No images found for the given search term.")

        # 取第一张图片的 URL（可以根据需要改成列表）
        first_image_url = data["hits"][1]["webformatURL"]
        return first_image_url

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Pixabay API request failed: {str(e)}")
    
    
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

STOP_WORDS = {"de", "con", "y", "a", "en", "por", "para", "el", "la", "los", "las", "un", "una", "del", "al", "que", "es", "como"}

def remove_stop_words(nombre: str):
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    palabras = [palabra for palabra in palabras if palabra not in STOP_WORDS]
    return palabras

@router.get("/sugerir_alimentos/{nombre}")
async def sugerir_alimentos(nombre: str, limit: int = 10):
    palabras = remove_stop_words(nombre)
    
    alimentos_sugeridos = set()  # eliminar repetidos
    
    for palabra in palabras:
        cursor = bedca_collection.find()
        
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
    
    if alimentos_sugeridos:
        return [{"nombre": nombre} for nombre in alimentos_sugeridos[:limit]]  # 返回最多10个结果
    else:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")

def convert_objectid(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, dict):
                convert_objectid(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, ObjectId):
                        item = str(item)
                    elif isinstance(item, dict):
                        convert_objectid(item)
    return data

@router.get("/detalle_alimento/{nombre}")
async def get_alimento_detalle(nombre: str):
    nombre_normalizado = unidecode(nombre.strip().lower())
    
    cursor = bedca_collection.find({}, {"_id": 0})
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

    # 增加：找图片
    try:
        image_url = await get_pixabay_image(nombre)
    except Exception:
        image_url = None

    # 结构不变，只是多一个 image_url
    return {
        "alimento": jsonable_encoder(result),
        "sugeridos": sugeridos,
        "image_url": image_url,
    }

    
@router.get("/por_categoria/{categoria}")
async def get_alimentos_por_categoria(categoria: str):
    categoria = unidecode(categoria.lower().strip())

    alimentos_cursor = bedca_collection.find()
    resultado = []

    async for item in alimentos_cursor:
        cat = item.get("category_esp", "")
        if unidecode(cat.lower().strip()) == categoria:
            resultado.append(item["name_esp"])
    resultado.sort()
    return {"alimentos": resultado}

@router.get("/all_categories")
async def get_all_categories():
    try:
        # 使用 Motor 异步查询 distinct
        categorias = await bedca_collection.distinct("category_esp")
        
        return {"categories": categorias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")