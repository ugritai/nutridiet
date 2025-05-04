from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host
from utils.food_utils import remove_stop_words
from unidecode import unidecode


router = APIRouter(tags=["Recipes"])

#collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
recetas_collection = ['abuela']

@router.get("/all_categories")
async def get_all_categories():
    try:
        # Crear un conjunto para almacenar categorías únicas
        categorias = set()

        # Iterar sobre cada colección y obtener las categorías
        for collection_name in recetas_collection:
            collection = recipe_db_host[collection_name]
            # Filtrar documentos por language_ISO: 'ES' y obtener las categorías
            cursor = collection.find({'language_ISO': 'ES'}, {'category': 1})
            
            # Recorrer los documentos y agregar categorías al conjunto
            async for doc in cursor:
                if 'category' in doc:
                    categorias.add(doc['category'])

        return {"categories": list(categorias)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {e}")

@router.get("/buscar_recetas/{nombre}")
async def buscar_recetas(nombre: str, limit: int = 5):
    palabras = remove_stop_words(nombre)
    sugerencias = set()

    for palabra in palabras:
        for collection_name in recetas_collection:
            collection = recipe_db_host[collection_name]
            cursor = collection.find({'language_ISO': 'ES'})

            async for doc in cursor:
                title = doc.get("title", "")
                title_sin_tildes = unidecode(title.lower())

                if palabra in title_sin_tildes:
                    sugerencias.add(title)

                if len(sugerencias) >= limit:
                    break
        if len(sugerencias) >= limit:
            break
    print(sugerencias)
    if sugerencias:
        return [{"nombre": s} for s in list(sugerencias)[:limit]]
    else:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

@router.get("/search_recipes")
async def search(query: str):
    collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
    
    results = {}

    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        results[collection_name] = list(collection.find({"$text": {"$search": query}}))

    return results

@router.get("/categories")
async def get_categories():
    collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
    categories = set()  # Usamos un set para asegurarnos de que no haya categorías duplicadas

    for collection in collections:
        # Verificar si la colección existe
        if collection in recipe_db_host.list_collection_names():
            try:
                collection_data = recipe_db_host[collection].distinct("category")
                categories.update(collection_data)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al acceder a la colección {collection}: {e}")
        else:
            raise HTTPException(status_code=404, detail=f"Collection {collection} no encontrada en la base de datos.")
    
    if not categories:
        raise HTTPException(status_code=404, detail="No se encontraron categorías.")

    # Convertimos el set a una lista y ordenamos alfabéticamente
    sorted_categories = sorted(list(categories))   
    return {"categories": sorted_categories}

@router.get("/recipes_by_category/{category}")
async def get_recipes_by_category(category: str):
    collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
    recipes = []

    for collection in collections:
        # Verificar si la colección existe
        if collection in recipe_db_host.list_collection_names():
            try:
                # Buscar las recetas en la colección por la categoría
                collection_data = recipe_db_host[collection].find({"category": category}, {"_id": 0, "title": 1})
                
                for recipe in collection_data:
                    if 'title' in recipe:
                        recipes.append(recipe['title'])
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error al acceder a la colección {collection}: {e}")
        else:
            raise HTTPException(status_code=404, detail=f"Collection {collection} no encontrada en la base de datos.")
    
    if not recipes:
        raise HTTPException(status_code=404, detail=f"No se encontraron recetas para la categoría: {category}")
    
    return {"recipes": recipes}
    