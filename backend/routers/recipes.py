from fastapi import APIRouter, HTTPException
from database.connection import recipe_db_host, bedca_collection
from utils.food_utils import remove_stop_words, convert_objectid, convertir_a_gramos, extraer_cantidad_y_unidad
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from bson import ObjectId

router = APIRouter(tags=["Recipes"])

#collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
collections = ['abuela']
recetas_collection = recipe_db_host['abuela_bedca']

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
        for collection_name in collections:
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
        for collection_name in collections:
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
    if sugerencias:
        return [{"nombre": s} for s in list(sugerencias)[:limit]]
    else:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

@router.get("/por_categoria/{categoria}")
async def get_recetas_por_categoria(categoria: str):
    categoria_normalizada = unidecode(categoria.lower().strip())
    resultados = {}

    # Primero, buscar si hay recetas donde category == categoria (caso directo)
    for collection_name in collections:
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

    for collection_name in collections:
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

    for collection_name in collections:
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

@router.get("/{receta}/nutricion")
async def calcular_nutricion(
    receta: str,  # Usamos 'receta' como título de la receta
    por_porcion: bool = True
):
    # Busca la receta usando el título directamente
    receta_obj = await recetas_collection.find_one({"title": receta})
    if not receta_obj:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    total_nutricion = {}
    ingredientes = receta_obj.get("ingredients", [])  # Cambié receta por receta_obj
    if not isinstance(ingredientes, list):
        raise HTTPException(status_code=400, detail="Formato de ingredientes incorrecto")

    # Iteramos sobre los ingredientes
    # Buscar y procesar cada ingrediente de la receta
# Iteramos sobre los ingredientes
    for ing in ingredientes:
        ingrediente_texto = ing.get("ingredient")  # Obtenemos el nombre del ingrediente
        ingrediente_id = ing.get("ingredientID")  # Obtenemos el ObjectId del ingrediente

        if ingrediente_id is None:
            continue  # Si no hay ID, pasamos al siguiente ingrediente

        # Verificamos si el ID es un ObjectId
        if not isinstance(ingrediente_id, ObjectId):
            try:
                ingrediente_id = ObjectId(ingrediente_id)  # Convertimos el ID a ObjectId si es necesario
            except Exception as e:
                print(f"Error al convertir {ingrediente_id}: {e}")
                continue  # Si el ID no es válido, lo ignoramos

        # Extraemos la cantidad y unidad del ingrediente
        cantidad, unidad = extraer_cantidad_y_unidad(ingrediente_texto)
        gramos_estimados = convertir_a_gramos(cantidad, unidad)  # Convertimos a gramos

        # Buscamos el alimento en la colección de BEDCA
        alimento = await bedca_collection.find_one({"_id": ingrediente_id})

        if not alimento:
            continue  # Si no encontramos el alimento, pasamos al siguiente

        # Obtenemos la información nutricional del alimento
        info = alimento.get("nutritional_info_100g", {})

        # Sumamos la información nutricional al total
        for clave, valor in info.items():
            if valor in ('', None):  # Si el valor es vacío o None, lo ignoramos
                continue
            if isinstance(valor, dict):
                for subclave, subvalor in valor.items():
                    if subvalor in ('', None):  # Ignoramos valores vacíos o None
                        continue
                    clave_compuesta = f"{clave}.{subclave}"
                    total_nutricion[clave_compuesta] = total_nutricion.get(clave_compuesta, 0) + float(subvalor) * gramos_estimados / 100
            else:
                total_nutricion[clave] = total_nutricion.get(clave, 0) + float(valor) * gramos_estimados / 100

    # Si la nutrición es por porción, ajustamos según el número de raciones
    raciones = receta_obj.get("n_diners", 1)  # Usamos receta_obj aquí también
    if por_porcion:
        total_nutricion = {k: round(v / raciones, 2) for k, v in total_nutricion.items()}
    else:
        total_nutricion = {k: round(v, 2) for k, v in total_nutricion.items()}

    return {
        "receta": receta_obj.get("title"),
        "por_porcion": por_porcion,
        "raciones": raciones,
        "valores_nutricionales": total_nutricion
    }
