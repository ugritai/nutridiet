import os
from database.connection import images_collection
from PIL import Image
import re
from tqdm import tqdm
import torch
import torchvision.transforms.functional as TVF
from models.owl_model import DetectorModelOwl
import torch.nn.functional as F
from collections import defaultdict


# ----------- Cargar modelo OWLv2 local -----------
model = DetectorModelOwl("google/owlv2-base-patch16-ensemble", dropout=0.0)
model.load_state_dict(torch.load("far5y1y5-8000.pt", map_location="cpu"))
model.eval()

# ----------- Función de predicción OWLv2 -----------
def owl_predict(image: Image.Image) -> bool:
    big_side = max(image.size)
    new_image = Image.new("RGB", (big_side, big_side), (128, 128, 128))
    new_image.paste(image, (0, 0))

    preped = new_image.resize((960, 960), Image.BICUBIC)
    preped = TVF.pil_to_tensor(preped)
    preped = preped / 255.0
    input_image = TVF.normalize(preped, [0.48145466, 0.4578275, 0.40821073],
                                         [0.26862954, 0.26130258, 0.27577711])

    logits, = model(input_image.unsqueeze(0), None)
    probs = F.softmax(logits, dim=1)
    prediction = torch.argmax(probs.cpu(), dim=1)

    return prediction.item() == 1  # 1: Watermarked


# ----------- Procesar y guardar solo una imagen sin marca por grupo -----------
def detectar_marca_agua_y_guardar():
    output_dir = "imagenes_filtradas"
    images_collection.delete_many({})
    print("🗑️ Colección 'images' vaciada.")

    procesados = set()  # Para llevar registro de grupos ya guardados

    for filename in tqdm(os.listdir(output_dir)):
        image_path = os.path.join(output_dir, filename)

        try:
            # Extraer el prefijo del nombre, como "orange" de "orange_1.jpg"
            match = re.match(r"([a-zA-Z]+)", filename)
            if not match:
                continue
            grupo = match.group(1)

            if grupo in procesados:
                continue  # Ya guardamos una imagen de este grupo

            image = Image.open(image_path)
            has_watermark = owl_predict(image)

            if not has_watermark:
                safe_name = re.sub(r"[^\w\-_.]", "_", filename)

                existing = images_collection.find_one({"name": safe_name})
                if not existing:
                    images_collection.insert_one({
                        "name": safe_name,
                        "image": image_path  # Guarda la ruta local como string
                    })

                    print(f"✅ {safe_name} guardada.")
                    procesados.add(grupo)  # Marca este grupo como procesado
            else:
                print(f"❌ Marca de agua detectada en: {filename}")

        except Exception as e:
            print(f"⚠️ Error procesando {filename}: {e}")


# Ejecutar
if __name__ == "__main__":
    detectar_marca_agua_y_guardar()
