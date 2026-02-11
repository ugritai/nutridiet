import asyncio
from utils.food_utils import fetch_pixabay_images, download_and_save_image, sanitize_filename, save_image_to_db
import os

async def main():
    api_key = os.getenv("PIXABAY_API_KEY")
    
    # Mapeo: Nombre de la categoría -> Lo que buscamos en Pixabay
    categorias = {
        'Verduras': 'verduras frescas',
        'Legumbres': 'legumbres y frutos secos',
        'Carne': 'filete de carne cruda',
        'Frutas': 'frutas variadas',
        'Pescados': 'pescado fresco marisco',
        'Lácteos': 'productos lácteos leche queso',
        'Cereales': 'cereales pan trigo',
        'Bebidas': 'bebidas refrescantes',
        'Dulces': 'dulces chocolates postres',
        'Platos Preparados': 'plato de comida cocinada',
        'Aceites': 'aceite de oliva virgen extra',
        'Otros': 'alimentos ingredientes'
    }
    
    print("🚀 Bajando imágenes con nombres exactos para React...")
    
    for cat_name, search_term in categorias.items():
        data = fetch_pixabay_images(search_term, api_key)
        if data and data.get("hits"):
            image_url = data["hits"][0]["webformatURL"]
            # FORZAMOS el nombre del archivo para que coincida con la categoría
            filename = sanitize_filename(cat_name) + ".jpg"
            
            if download_and_save_image(image_url, filename):
                local_url = f"/img/{filename}"
                save_image_to_db(cat_name, local_url)
                print(f"✅ Guardado: {filename} (buscando: {search_term})")
        
        await asyncio.sleep(1)
        
    print("\n✅ ¡Hecho! Ahora los nombres coinciden con el frontend.")

if __name__ == "__main__":
    asyncio.run(main())