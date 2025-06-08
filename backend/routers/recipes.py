from fastapi import APIRouter, HTTPException, Query
from database.connection import recipe_db_host, bedca_collection, embeddings_recipe_collection
from utils.food_utils import remove_stop_words, convert_objectid, convertir_a_gramos, extraer_cantidad_y_unidad
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from typing import Optional

import re

router = APIRouter(tags=["Recipes"])

#collections = ['abuela', 'food.com', 'mealrec', 'recipe1m', 'recipenlg', 'recipeQA']
collections = ['abuela_bedca', 'GNHD_24_25']
recetas_collection = recipe_db_host['abuela_bedca']

# Mapa de categorías a palabras clave
PALABRAS_CLAVE = {
    'sopas': ['sopa', 'crema'],
    'ensaladas': ['ensalada', 'ensaladas', 'Ensaladas'],
    'verduras': ['1. Verduras y Hortalizas', 'Verduras y Hortalizas', 'Verduras', '1. verduras y hortalizas'],
    'otros': ['desconocidos'],
    'arroz': ['paella', 'risotto', 'arroz'],
    'pasta': ['espaguetis', 'macarrones', 'ravioli', 'lasaña', 'pizza', 'tortellini', 'spaghetti', 'ramen'],
    'guisos': ['guiso', 'puré', 'pure', 'lentejas', 'garbanzos', 'estofado', 'cocido'],
    'pescado': ['bonito', 'atún', 'sardina', 'dorada', 'bacalao', 'salmón', '2. pescados y mariscos'],
    'carne': ['pollo', 'ternera', 'cerdo', 'pavo', 'jamón', 'conejo', 'redondo'],
    'postre': ['postre', 'helado', 'tarta', 'galleta', 'bizcocho', 'mousse', 'chocolate', 'dulce', 'brownie', 'pudin', 'batido', 'pancakes', 'porridge'],
    'fruta': ['manzana', 'plátano', 'pera', 'naranja', 'pomelo', 'kiwi', 'sandía', 'melón', 'cereza', 'ciruela', 'fresa', 'mandarina']
}

def capitalizar_primera_letra(texto: str) -> str:
    if not texto:
        return texto
    return texto[0].upper() + texto[1:].lower()


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
                    # Añadimos título capitalizado
                    sugerencias.add(capitalizar_primera_letra(title))

                if len(sugerencias) >= limit:
                    break
        if len(sugerencias) >= limit:
            break
    if sugerencias:
        return [{"nombre": s} for s in list(sugerencias)[:limit]]
    else:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

from fastapi import Query
from typing import Optional
import re

@router.get("/por_categoria/{categoria}")
async def get_recetas_por_categoria(
    categoria: str,
    por_porcion: bool = True,
    kcal_min: Optional[float] = Query(None),
    kcal_max: Optional[float] = Query(None),
    pro_min: Optional[float] = Query(None),
    pro_max: Optional[float] = Query(None),
    car_min: Optional[float] = Query(None),
    car_max: Optional[float] = Query(None),
):
    categoria_normalizada = unidecode(categoria.lower().strip())
    print (categoria_normalizada)
    resultados = set()

    def get_nutri_field(valores: dict, *keys):
        for key in keys:
            if key in valores:
                return valores[key]
        return 0

    def pasa_filtros(valores):
        if por_porcion:
            kcal = get_nutri_field(valores, "energy_kcal_porcion", "kcal_porcion", "kcal_racion", "energy_kcal")
            pro = get_nutri_field(valores, "proteins_porcion", "pro_porcion", "proteinas_porcion", "proteins_g", "pro")
            car = get_nutri_field(valores, "carbohydrates_porcion", "car_porcion", "carbohidratos_porcion", "carbohydrates_g", "car")
        else:
            kcal = get_nutri_field(valores, "energy_kcal", "kcal", "kcal_100g")
            pro = get_nutri_field(valores, "proteins_g", "pro", "proteinas")
            car = get_nutri_field(valores, "carbohydrates_g", "car", "carbohidratos")

        if (
            (kcal_min is not None and kcal < kcal_min) or
            (kcal_max is not None and kcal > kcal_max) or
            (pro_min is not None and pro < pro_min) or
            (pro_max is not None and pro > pro_max) or
            (car_min is not None and car < car_min) or
            (car_max is not None and car > car_max)
        ):
            return False
        return True

    # 1. Buscar coincidencia exacta en 'category'
    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({
            'origin_ISO': 'ESP',
            'category': {'$regex': f'^{re.escape(categoria_normalizada)}$', '$options': 'i'}
        }, {'title': 1, 'nutritional_info': 1})

        async for doc in cursor:
            if pasa_filtros(doc.get("nutritional_info", {})):
                resultados.add(doc.get("title", ""))

    # 2. Buscar por palabras clave si la categoría es válida
    if categoria_normalizada not in PALABRAS_CLAVE:
        if not resultados:
            raise HTTPException(status_code=404, detail="Categoría no válida y sin resultados")
        return {"recetas": list(resultados)}

    palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]

    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({'origin_ISO': 'ESP'}, {'title': 1, 'nutritional_info': 1})

        async for doc in cursor:
            titulo = doc.get("title", "")
            titulo_sin_tildes = unidecode(titulo.lower())

            if any(palabra in titulo_sin_tildes for palabra in palabras_clave):
                if pasa_filtros(doc.get("nutritional_info", {})):
                    resultados.add(titulo)

    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

    return {"recetas": list(resultados)}


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

                # Determinar categoría según palabras clave
                categoria = "desconocida"
                for cat, palabras in PALABRAS_CLAVE.items():
                    if any(palabra in unidecode(titulo.lower()) for palabra in palabras):
                        categoria = cat
                        break

                result["categoria"] = categoria.capitalize()

                if "title" in result:
                    result["title"] = capitalizar_primera_letra(result["title"])

                # Buscar sugerencias relacionadas
                sugeridos = await sugerir_recetas(nombre)

                return {
                    "receta": jsonable_encoder(result),
                    "sugeridos": sugeridos
                }

    # Si no se encontró, intentar sugerencias
    sugeridos = await sugerir_recetas(nombre)
    if sugeridos:
        suggested_titles = [r["titulo"] for r in sugeridos]
        return {
            "message": "No se encontró la receta exacta. Pero puede que le interese alguna de estas recetas:",
            "sugeridos": suggested_titles
        }

    raise HTTPException(status_code=404, detail="Receta no encontrada")

