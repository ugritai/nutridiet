import os
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Variables correctas según docker-compose
MONGO_URI_NUTRIDIET = os.getenv("MONGO_URI_NUTRIDIET")
MONGO_URI_FOODDB = os.getenv("MONGO_URI_FOODDB")

# Conexión sincronizada
client_host = MongoClient(MONGO_URI_NUTRIDIET, serverSelectionTimeoutMS=5000)
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

# Conexión asíncrona
recipe_host = AsyncIOMotorClient(MONGO_URI_FOODDB, serverSelectionTimeoutMS=5000)
recipe_db_host = recipe_host['fooddb']
bedca_collection = recipe_db_host['bedca_unified']
