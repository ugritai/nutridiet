import re
from bson import ObjectId
import unicodedata

STOP_WORDS = {",", "-", " "}

def remove_stop_words(nombre: str):
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    palabras = [palabra for palabra in palabras if palabra not in STOP_WORDS]
    return palabras

def convert_objectid(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, dict):
                convert_objectid(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, ObjectId):
                        item = str(item)
                    elif isinstance(item, dict):
                        convert_objectid(item)
    return data

# Función para convertir fracciones a su equivalente decimal
def convertir_fracciones_a_decimal(texto):
    if isinstance(texto, float) or isinstance(texto, int):
        # Convertir números a cadena para permitir la conversión de fracciones
        texto = str(texto)
    texto = texto.replace('\u00BD', '0.5')  # ½ -> 0.5
    texto = texto.replace('\u2153', '0.33') # ⅓ -> 0.33
    texto = texto.replace('\u00BC', '0.25') # ¼ -> 0.25
    texto = texto.replace('\u2154', '0.67') # ⅔ -> 0.67
    texto = texto.replace('\u00BE', '0.75') # ¾ -> 0.75
    return texto
     
# Convertir unidades a gramos
def convertir_a_gramos(cantidad, unidad):
    conversion_factors = {
        'cucharada': 15,  # asumiendo 15g por cucharada
        'cucharadas': 15,  # asumiendo 15g por cucharada
        'rebanada': 15,  # asumiendo 15g por rebanada
        'rebanadas': 15,  # asumiendo 15g por rebanada
        'unidad': 100,  # asumiendo 100g por unidad
        'unidades': 100,  # asumiendo 100g por unidad
        'taza': 240,  # asumiendo 240g por taza
        'tazas': 240,  # asumiendo 240g por taza
        'kilo': 1000,
        'kilos': 1000,
        'dientes': 3, # asumiento diente de ajo
        'diente': 3 # asumiento diente de ajo
    }
    return cantidad * conversion_factors.get(unidad, 1)

def escape_regex_special_chars(text):
    regex_special_chars = r'[\\^$*+?.()|{}\[\]]'
    return re.sub(regex_special_chars, lambda match: rf'\{match.group(0)}', text)

# Función para eliminar palabras vacías del nombre del ingrediente
def remove_stopwords(nombre):
    # Lista de palabras vacías que quieres eliminar
    stopwords = ['el', 'la', 'los', 'las', 'u','un', 'una', 'unos', 'unas', 'de', 'para', 'con', 'sin', 'por', 'entre', 'sobre', 'o']
    # Patrón para identificar palabras vacías en el nombre
    # r'\b(?:el|la|los|las|u|un|una|unos|unas|de|para|con|sin|por|entre|sobre|o)\b'
    pattern = r'\b(?:{})\b'.format('|'.join(stopwords))
    # Eliminar palabras vacías del nombre
    nombre_sin_stopwords = re.sub(pattern, '', nombre, flags=re.IGNORECASE)
    
    return nombre_sin_stopwords.strip()

def quitar_tildes(texto):
    # Normalizar el texto a 'NFKD' para separar los caracteres de los acentos
    texto_normalizado = unicodedata.normalize('NFKD', texto)
    # Filtrar para quedarse solo con los caracteres base y eliminar las marcas diacríticas (acentos)
    texto_sin_tildes = ''.join([c for c in texto_normalizado if not unicodedata.combining(c)])
    return texto_sin_tildes


