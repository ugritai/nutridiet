# routers/ingredients.py
import os
import requests
from fastapi import APIRouter, HTTPException
from database.connection import ingredient_categories_collection, recipe_db_host, bedca_collection

from models.schemas import IngredientCategory
from unidecode import unidecode


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
    collections = ['bedca']
    categories = set()  # Usamos un set para asegurarnos de que no haya categorías duplicadas

    for collection in collections:
        # Verificar si la colección existe
        if collection in recipe_db_host.list_collection_names():
            try:
                collection_data = recipe_db_host[collection].distinct("category_esp")
                categories.update(collection_data)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al acceder a la colección {collection}: {e}")
        else:
            raise HTTPException(status_code=404, detail=f"Collection {collection} no encontrada en la base de datos.")
    
    if not categories:
        raise HTTPException(status_code=404, detail="No se encontraron categorías.")

    # Convertimos el set a una lista y ordenamos alfabéticamente
    sorted_categories = sorted(list(categories))   
    return {"categories": sorted_categories}


def remove_tildes(text):
    return unidecode(text)

@router.get("/sugerir_alimentos/{nombre}")
async def sugerir_alimentos(nombre: str, limit: int = 10):
    nombre_sin_tildes = remove_tildes(nombre.lower())
    cursor = bedca_collection.find()
    alimentos_sugeridos = []

    async for doc in cursor:
        name_esp = doc.get("name_esp", "")
        name_sin_tildes = remove_tildes(name_esp.lower())

        if name_sin_tildes.startswith(nombre_sin_tildes):
            alimentos_sugeridos.append({"nombre": name_esp})
            if len(alimentos_sugeridos) >= limit:
                break

    if alimentos_sugeridos:
        return alimentos_sugeridos
    else:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")


