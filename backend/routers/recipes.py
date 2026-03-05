from fastapi import APIRouter, HTTPException, Query, Depends, Form, File, UploadFile, status
from database.connection import recipe_db_host, bedca_collection, embeddings_recipe_collection, nutritionist_collection
from utils.food_utils import remove_stop_words, convert_objectid, convertir_a_gramos, extraer_cantidad_y_unidad
from pydantic import BaseModel #para el añadir recetas
from unidecode import unidecode
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from typing import Optional
from models.schemas import RecetaProfesionalCreate

import json
import os
import uuid


from fastapi.security import OAuth2PasswordBearer
from .security import decode_jwt_token

import re

router = APIRouter(tags=["Recipes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

collections = ['abuela_bedca', 'GNHD_24_25', 'bedca_FB']
recetas_collection = recipe_db_host['abuela_bedca']

UPLOAD_DIR = "static/images_recipies"


# Mapa de categorías a palabras clave
PALABRAS_CLAVE = {
    'sopas': ['sopa', 'crema', 'gazpacho'],
    'ensaladas': ['ensalada', 'ensaladas', 'tabulé', 'bowl', 'bol'],
    'verduras': [
        'verduras', 'hortalizas', 'calabacín', 'berenjena', 'espinacas', 'zanahoria',
        'coliflor', 'pimientos', 'brocoli', 'alcachofas', 'champiñones', 'setas', 'ajo',
        'cebolla', 'espárragos', 'puerro', 'tomate', 'pepino', 'patatas'
    ],
    'otros': ['desconocidos', 'pico de gallo', 'entremeses', 'aperitivos'],
    'arroz': ['paella', 'risotto', 'arroz', 'cuscús'],
    'pasta': ['espaguetis', 'macarrones', 'ravioli', 'lasaña', 'pizza', 'tortellini', 'spaghetti', 'ramen', 'noodles'],
    'guisos': ['guiso', 'puré', 'pure', 'lentejas', 'garbanzos', 'estofado', 'cocido', 'puchero', 'alubias'],
    'pescado': [
        'bonito', 'atún', 'sardina', 'dorada', 'bacalao', 'salmón', 'merluza', 'lubina', 
        'pescado', 'surimi', 'gambas', 'langostinos', 'anchoas', 'almejas', 'trucha'
    ],
    'carne': [
        'pollo', 'ternera', 'cerdo', 'pavo', 'jamón', 'conejo', 'redondo', 'carnes', 'lomo', 
        'salchichas', 'bacon', 'sobrasada', 'albóndigas', 'hamburguesa', 'carne molida', 'carne'
    ],
    'postres': [
        'postre', 'helado', 'tarta', 'galleta', 'bizcocho', 'mousse', 'chocolate', 'dulce',
        'brownie', 'pudin', 'batido', 'pancakes', 'porridge', 'flan', 'pudding', 'chía', 'yogur'
    ],
    'fruta': ['manzana', 'plátano', 'pera', 'naranja', 'pomelo', 'kiwi', 'sandía', 'melón', 'cereza', 'ciruela', 'fresa', 'mandarina', 'mango', 'açaí'],
    'pan': ['pan', 'bocadillo', 'bagel', 'sándwich', 'tostas', 'tostadas', 'crackers', 'pionono', 'blinis'],
    'empanadas': ['empanada', 'empanadillas', 'hojaldre', 'quiche', 'volovanes', 'canastitas'],
    'croquetas': ['croquetas', 'bombas'],
    'pates': ['paté', 'pate', 'tapenade', 'sobrasada', 'almogrote'],
    'salsas': ['salsa', 'dip', 'mantequilla']
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
async def buscar_recetas(nombre: str, limit: int = Query(20, ge=1, le=100)):
    nombre_raw = nombre.strip()
    nombre_normalizado = unidecode(nombre_raw.lower())
    palabras = remove_stop_words(nombre_normalizado)
    
    if not palabras:
        return []

    # Listas para organizar por relevancia
    exactos = []
    empiezan_por = []
    contienen = []

    # Regex que busca palabras completas para evitar "Cocotte" si buscas "Coco"
    # Usamos \b para marcar límites de palabra
    regex_pattern = "".join([f"(?=.*\\b{re.escape(unidecode(p))})" for p in palabras])

    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        
        # Buscamos en la DB (origin_ISO: 'ESP' es vital para ver las nuevas)
        cursor = collection.find({
            'origin_ISO': 'ESP',
            'title': {'$regex': regex_pattern, '$options': 'i'}
        }, {'title': 1}).limit(limit * 2)

        async for doc in cursor:
            titulo_db = doc.get("title")
            if not titulo_db: continue
            
            titulo_cap = capitalizar_primera_letra(titulo_db)
            titulo_db_norm = unidecode(titulo_db.lower())

            # --- CLASIFICACIÓN POR RELEVANCIA ---
            if titulo_db_norm == nombre_normalizado:
                if titulo_cap not in exactos:
                    exactos.append(titulo_cap)
            elif titulo_db_norm.startswith(nombre_normalizado):
                if titulo_cap not in empiezan_por:
                    empiezan_por.append(titulo_cap)
            else:
                if titulo_cap not in contienen:
                    contienen.append(titulo_cap)

    # Combinamos en orden de importancia
    resultado_final = (exactos + empiezan_por + contienen)[:limit]
    
    # Devolvemos [] en lugar de 404 para evitar errores en la consola del navegador
    return [{"nombre": r} for r in resultado_final]

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

'''
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
'''

@router.get("/por_categoria_nutri/{categoria}")
async def get_recetas_por_categoria_nutri(categoria: str, por_porcion: bool = True):
    categoria_normalizada = unidecode(categoria.lower().strip())
    recetas_unicas = set()
    resultados = []

    def get_nutri_field(valores: dict, *keys):
        """Obtiene el primer valor existente de los keys indicados"""
        for key in keys:
            if key in valores and valores[key] is not None:
                return valores[key]
        return 0

    # Recorrer colecciones y buscar por categoría exacta
    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        cursor = collection.find({
            'origin_ISO': 'ESP',
            '$or': [
                {'category': categoria},
                {'category': {'$regex': f'^{categoria}$', '$options': 'i'}},
                {'category': {'$in': [categoria]}}
            ]
        }, {'title': 1, 'nutritional_info': 1, 'n_diners': 1})

        async for doc in cursor:
            titulo = doc.get("title", "").strip()
            titulo_limpio = titulo.lower()
            if titulo_limpio in recetas_unicas:
                continue

            nutricion = doc.get("nutritional_info", {})
            raciones = doc.get("n_diners", 1) or 1  # evitar división por 0

            # Acceso inteligente a los campos
            if por_porcion:
                kcal = round(get_nutri_field(nutricion, "energy_kcal_porcion", "kcal_porcion", "kcal_racion", "energy_kcal") , 2)
                pro = round(get_nutri_field(nutricion, "proteins_porcion", "pro_porcion", "proteinas_porcion", "proteins_g", "pro") , 2)
                car = round(get_nutri_field(nutricion, "carbohydrates_porcion", "car_porcion", "carbohidratos_porcion", "carbohydrates_g", "car") , 2)
            else:
                kcal = round(get_nutri_field(nutricion, "energy_kcal", "kcal", "kcal_100g") , 2)
                pro = round(get_nutri_field(nutricion, "proteins_g", "pro", "proteinas") , 2)
                car = round(get_nutri_field(nutricion, "carbohydrates_g", "car", "carbohidratos") , 2)

                # Si el dato está por porción, multiplicar por raciones
                if "energy_kcal_porcion" in nutricion:
                    kcal *= raciones
                if "proteins_porcion" in nutricion or "pro_porcion" in nutricion:
                    pro *= raciones
                if "carbohydrates_porcion" in nutricion or "car_porcion" in nutricion:
                    car *= raciones

            resultados.append({
                "nombre": titulo,
                "kcal": kcal,
                "pro": pro,
                "car": car
            })
            recetas_unicas.add(titulo_limpio)

    if not resultados:
        raise HTTPException(status_code=404, detail="No se encontraron recetas para esta categoría")

    return {"categoria": categoria, "por_porcion": por_porcion, "recetas": resultados}

@router.get("/detalle_receta/{nombre}")
async def get_receta_detalle(nombre: str):
    nombre_normalizado = unidecode(nombre.strip().lower())

    for collection_name in collections:
        collection = recipe_db_host[collection_name]
        
        # 🔥 EL FIX ESTÁ AQUÍ: Quitamos el {"_id": 0} para que Mongo sí envíe el ID
        cursor = collection.find({})

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
                sugeridos = await _sugerir_recetas_logic(nombre)

                return {
                    "receta": jsonable_encoder(result),
                    "sugeridos": sugeridos
                }

    # Si no se encontró, intentar sugerencias
    sugeridos = await _sugerir_recetas_logic(nombre)
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
    recetas_encontradas = {}

    try:
        for collection_name in collections:
            collection = recipe_db_host[collection_name]
            cursor = collection.find({
                'origin_ISO': 'ESP',
                '$or': [
                    {'category': categoria},
                    {'category': {'$regex': f'^{re.escape(categoria)}$', '$options': 'i'}},
                    {'category': {'$in': [categoria]}}
                ]
            })
            async for doc in cursor:
                titulo = doc.get("title", "")
                if titulo:
                    recetas_encontradas[titulo.lower()] = doc

        if categoria_normalizada in PALABRAS_CLAVE:
            palabras_clave = [unidecode(p.lower()) for p in PALABRAS_CLAVE[categoria_normalizada]]
            for collection_name in collections:
                collection = recipe_db_host[collection_name]
                cursor = collection.find({'origin_ISO': 'ESP'})
                async for doc in cursor:
                    titulo = doc.get("title", "")
                    if titulo and any(p in unidecode(titulo.lower()) for p in palabras_clave):
                        recetas_encontradas[titulo.lower()] = doc

        if not recetas_encontradas:
            return {"categoria": categoria, "resultados": [], "por_porcion": por_porcion}

        resultados = []
        def safe_round(val):
            try: return round(float(val), 2)
            except: return 0.0

        for receta_doc in recetas_encontradas.values():
            titulo = receta_doc.get("title", "")
            valores = receta_doc.get("nutritional_info", {}) or {}
            raciones = receta_doc.get("n_diners", 1) or 1

            def get_nutri_field(*keys):
                for key in keys:
                    if key in valores and valores[key] is not None:
                        return valores[key]
                return None

            if por_porcion:
                kcal_val = get_nutri_field("energy_kcal_porcion", "kcal_porcion", "kcal_racion")
                pro_val = get_nutri_field("proteins_porcion", "pro_porcion", "proteinas_porcion")
                car_val = get_nutri_field("carbohydrates_porcion", "car_porcion", "carbohidratos_porcion")

                kcal = safe_round(kcal_val if kcal_val is not None else (get_nutri_field("energy_kcal", "kcal") or 0) / raciones)
                pro = safe_round(pro_val if pro_val is not None else (get_nutri_field("proteins_g", "pro") or 0) / raciones)
                car = safe_round(car_val if car_val is not None else (get_nutri_field("carbohydrates_g", "car") or 0) / raciones)
            else:
                kcal = safe_round(get_nutri_field("energy_kcal", "kcal") or 0)
                pro = safe_round(get_nutri_field("proteins_g", "pro") or 0)
                car = safe_round(get_nutri_field("carbohydrates_g", "car") or 0)

            # Filtros nutricionales (Backend side)
            if ((kcal_min and kcal < kcal_min) or (kcal_max and kcal > kcal_max) or
                (pro_min and pro < pro_min) or (pro_max and pro > pro_max) or
                (car_min and car < car_min) or (car_max and car > car_max)):
                continue

            resultados.append({
                "id": str(receta_doc.get("_id", "")),
                "name": titulo,
                "kcal": kcal,
                "pro": pro,
                "car": car,
                # IMPORTANTE: Asegúrate de enviar la lista de imágenes si existe
                "images": receta_doc.get("images", []) 
            })

        return {"categoria": categoria, "resultados": resultados, "por_porcion": por_porcion}

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#comentar para hacer pruebas sin torch '''    
from sentence_transformers import SentenceTransformer, util
import torch

model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
#comentar para hacer pruebas sin torch '''

async def _sugerir_recetas_logic(nombre: str, limit: int = 10):
    #comentar para hacer pruebas sin torch '''
    nombre_normalizado = unidecode(nombre.strip().lower())
    embedding_input = model.encode(nombre_normalizado)
    embedding_input = torch.tensor(embedding_input, dtype=torch.float32)

    docs = list(
        embeddings_recipe_collection.find(
            {},
            {"_id": 0, "title": 1, "category": 1, "embedding": 1}
        )
    )

    similarities = []

    for doc in docs:
        doc_title_normalizado = unidecode(doc["title"].strip().lower())
        if doc_title_normalizado == nombre_normalizado:
            continue

        emb = torch.tensor(doc["embedding"], dtype=torch.float32)
        sim = util.cos_sim(embedding_input, emb)[0][0].item()

        similarities.append((sim, doc, doc.get("category", "")))

    if not similarities:
        return []

    top = sorted(similarities, key=lambda x: x[0], reverse=True)[:limit]

    categoria_objetivo = next(
        (
            doc.get("category", "")
            for doc in docs
            if unidecode(doc["title"].strip().lower()) == nombre_normalizado
        ),
        None
    )

    top_ordenado = sorted(top, key=lambda x: x[2] != categoria_objetivo)

    return [
        {
            "titulo": doc["title"],
            "categoria": categoria_doc,
            "similitud": round(sim, 4)
        }
        for sim, doc, categoria_doc in top_ordenado
    ]
    
    #comentar para hacer pruebas sin torch '''
    #return []


@router.get("/sugerir_recetas/{nombre}")
async def sugerir_recetas(nombre: str, limit: int = 10):
    resultados = await _sugerir_recetas_logic(nombre, limit)

    if not resultados:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron sugerencias"
        )

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
                '$or': [
                    {'category': categoria},
                    {'category': {'$regex': f'^{categoria}$', '$options': 'i'}},
                    {'category': {'$in': [categoria]}}
                ]
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





@router.post("/crear_receta_profesional")
async def crear_receta_profesional(
    datos_receta: str = Form(...), 
    foto: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme)
):
    print("\n🚀 [BACKEND] Petición recibida", flush=True)

    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

    try:
        data_dict = json.loads(datos_receta)
        receta_input = RecetaProfesionalCreate(**data_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error en datos: {str(e)}")

    totales = {"energy_kcal": 0.0, "pro": 0.0, "car": 0.0}
    ingredientes_db = []
    
    for item in receta_input.ingredientes:
        alimento = await bedca_collection.find_one({"_id": ObjectId(item.alimento_id)})
        if alimento:
            info = alimento.get("nutritional_info_100g", {})
            f = item.cantidad_g / 100.0
            totales["energy_kcal"] += (info.get("energy_kcal") or 0) * f
            totales["pro"] += (info.get("pro") or 0) * f
            totales["car"] += (info.get("car") or 0) * f

            ingredientes_db.append({
                "ingredient": item.nombre_pantalla,
                "ingredientID": ObjectId(item.alimento_id),
                "cantidad_g": item.cantidad_g
            })

    ruta_final_para_db = "/static/images/placeholder_receta.webp"
    if foto:
        try:
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            nombre_limpio = re.sub(r'[^a-zA-Z0-9.-]', '_', foto.filename)
            nombre_archivo = f"{uuid.uuid4()}_{nombre_limpio}"
            file_path = os.path.join(UPLOAD_DIR, nombre_archivo)
            
            with open(file_path, "wb") as buffer:
                content = await foto.read()
                buffer.write(content)
            
            ruta_final_para_db = f"/static/images_recipies/{nombre_archivo}"
        except Exception as e:
            print(f"❌ Error guardando imagen: {e}")

    nuevo_doc = {
        "title": receta_input.titulo,
        "owner_id": str(nutricionista["_id"]),
        "source": "Nutricionista",
        "origin_ISO": "ESP",
        "n_diners": receta_input.comensales,
        "dificultad": receta_input.dificultad,
        "category": receta_input.categoria.lower(),
        "minutes": receta_input.minutos,
        "ingredients": ingredientes_db,
        "steps": receta_input.pasos,
        "detalles": getattr(receta_input, "detalles", ""),
        "images": [ruta_final_para_db],
        "nutritional_info": {k: round(v, 2) for k, v in totales.items()},
        "dietary_preferences": []
    }

    result = await recipe_db_host['abuela_bedca'].insert_one(nuevo_doc)
    return {"message": "Receta creada", "id": str(result.inserted_id), "img": ruta_final_para_db}


@router.put("/actualizar_receta/{receta_id}")
async def actualizar_receta_profesional(
    receta_id: str,
    datos_receta: str = Form(...), 
    foto: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme)
):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=404, detail="Nutricionista no encontrado")

    try:
        oid = ObjectId(receta_id)
    except:
        raise HTTPException(status_code=400, detail="ID de receta no válido")

    receta_previa = await recipe_db_host['abuela_bedca'].find_one({"_id": oid})
    if not receta_previa:
        raise HTTPException(status_code=404, detail="La receta no existe")

    if receta_previa.get("owner_id") != str(nutricionista["_id"]):
        raise HTTPException(status_code=403, detail="No autorizado para modificar esta receta")

    try:
        data_dict = json.loads(datos_receta)
        receta_input = RecetaProfesionalCreate(**data_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error en datos: {str(e)}")

    totales = {"energy_kcal": 0.0, "pro": 0.0, "car": 0.0}
    ingredientes_db = []
    
    for item in receta_input.ingredientes:
        alimento = await bedca_collection.find_one({"_id": ObjectId(item.alimento_id)})
        if alimento:
            info = alimento.get("nutritional_info_100g", {})
            f = item.cantidad_g / 100.0
            totales["energy_kcal"] += (info.get("energy_kcal") or 0) * f
            totales["pro"] += (info.get("pro") or 0) * f
            totales["car"] += (info.get("car") or 0) * f

            ingredientes_db.append({
                "ingredient": item.nombre_pantalla,
                "ingredientID": ObjectId(item.alimento_id),
                "cantidad_g": item.cantidad_g
            })

    ruta_imagenes = receta_previa.get("images", ["/static/images/placeholder_receta.webp"])
    if foto:
        try:
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            nombre_limpio = re.sub(r'[^a-zA-Z0-9.-]', '_', foto.filename)
            nombre_archivo = f"{uuid.uuid4()}_{nombre_limpio}"
            file_path = os.path.join(UPLOAD_DIR, nombre_archivo)
            
            with open(file_path, "wb") as buffer:
                content = await foto.read()
                buffer.write(content)
            
            ruta_final_para_db = f"/static/images_recipies/{nombre_archivo}"
            ruta_imagenes = [ruta_final_para_db]
        except Exception as e:
            print(f"❌ Error guardando imagen nueva: {e}")

    update_data = {
        "$set": {
            "title": receta_input.titulo,
            "n_diners": receta_input.comensales,
            "dificultad": receta_input.dificultad,
            "category": receta_input.categoria.lower(),
            "minutes": receta_input.minutos,
            "ingredients": ingredientes_db,
            "steps": receta_input.pasos,
            "detalles": getattr(receta_input, "detalles", ""),
            "images": ruta_imagenes,
            "nutritional_info": {k: round(v, 2) for k, v in totales.items()}
        }
    }

    await recipe_db_host['abuela_bedca'].update_one({"_id": oid}, update_data)
    return {"message": "Receta actualizada correctamente", "id": receta_id}


@router.delete("/eliminar_receta/{receta_id}")
async def eliminar_receta(receta_id: str, token: str = Depends(oauth2_scheme)):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=404, detail="Nutricionista no encontrado")

    try:
        oid = ObjectId(receta_id)
    except:
        raise HTTPException(status_code=400, detail="ID no válido")

    receta = await recipe_db_host['abuela_bedca'].find_one({"_id": oid})
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    if receta.get("owner_id") != str(nutricionista["_id"]):
        raise HTTPException(status_code=403, detail="No autorizado para eliminar esta receta")

    imagenes = receta.get("images", [])
    for img_path in imagenes:
        if "images_recipies" in img_path:
            file_system_path = img_path.lstrip("/") 
            if os.path.exists(file_system_path):
                try:
                    os.remove(file_system_path)
                    print(f"🗑️ Archivo eliminado: {file_system_path}")
                except Exception as e:
                    print(f"⚠️ No se pudo borrar el archivo: {e}")

    result = await recipe_db_host['abuela_bedca'].delete_one({"_id": oid})
    
    if result.deleted_count == 1:
        return {"message": "Receta y archivos asociados eliminados con éxito"}
    
    raise HTTPException(status_code=500, detail="Error al eliminar la receta de la base de datos")
