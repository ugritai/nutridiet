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

def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, float) or isinstance(texto, int):
        texto = str(texto)
    texto = texto.replace('\u00BD', '0.5')
    texto = texto.replace('\u2153', '0.33')
    texto = texto.replace('\u00BC', '0.25')
    texto = texto.replace('\u2154', '0.67')
    texto = texto.replace('\u00BE', '0.75')
    return texto
     
def convertir_a_gramos(cantidad, unidad):
    conversion_factors = {
        'cucharada': 15,
        'cucharadas': 15,
        'rebanada': 15,
        'rebanadas': 15,
        'unidad': 100,
        'unidades': 100,
        'taza': 240,
        'tazas': 240,
        'kilo': 1000,
        'kilos': 1000,
        'dientes': 3,
        'diente': 3
    }
    return cantidad * conversion_factors.get(unidad, 1)

def escape_regex_special_chars(text):
    regex_special_chars = r'[\\^$*+?.()|{}\[\]]'
    return re.sub(regex_special_chars, lambda match: rf'\{match.group(0)}', text)

def remove_stopwords(nombre):
    stopwords = ['el', 'la', 'los', 'las', 'u','un', 'una', 'unos', 'unas', 'de', 'para', 'con', 'sin', 'por', 'entre', 'sobre', 'o']
    pattern = r'\b(?:{})\b'.format('|'.join(stopwords))
    nombre_sin_stopwords = re.sub(pattern, '', nombre, flags=re.IGNORECASE)
    return nombre_sin_stopwords.strip()

def quitar_tildes(texto):
    texto_normalizado = unicodedata.normalize('NFKD', texto)
    texto_sin_tildes = ''.join([c for c in texto_normalizado if not unicodedata.combining(c)])
    return texto_sin_tildes

def sanitize_filename(name: str) -> str:
    return re.sub(r"[^\w\-]", "-", name).lower()

def save_image_to_db(name_esp: str, image_url: str):
    document = {
        "name_esp": name_esp,
        "image_url": image_url,
    }
    existing = images_collection.find_one({"name_esp": name_esp})
    if not existing:
        images_collection.insert_one(document)
        print(f"[MongoDB] Imagen insertada: {name_esp}")
    else:
        print(f"[MongoDB] Imagen ya existe: {name_esp}")

def fetch_pixabay_images(keyword: str, api_key: str, retry: bool = False) -> Optional[dict]:
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
            
        if not retry and " " in keyword:
            print(f"No results, retrying with first word: {keyword.split()[0]}")
            return fetch_pixabay_images(keyword.split()[0], api_key, retry=True)
            
        return None

    except requests.exceptions.RequestException as e:
        print(f"Pixabay API request failed: {str(e)}")
        return None
    
def download_and_save_image(url: str, filename: str) -> bool:
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
        numero_str = match.group(1).replace(',', '.')
        try:
            cantidad = float(numero_str)
        except ValueError:
            cantidad = 100.0
        unidad = match.group(2) if match.group(2) else 'gramos'
        return cantidad, unidad
    return 100.0, 'gramos'

# --- ASYNC FUNCTIONS ---

async def get_pixabay_image(search_term: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Pixabay API key not found in environment variables.")
    
    words = search_term.strip().split()
    keyword = " ".join(words[:3]) 
    print(f"[Pixabay] Usando keywords: '{keyword}'")

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

        # Retry logic if no results
        if data.get("totalHits", 0) == 0 or not data.get("hits"):
            print(f"[Pixabay] No images found, retrying with: '{words[0]}'")
            keyword = words[0]
            params["q"] = keyword
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("totalHits", 0) == 0 or not data.get("hits"):
                return ""

        first_image_url = data["hits"][0]["webformatURL"]
        
        safe_name = "-".join(words[:3]).lower()
        file_name = f"{safe_name}.jpg"
        save_path = IMAGE_DIR / file_name

        if save_path.exists():
            print(f"[Exist] Imagen guardada: {save_path}")
            # Ensure relative path for production
            local_url = f"/img/{file_name}"
            save_image_to_db(search_term, local_url)
            return first_image_url

        img_data = requests.get(first_image_url, timeout=10).content
        with open(save_path, "wb") as f:
            f.write(img_data)

        print(f"[Saved] Imagen guardada: {save_path}")
        
        # Ensure relative path for production
        local_url = f"/img/{file_name}"
        save_image_to_db(search_term, local_url)
        return first_image_url

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Pixabay API request failed: {str(e)}")

async def get_unsplash_image(search_term: str) -> str:
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        raise HTTPException(status_code=500, detail="Unsplash Access Key not found.")
    
    words = search_term.strip().split()
    keyword = " ".join(words[:3])
    
    url = "https://api.unsplash.com/search/photos"
    params = {"query": keyword, "per_page": 1, "client_id": access_key}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("results"):
            raise HTTPException(status_code=404, detail="No images found.")

        first_image_url = data["results"][0]["urls"]["regular"]
        file_name = f"{search_term}.jpg"
        save_path = IMAGE_DIR / file_name

        if save_path.exists():
            print(f"[Exist] Imagen guardada: {save_path}")
            return first_image_url
            
        img_data = requests.get(first_image_url, timeout=10).content
        with open(save_path, "wb") as f:
            f.write(img_data)
            
        # Ensure relative path for production
        local_url = f"/img/{file_name}"
        save_image_to_db(search_term, local_url)

        print(f"[Saved] Imagen guardada: {save_path}")
        return first_image_url

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Unsplash API request failed: {str(e)}")

async def get_pixabay_image_api(name_esp: str) -> str:
    # 1. Check DB
    existing = images_collection.find_one({"name_esp": name_esp})
    if existing:
        return existing["image_url"]

    # 2. Check Pixabay
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        print("❌ API key not configured")
        return ""

    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        print(f"⚠️ No image found for: {name_esp}")
        return ""

    image_url = data["hits"][0]["webformatURL"]

    # 3. Save Locally
    filename = sanitize_filename(name_esp) + ".jpg"
    if download_and_save_image(image_url, filename):
        print(f"[Pixabay] Downloaded: {filename}")

    # 4. Save to DB with RELATIVE PATH (for Production)
    local_url = f"/img/{filename}"
    save_image_to_db(name_esp, local_url)

    return image_url

async def actualizar_imagen_alimento(name_esp: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")

    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        raise HTTPException(status_code=404, detail=f"No image found for: {name_esp}")

    nueva_url = data["hits"][0]["webformatURL"]
    filename = sanitize_filename(name_esp) + ".jpg"

    if not download_and_save_image(nueva_url, filename):
        raise HTTPException(status_code=500, detail="Error downloading image")

    # RELATIVE PATH (Production compatible)
    local_url = f"/img/{filename}"

    result = images_collection.update_one(
        {"name_esp": name_esp},
        {"$set": {"image_url": local_url}}
    )

    if result.matched_count == 0:
        images_collection.insert_one({
            "name_esp": name_esp,
            "image_url": local_url
        })

    return local_url