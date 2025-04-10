from pymongo import MongoClient

client_host = MongoClient('mongodb://localhost:27017')
db_host = client_host['nutridiet']
nutritionist_collection = db_host['nutritionist']

recipe_host = MongoClient('mongodb://localhost:27018')
recipe_db_host = recipe_host['nutridiet']