import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://root:RootPass123%21@127.0.0.1:27017/fooddb?authSource=admin&directConnection=true"

# Usamos las categorías oficiales de BEDCA que detectamos en tu DB
CATEGORIAS_ORIGEN = {
    "Frutas": "Frutas y derivados",
    "Bebidas": "Bebidas (no lácteas)"
}

def limpiar_titulo(t):
    # "Manzana, cruda, con piel" -> "Manzana"
    # "Zumo de naranja, natural" -> "Zumo de naranja"
    nombre = t.split(',')[0].strip()
    return nombre.capitalize()

async def cargar_recetas_fieles():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['fooddb']
    
    alimentos_col = db['all_ingredients'] 
    recetas_col = db['abuela_bedca']

    # 1. Limpieza de seguridad de intentos previos
    print("🧹 Borrando rastro de experimentos anteriores...")
    await recetas_col.delete_many({"source": "Generación Automática Nutridiet"})

    for cat_app, cat_bedca in CATEGORIAS_ORIGEN.items():
        print(f"[*] Importando desde categoría BEDCA: {cat_bedca}...")
        
        # Buscamos por la categoría exacta de BEDCA para evitar meter corderos o aceites
        cursor = alimentos_col.find({"category_esp": cat_bedca})
        contador = 0

        async for alimento in cursor:
            nombre_orig = alimento.get("name_esp", "")
            if not nombre_orig: continue

            # Extraemos la info del sub-objeto correcto: nutritional_info_100g
            info = alimento.get("nutritional_info_100g", {})
            fats = info.get("fats", {})

            # Si no hay calorías, probablemente sea un registro incompleto, saltamos
            if not info.get("energy_kcal"):
                continue

            nueva_receta = {
                "title": limpiar_titulo(nombre_orig),
                "title_full": nombre_orig, # Guardamos el original por si acaso
                "ingredients": [f"100g de {nombre_orig}"],
                "instructions": [
                    f"Seleccionar {limpiar_titulo(nombre_orig)} de buena calidad.",
                    "Preparar para su consumo directo o mezcla.",
                    "Servir a temperatura adecuada."
                ],
                "nutritional_info": {
                    "energy_kcal": info.get("energy_kcal", 0),
                    "pro": info.get("pro", 0),
                    "car": info.get("car", 0),
                    "fats.total_fat": fats.get("total_fat", 0),
                    "sug": info.get("sug", 0),
                    "salt": info.get("salt", 0)
                },
                "category_esp": cat_app, # "Frutas" o "Bebidas"
                "images": [], # Para tu ComfyUI
                "source": "Generación Automática Nutridiet",
                "dietary_preferences": ["Natural", "Monoinrediente"]
            }
            
            await recetas_col.insert_one(nueva_receta)
            contador += 1
        
        print(f"✅ Añadidas {contador} recetas reales de {cat_app}.")

    client.close()
    print("\n--- PROCESO FINALIZADO CON ÉXITO ---")

if __name__ == "__main__":
    asyncio.run(cargar_recetas_fieles())