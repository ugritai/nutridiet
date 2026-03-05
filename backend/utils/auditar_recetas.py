import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# Entorno Docker
MONGO_URI = "mongodb://root:RootPass123%21@fooddb:27017/fooddb?authSource=admin"

async def auditar():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['fooddb']
    col = db['abuela_bedca']

    print("\n" + "="*60)
    print("--- INFORME DE AUDITORÍA DE RECETAS (Estructura Nutridiet) ---")
    print("="*60)

    # --- VERIFICACIÓN DE INSERCIÓN (Script de Carga) ---
    print("\n🔍 VERIFICACIÓN DE INSERCIÓN:")
    
    # Filtro exacto según tu script de carga (sin tildes y con campo 'categoria')
    filtro_carga = {"source": "Generacion Automatica Nutridiet"}
    
    total_nuevas = await col.count_documents(filtro_carga)
    total_frutas = await col.count_documents({**filtro_carga, "categoria": "Frutas"})
    total_bebidas = await col.count_documents({**filtro_carga, "categoria": "Bebidas"})

    if total_nuevas > 0:
        print(f"✅ ÉXITO: Se han encontrado {total_nuevas} recetas nuevas en total.")
        print(f"   - Frutas: {total_frutas}")
        print(f"   - Bebidas: {total_bebidas}")
        
        # Muestra de control para validar el buscador (origin_ISO)
        print("\n--- EJEMPLO DE CONTROL PARA EL BUSCADOR ---")
        ejemplo = await col.find_one(filtro_carga)
        print(f" > Título: {ejemplo.get('title')}")
        print(f" > ISO: {ejemplo.get('origin_ISO')} (Debe ser ESP)")
        print(f" > Categoría: {ejemplo.get('categoria')} (Para el Frontend)")
        print(f" > Category: {ejemplo.get('category')} (Para el Backend)")
        print("-" * 40)
    else:
        print("❌ ERROR: No se han encontrado recetas con el source 'Generacion Automatica Nutridiet'.")

    # 1. Validación de Macros
    vacias = await col.count_documents({
        **filtro_carga,
        "$or": [
            {"nutritional_info": {"$exists": False}},
            {"nutritional_info.energy_kcal": 0}
        ]
    })
    print(f"\n[!] Recetas nuevas con 0 kcal o sin info nutricional: {vacias}")

    # 2. Verificación de Imágenes
    sin_imagen = await col.count_documents({**filtro_carga, "images": {"$size": 0}})
    print(f"[*] Recetas nuevas pendientes de imagen (ComfyUI): {sin_imagen}")

    # 3. Muestreo Aleatorio General
    print("\n--- MUESTRA DE CONTROL ALEATORIA ---")
    cursor = col.aggregate([
        {"$match": filtro_carga},
        {"$sample": {"size": 3}}
    ])
    
    async for doc in cursor:
        print(f"\nID: {doc['_id']}")
        print(f"Título: {doc.get('title', 'N/A')}")
        nutri = doc.get('nutritional_info', {})
        print(f"Macros: kcal: {nutri.get('energy_kcal')}, pro: {nutri.get('pro')}, car: {nutri.get('car')}")
        ingredientes = doc.get('ingredients', [])
        print(f"Ingrediente 1: {ingredientes[0] if ingredientes else 'Sin ingredientes'}")

    print("\n" + "="*60 + "\n")
    client.close()

if __name__ == "__main__":
    asyncio.run(auditar())

# docker cp auditar_recetas.py nutridiet-backend:/app/auditar_recetas.py
# docker exec -it nutridiet-backend python /app/auditar_recetas.py