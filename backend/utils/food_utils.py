import re
import os
import unicodedata
import requests
from pathlib import Path
from typing import Optional
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import HTTPException
from database.connection import images_collection

load_dotenv()

# Directorio de imágenes
IMAGE_DIR = Path("static/images")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# --- UTILIDADES DE TEXTO ---

def convert_objectid(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, dict):
                convert_objectid(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        convert_objectid(item)
    return data

def sanitize_filename(name: str) -> str:
    name = quitar_tildes(name)
    return re.sub(r"[^\w\-]", "-", name).lower()

def quitar_tildes(texto):
    texto_normalizado = unicodedata.normalize('NFKD', texto)
    return ''.join([c for c in texto_normalizado if not unicodedata.combining(c)])

def remove_stop_words(nombre: str):
    stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'para', 'con', 'sin', 'por', 'entre', 'sobre', 'o', 'u', 'y', 'en']
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    return [p for p in palabras if p not in stopwords]

# --- UTILIDADES NUTRICIONALES (Para evitar errores de importación) ---

def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, (float, int)):
        return str(texto)
    fracciones = {'\u00BD': '0.5', '\u2153': '0.33', '\u00BC': '0.25', '\u2154': '0.67', '\u00BE': '0.75'}
    for uni, dec in fracciones.items():
        texto = texto.replace(uni, dec)
    return texto

def convertir_a_gramos(cantidad, unidad):
    conversion_factors = {
        'cucharada': 15, 'cucharadas': 15, 'rebanada': 15, 'rebanadas': 15,
        'unidad': 100, 'unidades': 100, 'taza': 240, 'tazas': 240,
        'kilo': 1000, 'kilos': 1000, 'dientes': 3, 'diente': 3
    }
    return cantidad * conversion_factors.get(unidad, 1)

def extraer_cantidad_y_unidad(texto):
    texto = convertir_fracciones_a_decimal(texto).lower()
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

# --- GESTIÓN DE DISCO Y DB ---

def save_image_to_db(name_esp: str, image_url: str):
    document = {"name_esp": name_esp, "image_url": image_url}
    images_collection.update_one({"name_esp": name_esp}, {"$set": document}, upsert=True)

def download_and_save_image(url: str, filename: str) -> bool:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        with open(IMAGE_DIR / filename, "wb") as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"❌ Error descarga {filename}: {str(e)}")
        return False

# --- BÚSQUEDA RELEVANTE EN PIXABAY ---

def fetch_pixabay_images(keyword: str, api_key: str) -> Optional[dict]:
    url = "https://pixabay.com/api/"
    
    # 1. Intentar con el nombre completo
    params = {
        "key": api_key, "q": keyword, "image_type": "photo",
        "safesearch": "true", "lang": "es", "per_page": 3
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 429: return None
        data = res.json()
        if data.get("totalHits", 0) > 0: return data

        # 2. Si falla, limpiar "stop words" y buscar por palabras clave (más preciso que buscar solo la 1ª palabra)
        keywords_clean = " ".join(remove_stop_words(keyword))
        if keywords_clean and keywords_clean != keyword.lower():
            params["q"] = keywords_clean
            res = requests.get(url, params=params, timeout=5)
            data = res.json()
            if data.get("totalHits", 0) > 0: return data
            
        return None
    except:
        return None

# --- FUNCIONES DE CARGA (LAZY) ---

async def get_pixabay_image_api(name_esp: str) -> str:
    """
    CONSULTA RÁPIDA: Solo mira la DB. 
    Retorna la URL si existe o el Placeholder si no.
    """
    existing = images_collection.find_one({"name_esp": name_esp})
    if existing:
        return existing["image_url"]
    return "/img/placeholder-food.jpg"

async def actualizar_imagen_alimento(name_esp: str) -> str:
    """
    TRABAJO PESADO: Descarga la imagen. 
    Se debe llamar con BackgroundTasks.
    """
    # 1. Verificación de seguridad: ¿Ya tenemos la imagen en DB?
    existing = images_collection.find_one({"name_esp": name_esp})
    if existing and existing["image_url"] != "/img/placeholder-food.jpg":
        return existing["image_url"]

    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key: return "/img/placeholder-food.jpg"

    # 2. Buscar imagen con lógica de relevancia
    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        return "/img/placeholder-food.jpg"

    # 3. Descargar y Guardar
    nueva_url = data["hits"][0]["webformatURL"]
    filename = sanitize_filename(name_esp) + ".jpg"
    
    # Solo descargar si el archivo no existe físicamente
    if (IMAGE_DIR / filename).exists() or download_and_save_image(nueva_url, filename):
        local_url = f"/img/{filename}"
        save_image_to_db(name_esp, local_url)
        return local_url

    return "/img/placeholder-food.jpg"