import re
import asyncio
from fastapi import HTTPException
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

recipe_host = AsyncIOMotorClient('mongodb://localhost:27018')
recipe_db_host = recipe_host['nutridiet']
recetas_collection = recipe_db_host['abuela_bedca']
bedca_collection = recipe_db_host['bedca']

def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, (float, int)):
        texto = str(texto)
    texto = texto.replace('\u00BD', '0.5').replace('\u2153', '0.33').replace('\u00BC', '0.25').replace('\u2154', '0.67').replace('\u00BE', '0.75')
    return texto

def extraer_cantidad_y_unidad(texto):
    texto = convertir_fracciones_a_decimal(texto).lower()
    patron = r'(\d+(?:[\.,]\d+)?)\s*([a-záéíóúüñ]+)?'
    match = re.search(patron, texto)
    if match:
        numero_str = match.group(1).replace(',', '.')
        try:
            cantidad = float(numero_str)
        except ValueError:
            cantidad = 100.0
        unidad = match.group(2) if match.group(2) else 'gramos'
        return cantidad, unidad
    return 100.0, 'gramos'

def convertir_a_gramos(cantidad, unidad):
    factores = {
        'cucharada': 15, 'cucharadas': 15,
        'rebanada': 15, 'rebanadas': 15,
        'unidad': 100, 'unidades': 100,
        'taza': 240, 'tazas': 240,
        'kilo': 1000, 'kilos': 1000,
        'dientes': 3, 'diente': 3
    }
    return cantidad * factores.get(unidad, 1)

async def calcular_y_guardar_nutricion(receta_obj):
    if not receta_obj:
        raise Exception("Receta no encontrada")

    if receta_obj.get("nutritional_info"):
        return receta_obj["nutritional_info"]

    total_nutricion = {}
    ingredientes = receta_obj.get("ingredients", [])
    if not isinstance(ingredientes, list):
        print(f"Ingredientes inválidos en receta {receta_obj.get('title')}")
        return

    for ing in ingredientes:
        ingrediente_texto = ing.get("ingredient")
        ingrediente_id = ing.get("ingredientID")

        if ingrediente_id is None:
            continue

        if not isinstance(ingrediente_id, ObjectId):
            try:
                ingrediente_id = ObjectId(ingrediente_id)
            except Exception:
                continue

        cantidad, unidad = extraer_cantidad_y_unidad(ingrediente_texto)
        gramos_estimados = convertir_a_gramos(cantidad, unidad)

        alimento = await bedca_collection.find_one({"_id": ingrediente_id})
        if not alimento:
            continue

        info = alimento.get("nutritional_info_100g", {})

        for clave, valor in info.items():
            if valor in ('', None):
                continue
            if isinstance(valor, dict):
                for subclave, subvalor in valor.items():
                    if subvalor in ('', None):
                        continue
                    clave_compuesta = f"{clave}.{subclave}"
                    total_nutricion[clave_compuesta] = total_nutricion.get(clave_compuesta, 0) + float(subvalor) * gramos_estimados / 100
            else:
                total_nutricion[clave] = total_nutricion.get(clave, 0) + float(valor) * gramos_estimados / 100

    await recetas_collection.update_one(
        {"_id": receta_obj["_id"]},
        {"$set": {"nutritional_info": total_nutricion}}
    )
    print(f"Actualizada receta: {receta_obj.get('title')}")

async def procesar_recetas_sin_nutricion():
    cursor = recetas_collection.find({"nutritional_info": {"$exists": False}})
    count = 0
    async for receta_obj in cursor:
        await calcular_y_guardar_nutricion(receta_obj)
        count += 1
    print(f"Procesadas {count} recetas sin información nutricional.")

if __name__ == "__main__":
    asyncio.run(procesar_recetas_sin_nutricion())
