import json
from pymongo import MongoClient

# -------------------------
# -------------------------

# Usa el mismo host que tu backend
client = MongoClient('mongodb://app_user:secure_pass123@127.0.0.1:27018/fooddb?authSource=admin')

# BD destino (ajusta si el nombre cambia)
db = client['fooddb']

# Coleccion destino
collection = db['GNHD_24_25']   # <- Cambialo si debe tener otro nombre

# -------------------------
#  CARGAR JSON GENERADO
# -------------------------

with open("recetas.json", "r", encoding="utf-8") as f:
    recetas = json.load(f)

# -------------------------
#  INSERTAR EN MONGO
# -------------------------

if not isinstance(recetas, list):
    raise ValueError("El JSON debe contener una lista de recetas")

result = collection.insert_many(recetas)
print(f"Insertados {len(result.inserted_ids)} documentos en GNHD_24_25.fooddb")
