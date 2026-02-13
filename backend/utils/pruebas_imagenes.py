# -*- coding: utf-8 -*-
import os
import json
import requests
import asyncio
import unicodedata
import re
import time
import random
import io
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# --- CONFIGURACION ---
MONGO_URI = "mongodb://root:RootPass123%21@127.0.0.1:27017/fooddb?authSource=admin&directConnection=true"
COMFY_HOST = "127.0.0.1:8000"
COMFY_URL = f"http://{COMFY_HOST}/prompt"
# Carpeta de salida corregida
OUTPUT_FOLDER = os.path.abspath(os.path.join("..", "static", "images_recipies"))

# Negativo optimizado para menor resolución
PROMPT_NEGATIVO = "ugly, deformed, noisy, blurry, distorted, low quality, extra fingers, text, watermark, logo, banner, drawing, painting, cartoon, anime, artificial, plastic look, fake food, messy kitchen"

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '-', value)

async def descargar_y_convertir_webp(filename, subfolder, receta_id, client, nombre_final):
    view_url = f"http://{COMFY_HOST}/view?filename={filename}&subfolder={subfolder}&type=output"
    try:
        response = requests.get(view_url)
        if response.status_code == 200:
            img = Image.open(io.BytesIO(response.content))
            webp_filename = f"{nombre_final}.webp"
            local_path = os.path.join(OUTPUT_FOLDER, webp_filename)
            
            # Calidad 80 con método 6 es el mejor equilibrio peso/calidad
            img.save(local_path, "WEBP", quality=80, method=6)
            
            db = client['fooddb']
            await db['abuela_bedca'].update_one(
                {"_id": receta_id},
                {"$set": {"images": [f"/static/images_recipies/{webp_filename}"]}}
            )
            return True
    except Exception as e:
        print(f" -> Error procesando imagen: {e}")
    return False

async def track_progress(prompt_id, receta_id, client, nombre_final):
    while True:
        await asyncio.sleep(1) # Bajamos a 1s para ser más ágiles
        try:
            res = requests.get(f"http://{COMFY_HOST}/history/{prompt_id}").json()
            if prompt_id in res:
                outputs = res[prompt_id]['outputs']
                for node_id in outputs:
                    if 'images' in outputs[node_id]:
                        img_info = outputs[node_id]['images'][0]
                        return await descargar_y_convertir_webp(
                            img_info['filename'], img_info['subfolder'], 
                            receta_id, client, nombre_final
                        )
        except:
            break

async def generar_prueba_baja_res():
    inicio_total = time.time()
    print("--- PRUEBA FINAL: RESOLUCIÓN (512x512) ---")
    
    client = AsyncIOMotorClient(MONGO_URI)
    db = client['fooddb']
    col = db['abuela_bedca']

    # 10 recetas sin imagen
    cursor = col.find({"$or": [{"images": {"$exists": False}}, {"images": {"$size": 0}}]}).limit(10)

    try:
        with open("MyWorkFlow.json", "r", encoding="utf-8") as f:
            workflow_base = json.load(f)
    except FileNotFoundError:
        print("Error: No se encuentra MyWorkFlow.json")
        return

    async for receta in cursor:
        inicio_receta = time.time()
        titulo = receta.get('title', 'comida')
        receta_id = receta['_id']
        nombre_base = slugify(titulo)
        
        print(f"\n[*] Procesando: {titulo}")

        prompt_positivo = f"Professional food photography of {titulo}, gourmet plating, cinematic lighting, 8k, highly detailed, realistic textures"
        
        workflow = workflow_base.copy()
        workflow["9"]["inputs"]["text"] = prompt_positivo
        workflow["10"]["inputs"]["text"] = PROMPT_NEGATIVO
        workflow["11"]["inputs"]["seed"] = random.randint(1, 10**15)
        workflow["15"]["inputs"]["filename_prefix"] = nombre_base
        
        # AJUSTE DE RESOLUCIÓN A 384
        workflow["13"]["inputs"]["width"] = 512
        workflow["13"]["inputs"]["height"] = 512

        try:
            response = requests.post(COMFY_URL, json={"prompt": workflow})
            if response.status_code == 200:
                prompt_id = response.json().get('prompt_id')
                success = await track_progress(prompt_id, receta_id, client, nombre_base)
                
                tiempo_receta = time.time() - inicio_receta
                print(f" -> {titulo} listo en {tiempo_receta:.2f}s.")
            else:
                print(f" -> Error ComfyUI: {response.text}")
        except Exception as e:
            print(f" -> Error: {e}")

    tiempo_total = time.time() - inicio_total
    print(f"\n--- PRUEBA COMPLETADA ---")
    print(f"Tiempo total: {tiempo_total:.2f}s | Promedio: {(tiempo_total/10):.2f}s")
    client.close()

if __name__ == "__main__":
    asyncio.run(generar_prueba_baja_res())