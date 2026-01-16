import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://app_user:secure_pass123@127.0.0.1:27018/fooddb?authSource=admin")
db = client["fooddb"]
bedca_collection = db["all_ingredients"]
recetas_collection = db["abuela_bedca"]

async def contar_nutricion(collection, tipo="Alimentos"):
    total = await collection.count_documents({})
    
    # Sin info nutricional
    sin_info = await collection.count_documents({"nutritional_info_100g": {"$exists": False}})
    
    # Con info nutricional pero kcal = 0 o None
    con_cero = await collection.count_documents({
        "nutritional_info_100g": {"$exists": True},
        "nutritional_info_100g.energy_kcal": {"$in": [0, None]}
    })
    
    print(f"=== RESUMEN {tipo} ===")
    print(f"Total {tipo.lower()}: {total}")
    print(f"Sin info nutricional: {sin_info}")
    print(f"Con kcal = 0: {con_cero}\n")
    
    # Mostrar solo 2 documentos para inspección
    print(f"=== 2 {tipo.lower()} de ejemplo ===")
    async for doc in collection.find().limit(2):
        print({
            "title": doc.get("title"),
            "url": doc.get("url"),
            "n_diners": doc.get("n_diners"),
            "n_ingredients": doc.get("n_ingredients"),
            "n_steps": doc.get("n_steps"),
            "nutritional_info_100g": doc.get("nutritional_info_100g")
        })
        print("\n---\n")

async def main():
    await contar_nutricion(bedca_collection, "ALIMENTOS")
    await contar_nutricion(recetas_collection, "RECETAS")

if __name__ == "__main__":
    asyncio.run(main())
