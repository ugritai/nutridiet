import asyncio
import aiohttp
from motor.motor_asyncio import AsyncIOMotorClient
import os
import csv
import aiofiles
import re
from fastapi import HTTPException

client = AsyncIOMotorClient('mongodb://localhost:27018')
db = client['nutridiet']
bedca_collection = db['bedca']

output_file = "imagenes_encontradas.csv"
local_image_dir = "static/image/api"
os.makedirs(local_image_dir, exist_ok=True)

# Sanitiza nombres para archivos
def sanitize_filename(nombre):
    return re.sub(r"[^\w\-_.]", "_", nombre.lower().strip())

# --------------------------
# Obtener imagen desde Pixabay
# --------------------------
async def get_pixabay_image(nombre: str, session: aiohttp.ClientSession) -> str | None:
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Pixabay API key not found in environment variables.")
    
    url = "https://pixabay.com/api/"
    params = {
        "key": api_key,
        "q": nombre,
        "image_type": "photo",
        "lang": "es",
        "safesearch": "true",
        "per_page": 3,
    }

    async with session.get(url, params=params) as response:
        remaining = int(response.headers.get("X-RateLimit-Remaining", 1))
        reset = int(response.headers.get("X-RateLimit-Reset", 1))

        if remaining == 0:
            print(f"🚫 Límite alcanzado. Esperando {reset} segundos...")
            await asyncio.sleep(reset + 1)

        if response.status != 200:
            print(f"❌ Error {response.status} para '{nombre}'")
            return None

        data = await response.json()
        hits = data.get("hits")
        if hits:
            return hits[0].get("webformatURL")
        return None

# --------------------------
# Descargar imagen local
# --------------------------
async def download_image(url: str, filename: str, session: aiohttp.ClientSession) -> str | None:
    try:
        async with session.get(url) as resp:
            if resp.status != 200:
                return None
            filepath = os.path.join(local_image_dir, filename)
            async with aiofiles.open(filepath, 'wb') as f:
                await f.write(await resp.read())
            return filepath
    except Exception as e:
        print(f"❌ Error al descargar {url}: {e}")
        return None

# --------------------------
# Función principal
# --------------------------
async def update_image_urls():
    updated = 0
    found_images = []

    async with aiohttp.ClientSession() as session:
        cursor = bedca_collection.find({}, {"nombre": 1, "image_url": 1})
        async for doc in cursor:
            nombre = doc.get("nombre")
            if not nombre or ("image_path" in doc and doc["image_path"]):
                continue

            image_url = await get_pixabay_image(nombre, session)
            if not image_url:
                print(f"❌ Sin imagen para: {nombre}")
                continue

            filename = sanitize_filename(nombre) + ".jpg"
            image_path = await download_image(image_url, filename, session)

            if image_path:
                await bedca_collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {
                        "image_url": image_url,
                        "image_path": image_path
                    }}
                )
                found_images.append((nombre, image_url, image_path))
                updated += 1
                print(f"✅ {nombre} guardado en {image_path}")
            else:
                print(f"⚠️ Fallo al guardar {nombre}")

    # Guardar CSV
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["nombre", "image_url", "image_path"])
        writer.writerows(found_images)

    print(f"\n📁 Imágenes guardadas en '{local_image_dir}'")
    print(f"📄 CSV exportado a '{output_file}'")
    print(f"✅ Total actualizados: {updated}")

if __name__ == "__main__":
    asyncio.run(update_image_urls())
