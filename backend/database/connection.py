from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient


client_host = MongoClient('mongodb://localhost:27017')
db_host = client_host['nutridiet']
nutritionist_collection = db_host['nutritionist']
ingredient_categories_collection = db_host['ingredient_categories']
pacient_collection = db_host['pacient']
embeddings_collection = db_host['bedca_embeddings']
embeddings_recipe_collection = db_host['recetas_embeddings']
images_collection = db_host['ingredient_image']
intake_collection = db_host['intake']
diet_collection = db_host['diet']
food_portions_collection = db_host['food_portions']

recipe_host = AsyncIOMotorClient('mongodb://localhost:27018')
recipe_db_host = recipe_host['nutridiet']
bedca_collection = recipe_db_host['bedca']