@router.get("/{receta}/nutricion")
async def obtener_nutricion(
    receta: str,
    por_porcion: bool = Query(True)
):
    nombre_normalizado = unidecode(receta.strip().lower())
    receta_obj = None
    raciones = 1
    total_nutricion = {}

    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({})

        async for doc in cursor:
            titulo = doc.get("title", "")
            titulo_normalizado = unidecode(titulo.strip().lower())

            if titulo_normalizado == nombre_normalizado:
                receta_obj = doc
                raciones = receta_obj.get("n_diners", 1)
                total_nutricion = receta_obj.get("nutritional_info", {})
                # Capitalizar título con solo primera letra en mayúscula
                if "title" in receta_obj:
                    receta_obj["title"] = capitalizar_primera_letra(receta_obj["title"])
                break

        if receta_obj:
            break

    if not receta_obj:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    if por_porcion:
        total_nutricion = {k: round((v if v is not None else 0) / raciones, 2) for k, v in total_nutricion.items()}
    else:
        total_nutricion = {k: round((v if v is not None else 0), 2) for k, v in total_nutricion.items()}
    
    receta_obj["_id"] = str(receta_obj["_id"])
    return {
        "receta": receta_obj.get("title"),
        "_id": receta_obj["_id"],
        "por_porcion": por_porcion,
        "raciones": raciones,
        "nutritional_info": total_nutricion
    }

@router.get("/categoria/{categoria}/nutricion_simplificada")
async def obtener_kcal_pro_car_por_categoria(
    categoria: str,
    por_porcion: bool = True,
    kcal_min: Optional[float] = Query(None),
    kcal_max: Optional[float] = Query(None),
    pro_min: Optional[float] = Query(None),
    pro_max: Optional[float] = Query(None),
    car_min: Optional[float] = Query(None),
    car_max: Optional[float] = Query(None),
):
    categoria_normalizada = unidecode(categoria.lower().strip())
    print(categoria_normalizada)
    recetas_encontradas = {}

    # Buscar por categoría exacta
    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({
            'origin_ISO': 'ESP',
            'category': {'$regex': f'^{categoria}$', '$options': 'i'}
        })

        async for doc in cursor:
            titulo = doc.get("title", "")
            recetas_encontradas[titulo.lower()] = doc

    # Buscar por palabras clave
    if categoria_normalizada in PALABRAS_CLAVE:
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

    resultados = []

    for receta_doc in recetas_encontradas.values():

        titulo = receta_doc.get("title", "")
        valores = receta_doc.get("nutritional_info", {})
        receta_doc["_id"] = str(receta_doc["_id"])
        
        # Acceso inteligente a los campos por porción o por 100g
        def get_nutri_field(*keys):
            for key in keys:
                valor = valores.get(key)
                if valor is not None:
                    return valor
            return 0


        def safe_round(val):
            try:
                return round(float(val), 2)
            except (TypeError, ValueError):
                return 0.0

        if por_porcion:
            kcal = safe_round(get_nutri_field("energy_kcal_porcion", "kcal_porcion", "kcal_racion", "energy_kcal"))
            pro = safe_round(get_nutri_field("proteins_porcion", "pro_porcion", "proteinas_porcion", "proteins_g", "pro"))
            car = safe_round(get_nutri_field("carbohydrates_porcion", "car_porcion", "carbohidratos_porcion", "carbohydrates_g", "car"))
        else:
            kcal = safe_round(get_nutri_field("energy_kcal", "kcal", "kcal_100g"))
            pro = safe_round(get_nutri_field("proteins_g", "pro", "proteinas"))
            car = safe_round(get_nutri_field("carbohydrates_g", "car", "carbohidratos"))


        # Filtros
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
            "id": receta_doc["_id"],
            "name": titulo,
            "kcal": kcal,
            "pro": pro,
            "car": car
        })
    resultados.sort(key=lambda x: x["name"].lower())
    
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

    
from sentence_transformers import SentenceTransformer, util
import torch

