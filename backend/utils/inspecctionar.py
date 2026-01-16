# -*- coding: utf-8 -*-
import asyncio
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

recipe_host = AsyncIOMotorClient(
    'mongodb://app_user:secure_pass123@127.0.0.1:27018/fooddb?authSource=admin',
    serverSelectionTimeoutMS=5000
)
db = recipe_host['fooddb']
recetas_collection = db['abuela_bedca']
bedca_collection = db['bedca_unified']

async def inspeccionar_recetas_sin_kcal(log_file="log_recetas_sin_kcal.txt"):
    cursor = recetas_collection.find({})
    logs = []

    async for receta in cursor:
        log = {"title": receta.get("title"), "ingredientes_fallidos": []}
        nutricion = receta.get("nutritional_info", {})
        kcal = nutricion.get("Energía (kcal)", 0)

        if kcal is None or kcal == 0:
            ingredientes = receta.get("ingredients", [])
            if not isinstance(ingredientes, list):
                log["ingredientes_fallidos"].append("Campo 'ingredients' inválido")
            else:
                for ing in ingredientes:
                    ing_id = ing.get("ingredientID")
                    ing_text = ing.get("ingredient", "")
                    if not ing_id:
                        log["ingredientes_fallidos"].append(f"{ing_text} -> Sin ingredientID")
                        continue
                    if not isinstance(ing_id, ObjectId):
                        try:
                            ing_id = ObjectId(ing_id)
                        except Exception:
                            log["ingredientes_fallidos"].append(f"{ing_text} -> ID inválido")
                            continue
                    alimento = await bedca_collection.find_one({"_id": ing_id})
                    if not alimento:
                        log["ingredientes_fallidos"].append(f"{ing_text} -> No encontrado en bedca")

            logs.append(log)

    # Guardar en archivo
    with open(log_file, "w", encoding="utf-8") as f:
        for l in logs:
            f.write(f"Receta: {l['title']}\n")
            if l["ingredientes_fallidos"]:
                for f_ing in l["ingredientes_fallidos"]:
                    f.write(f"  - {f_ing}\n")
            else:
                f.write("  - Ningún ingrediente fallido, pero kcal = 0\n")
            f.write("\n")  # separar recetas

    print(f"Log guardado en {log_file}. Total recetas con 0 kcal: {len(logs)}")

async def main():
    await inspeccionar_recetas_sin_kcal()

if __name__ == "__main__":
    asyncio.run(main())
