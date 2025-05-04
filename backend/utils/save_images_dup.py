import os
from unidecode import unidecode
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from datasets import load_dataset
import asyncio
from io import BytesIO
from PIL import Image
from database.connection import db_host

# Función principal
async def comparar_y_guardar_duplicados():
    # 1. Conectar a MongoDB y obtener name_en únicos
    client = AsyncIOMotorClient("mongodb://localhost:27018")
    db = client["nutridiet"]
    collection = db["bedca"]

    # Conexión a la colección donde se guardarán las imágenes
    ingredient_image_collection = db_host['ingredient_image']

    # Limpiar la colección ingredient_image antes de empezar
    ingredient_image_collection.delete_many({})  # Eliminar todos los documentos en la colección
    print("🧹 Limpiada la colección 'ingredient_image'.")

    name_en_set = set()
    cursor = collection.find({}, {"_id": 0, "name_en": 1})  # Buscar name_en en MongoDB
    async for doc in cursor:
        name = doc.get("name_en", "").strip()  # Obtener name_en
        if name:
            name_en_set.add(unidecode(name.lower()))

    print(f"🔍 name_en únicos en MongoDB: {len(name_en_set)}")

    # 2. Cargar dataset
    dataset = load_dataset("Scuccorese/food-ingredients-dataset")
    data = dataset["train"]

    # 3. Comparar duplicados y almacenar imágenes en la colección
    duplicados = []
    seen = set()  # Para rastrear qué name_es ya se han procesado

    for item in data:
        ingredient = item.get("ingredient", "").strip().lower()
        image = item.get("image", None)

        if not ingredient or not image:
            continue

        normalized = unidecode(ingredient)
        if normalized in seen:
            continue  # Evitar guardar múltiples veces
        seen.add(normalized)

        # Comparar ingredient con name_en en MongoDB
        if normalized in name_en_set:  # Si hay coincidencia con name_en
            # Buscar en MongoDB para obtener el name_es correspondiente
            mongo_doc = await collection.find_one({"name_en": {"$regex": f"^{ingredient}$", "$options": "i"}})
            if mongo_doc:
                name_es = mongo_doc.get("name_es", "").strip()  # Obtener name_es

                # Verificar si ya se procesó este name_es
                if name_es in seen:
                    continue

                safe_name = ingredient.replace(" ", "_")
                try:
                    # Convertir imagen a binario
                    img_byte_arr = BytesIO()
                    image.convert("RGB").save(img_byte_arr, format="JPEG")
                    img_byte_arr.seek(0)

                    # Insertar en la colección ingredient_image
                    ingredient_image_collection.insert_one({
                        "name_es": name_es,  # Guardar name_es
                        "image": img_byte_arr.getvalue()  # Guardar la imagen en formato binario
                    })
                    duplicados.append({
                        "ingredient": ingredient,
                        "name_es": name_es,
                    })
                    seen.add(name_es)  # Añadir name_es al conjunto de vistos
                    print(f"✅ Imagen guardada en ingredient_image: {name_es}.jpg")
                except Exception as e:
                    print(f"❌ Error guardando {ingredient}: {e}")

# Ejecutar función
asyncio.run(comparar_y_guardar_duplicados())
