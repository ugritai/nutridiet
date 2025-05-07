import os
from datasets import load_dataset
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
from tqdm import tqdm
import asyncio
import re

# Cargar dataset y mapeo de etiquetas
ds = load_dataset("SunnyAgarwal4274/Food_Ingredients")
data = ds["validation"]
label_map = data.features["label"].int2str  # Mapea int -> nombre (ej. 49 -> "Turnip")

# Conexión a MongoDB
client = AsyncIOMotorClient("mongodb://localhost:27018")
db = client["nutridiet"]
bedca_collection = db["bedca"]

# Carpeta donde guardar imágenes
output_dir = "imagenes_filtradas/otros"
os.makedirs(output_dir, exist_ok=True)

# Diccionario para evitar duplicados
name_counts = {}

async def guardar_imagenes_filtradas():
    total_guardadas = 0

    for item in tqdm(data):
        name_en = label_map(item["label"])  # Convertir índice a nombre (ej. "Turnip")
        image = item["image"]

        # Buscar en Mongo insensible a mayúsculas
        doc = await bedca_collection.find_one({
            "name_en": {
                "$regex": f"^{re.escape(name_en)}$",
                "$options": "i"
            }
        })

        if doc:
            # Contador para nombres repetidos
            count = name_counts.get(name_en, 0) + 1
            name_counts[name_en] = count

            # Nombre de archivo seguro
            safe_name = name_en.replace("/", "_").replace("\\", "_").replace(" ", "_")
            filename = f"{safe_name}_{count}.jpg"
            path = os.path.join(output_dir, filename)

            # Convertir imagen si es necesario
            if image.mode != "RGB":
                image = image.convert("RGB")

            image.save(path)
            total_guardadas += 1

    print(f"✅ Total de imágenes guardadas: {total_guardadas}")

# Ejecutar
asyncio.run(guardar_imagenes_filtradas())
