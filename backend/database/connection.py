import os
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI_NUTRIDIET = os.getenv("MONGO_URI_NUTRIDIET")
MONGO_URI_FOODDB = os.getenv("MONGO_URI_FOODDB")

# ---------------------------------------------------------
# 1. CLIENTES (Conexiones)
# ---------------------------------------------------------

# NUTRIDIET (Usuarios, Pacientes)
# MANTENEMOS EL NOMBRE 'client_host' para que main.py no falle
client_host = MongoClient(
    MONGO_URI_NUTRIDIET, 
    serverSelectionTimeoutMS=5000, 
    authSource="admin"
)
db_host = client_host['nutridiet'] # Base de datos de usuarios

# FOODDB (Ingredientes, Porciones) -> NUEVO CLIENTE
client_food = MongoClient(
    MONGO_URI_FOODDB, 
    serverSelectionTimeoutMS=5000, 
    authSource="admin"
)
db_food = client_food['fooddb']

# Cliente Asíncrono (para recetas/chat)
# Apunta a FOODDB porque ahí están los embeddings y recetas
recipe_host = AsyncIOMotorClient(
    MONGO_URI_FOODDB, 
    serverSelectionTimeoutMS=5000, 
    authSource="admin"
)
recipe_db_host = recipe_host['fooddb']

# ---------------------------------------------------------
# 2. COLECCIONES
# ---------------------------------------------------------

# --- Datos de USUARIOS (Usan db_host / nutridietdb) ---
nutritionist_collection = db_host['nutritionist']
pacient_collection = db_host['patient']
intake_collection = db_host['intake']
diet_collection = db_host['diet']
ingredient_categories_collection = db_host['ingredient_categories'] 

reports_collection = db_host['issue_reports']

# --- Datos de COMIDA (Usan db_food / fooddb) ---
# ¡IMPORTANTE!: Cambiamos estas para que usen db_food
embeddings_collection = db_food['bedca_embeddings']
embeddings_recipe_collection = db_food['recetas_embeddings']
images_collection = db_food['ingredient_image']
food_portions_collection = db_food['food_portions']

# OJO: En tu dump vi 'abuela_bedca'. Si tu código usaba 'bedca_unified', 
# verifica cuál es la correcta. Aquí pongo 'abuela_bedca' según tu dump.
bedca_collection = recipe_db_host['all_ingredients']

