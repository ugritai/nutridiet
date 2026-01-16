# -*- coding: utf-8 -*-
import asyncio
import re
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from unidecode import unidecode

# ================== DB ==================
recipe_host = AsyncIOMotorClient(
    'mongodb://app_user:secure_pass123@127.0.0.1:27018/fooddb?authSource=admin',
    serverSelectionTimeoutMS=5000
)
db = recipe_host['fooddb']
recetas_collection = db['abuela_bedca']
bedca_collection = db['all_ingredients']

# ================== LOG ==================
LOG_FILE = f"log_recalculo_kcal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"

def log(msg):
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# ================== CONSTANTES ==================
FRACCIONES = {
    '½': 0.5, '⅓': 0.33, '⅔': 0.66, '¼': 0.25, '¾': 0.75
}

FACTORES_GRAMOS = {
    'cucharada': 15,
    'cucharadas': 15,
    'cucharadita': 5,
    'taza': 240,
    'tazas': 240,
    'kilo': 1000,
    'kg': 1000,
    'litro': 1000,
    'ml': 1,
    'g': 1,
    'gr': 1
}

DEFAULT_GRAMOS_POR_ALIMENTO = {
    'huevo': 60,
    'tortilla': 25,
    'papa': 170,
    'cebolla': 50,
    'tomate': 120,
    'ajo': 3,
    'aguacate': 150,
    'aceite': 13,
    'queso': 30,
    'chile': 15
}

IGNORAR = [
    'al gusto', 'palillo', 'palillos', 'agua', 'sal', 'pimienta'
]

PALABRAS_BASURA = [
    'picado', 'picada', 'finamente', 'en', 'cubitos', 'tiras',
    'sin', 'semillas', 'para', 'freir', 'freír', 'opcional',
    'desmenuzado', 'blanca', 'roja', 'verdes', 'rojos',
    'mexicana', 'vegetal', 'mediano', 'mediana'
]

# ================== NORMALIZACIÓN ==================
def normalizar_texto(texto):
    texto = unidecode(texto.lower())
    texto = re.sub(r'\(.*?\)', '', texto)
    texto = re.sub(r'[^a-z0-9\s]', ' ', texto)
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip()

def extraer_cantidad(texto):
    for f, v in FRACCIONES.items():
        if f in texto:
            return v
    m = re.search(r'(\d+(?:[\.,]\d+)?)', texto)
    return float(m.group(1).replace(',', '.')) if m else None

def extraer_unidad(texto):
    for u in FACTORES_GRAMOS.keys():
        if u in texto:
            return u
    return None

def gramos_por_defecto(texto):
    for k, g in DEFAULT_GRAMOS_POR_ALIMENTO.items():
        if k in texto:
            return g
    return 50

# ================== LIMPIEZA DE INGREDIENTE ==================
def aislar_ingrediente(texto):
    t = limpiar_ruido_extra(texto)

    # quitar fracciones unicode
    for f in FRACCIONES:
        t = t.replace(f, ' ')

    # quitar números
    t = re.sub(r'\d+(?:[\.,]\d+)?', ' ', t)

    # quitar unidades métricas
    for u in FACTORES_GRAMOS:
        t = re.sub(rf'\b{u}\b', ' ', t)

    palabras = [
        p for p in t.split()
        if p not in PALABRAS_BASURA and len(p) > 2
    ]

    return ' '.join(palabras)

# ================== RESOLUCIÓN ALIMENTO ==================
# ================== ALIAS / CATEGORÍAS ==================
ALIAS = {
    # básicos
    "ajo": "ajo crudo",
    "caldo pollo": "caldo de pollo",
    "aceite oliva": "aceite de oliva",
    "aceite": "aceite de oliva",

    # vegetales
    "cilantro": "cilantro hojas crudo",
    "chile serrano": "chile verde crudo",
    "chiles serranos": "chile verde crudo",
    "calabacin": "calabacin crudo",
    "elote": "maiz dulce grano",
    "maiz": "maiz dulce",
    "tomate roma": "tomate crudo",
    "tomate": "tomate crudo",

    # lácteos
    "queso fresco": "queso fresco",
    "feta": "queso feta",

    # limón
    "limon": "limon crudo"
}


CATEGORIAS = {
    "queso": "queso",
    "aceite": "aceite",
    "chile": "chile",
    "tomate": "tomate",
    "cebolla": "cebolla",
    "patata": "patata",
    "papa": "patata",
    "limon": "limon",
    "nata": "nata",
    "crema": "nata"
}

# ================== NUEVAS CONSTANTES ==================

UNIDADES_EXTRA = [
    "diente", "dientes",
    "cucharadita", "cucharaditas",
    "cucharada", "cucharadas",
    "sopera", "soperas",
    "rebanada", "rebanadas",
    "taza", "tazas",
    "gramo", "gramos",
    "aproximadamente"
]

SINONIMOS = {
    "aceite vegetal": "aceite",
    "aceite de oliva": "aceite",
    "mantequilla": "mantequilla",
    "caldo de pollo": "caldo pollo",
    "pan frances": "pan blanco",
    "harina": "harina trigo",
    "leche": "leche entera",
    "calabaza": "calabacin",
}

# ================== NORMALIZACIÓN DURA ==================

