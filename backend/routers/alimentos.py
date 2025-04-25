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


router = APIRouter(tags=["Ingredients"])
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")  # 从环境变量获取

async def get_pixabay_image(search_term: str) -> str:
    """ 从 Pixabay 获取图片 URL """
    try:
        params = {
            "key": PIXABAY_API_KEY,
            "q": search_term,
            "image_type": "photo",
            "per_page": 1
        }
        response = requests.get("https://pixabay.com/api/", params=params)
        data = response.json()
        
        if data["totalHits"] > 0:
            return data["hits"][0]["webformatURL"]
        return ""  # 没有找到返回空字符串
    except Exception as e:
        print(f"Pixabay API error: {e}")
        return ""
    
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
        # 如果找不到精确匹配，尝试根据名称提供建议
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

    # 获取相关的食物建议
    sugeridos = await sugerir_alimentos(nombre)

    # 返回食物详细信息和建议
    return {
        "alimento": jsonable_encoder(result),
        "sugeridos": sugeridos
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

    return {"alimentos": resultado}

@router.get("/all_categories")
async def get_all_categories():
    try:
        # 使用 Motor 异步查询 distinct
        categorias = await bedca_collection.distinct("category_esp")
        
        return {"categories": categorias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")