import re

STOP_WORDS = {",", "-", " "}

def remove_stop_words(nombre: str):
    nombre = re.sub(r'[^\w\s]', '', nombre.lower())
    palabras = nombre.split()
    palabras = [palabra for palabra in palabras if palabra not in STOP_WORDS]
    return palabras
