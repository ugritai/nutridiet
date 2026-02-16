import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://root:RootPass123%21@fooddb:27017/fooddb?authSource=admin"

# Mapeo completo basado en tu CATEGORY_MAPPING de React
CONFIG_CATEGORIAS = [
    {"app": "Frutas", "keywords": ["fruta", "jugo", "zumo", "fruticola"]},
    {"app": "Verduras", "keywords": ["verdura", "vegetal", "hortaliza", "hierba", "especia"]},
    {"app": "Carne", "keywords": ["carne", "res", "cerdo", "cordero", "ternera", "caza", "embutido", "avicola", "pollo"]},
    {"app": "Pescados", "keywords": ["pescado", "marisco", "molusco", "crustaceo"]},
    {"app": "Lácteos", "keywords": ["leche", "lacteo", "huevo", "queso", "yogur"]},
    {"app": "Legumbres", "keywords": ["legumbre", "semilla", "nuez", "frutos secos"]},
    {"app": "Cereales", "keywords": ["cereal", "grano", "pasta", "horneado", "pan", "arroz"]},
    {"app": "Bebidas", "keywords": ["bebida", "refresco", "alcohol", "cafe", "te", "infusion"]},
    {"app": "Aceites", "keywords": ["grasa", "aceite", "mantequilla", "margarina"]}
]

def limpiar_titulo(t):
    nombre = t.split(',')[0].strip()
    return nombre.capitalize()

async def cargar_recetas_fieles():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['fooddb']
    alimentos_col = db['all_ingredients'] 
    recetas_col = db['abuela_bedca']

    print("🧹 Limpiando base de datos para carga completa...")
    await recetas_col.delete_many({"source": "Generacion Automatica Nutridiet"})

    for item in CONFIG_CATEGORIAS:
        cat_app = item["app"]
        regex_pattern = "|".join(item["keywords"])
        # Buscamos en category_esp de all_ingredients
        query = {"category_esp": {"$regex": regex_pattern, "$options": "i"}}
        
        cursor = alimentos_col.find(query)
        contador = 0

        async for alimento in cursor:
            nombre_orig = alimento.get("name_esp", "")
            if not nombre_orig: continue

            info = alimento.get("nutritional_info_100g", {})
            fats = info.get("fats", {})
            if not info.get("energy_kcal"): continue

            nueva_receta = {
                "title": limpiar_titulo(nombre_orig),
                "title_full": nombre_orig,
                "ingredients": [{"ingredient": f"100g de {nombre_orig}"}],
                "steps": ["Consumo directo.", "Lavar y preparar si es necesario."], # Cambiado de 'instructions' a 'steps' para tu frontend
                "nutritional_info": {
                    "energy_kcal": info.get("energy_kcal", 0),
                    "pro": info.get("pro", 0),
                    "car": info.get("car", 0),
                    "fats": fats.get("total_fat", 0),
                    "sug": info.get("sug", 0),
                    "salt": info.get("salt", 0)
                },
                "categoria": cat_app,      
                "category": cat_app.lower(), 
                "origin_ISO": "ESP",       
                "n_diners": 1,             # Campo esperado por el front
                "minutes": 5,              # Campo esperado por el front
                "dificultad": ["Dificultad baja"], # Campo esperado por el front
                "images": [],
                "source": "Generacion Automatica Nutridiet",
                "dietary_preferences": ["Natural", "Monoinrediente"]
            }
            
            await recetas_col.insert_one(nueva_receta)
            contador += 1
        
        print(f"✅ Categoría '{cat_app}': {contador} recetas añadidas.")

    client.close()
    print("\n--- CARGA MASIVA FINALIZADA ---")

if __name__ == "__main__":
    asyncio.run(cargar_recetas_fieles())

    
# docker cp add_recetas.py nutridiet-backend:/app/add_recetas.py
# docker exec -it nutridiet-backend python /app/add_recetas.py