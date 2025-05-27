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
 
@router.get("/por_categoria_nutri/{categoria}")
async def get_recetas_por_categoria_nutri(categoria: str):
    categoria_normalizada = unidecode(categoria.lower().strip())
    recetas_unicas = set()
    resultados = []

    async def obtener_valores_basicos(titulo: str):
        receta_obj = await recetas_collection.find_one({"title": titulo})
        if not receta_obj:
            return {"kcal": 0, "pro": 0, "car": 0}

        total_nutricion = {}
        ingredientes = receta_obj.get("ingredients", [])
        if not isinstance(ingredientes, list):
            return {"kcal": 0, "pro": 0, "car": 0}

        for ing in ingredientes:
            ingrediente_id = ing.get("ingredientID")
            ingrediente_texto = ing.get("ingredient")

            if not ingrediente_id:
                continue

            try:
                ingrediente_id = ObjectId(ingrediente_id)
            except:
                continue

            cantidad, unidad = extraer_cantidad_y_unidad(ingrediente_texto)
            gramos_estimados = convertir_a_gramos(cantidad, unidad)

            alimento = await bedca_collection.find_one({"_id": ingrediente_id})
            if not alimento:
                continue

            info = alimento.get("nutritional_info_100g", {})
            for clave, valor in info.items():
                if not valor: continue
                if isinstance(valor, dict):
                    for subclave, subvalor in valor.items():
                        if not subvalor: continue
                        key = f"{clave}.{subclave}"
                        total_nutricion[key] = total_nutricion.get(key, 0) + float(subvalor) * gramos_estimados / 100
                else:
                    total_nutricion[clave] = total_nutricion.get(clave, 0) + float(valor) * gramos_estimados / 100

        raciones = receta_obj.get("n_diners", 1)
        porcion = {k: round(v / raciones, 2) for k, v in total_nutricion.items()}

        return {
            "kcal": porcion.get("kcal", 0),
            "pro": porcion.get("proteina", 0),
            "car": porcion.get("hidratos de carbono", 0)
        }

    # Búsqueda directa por categoría
    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find(
            {'origin_ISO': 'ESP', 'category': {'$regex': f'^{categoria}$', '$options': 'i'}},
            {'title': 1}
        )
        async for doc in cursor:
            titulo = doc.get("title", "").strip()
            titulo_limpio = titulo.lower()
            if titulo_limpio in recetas_unicas:
                continue
            nutricion = await obtener_valores_basicos(titulo)
            resultados.append({"nombre": titulo, **nutricion})
            recetas_unicas.add(titulo_limpio)

    # Si no hay resultados por categoría directa, buscar por palabra clave
    if not resultados:
        if categoria_normalizada not in PALABRAS_CLAVE:
            raise HTTPException(status_code=404, detail="Categoría no válida")
        palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]

        for collection_name in collections:
            collection = recipe_db_host[collection_name]
            cursor = collection.find({'origin_ISO': 'ESP'}, {'title': 1})
            async for doc in cursor:
                titulo = doc.get("title", "").strip()
                titulo_limpio = titulo.lower()
                if titulo_limpio in recetas_unicas:
                    continue
                titulo_sin_tildes = unidecode(titulo_limpio)
                if any(p in titulo_sin_tildes for p in palabras_clave):
                    nutricion = await obtener_valores_basicos(titulo)
                    resultados.append({"nombre": titulo, **nutricion})
                    recetas_unicas.add(titulo_limpio)

    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

    return {"recetas": resultados}

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


from fastapi import Query

@router.get("/categoria/{categoria}/nutricion_simplificada")
async def obtener_kcal_pro_car_por_categoria(
    categoria: str,
    por_porcion: bool = True,
    kcal_min: float = Query(None),
    kcal_max: float = Query(None),
    pro_min: float = Query(None),
    pro_max: float = Query(None),
    car_min: float = Query(None),
    car_max: float = Query(None),
):
    from unidecode import unidecode

    categoria_normalizada = unidecode(categoria.lower().strip())
    recetas_encontradas = {}

    # Buscar recetas por categoría exacta
    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({
            'origin_ISO': 'ESP',
            'category': {'$regex': f'^{categoria}$', '$options': 'i'}
        })

        async for doc in cursor:
            titulo = doc.get("title", "")
            recetas_encontradas[titulo.lower()] = doc

    # Buscar por palabras clave si no se encontró ninguna
    if not recetas_encontradas:
        if categoria_normalizada not in PALABRAS_CLAVE:
            raise HTTPException(status_code=404, detail="Categoría no válida")

        palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]

        for collection_name in collections:
            collection = recipe_db_host[collection_name]
            cursor = collection.find({'origin_ISO': 'ESP'})

            async for doc in cursor:
                titulo = doc.get("title", "")
                titulo_sin_tildes = unidecode(titulo.lower())

                if any(p in titulo_sin_tildes for p in palabras_clave):
                    recetas_encontradas[titulo.lower()] = doc

    if not recetas_encontradas:
        raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

    # Calcular nutrición por receta y aplicar filtros
    resultados = []

    for receta_doc in recetas_encontradas.values():
        titulo = receta_doc.get("title")
        try:
            nutricion = await calcular_nutricion(titulo, por_porcion=por_porcion)
            valores = nutricion.get("valores_nutricionales", {})

            kcal = round(valores.get("energy_kcal", 0), 2)
            pro = round(valores.get("pro", 0), 2)
            car = round(valores.get("car", 0), 2)

            # Aplicar filtros
            if (
                (kcal_min is not None and kcal < kcal_min) or
                (kcal_max is not None and kcal > kcal_max) or
                (pro_min is not None and pro < pro_min) or
                (pro_max is not None and pro > pro_max) or
                (car_min is not None and car < car_min) or
                (car_max is not None and car > car_max)
            ):
                continue

            resultados.append({
                "receta": titulo,
                "kcal": kcal,
                "pro": pro,
                "car": car
            })

        except Exception as e:
            print(f"Error al calcular nutrición para '{titulo}': {e}")
            continue

    return {
        "categoria": categoria,
        "por_porcion": por_porcion,
        "filtros": {
            "kcal_min": kcal_min, "kcal_max": kcal_max,
            "pro_min": pro_min, "pro_max": pro_max,
            "car_min": car_min, "car_max": car_max
        },
        "resultados": resultados
    }
