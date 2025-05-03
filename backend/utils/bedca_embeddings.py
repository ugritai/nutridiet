from sentence_transformers import SentenceTransformer
from unidecode import unidecode
from database.connection import db_host, bedca_collection
import asyncio

# Configuración
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
embeddings_collection = db_host["bedca_embeddings"]

# Async: obtiene todos los documentos
async def fetch_async_documents():
    cursor = bedca_collection.find()
    return await cursor.to_list(length=10000)

# Main sincrónico
def main():
    embeddings_collection.delete_many({})  # Limpia embeddings anteriores
    documents = asyncio.run(fetch_async_documents())

    for doc in documents:
        name_esp = doc.get("name_esp", "")  # Solo usar el nombre
        texto_sin_tildes = unidecode(name_esp.lower())  # Eliminar tildes y pasar a minúsculas

        # Genera el embedding para el nombre
        embedding = model.encode(texto_sin_tildes)

        # Guarda en la colección de embeddings solo el nombre y el embedding
        embeddings_collection.insert_one({
            "name_esp": name_esp,
            "embedding": embedding.tolist(),
        })

    print("✅ Embeddings generados y guardados con éxito.")

if __name__ == "__main__":
    main()
