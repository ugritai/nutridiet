import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Configura tu conexión MongoDB
MONGO_URI = "mongodb://localhost:27018"
DB_NAME = "nutridiet"  # ajusta si tu DB se llama distinto
COL_DESTINO = "bedca_FB"

# Categorías a importar
CATEGORIAS_OBJETIVO = ["Frutas y productos frutícolas", "Bebidas (no lácteas)"]

async def importar_bedca_como_recetas():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    alimentos_col = db["bedca"]
    recetas_col = db[COL_DESTINO]

    # Buscar alimentos de las categorías deseadas
    alimentos = await alimentos_col.find({
        "category_esp": {"$in": CATEGORIAS_OBJETIVO}
    }).to_list(length=None)

    recetas = []

    for alimento in alimentos:
        nombre = alimento.get("name_esp", "").strip().capitalize()
        info = alimento.get("nutritional_info_100g", {})
        grasas = info.get("fats", {}).get("total_fat", 0)

        receta = {
            "title": nombre,
            "descripcion": f"Receta generada automáticamente a partir del alimento '{nombre}' (BEDCA).",
            "source": "BEDCA",
            "language_ISO": "ES",
            "origin_ISO": "ESP",
            "n_diners": 1,
            "dificultad": "",
            "category": alimento.get("category_esp", ""),  # ✅ Ahora como string
            "subcategory": "",
            "minutes": 5,
            "n_ingredients": 1,
            "ingredients": [{
                "ingredient": nombre,
                "ingredientID": str(alimento.get("_id", ObjectId())),
                "max_similarity": 1.0
            }],
            "n_steps": 1,
            "steps": [f"Consumir una unidad de {nombre}."],
            "images": [],
            "interactions": "",
            "aver_rate": "",
            "num_interactions": 0,
            "tags": [],
            "num_tags": "",
            "dietary_preferences": [],
            "nutritional_info": {
                "car": info.get("car", 0),
                "energy_kcal": info.get("energy_kcal", 0),
                "energy_kj": info.get("energy_kj", 0),
                "pro": info.get("pro", 0),
                "wat": info.get("wat", 0),
                "fats.total_fat": grasas or 0,
                "fats.sat": info.get("fats", {}).get("sat", 0),
                "fats.trans": info.get("fats", {}).get("trans", 0),
                "fiber": info.get("fiber", 0),
                "cal": info.get("cal", 0),
                "iron": info.get("iron", 0),
                "pot": info.get("pot", 0),
                "mag": info.get("mag", 0),
                "sod": info.get("sod", 0),
                "salt": info.get("salt", 0),
                "phos": info.get("phos", 0),
                "cholesterol": info.get("cholesterol", 0),
                "sug": info.get("sug", 0),
            },
            "created_from_alimento": True,
        }



        recetas.append(receta)

    # Insertar evitando duplicados por nombre
    ya_insertadas = 0
    nuevas = []

    for receta in recetas:
        ya_existe = await recetas_col.find_one({"title": receta["title"]})
        if ya_existe:
            ya_insertadas += 1
            continue
        nuevas.append(receta)

    if nuevas:
        await recetas_col.insert_many(nuevas)

    print(f"[{COL_DESTINO}] → Insertadas: {len(nuevas)} | Omitidas (ya existían): {ya_insertadas}")
    client.close()


async def actualizar_origin_iso():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    col = db[COL_DESTINO]

    # Actualiza todos los documentos de la colección destino
    result = await col.update_many(
        {},  # sin filtro → todos los documentos
        {"$set": {"origin_ISO": "ESP"}}
    )

    print(f"✅ Actualizados: {result.modified_count} documentos en '{COL_DESTINO}'")
    client.close()
    
if __name__ == "__main__":
    asyncio.run(importar_bedca_como_recetas())
