from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

app = FastAPI()

MONGO_URI = "mongodb://localhost:27017"  # Cambia 'localhost' por la IP o nombre del contenedor si es necesario
DATABASE_NAME = "nutrition_db"
COLLECTION_NAME = "all_ingredients"

# Establecer la conexión con MongoDB
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Función para convertir ObjectId a string
def convert_objectid_to_str(doc):
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, dict):
        return {key: convert_objectid_to_str(value) for key, value in doc.items()}
    if isinstance(doc, list):
        return [convert_objectid_to_str(item) for item in doc]
    return doc

@app.get("/")
async def read_root():
    try:
        # Obtener los primeros 5 documentos de la colección
        ingredients_cursor = collection.find().limit(5)
        ingredients = await ingredients_cursor.to_list(length=5)
        
        # Convertir los ObjectId a string
        ingredients = convert_objectid_to_str(ingredients)
        
        return {"message": "Conexión exitosa a MongoDB", "ingredients": ingredients}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la conexión a MongoDB: {str(e)}")
