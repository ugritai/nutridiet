import asyncio
import os
from utils.food_utils import fetch_pixabay_images, download_and_save_image, sanitize_filename, save_image_to_db

async def descargar_grupo(api_key, mapeo, subcarpeta):
    """
    Descarga imágenes para un grupo específico (alimentos o recetas)
    """
    print(f"\n📂 Procesando grupo: {subcarpeta}...")
    
    # Aseguramos que el directorio de destino exista localmente en el contenedor
    # La función download_and_save_image debería manejar la ruta, 
    # pero aquí preparamos el prefijo del nombre.
    
    for cat_name, search_term in mapeo.items():
        data = fetch_pixabay_images(search_term, api_key)
        if data and data.get("hits"):
            image_url = data["hits"][0]["webformatURL"]
            
            # Formato de nombre: "alimentos/verduras.jpg" o "recetas/sopas.jpg"
            clean_name = sanitize_filename(cat_name)
            filename = f"{subcarpeta}/{clean_name}.jpg"
            
            # Nota: Asegúrate de que tu función download_and_save_image 
            # sea capaz de crear carpetas si no existen.
            if download_and_save_image(image_url, filename):
                local_url = f"/img/{filename}"
                # Guardamos en la DB indexando por subcarpeta para evitar colisiones
                save_image_to_db(f"{subcarpeta}_{cat_name}", local_url)
                print(f"  ✅ {subcarpeta} -> {cat_name} ({filename})")
        
        await asyncio.sleep(1.5) # Un poco más de margen para Pixabay

async def main():
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        print("❌ Error: PIXABAY_API_KEY no configurada.")
        return

    # 1. CATEGORÍAS DE ALIMENTOS (BEDCA)
    categorias_alimentos = {
        'Verduras': 'vegetables fresh',
        'Legumbres': 'legumes nuts',
        'Carne': 'raw meat beef chicken',
        'Frutas': 'fresh fruits',
        'Pescados': 'fish seafood',
        'Lácteos': 'dairy milk cheese',
        'Cereales': 'cereals bread pasta',
        'Bebidas': 'soft drinks water',
        'Dulces': 'sweets candy dessert',
        'Platos Preparados': 'prepared meals soup',
        'Aceites': 'olive oil cooking',
        'Otros': 'food ingredients'
    }

    # 2. CATEGORÍAS DE RECETAS (Específicas del frontend)
    categorias_recetas = {
        'Sopas': 'hot soup bowl',
        'Ensaladas': 'fresh salad plate',
        'Arroz': 'cooked rice dish',
        'Pasta': 'pasta spaghetti italian',
        'Guisos': 'stew pot cooking',
        'Pescado': 'cooked fish dish',
        'Carne': 'cooked meat steak',
        'Fruta': 'fruit salad',
        'Postres': 'sweet dessert cake'
    }

    # Ejecutar ambas descargas
    await descargar_grupo(api_key, categorias_alimentos, "alimentos")
    await descargar_grupo(api_key, categorias_recetas, "recetas")
    
    print("\n✅ ¡Proceso finalizado! Carpetas /img/alimentos y /img/recetas actualizadas.")

if __name__ == "__main__":
    asyncio.run(main())

# docker exec -it nutridiet-backend python -c "from database.connection import images_collection; images_collection.drop(); print('✅ Base de datos de imágenes reseteada')"

# docker cp backend/utils/descarga_categorias.py nutridiet-backend:/app/utils/descarga_categorias.py
# docker exec -it nutridiet-backend python -m utils.descarga_categorias