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

# Configuración de directorios
IMAGE_DIR = Path("static/images")
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# --- UTILIDADES DE TEXTO Y CONVERSIÓN ---

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
    return re.sub(r"[^\w\-]", "-", name).lower()

def quitar_tildes(texto):
    texto_normalizado = unicodedata.normalize('NFKD', texto)
    return ''.join([c for c in texto_normalizado if not unicodedata.combining(c)])

def remove_stop_words(nombre: str):
    stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'para', 'con', 'sin', 'por', 'entre', 'sobre', 'o', 'u']
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    return [p for p in palabras if p not in stopwords]

def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, (float, int)):
        return str(texto)
    fracciones = {'\u00BD': '0.5', '\u2153': '0.33', '\u00BC': '0.25', '\u2154': '0.67', '\u00BE': '0.75'}
    for uni, dec in fracciones.items():
        texto = texto.replace(uni, dec)
    return texto

# ✅ RESTAURADA: Esta es la que causaba el ImportError
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

# --- GESTIÓN DE BASE DE DATOS Y ARCHIVOS ---

def save_image_to_db(name_esp: str, image_url: str):
    document = {"name_esp": name_esp, "image_url": image_url}
    existing = images_collection.find_one({"name_esp": name_esp})
    if not existing:
        images_collection.insert_one(document)
    else:
        images_collection.update_one({"name_esp": name_esp}, {"$set": {"image_url": image_url}})

def download_and_save_image(url: str, filename: str) -> bool:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        save_path = IMAGE_DIR / filename
        with open(save_path, "wb") as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"❌ Error descargando imagen: {str(e)}")
        return False

# --- APIS EXTERNAS ---

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
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 429:
            return None
        response.raise_for_status()
        data = response.json()
        if data.get("totalHits", 0) > 0:
            return data
        if not retry and " " in keyword:
            return fetch_pixabay_images(keyword.split()[0], api_key, retry=True)
        return None
    except Exception:
        return None

# --- FUNCIONES ASÍNCRONAS ---

async def get_pixabay_image_api(name_esp: str) -> str:
    existing = images_collection.find_one({"name_esp": name_esp})
    if existing:
        return existing["image_url"]
    return "/img/placeholder-food.jpg"

async def actualizar_imagen_alimento(name_esp: str) -> str:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key no configurada")
    data = fetch_pixabay_images(name_esp, api_key)
    if not data or not data.get("hits"):
        return "/img/placeholder-food.jpg"
    nueva_url = data["hits"][0]["webformatURL"]
    filename = sanitize_filename(name_esp) + ".jpg"
    if download_and_save_image(nueva_url, filename):
        local_url = f"/img/{filename}"
        save_image_to_db(name_esp, local_url)
        return local_url
    return "/img/placeholder-food.jpg"

async def get_unsplash_image(search_term: str) -> str:
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key: return ""
    url = "https://api.unsplash.com/search/photos"
    params = {"query": search_term, "per_page": 1, "client_id": access_key}
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("results"):
            img_url = data["results"][0]["urls"]["regular"]
            filename = sanitize_filename(search_term) + ".jpg"
            if download_and_save_image(img_url, filename):
                local_url = f"/img/{filename}"
                save_image_to_db(search_term, local_url)
                return img_url
        return ""
    except Exception:
        return ""