from pymongo import MongoClient

# Conexión MongoDB
client = MongoClient("mongodb://localhost:27018")  # Ajusta si es necesario
db = client["nutridiet"]
col = db["GNHD_24_25"]

def etiquetar_receta(receta):
    etiquetas = []
    valores = receta.get("nutritional_info", {})

    kcal_100g = valores.get("energy_kcal")
    kcal_racion = receta.get("kcal_por_racion")
    grasa = valores.get("fat_g")
    fibra = valores.get("fiber_g")
    azucar = valores.get("sugars_g")
    proteina = valores.get("proteins_g")
    sodio = valores.get("sodium_g")

    # Calorías
    if kcal_100g is not None and kcal_100g <= 40:
        etiquetas.append("Bajo en calorías")
    elif kcal_racion is not None and kcal_racion <= 150:
        etiquetas.append("Bajo en calorías")

    # Grasa
    if grasa is not None:
        if grasa <= 3:
            etiquetas.append("Bajo en grasa")
        elif grasa >= 17.5:
            etiquetas.append("Alto en grasa")

    # Fibra
    if fibra is not None:
        if fibra == 0:
            etiquetas.append("Sin fibra")
        elif fibra >= 3:
            etiquetas.append("Alto en fibra")

    # Azúcar
    if azucar is not None:
        if azucar == 0:
            etiquetas.append("Sin azúcar")
        elif azucar <= 5:
            etiquetas.append("Bajo en azúcar")

    # Proteínas
    if proteina is not None and proteina >= 10:
        etiquetas.append("Alto en proteínas")

    # Sodio
    if sodio is not None and sodio <= 0.12:
        etiquetas.append("Bajo en sodio")

    return etiquetas

# Procesar y actualizar cada receta
recetas = col.find({})
for receta in recetas:
    etiquetas = etiquetar_receta(receta)
    col.update_one(
        {"_id": receta["_id"]},
        {"$set": {"dietary_preferences": etiquetas}}
    )

print("Actualización completada.")
