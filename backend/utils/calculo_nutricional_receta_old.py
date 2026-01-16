# -*- coding: utf-8 -*-
import asyncio
import re
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pprint import pprint

# ================== DB ==================
recipe_host = AsyncIOMotorClient(
    'mongodb://app_user:secure_pass123@127.0.0.1:27018/fooddb?authSource=admin',
    serverSelectionTimeoutMS=5000
)
db = recipe_host['fooddb']
recetas_collection = db['abuela_bedca']
bedca_collection = db['bedca_unified']

# ================== AUDITORÍA ==================
async def auditar_db():
    print("\n📦 COLECCIONES EN fooddb:")
    cols = await db.list_collection_names()
    for c in cols:
        print(" -", c)

    total = await recetas_collection.count_documents({})
    print(f"\n📊 Total recetas en abuela_bedca: {total}")

    sin_campo = await recetas_collection.count_documents(
        {"nutritional_info": {"$exists": False}}
    )
    vacio = await recetas_collection.count_documents(
        {"nutritional_info": {}}
    )
    nulo = await recetas_collection.count_documents(
        {"nutritional_info": None}
    )

    print("\n🔍 Estado nutritional_info:")
    print(f" - Sin campo: {sin_campo}")
    print(f" - Campo vacío {{}}: {vacio}")
    print(f" - Campo null: {nulo}")

    ejemplo = await recetas_collection.find_one({})
    print("\n🧪 EJEMPLO DE DOCUMENTO:")
    pprint({
        "_id": ejemplo.get("_id"),
        "title": ejemplo.get("title"),
        "ingredients_type": type(ejemplo.get("ingredients")),
        "ingredients_sample": ejemplo.get("ingredients", [])[:2],
        "nutritional_info": ejemplo.get("nutritional_info")
    })

# ================== UTILS ==================
def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, (float, int)):
        texto = str(texto)
    return (
        texto.replace('\u00BD', '0.5')
             .replace('\u2153', '0.33')
             .replace('\u00BC', '0.25')
             .replace('\u2154', '0.67')
             .replace('\u00BE', '0.75')
    )

def extraer_cantidad_y_unidad(texto):
    texto = convertir_fracciones_a_decimal(texto or "").lower()
    match = re.search(r'(\d+(?:[\.,]\d+)?)\s*([a-záéíóúüñ]+)?', texto)
    if match:
        try:
            cantidad = float(match.group(1).replace(',', '.'))
        except ValueError:
            cantidad = 100.0
        return cantidad, match.group(2) or 'gramos'
    return 100.0, 'gramos'

def convertir_a_gramos(cantidad, unidad):
    return cantidad * {
        'cucharada': 15, 'cucharadas': 15,
        'rebanada': 15, 'rebanadas': 15,
        'unidad': 100, 'unidades': 100,
        'taza': 240, 'tazas': 240,
        'kilo': 1000, 'kilos': 1000,
        'diente': 3, 'dientes': 3
    }.get(unidad, 1)

# ================== PROCESO ==================
async def calcular_y_guardar_nutricion(receta):
    total = {}
    ingredientes = receta.get("ingredients", [])

    if not isinstance(ingredientes, list):
        return

    usados = 0

    for ing in ingredientes:
        iid = ing.get("ingredientID")
        if not iid:
            continue

        try:
            iid = ObjectId(iid)
        except Exception:
            continue

        alimento = await bedca_collection.find_one({"_id": iid})
        if not alimento:
            continue

        usados += 1
        cantidad, unidad = extraer_cantidad_y_unidad(ing.get("ingredient"))
        gramos = convertir_a_gramos(cantidad, unidad)

        for k, v in alimento.get("nutritional_info_100g", {}).items():
            if isinstance(v, (int, float)):
                total[k] = total.get(k, 0) + v * gramos / 100

    if usados == 0:
        print(f"⚠️  {receta.get('title')} sin ingredientes válidos")
        return

    await recetas_collection.update_one(
        {"_id": receta["_id"]},
        {"$set": {"nutritional_info": total}}
    )
    print(f"✅ Actualizada: {receta.get('title')}")

async def procesar():
    print("\n================ AUDITORÍA =================")
    await auditar_db()

    print("\n================ PROCESO =================")
    filtro = {
        "$or": [
            {"nutritional_info": {"$exists": False}},
            {"nutritional_info": {}},
            {"nutritional_info": None}
        ]
    }

    count = 0
    async for receta in recetas_collection.find(filtro):
        await calcular_y_guardar_nutricion(receta)
        count += 1

    print(f"\n🏁 Procesadas {count} recetas")

if __name__ == "__main__":
    asyncio.run(procesar())
