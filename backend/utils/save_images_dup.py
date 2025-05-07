import os
import asyncio
from unidecode import unidecode
from io import BytesIO
from PIL import Image
import pytesseract
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from datasets import load_dataset
from database.connection import db_host

STATIC_DIR = "backend/static/images/alimentos"
os.makedirs(STATIC_DIR, exist_ok=True)

def tiene_marca_de_agua(img: Image.Image) -> bool:
    texto = pytesseract.image_to_string(img).lower()
    return any(marca in texto for marca in ["istock", "shutterstock", "alamy"])

def guardar_imagen(img: Image.Image, name_en: str) -> str:
    filepath = os.path.join(STATIC_DIR, f"{name_en}.jpg")
    img.save(filepath, format="JPEG")
    return filepath.replace("\\", "/")  # Compatibilidad con Windows

async def obtener_mongo_doc(collection, ingredient: str):
    return await collection.find_one({"name_en": {"$regex": f"^{ingredient}$", "$options": "i"}})

async def procesar_ingrediente(item, name_en_set, collection, ingredient_image_collection, seen):
    ingredient = item.get("ingredient", "").strip().lower()
    image_field = item.get("image")

    if not ingredient:
        print("⚠️ Ingrediente vacío, se omite")
        return None

    if not image_field:
        print(f"⚠️ '{ingredient}' no tiene imagen")
        return None

    normalized = unidecode(ingredient)

    if normalized in seen:
        print(f"⏩ Ya procesado antes: {ingredient}")
        return None

    if normalized not in name_en_set:
        print(f"❌ No está en name_en_set: {ingredient}")
        return None

    print(f"👉 Procesando válido: {ingredient}")

    mongo_doc = await collection.find_one({"name_en": {"$regex": f"^{ingredient}$", "$options": "i"}})

    if not mongo_doc:
        print(f"❌ No encontrado en MongoDB con regex: {ingredient}")
        return None

    name_en = mongo_doc.get("name_en", "").strip().lower().replace(" ", "_")
    name_es = mongo_doc.get("name_esp", "").strip()

    if not name_es:
        print(f"❌ name_es vacío para: {ingredient}")
        return None

    if name_es in seen:
        print(f"⏩ name_es ya procesado: {name_es}")
        return None

    if not isinstance(image_field, Image.Image):
        print(f"⛔ No es imagen válida para: {ingredient}, tipo: {type(image_field)}")
        return None

    if tiene_marca_de_agua(image_field):
        print(f"🚫 Imagen con marca de agua: {ingredient}")
        return None

    try:
        path = guardar_imagen(image_field, name_en)
        ingredient_image_collection.insert_one({
            "name_esp": name_es,
            "name_en": name_en,
            "path": path
        })
        seen.update([normalized, name_es])
        print(f"✅ Imagen guardada: {path}")
        return {"ingredient": ingredient, "name_esp": name_es}
    except Exception as e:
        print(f"❌ Error guardando imagen de {ingredient}: {e}")
        return None

async def comparar_y_guardar_duplicados():
    client = AsyncIOMotorClient("mongodb://localhost:27018")
    db = client["nutridiet"]
    collection = db["bedca"]
    ingredient_image_collection = db_host['ingredient_image']

    ingredient_image_collection.delete_many({})
    print("🧹 Limpiada la colección 'ingredient_image'.")

    # preparar set de ingredientes
    name_en_set = set()
    async for doc in collection.find({}, {"_id": 0, "name_en": 1}):
        name = doc.get("name_en", "").strip()
        if name:
            name_en_set.add(unidecode(name.lower()))

    print(f"🔍 name_en únicos en MongoDB: {len(name_en_set)}")

    dataset = load_dataset("Scuccorese/food-ingredients-dataset")["train"]
    print(f"📦 Total de elementos en dataset: {len(dataset)}")
    print(f"🧪 Primer elemento:\n{dataset[0]}")

    seen = set()
    duplicados = []

    for item in dataset:
        resultado = await procesar_ingrediente(item, name_en_set, collection, ingredient_image_collection, seen)
        if resultado:
            duplicados.append(resultado)

    print(f"\n📸 Total de imágenes guardadas: {len(duplicados)}")

if __name__ == "__main__":
    asyncio.run(comparar_y_guardar_duplicados())
