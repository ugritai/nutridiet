import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://root:RootPass123%21@127.0.0.1:27017/fooddb?authSource=admin&directConnection=true"

async def auditar():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['fooddb']
    col = db['abuela_bedca']

    print("--- INFORME DE AUDITORÍA DE RECETAS (Estructura Nutridiet) ---")

    # 1. Validación de Macros (usando nutritional_info.energy_kcal)
    frutas_vacias = await col.count_documents({
        "category_esp": "Frutas",
        "$or": [
            {"nutritional_info": {"$exists": False}},
            {"nutritional_info.energy_kcal": 0}
        ]
    })
    print(f"[!] Frutas con 0 calorías o sin info nutricional: {frutas_vacias}")

    # 2. Verificación de Imágenes pendientes
    sin_imagen = await col.count_documents({"images": {"$size": 0}})
    print(f"[*] Total recetas pendientes de imagen (ComfyUI): {sin_imagen}")

    # 3. Muestreo Aleatorio de las NUEVAS recetas
    print("\n--- MUESTRA DE CONTROL (FRUTAS/BEBIDAS) ---")
    # Filtramos para ver específicamente lo que hemos insertado nuevo
    cursor = col.aggregate([
        {"$match": {"category_esp": {"$in": ["Frutas", "Bebidas"]}}},
        {"$sample": {"size": 5}}
    ])
    
    async for doc in cursor:
        print(f"\nID: {doc['_id']}")
        print(f"Título: {doc.get('title', 'N/A')}")
        print(f"Categoría: {doc.get('category_esp', 'N/A')}")
        
        # Acceso seguro a nutritional_info
        nutri = doc.get('nutritional_info', {})
        print(f"Macros: kcal: {nutri.get('energy_kcal')}, pro: {nutri.get('pro')}, car: {nutri.get('car')}")
        
        ingredientes = doc.get('ingredients', [])
        print(f"Ingredientes: {ingredientes[0] if ingredientes else 'Sin ingredientes'}")

    client.close()

if __name__ == "__main__":
    asyncio.run(auditar())