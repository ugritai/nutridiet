import os
import pandas as pd
from datasets import load_dataset

# 创建保存图片的目录
image_dir = "static/images"
os.makedirs(image_dir, exist_ok=True)

# 加载数据集
dataset = load_dataset("Scuccorese/food-ingredients-dataset")
data = dataset["train"]

# 用于记录已处理的 ingredient，避免重复保存
seen_ingredients = set()
saved_images = []

# 遍历数据
for item in data:
    ingredient = item.get("ingredient", "").strip().lower()
    image_obj = item.get("image", None)  # image 是 PIL.Image 对象

    if not ingredient or image_obj is None:
        continue

    if ingredient in seen_ingredients:
        continue  # 跳过重复

    seen_ingredients.add(ingredient)

    # 处理安全的文件名
    safe_name = ingredient.replace(" ", "_")
    image_path = os.path.join(image_dir, f"{safe_name}.jpg")

    try:
        image_obj.convert("RGB").save(image_path, "JPEG")
        saved_images.append({"ingredient": ingredient, "image_path": image_path})
        print(f"[OK] Guardado: {safe_name}.jpg")
    except Exception as e:
        print(f"[ERROR] Fallo al guardar {ingredient}: {e}")

# 保存信息为 Excel（可选）
df = pd.DataFrame(saved_images)
df.to_excel("ingredientes_con_imagenes.xlsx", index=False)

print("✅ Guardado completado.")
