import asyncio
from database.connection import db_food
from utils.food_utils import get_pixabay_image_api 

async def main():
    print("🚀 Iniciando la descarga masiva de imágenes (¡Ahora de verdad!)...")
    
    coleccion = db_food['all_ingredients'] 
    total = coleccion.count_documents({})
    print(f"📦 Total de alimentos a revisar: {total}")
    
    alimentos = coleccion.find({})
    contador = 1
    
    for alimento in alimentos:
        # ¡AQUÍ ESTÁ LA MAGIA! Ahora buscamos "name_esp"
        nombre = alimento.get("name_esp")
        
        if nombre:
            print(f"[{contador}/{total}] Procesando: {nombre}")
            try:
                await get_pixabay_image_api(nombre)
            except Exception as e:
                print(f"⚠️ Error al descargar '{nombre}': {e}")
                
            # Pausa de 1 seg para respetar la API de Pixabay (son 3600 por hora)
            await asyncio.sleep(1) 
            
        contador += 1

    print("\n✅ ¡Descarga masiva completada al 100%!")

if __name__ == "__main__":
    asyncio.run(main())

# para el server
# docker cp backend\utils\descarga_masiva.py nutridiet-backend:/app/utils/descarga_masiva.py
# docker exec -it nutridiet-backend python -m utils.descarga_masiva