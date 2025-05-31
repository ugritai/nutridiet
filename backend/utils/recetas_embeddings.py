from sentence_transformers import SentenceTransformer
from unidecode import unidecode
from database.connection import db_host, recipe_db_host
import asyncio

# Cargar modelo
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

# Colección donde se guardarán los embeddings
embeddings_collection = db_host["recetas_embeddings"]

# Lista de colecciones de recetas
colecciones = [
    recipe_db_host["abuela_bedca"],
    recipe_db_host["GNHD_24_25"]
]

# Obtener documentos de varias colecciones
async def fetch_all_documents():
    documentos = []
    for coleccion in colecciones:
        cursor = coleccion.find()
        docs = await cursor.to_list(length=10000)
        documentos.extend(docs)
    return documentos

# Ejecutar el proceso de embeddings
def main():
    embeddings_collection.delete_many({})  # Limpiar antes

    documentos = asyncio.run(fetch_all_documents())

    for doc in documentos:
        title = doc.get("title", "")
        category = doc.get("category", "")
        id_original = doc.get("_id")

        if not title:
            continue

        texto = unidecode(title.lower())
        embedding = model.encode(texto)

        embeddings_collection.insert_one({
            "title": title,
            "category": category,
            "_id_original": id_original,
            "embedding": embedding.tolist()
        })

    print("✅ Embeddings guardados con _id_original.")

if __name__ == "__main__":
    main()
