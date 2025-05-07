import os
from database.connection import images_collection
from PIL import Image
from gradio_client import Client, handle_file
import asyncio
import re
from tqdm import tqdm

# Conexión a MongoDB
images_collection = images_collection

# Conectar con el modelo de detección de marca de agua
client = Client("fancyfeast/joycaption-watermark-detection")

# Carpeta de imágenes filtradas
output_dir = "imagenes_filtradas"

async def detectar_marca_agua_y_guardar():
    for filename in tqdm(os.listdir(output_dir)):
        # Cargar la imagen
        image_path = os.path.join(output_dir, filename)
        image = Image.open(image_path)

        # Llamar al modelo de detección de marca de agua
        result = client.predict(
            image=handle_file(image_path),
            conf_threshold=0.5,
            api_name="/predict"
        )

        # Verificar si la respuesta contiene detecciones
        detections = result[1].get('confidences', None)

        if detections:  # Solo procesar si 'detections' no es None
            # Verificar si hay marcas de agua
            has_watermark = any(d['confidence'] > 0.5 for d in detections)  # Ajusta este umbral según sea necesario

            if not has_watermark:
                # Preparar el nombre seguro para la imagen
                safe_name = filename.replace("/", "_").replace("\\", "_").replace(" ", "_")

                # Insertar la imagen en MongoDB si no tiene marca de agua
                with open(image_path, "rb") as img_file:
                    img_data = img_file.read()

                # Verificar si la imagen ya está en la base de datos
                existing_doc = await images_collection.find_one({"name": safe_name})
                if not existing_doc:
                    await images_collection.insert_one({
                        "name": safe_name,
                        "image": img_data
                    })
                    print(f"Imagen {safe_name} guardada en MongoDB.")
        else:
            print(f"No se pudo procesar la detección de marca de agua para la imagen {filename}.")

# Ejecutar
asyncio.run(detectar_marca_agua_y_guardar())