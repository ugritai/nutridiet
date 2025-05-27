import re
from bson import ObjectId
import unicodedata

import requests
from typing import Optional
import os

from dotenv import load_dotenv
from pathlib import Path

from database.connection import images_collection
from fastapi import HTTPException

load_dotenv()
IMAGE_DIR = Path("static/images")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)


STOP_WORDS = {",", "-", " "}

def remove_stop_words(nombre: str):
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    palabras = [palabra for palabra in palabras if palabra not in STOP_WORDS]
    return palabras

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

# Función para convertir fracciones a su equivalente decimal
def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, float) or isinstance(texto, int):
        # Convertir números a cadena para permitir la conversión de fracciones
        texto = str(texto)
    texto = texto.replace('\u00BD', '0.5')  # ½ -> 0.5
    texto = texto.replace('\u2153', '0.33') # ⅓ -> 0.33
    texto = texto.replace('\u00BC', '0.25') # ¼ -> 0.25
    texto = texto.replace('\u2154', '0.67') # ⅔ -> 0.67
    texto = texto.replace('\u00BE', '0.75') # ¾ -> 0.75
    return texto
     
# Convertir unidades a gramos
def convertir_a_gramos(cantidad, unidad):
    conversion_factors = {
        'cucharada': 15,  # asumiendo 15g por cucharada
        'cucharadas': 15,  # asumiendo 15g por cucharada
        'rebanada': 15,  # asumiendo 15g por rebanada
        'rebanadas': 15,  # asumiendo 15g por rebanada
        'unidad': 100,  # asumiendo 100g por unidad
        'unidades': 100,  # asumiendo 100g por unidad
        'taza': 240,  # asumiendo 240g por taza
        'tazas': 240,  # asumiendo 240g por taza
        'kilo': 1000,
        'kilos': 1000,
        'dientes': 3, # asumiento diente de ajo
        'diente': 3 # asumiento diente de ajo
    }
    return cantidad * conversion_factors.get(unidad, 1)

def escape_regex_special_chars(text):
    regex_special_chars = r'[\\^$*+?.()|{}\[\]]'
    return re.sub(regex_special_chars, lambda match: rf'\{match.group(0)}', text)

# Función para eliminar palabras vacías del nombre del ingrediente
def remove_stopwords(nombre):
    # Lista de palabras vacías que quieres eliminar
    stopwords = ['el', 'la', 'los', 'las', 'u','un', 'una', 'unos', 'unas', 'de', 'para', 'con', 'sin', 'por', 'entre', 'sobre', 'o']
    # Patrón para identificar palabras vacías en el nombre
    # r'\b(?:el|la|los|las|u|un|una|unos|unas|de|para|con|sin|por|entre|sobre|o)\b'
    pattern = r'\b(?:{})\b'.format('|'.join(stopwords))
    # Eliminar palabras vacías del nombre
    nombre_sin_stopwords = re.sub(pattern, '', nombre, flags=re.IGNORECASE)
    
    return nombre_sin_stopwords.strip()

def quitar_tildes(texto):
    # Normalizar el texto a 'NFKD' para separar los caracteres de los acentos
    texto_normalizado = unicodedata.normalize('NFKD', texto)
    # Filtrar para quedarse solo con los caracteres base y eliminar las marcas diacríticas (acentos)
    texto_sin_tildes = ''.join([c for c in texto_normalizado if not unicodedata.combining(c)])
    return texto_sin_tildes

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

def extraer_cantidad_y_unidad(texto):
    texto = convertir_fracciones_a_decimal(texto)
    texto = texto.lower()
    patron = r'(\d+(?:[\.,]\d+)?)\s*([a-záéíóúüñ]+)?'
    match = re.search(patron, texto)
    if match:
        numero_str = match.group(1).replace(',', '.')  # Aceptar "1,5" como "1.5"
        try:
            cantidad = float(numero_str)
        except ValueError:
            cantidad = 100.0  # valor por defecto si la conversión falla
        unidad = match.group(2) if match.group(2) else 'gramos'
        return cantidad, unidad

    # Si no se encuentra coincidencia válida
    return 100.0, 'gramos'  # valor por defecto

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

async def get_pixabay_image_api(name_esp: str) -> str:
    # Primero revisar si ya está en la BD
    existing = images_collection.find_one({"name_esp": name_esp})
    if existing:
        print(f"[Pixabay] Imagen encontrada en BD: {name_esp}")
        return existing["image_url"]

    # Si no está, buscar en Pixabay
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        print("❌ API key de Pixabay no configurada")
        return ""

    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        print(f"⚠️ No se encontró imagen para: {name_esp}")
        return ""

    image_url = data["hits"][0]["webformatURL"]

    # (Opcional) Guardar imagen localmente
    filename = sanitize_filename(name_esp) + ".jpg"
    if download_and_save_image(image_url, filename):
        print(f"[Pixabay] Imagen descargada: {filename}")

    # Guardar en MongoDB
    local_url = f"http://localhost:8000/static/images/{filename}"
    save_image_to_db(name_esp, local_url)

    return image_url

async def actualizar_imagen_alimento(name_esp: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key de Pixabay no configurada")

    print(f"[Actualizar] Buscando nueva imagen para: {name_esp}")
    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        raise HTTPException(status_code=404, detail=f"No se encontró imagen para: {name_esp}")

    nueva_url = data["hits"][0]["webformatURL"]
    filename = sanitize_filename(name_esp) + ".jpg"

    # Descargar y reemplazar la imagen local
    if not download_and_save_image(nueva_url, filename):
        raise HTTPException(status_code=500, detail="Error descargando la imagen")

    # Construir la URL local permanente (ajusta el host si es necesario)
    local_url = f"http://localhost:8000/static/images/{filename}"

    # Actualizar la base de datos
    result = images_collection.update_one(
        {"name_esp": name_esp},
        {"$set": {"image_url": local_url}}
    )

    if result.matched_count == 0:
        # Si no existe, inserta nuevo documento
        images_collection.insert_one({
            "name_esp": name_esp,
            "image_url": local_url
        })
        print(f"[Actualizar] Documento insertado para: {name_esp}")
    else:
        print(f"[Actualizar] Documento actualizado para: {name_esp}")

    return local_url
