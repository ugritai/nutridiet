import os
from dotenv import load_dotenv  # <--- nuevo
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient

# Cargar variables de entorno del archivo .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
RECIPE_MONGO_URI = os.getenv("RECIPE_MONGO_URI")

client_host = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db_host = client_host['nutridiet']

nutritionist_collection = db_host['nutritionist']
ingredient_categories_collection = db_host['ingredient_categories']
pacient_collection = db_host['patient']
embeddings_collection = db_host['bedca_embeddings']
embeddings_recipe_collection = db_host['recetas_embeddings']
images_collection = db_host['ingredient_image']
intake_collection = db_host['intake']
diet_collection = db_host['diet']
food_portions_collection = db_host['food_portions']

recipe_host = AsyncIOMotorClient(RECIPE_MONGO_URI, serverSelectionTimeoutMS=5000)
recipe_db_host = recipe_host['fooddb']
bedca_collection = recipe_db_host['bedca_unified']
