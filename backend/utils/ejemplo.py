'''
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def ver_ejemplo():
    client = AsyncIOMotorClient("mongodb://root:RootPass123%21@127.0.0.1:27017/fooddb?authSource=admin&directConnection=true")
    db = client['fooddb']
    # Miramos uno de la colección original
    doc = await db['abuela_bedca'].find_one()
    print(json.dumps(doc, indent=2, default=str))
    client.close()

asyncio.run(ver_ejemplo())
'''

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_source_fields():
    client = AsyncIOMotorClient("mongodb://root:RootPass123%21@127.0.0.1:27017/fooddb?authSource=admin&directConnection=true")
    # Prueba con la colección que tiene los 11k documentos
    doc = await client['fooddb']['all_ingredients'].find_one({"name_esp": {"$regex": "Manzana", "$options": "i"}})
    print("CAMPOS REALES EN EL INGREDIENTE:")
    import json
    print(json.dumps(doc, indent=2, default=str))
    client.close()

asyncio.run(check_source_fields())