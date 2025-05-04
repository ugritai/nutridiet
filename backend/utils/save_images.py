import os
from database.connection import db_host

collection = db_host['ingredient_image']

image_dir = 'static/images_dup'  # 图片文件夹

# 遍历文件夹中的所有图片
for filename in os.listdir(image_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        name_en = os.path.splitext(filename)[0]  # 去掉扩展名作为 name_en
        image_path = f'/static/images_dup/{filename}'

        # 如果该 name_en 已存在，就跳过
        if collection.find_one({'name_en': name_en}):
            print(f'Skipping existing: {name_en}')
            continue

        # 插入到数据库
        collection.insert_one({
            'name_en': name_en,
            'image': image_path
        })
        print(f'Inserted: {name_en}')
