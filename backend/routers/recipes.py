from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host

router = APIRouter(tags=["Recipes"])

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
    