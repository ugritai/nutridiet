from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host
from utils.food_utils import remove_stop_words, convert_objectid
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder



router = APIRouter(tags=["Recipes"])

#collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
recetas_collection = ['abuela']

# Mapa de categorías a palabras clave
PALABRAS_CLAVE = {
    'sopas': ['sopa', 'crema'],
    'ensaladas': ['ensalada'],
    'arroz': ['paella', 'risotto', 'arroz'],
    'pasta': ['espaguetis', 'macarrones', 'ravioli', 'lasaña', 'pizza', 'tortellini', 'spaghetti', 'ramen'],
    'guisos': ['guiso', 'puré', 'pure', 'lentejas', 'garbanzos', 'estofado', 'cocido'],
    'pescado': ['bonito', 'atún', 'sardina', 'dorada', 'bacalao', 'salmón'],
    'carne': ['pollo', 'ternera', 'cerdo', 'pavo', 'jamón', 'conejo', 'redondo'],
    'postre': ['postre', 'helado', 'tarta', 'galleta', 'bizcocho', 'mousse', 'chocolate', 'dulce', 'brownie', 'pudin', 'batido', 'pancakes', 'porridge'],
    'fruta': ['manzana', 'plátano', 'pera', 'naranja', 'pomelo', 'kiwi', 'sandía', 'melón', 'cereza', 'ciruela', 'fresa', 'mandarina']
}

@router.get("/all_categories")
async def get_all_categories():
    try:
        # Crear un conjunto para almacenar categorías únicas
        categorias = set()

        # Iterar sobre cada colección y obtener las categorías
        for collection_name in recetas_collection:
            collection = recipe_db_host[collection_name]
            # Filtrar documentos por origin_ISO: 'ESP' y obtener las categorías
            cursor = collection.find({'origin_ISO': 'ESP'}, {'category': 1})
            
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
            cursor = collection.find({'origin_ISO': 'ESP'})

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

@router.get("/por_categoria/{categoria}")
async def get_recetas_por_categoria(categoria: str):
    categoria_normalizada = unidecode(categoria.lower().strip())
    resultados = {}

    # Primero, buscar si hay recetas donde category == categoria (caso directo)
    for collection_name in recetas_collection:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({
            'origin_ISO': 'ESP',
            'category': {'$regex': f'^{categoria}$', '$options': 'i'}
        }, {'title': 1})

        async for doc in cursor:
            titulo = doc.get("title", "")
            resultados[titulo.lower()] = titulo  # Guardar el original

    if resultados:
        return {"recetas": list(resultados.values())}

    # Si no hay coincidencias por category exacto, buscar por palabras clave
    if categoria_normalizada not in PALABRAS_CLAVE:
        raise HTTPException(status_code=404, detail="Categoría no válida")

    palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]

    for collection_name in recetas_collection:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({'origin_ISO': 'ESP'}, {'title': 1})

        async for doc in cursor:
            titulo = doc.get("title", "")
            titulo_sin_tildes = unidecode(titulo.lower())

            if any(palabra in titulo_sin_tildes for palabra in palabras_clave):
                resultados[titulo.lower()] = titulo  # Guardar el original

    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

    return {"recetas": list(resultados.values())}
 
@router.get("/detalle_receta/{nombre}")
async def get_receta_detalle(nombre: str):
    nombre_normalizado = unidecode(nombre.strip().lower())

    for collection_name in recetas_collection:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({}, {"_id": 0})

        async for doc in cursor:
            titulo = doc.get("title", "")
            titulo_normalizado = unidecode(titulo.strip().lower())

            if nombre_normalizado == titulo_normalizado:
                result = doc
                result = convert_objectid(result)
                
                # Determinar la categoría usando el mapa de palabras clave
                categoria = "desconocida"  # Valor por defecto en caso de no encontrar ninguna categoría
                for cat, palabras in PALABRAS_CLAVE.items():
                    if any(palabra in unidecode(titulo.lower()) for palabra in palabras):
                        categoria = cat
                        break
                
                # Añadir la categoría a la respuesta
                result["categoria"] = categoria.capitalize()

                return {
                    "receta": jsonable_encoder(result)
                }

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
    