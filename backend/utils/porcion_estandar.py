import json
from pymongo import MongoClient
from bson import ObjectId

# 1. Conecta a MongoDB (ajusta URI según tu configuración)
client_host = MongoClient('mongodb://localhost:27018')
db_host = client_host['nutridiet']
col = db_host["GNHD_24_25"]

# 2. Lee el archivo JSON
with open("recetas_mongodb_final.json", "r", encoding="utf-8") as f:
    documentos = json.load(f)
    for doc in documentos:
        if '_id' in doc and isinstance(doc['_id'], dict) and '$oid' in doc['_id']:
            doc['_id'] = ObjectId(doc['_id']['$oid'])

# 3. Inserta en la colección (borra primero si quieres)
col.drop()
col.insert_many(documentos)

print(f"Insertados {len(documentos)} documentos en la colección 'raciones'")
