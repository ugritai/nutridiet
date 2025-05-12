# routers/ingredients.py
import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from database.connection import recipe_db_host, bedca_collection,embeddings_collection,images_collection
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from pathlib import Path
from typing import Optional
import re

from utils.food_utils import remove_stop_words, convert_objectid
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
import numpy as np
import torch

load_dotenv()
IMAGE_DIR = Path("static/image/api")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)


router = APIRouter(tags=["Ingredients"])

alimentos_collection = bedca_collection

def sanitize_filename(name: str) -> str:
    """生成安全的文件名，替换特殊字符为连字符"""
    return re.sub(r"[^\w\-]", "-", name).lower()

def save_image_to_db(name_esp: str, image_url: str):
    document = {
        "name_esp": name_esp,
        "image_url": image_url,
    }
    existing = images_collection.find_one({"name_esp": name_esp})
    print(f"[MongoDB] nombre encontrado")
    if not existing:
        images_collection.insert_one(document)
        print(f"[MongoDB] Imagen insertada: {name_esp}")
    else:
        print(f"[MongoDB] Imagen ya existe: {name_esp}")

def fetch_pixabay_images(keyword: str, api_key: str, retry: bool = False) -> Optional[dict]:
    """封装Pixabay API请求"""
    url = "https://pixabay.com/api/"
    params = {
        "key": api_key,
        "q": keyword,
        "image_type": "photo",
        "safesearch": "true",
        "lang": "es",
        "per_page": 3,
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        if data.get("totalHits", 0) > 0 and data.get("hits"):
            return data
            
        if not retry and " " in keyword:  # 如果含空格则尝试第一个单词
            print(f"No results, retrying with first word: {keyword.split()[0]}")
            return fetch_pixabay_images(keyword.split()[0], api_key, retry=True)
            
        return None

    except requests.exceptions.RequestException as e:
        print(f"Pixabay API request failed: {str(e)}")
        return None
    
def download_and_save_image(url: str, filename: str) -> bool:
    """下载并保存图片到本地"""
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        save_path = IMAGE_DIR / filename
        if save_path.exists():
            print(f"Image already exists locally: {filename}")
            return True
            
        with open(save_path, "wb") as f:
            f.write(response.content)
            
        print(f"Saved image locally: {filename}")
        return True
        
    except (IOError, requests.exceptions.RequestException) as e:
        print(f"Failed to download/save image: {str(e)}")
        return False

@router.get("/pixabay_search")
async def get_pixabay_image_api(search_term: str) -> str:
    # 验证API Key
    if not (api_key := os.getenv("PIXABAY_API_KEY")):
        print(f"Pixabay API key not configured")
        raise HTTPException(status_code=500, detail="API key missing")

    # 处理搜索词
    clean_search = search_term.strip()
    if not clean_search:
        raise HTTPException(status_code=400, detail="Empty search term")

    # 获取API数据
    api_data = fetch_pixabay_images(clean_search, api_key)
    if not api_data or not api_data.get("hits"):
        return ""  # 两次搜索均无结果

    # 处理图片结果
    first_image_url = api_data["hits"][0]["webformatURL"]
    
    # 生成安全文件名
    base_name = sanitize_filename(clean_search)[:50]  # 限制长度
    file_name = f"{base_name}.jpg"

    # 保存图片和记录
    if download_and_save_image(first_image_url, file_name):
        if save_image_to_db(clean_search, first_image_url):
            print(f"Successfully processed: {clean_search}")
        return first_image_url

    return ""  # 所有尝试均失败

@router.get("/pixabay_search")
async def get_pixabay_image(search_term: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Pixabay API key not found in environment variables.")
    
    words = search_term.strip().split()
    keyword = " ".join(words[:3]) 
    print(f"[Pixabay] 使用关键词搜索: '{keyword}'")

    # 准备请求
    url = "https://pixabay.com/api/"
    params = {
        "key": api_key,
        "q": keyword,
        "image_type": "photo",
        "safesearch": "true",
        "lang": "es",
        "per_page": 3,  
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("totalHits", 0) == 0 or not data.get("hits"):
           if data.get("totalHits", 0) == 0 or not data.get("hits"):
            # No results, retry with the first word of the search term
            print(f"[Pixabay] No se encontraron imágenes, intentando con la primera palabra: '{words[0]}'")
            keyword = words[0]  # Use only the first word of the search term
            params["q"] = keyword

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            # If still no results, return empty string
            if data.get("totalHits", 0) == 0 or not data.get("hits"):
                return ""  # No images found after retrying
       
        # 取第一张图片的 URL（可以根据需要改成列表）
        first_image_url = data["hits"][0]["webformatURL"]
        
        # 本地保存路径
        safe_name = "-".join(words[:3]).lower()
        file_name = f"{safe_name}.jpg"
        save_path = IMAGE_DIR / file_name

        # 如果文件已存在，直接返回
        if save_path.exists():
            print(f"[Exist] Imagen guardada: {save_path}")
            save_image_to_db(search_term, str(first_image_url))
            return first_image_url
        # 下载图片并保存
        img_data = requests.get(first_image_url, timeout=10).content
        with open(save_path, "wb") as f:
            f.write(img_data)

        print(f"[Saved] Imagen guardada: {save_path}")
        
        # Asegúrate de pasar una URL o el nombre correcto de la imagen
        save_image_to_db(search_term, str(first_image_url))  # Guardar la ruta como string
        return first_image_url

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Pixabay API request failed: {str(e)}")


#API
@router.get("/unsplash_search")
async def get_unsplash_image(search_term: str) -> str:
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        raise HTTPException(status_code=500, detail="Unsplash Access Key not found in environment variables.")
    
    words = search_term.strip().split()
    keyword = " ".join(words[:3])
    print(f"[Unsplash API] 使用关键词搜索: '{keyword}'")

    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": keyword,
        "per_page": 1,
        "client_id": access_key,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("results"):
            raise HTTPException(status_code=404, detail="No images found for the given search term.")

        # URL del primer imagen
        first_image_url = data["results"][0]["urls"]["regular"]
        
        # url local
        file_name = f"{search_term}.jpg"
        save_path = IMAGE_DIR / file_name

        #  si ya existe devolver directamente
        if save_path.exists():
            print(f"[Exist] Imagen guardada: {save_path}")
            return first_image_url
        # descarga la imagen y guardar 
        img_data = requests.get(first_image_url, timeout=10).content
        with open(save_path, "wb") as f:
            f.write(img_data)
            
        save_image_to_db(search_term, first_image_url, save_path)

        print(f"[Saved] Imagen guardada: {save_path}")
        return first_image_url
        #return {"image_url": f"/static/images/{file_name}"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Unsplash API request failed: {str(e)}")
    

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

model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

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
    image_doc = images_collection.find_one({"name_esp": nombre})
    if image_doc:
        image_url = image_doc.get("image_url")

    # 结构不变，只是多一个 image_url
    return {
        "alimento": jsonable_encoder(result),
        "sugeridos": sugeridos,
        "image_url": image_url,
    }

# Para obetener nombre de alimentos en español de una categorías en concreta del BedCA 
@router.get("/por_categoria/{categoria}")
async def get_alimentos_por_categoria(categoria: str):
    categoria = unidecode(categoria.lower().strip())

    alimentos_cursor = alimentos_collection.find()
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

# Para obetener nombre de alimentos en español de una categorías en concreta del BedCA 
@router.get("/por_categoria_imagen/{categoria}")
async def get_alimentos_por_categoria_imagen(categoria: str):
    categoria = unidecode(categoria.lower().strip())

    alimentos_cursor = alimentos_collection.find()
    resultado = []

    # Recorrer los alimentos de la categoría
    async for item in alimentos_cursor:
        cat = item.get("category_esp", "")
        if unidecode(cat.lower().strip()) == categoria:
            # Obtener la URL de la imagen del alimento
            image_url = await get_pixabay_image_api(item["name_esp"])

            # Agregar el alimento y la URL de la imagen al resultado
            resultado.append({
                "name_esp": item["name_esp"],
                "image_url": image_url  # Se incluye la URL de la imagen
            })

    resultado.sort(key=lambda x: x["name_esp"])  # Ordenar por nombre
    return {"alimentos": resultado}


# Para obetener todas las categorías de alimentos del BedCA
@router.get("/all_categories")
async def get_all_categories():
    try:
        categorias = await alimentos_collection.distinct("category_esp")
        
        return {"categories": categorias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")
    

@router.get("/ingredient_image/{name_en}")
def get_ingredient_image(name_en: str):
    result = images_collection.find_one({"name_en": name_en})
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"name_en": result["name_en"], "image": result["image"]}