def normalizar_pre(texto):
    t = unidecode(texto.lower())

    # rangos tipo 1-½
    t = t.replace('-', ' ')

    # quitar símbolos raros
    t = re.sub(r'[*~]', ' ', t)

    # quitar números
    t = re.sub(r'\d+(?:[\.,]\d+)?', ' ', t)

    # quitar fracciones unicode
    for f in FRACCIONES:
        t = t.replace(f, ' ')

    # quitar unidades
    for u in UNIDADES_EXTRA + list(FACTORES_GRAMOS.keys()):
        t = re.sub(rf'\b{u}\b', ' ', t)

    t = re.sub(r'\s+', ' ', t)
    return t.strip()

# ================== AISLAR INGREDIENTE ==================

def aislar_ingrediente(texto):
    t = normalizar_pre(texto)

    palabras = [
        p for p in t.split()
        if p not in PALABRAS_BASURA and len(p) > 2
    ]

    base = ' '.join(palabras)

    # aplicar sinónimos
    for k, v in SINONIMOS.items():
        if k in base:
            base = v

    return base.strip()

# ================== RESOLVER ALIMENTO (FINAL) ==================

async def resolver_alimento(texto, ing_id=None):
    # 0️⃣ ObjectId directo
    if ing_id:
        try:
            doc = await bedca_collection.find_one({"_id": ObjectId(ing_id)})
            if doc:
                return doc
        except:
            pass

    ingrediente = aislar_ingrediente(texto)
    if not ingrediente:
        return None

    tokens = ingrediente.split()

    # 1️⃣ tokens AND (estrategia principal)
    regex_and = ''.join(f'(?=.*{re.escape(t)})' for t in tokens)
    doc = await bedca_collection.find_one({
        "name_normalized": {"$regex": regex_and}
    })
    if doc:
        return doc

    # 2️⃣ fallback por ingrediente base
    for base in [
        "ajo", "cebolla", "aceite", "mantequilla", "leche",
        "harina", "pan", "calabacin", "caldo", "tomate"
    ]:
        if base in ingrediente:
            doc = await bedca_collection.find_one({
                "name_normalized": {"$regex": f"^{base}"}
            })
            if doc:
                return doc

    return None


# ================== CORE ==================
async def calcular_y_guardar(receta):
    titulo = receta.get("title", "[sin título]")
    total_nutricion = {}
    fallos = []

    log(f"\n--- RECETA: {titulo} ---")

    for ing in receta.get("ingredients", []):
        texto = ing.get("ingredient", "")
        if not texto:
            continue

        texto_norm = normalizar_texto(texto)

        if any(x in texto_norm for x in IGNORAR):
            log(f"IGNORADO: {texto}")
            continue

        alimento = await resolver_alimento(texto, ing.get("ingredientID"))
        if not alimento:
            fallos.append(texto)
            log(f"NO RESUELTO: {texto}")
            continue

        info = alimento.get("nutritional_info_100g", {})
        if not info:
            fallos.append(texto)
            log(f"SIN INFO NUTRICIONAL: {texto}")
            continue

        cantidad = extraer_cantidad(texto) or 1
        unidad = extraer_unidad(texto_norm)

        if unidad:
            gramos = cantidad * FACTORES_GRAMOS.get(unidad, 50)
        else:
            gramos = cantidad * gramos_por_defecto(texto_norm)

        log(f"OK: {texto} → {alimento.get('name_esp','?')} ({gramos:.1f} g)")

        for k, v in info.items():
            try:
                total_nutricion[k] = total_nutricion.get(k, 0) + float(v) * gramos / 100
            except:
                pass

    if "energy.kcal" not in total_nutricion and "energy.kj" in total_nutricion:
        total_nutricion["energy.kcal"] = total_nutricion["energy.kj"] * 0.239
        log("Convertido energy.kj → energy.kcal")

    kcal = total_nutricion.get("energy.kcal", 0)
    log(f"TOTAL KCAL: {kcal:.2f}")

    await recetas_collection.update_one(
        {"_id": receta["_id"]},
        {"$set": {"nutritional_info": total_nutricion}}
    )

    if fallos:
        log("INGREDIENTES CON PROBLEMAS:")
        for f in fallos:
            log(f"  - {f}")

# ================== RUNNER ==================
async def procesar_recetas():
    total = 0
    restauradas = 0
    siguen_cero = 0

    log("=== INICIO RECALCULO KCAL ===")

    cursor = recetas_collection.find({})
    async for receta in cursor:
        total += 1

        kcal_antes = receta.get("nutritional_info", {}).get("energy.kcal", 0)

        if not kcal_antes or kcal_antes <= 0:
            await calcular_y_guardar(receta)

            # volver a leer la receta para ver resultado final
            receta_actualizada = await recetas_collection.find_one(
                {"_id": receta["_id"]},
                {"nutritional_info.energy.kcal": 1}
            )

            kcal_despues = (
                receta_actualizada
                .get("nutritional_info", {})
                .get("energy.kcal", 0)
            )

            if kcal_despues and kcal_despues > 0:
                restauradas += 1
            else:
                siguen_cero += 1

    log("\n=== RESUMEN FINAL ===")
    log(f"Total recetas en DB: {total}")
    log(f"Recetas restauradas correctamente: {restauradas}")
    log(f"Recetas que siguen a 0 kcal: {siguen_cero}")
    log("=== FIN ===")

# ================== MAIN ==================
if __name__ == "__main__":
    asyncio.run(procesar_recetas())