model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

@router.get("/sugerir_recetas/{nombre}")
async def sugerir_recetas(nombre: str, limit: int = 10):
    nombre_normalizado = unidecode(nombre.strip().lower())
    embedding_input = model.encode(nombre_normalizado)
    embedding_input = torch.tensor(embedding_input, dtype=torch.float32)

    # Obtener todos los embeddings
    docs = list(embeddings_recipe_collection.find({}, {"_id": 0, "title": 1, "category": 1, "embedding": 1}))

    similarities = []
    for doc in docs:
        doc_title_normalizado = unidecode(doc["title"].strip().lower())
        if doc_title_normalizado == nombre_normalizado:
            continue

        categoria_doc = doc.get("category", "")
        emb = torch.tensor(doc["embedding"], dtype=torch.float32)
        sim = util.cos_sim(embedding_input, emb)[0][0].item()

        similarities.append((sim, doc, categoria_doc))

    if not similarities:
        raise HTTPException(status_code=404, detail="No se encontraron sugerencias")

    # Ordenar por similitud
    top = sorted(similarities, key=lambda x: x[0], reverse=True)[:limit]

    # Obtener la categoría de la receta objetivo (si existe)
    categoria_objetivo = None
    for doc in docs:
        if unidecode(doc["title"].strip().lower()) == nombre_normalizado:
            categoria_objetivo = doc.get("category", "")
            break

    # Ordenar para dar preferencia a la misma categoría
    top_ordenado = sorted(top, key=lambda x: x[2] != categoria_objetivo)

    # Formatear resultados
    resultados = [
        {
            "titulo": doc["title"],
            "categoria": categoria_doc,
            "similitud": round(sim, 4)
        }
        for sim, doc, categoria_doc in top_ordenado
    ]

    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron recetas distintas al término de búsqueda")

    return resultados

from pymongo import DESCENDING

@router.get("/recetas/maximos_nutricionales")
async def obtener_maximos_nutricionales(categoria: Optional[str] = None):
    campos_nutricionales = {
        "kcal": ["energy_kcal", "kcal", "kcal_100g"],
        "pro": ["proteins_g", "pro", "proteinas"],
        "car": ["carbohydrates_g", "car", "carbohidratos"]
    }

    recetas_filtradas = []

    if categoria:
        categoria_normalizada = unidecode(categoria.lower().strip())
        recetas_unicas = {}

        # 1. Buscar coincidencia exacta en 'category'
        for collection_name in collections:
            collection = recipe_db_host[collection_name]
            cursor = collection.find({
                'origin_ISO': 'ESP',
                'category': {'$regex': f'^{re.escape(categoria_normalizada)}$', '$options': 'i'}
            }, {'title': 1, 'nutritional_info': 1})

            async for doc in cursor:
                titulo = doc.get("title", "").lower()
                recetas_unicas[titulo] = doc

        # 2. Buscar por palabras clave si existen
        if categoria_normalizada in PALABRAS_CLAVE:
            palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]
            for collection_name in collections:
                collection = recipe_db_host[collection_name]
                cursor = collection.find({'origin_ISO': 'ESP'}, {'title': 1, 'nutritional_info': 1})

                async for doc in cursor:
                    titulo = doc.get("title", "")
                    titulo_sin_tildes = unidecode(titulo.lower())
                    if any(p in titulo_sin_tildes for p in palabras_clave):
                        recetas_unicas[titulo.lower()] = doc

        if not recetas_unicas:
            raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

        recetas_filtradas = list(recetas_unicas.values())

    # Función para obtener el máximo de cada conjunto de claves
    async def obtener_maximo_para_campos(keys, docs=None):
        valor_max = 0
        if docs is not None:
            for doc in docs:
                info = doc.get("nutritional_info", {})
                for key in keys:
                    valor = info.get(key)
                    if isinstance(valor, (int, float)) and valor > valor_max:
                        valor_max = valor
        else:
            for collection_name in collections:
                collection = recipe_db_host[collection_name]
                for key in keys:
                    doc = await collection.find_one(
                        {f"nutritional_info.{key}": {"$exists": True}, "origin_ISO": "ESP"},
                        sort=[(f"nutritional_info.{key}", DESCENDING)]
                    )
                    if doc:
                        valor = doc["nutritional_info"].get(key)
                        if isinstance(valor, (int, float)) and valor > valor_max:
                            valor_max = valor
        return round(valor_max, 2)

    kcal = await obtener_maximo_para_campos(campos_nutricionales["kcal"], docs=recetas_filtradas if categoria else None)
    pro = await obtener_maximo_para_campos(campos_nutricionales["pro"], docs=recetas_filtradas if categoria else None)
    car = await obtener_maximo_para_campos(campos_nutricionales["car"], docs=recetas_filtradas if categoria else None)

    return {"kcal": kcal, "pro": pro, "car": car}