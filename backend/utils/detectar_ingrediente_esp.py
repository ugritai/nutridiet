#!pip install transformers

#!pip install sentence_transformers

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
#import bd
import pymongo
from pymongo import MongoClient
import json
import os



# Carga de la base de datos 

MONGO_URI = 'mongodb://localhost:27018/'

client = MongoClient(MONGO_URI)

db = client['nutridiet']
collection_ingredientes = db['bedca']
collection_recetas = db['GNHD_24_25']

# Carga del modelo de lenguaje

model = SentenceTransformer('hiiamsid/sentence_similarity_spanish_es') # MOdelo en español

# Funciones para extraer ingrediente principal y detalles por separado

def get_main_ingredient(name):
    return name.split(',')[0]

def get_details(name):
    parts = name.split(',')
    return ','.join(parts[1:]).strip()

# Carga de info nutricional de la base de datos

cursor = collection_ingredientes.find({}) # Obtener todos los ingredientes

# Crear un DataFrame con los datos de la base de datos

df = pd.DataFrame(list(cursor))

# Extraer ingrediente principal y detalles

df['main_ingredient'] = df['name_esp'].apply(get_main_ingredient)
df['ingredient_details'] = df['name_esp'].apply(get_details)

# Convertimos el DataFrame a un diccionario

dict_df = df.to_dict('records')


print("Codificando ingredientes...")

main_ingredient_encoding = model.encode(list(df['main_ingredient']))
ingredient_details_encoding = model.encode(list(df['ingredient_details']))



# Obtenemos las recetas de la base de datos

cursor_recetas = list(collection_recetas.find({})) # Obtener todas las recetas


# Recorremos todas las recetas

print("Recorremos todas las recetas...")

for receta in cursor_recetas: # Recorrer todas las recetas

    ingredientes = receta['ingredients']

    for ingrediente_receta in ingredientes: # Recorrer todos los ingredientes de la receta

        # Codificar el ingrediente de la receta

        mi_ingrediente = ingrediente_receta['ingredient']
        mi_ingrediente_main = model.encode([get_main_ingredient(mi_ingrediente)])
        mi_ingrediente_details = model.encode([get_details(mi_ingrediente)])

        print(ingrediente_receta['ingredient'])

        # Comparar emb con todos los vectores de embeddings
        similarities = np.array(cosine_similarity(mi_ingrediente_main.reshape(1, -1), main_ingredient_encoding))

        # Obtener los índices de los embeddings ordenados por similitud descendente
        sorted_indices = similarities.argsort()[0][::-1]

        # nos quedamos con el valor máximo de similitud alcanzado, y queremos obtener todos los alimentos principales que den ese valor máximo. Puede dar más de uno.
        max_similarity = np.max(similarities)
        # Obtener todos los alimentos principales que dan ese valor máximo
        max_similarity_positions = [idx for idx, sim in enumerate(similarities[0]) if sim == max_similarity]

        # Imprimir el valor máximo de similitud y los alimentos principales correspondientes
        print("Máxima similitud alcanzada:", max_similarity)
        print("\nAlimentos principales con máxima similitud (solo nos fijamos en lo que hay antes de la primera coma):")
        for pos in max_similarity_positions:
            print(dict_df[pos]['name_esp'])

        """## 2.2 Identificación de la parte detallada del ingrediente (todo lo que sigue la primera coma)
        Una vez tenemos la coincidencia máxima de ingrediente (en general), miramos la info detallada para intentar acertar al máximo. Usamos la misma metodología, pero esta vez únicamente nos quedamos con el que nos de la descripción más acertada de todas.
        """

        similarities = np.array(cosine_similarity(mi_ingrediente_details.reshape(1, -1), ingredient_details_encoding[max_similarity_positions]))
        sorted_indices = similarities.argsort()[0][::-1]

        # Obtener los alimentos principales que corresponden a los índices ordenados
        max_similarity_positions_sorted = [max_similarity_positions[idx] for idx in sorted_indices]

        print(max_similarity_positions_sorted)

        for pos in max_similarity_positions_sorted:
            print(dict_df[pos]['name_esp'])

        """### Resultado

        Y la opción final más parecida, sería la que aparece en este último vector ordenado en la posición 0

        """

        print(dict_df[max_similarity_positions_sorted[0]])

        collection_recetas.update_one(
            {'_id': receta['_id'], 'ingredients.ingredient': mi_ingrediente},
            {'$set': {
                'ingredients.$.ingredientID': dict_df[max_similarity_positions_sorted[0]]['_id'],
                'ingredients.$.max_similarity': float(max_similarity)
            }}
        )

