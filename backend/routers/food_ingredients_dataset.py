import asyncio
from datasets import load_dataset
import pandas as pd
from unidecode import unidecode
from motor.motor_asyncio import AsyncIOMotorClient

async def fetch_unique_names():
    # Conectar a MongoDB
    recipe_host = AsyncIOMotorClient('mongodb://localhost:27018')
    recipe_db_host = recipe_host['nutridiet']
    bedca_collection = recipe_db_host['bedca']
    
    unique_names = set()
    
    # Usar el cursor de manera asíncrona
    cursor = bedca_collection.find({}, {"_id": 0, "name_en": 1})
    async for doc in cursor:
        name_esp = doc.get("name_en", "")
        if name_esp:
            unique_names.add(unidecode(name_esp.strip().lower()))  # Normalizar y agregar
    
    # Convertir el conjunto a una lista
    unique_names_list = list(unique_names)
    
    # Crear un DataFrame y exportarlo a Excel
    df = pd.DataFrame(unique_names_list, columns=["name_esp"])
    
    # Guardar el archivo Excel
    df.to_excel("nombres_esp_unique.xlsx", index=False)

# Ejecutar la función asíncrona
#asyncio.run(fetch_unique_names())


# 加载数据集
#ds = load_dataset("Scuccorese/food-ingredients-dataset")

# 如果数据集中只有一个 split，可以直接取出
#data = ds['train']  # 或者你根据实际 split 名称修改

# 获取 ingredient 列并去重
#unique_ingredients = list(set(data['ingredient']))

# 转成 DataFrame
#df = pd.DataFrame(unique_ingredients, columns=["ingredient"])

# 保存为 Excel 文件
#df.to_excel("unique_ingredients.xlsx", index=False)

#print("已保存为 unique_ingredients.xlsx")

import pandas as pd

def calculate_duplicate_percentage(file1, file2):
    # Cargar los dos archivos Excel
    df1 = pd.read_excel(file1)
    df2 = pd.read_excel(file2)

    # Obtener las listas de nombres de los archivos
    set1 = set(df1['name_esp'].str.lower())  # Usar 'lower()' para normalizar y eliminar diferencias de mayúsculas/minúsculas
    set2 = set(df2['ingredient'].str.lower())  # Asumiendo que la columna del segundo archivo se llama 'ingredient'

    # Encontrar los duplicados entre los dos conjuntos
    duplicates = set1.intersection(set2)
    
    # Calcular el porcentaje de duplicados
    duplicate_percentage = (len(duplicates) / len(set1)) * 100 if set1 else 0

    return duplicate_percentage, len(duplicates)
import os

# Configurar carpeta para guardar duplicados
dup_dir = "static/images_dup"
os.makedirs(dup_dir, exist_ok=True)

# Función principal
async def comparar_y_guardar_duplicados():
    # 1. Conectar a MongoDB y obtener name_en únicos
    client = AsyncIOMotorClient("mongodb://localhost:27018")
    db = client["nutridiet"]
    collection = db["bedca"]

    name_en_set = set()
    cursor = collection.find({}, {"_id": 0, "name_en": 1})
    async for doc in cursor:
        name = doc.get("name_en", "").strip()
        if name:
            name_en_set.add(unidecode(name.lower()))

    print(f"🔍 name_en únicos en MongoDB: {len(name_en_set)}")

    # 2. Cargar dataset
    dataset = load_dataset("Scuccorese/food-ingredients-dataset")
    data = dataset["train"]

    # 3. Comparar duplicados y guardar imágenes
    duplicados = []
    seen = set()

    for item in data:
        ingredient = item.get("ingredient", "").strip().lower()
        image = item.get("image", None)

        if not ingredient or not image:
            continue

        normalized = unidecode(ingredient)
        if normalized in seen:
            continue  # evitar guardar múltiples veces
        seen.add(normalized)

        if normalized in name_en_set:
            safe_name = ingredient.replace(" ", "_")
            image_path = os.path.join(dup_dir, f"{safe_name}.jpg")
            try:
                image.convert("RGB").save(image_path, "JPEG")
                duplicados.append({
                    "ingredient": ingredient,
                    "image_path": image_path
                })
                print(f"✅ Guardado duplicado: {safe_name}.jpg")
            except Exception as e:
                print(f"❌ Error guardando {ingredient}: {e}")

    # 4. Guardar duplicados en Excel
    df = pd.DataFrame(duplicados)
    df.to_excel("duplicados.xlsx", index=False)
    print(f"📄 Guardado Excel con {len(duplicados)} duplicados.")

# Ejecutar función
asyncio.run(comparar_y_guardar_duplicados())