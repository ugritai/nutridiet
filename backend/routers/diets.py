from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from models.schemas import DietCreate
from database.connection import intake_collection, nutritionist_collection, diet_collection
from fastapi.security import OAuth2PasswordBearer 
from .security import decode_jwt_token
import datetime
from bson import ObjectId
from typing import Any



router = APIRouter(tags=["Diets"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

from datetime import datetime

def convert_date_to_datetime(dieta_dict):
    for dia in dieta_dict["dias"]:
        # convertir fecha (datetime.date) a datetime.datetime
        dia["fecha"] = datetime(dia["fecha"].year, dia["fecha"].month, dia["fecha"].day)
    # igual para start_date y end_date
    dieta_dict["start_date"] = datetime(
        dieta_dict["start_date"].year,
        dieta_dict["start_date"].month,
        dieta_dict["start_date"].day,
    )
    dieta_dict["end_date"] = datetime(
        dieta_dict["end_date"].year,
        dieta_dict["end_date"].month,
        dieta_dict["end_date"].day,
    )
    return dieta_dict

@router.post("/crear_dieta/")
async def crear_dieta(
    dieta: DietCreate,
    token: str = Depends(oauth2_scheme),
):
    print("Payload recibido:", dieta)
    try:
        payload = decode_jwt_token(token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

        email_nutri = payload.get("sub")
        if not email_nutri:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

        nutricionista = nutritionist_collection.find_one({"email": email_nutri})
        if not nutricionista:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

        dieta_dict = dieta.dict()

        dieta_dict["nutricionista_email"] = nutricionista["email"]
        dieta_dict = convert_date_to_datetime(dieta_dict)

        # guardar en MongoDB
        result = diet_collection.insert_one(dieta_dict)

        return {"message": "Dieta creada exitosamente", "id": str(result.inserted_id)}
    except Exception as e:
        print("Error al crear dieta:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def serialize_dieta_con_ingestas(dieta: dict[str, Any], ingestas_dict: dict[str, Any]) -> dict[str, Any]:
    dieta["_id"] = str(dieta["_id"])
    for dia in dieta.get("dias", []):
        dia["fecha"] = dia["fecha"].isoformat()
        for ingesta in dia.get("ingestas", []):
            intake_id = ingesta.get("intake_id")
            if isinstance(intake_id, ObjectId):
                str_id = str(intake_id)
                ingesta["intake_id"] = str_id
                intake = ingestas_dict.get(str_id)
                if intake:
                    # Formatear las recetas por tipo
                    recetas_por_tipo = {
                        "entrante": [],
                        "primer_plato": [],
                        "segundo_plato": [],
                        "postre": [],
                        "bebida": []
                    }
                    for tipo in recetas_por_tipo:
                        for r in intake.get("recetas", {}).get(tipo, []):
                            recetas_por_tipo[tipo].append({
                                "name": r.get("name"),
                                "kcal": r.get("kcal"),
                                "pro": r.get("pro"),
                                "car": r.get("car")
                            })
                    ingesta["contenido"] = {
                        "intake_type": intake.get("tipo", ""),
                        "recipes": recetas_por_tipo
                    }
    return dieta


def serialize_mongo_document(doc):
    if not isinstance(doc, dict):
        return doc
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, datetime):
            doc[k] = v.isoformat()
        elif isinstance(v, list):
            doc[k] = [serialize_mongo_document(i) if isinstance(i, dict) else i for i in v]
        elif isinstance(v, dict):
            doc[k] = serialize_mongo_document(v)
    return doc

@router.get("/dietas_paciente/{pacienteN}")
async def obtener_dietas_paciente(pacienteN: str):
    try:
        dietas_cursor = diet_collection.find({"paciente": pacienteN})
        resultado = []

        for dieta in dietas_cursor:
            nombre_dieta = dieta.get("name")
            fecha_inicio = dieta.get("start_date")
            fecha_final = dieta.get("end_date")
            dias = dieta.get("dias", [])
            _id = str(dieta["_id"])  # ✅ Aquí obtenemos el id

            # Extraer intake_ids base
            intake_ids = [
                ObjectId(ing["intake_id"].split("-")[0])
                for dia in dias for ing in dia.get("ingestas", [])
                if "intake_id" in ing
            ]

            # Buscar subingestas por _id
            subingestas_cursor = intake_collection.find({"_id": {"$in": intake_ids}})
            subingesta_map = {}
            for ing in subingestas_cursor:
                ing_serialized = serialize_mongo_document(ing)
                subingesta_map[ing_serialized["_id"]] = ing_serialized

            # Enriquecer ingestas con sus detalles
            for dia in dias:
                for ing in dia.get("ingestas", []):
                    _id_base = ing["intake_id"].split("-")[0]
                    ing["detalles"] = subingesta_map.get(_id_base)

            dieta_serializada = {
                "_id": _id,  # ✅ ID incluido
                "nombre_dieta": nombre_dieta,
                "fecha_inicio": fecha_inicio.isoformat() if isinstance(fecha_inicio, datetime) else fecha_inicio,
                "fecha_final": fecha_final.isoformat() if isinstance(fecha_final, datetime) else fecha_final,
                "dias": dias
            }

            resultado.append(dieta_serializada)

        return jsonable_encoder(resultado)

    except Exception as e:
        print("❌ ERROR AL OBTENER DIETAS:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dieta_por_id/{id}")
async def get_dieta_por_id(id: str):
    print("🔍 Intentando buscar dieta con ID:", id)
    try:
        obj_id = ObjectId(id)
    except Exception as e:
        print(f"❌ ID inválido para ObjectId: {id} | Error: {e}")
        raise HTTPException(status_code=400, detail="ID inválido")

    dieta = diet_collection.find_one({"_id": obj_id})

    if not dieta:
        print(f"⚠️ No se encontró dieta con ObjectId({id}) en la colección '{diet_collection.name}'")
        raise HTTPException(status_code=404, detail="Dieta no encontrada")

    dias = dieta.get("dias", [])

    intake_ids = [
        ObjectId(ing["intake_id"].split("-")[0])
        for dia in dias for ing in dia.get("ingestas", [])
        if "intake_id" in ing
    ]

    subingestas_cursor = intake_collection.find({"_id": {"$in": intake_ids}})
    subingesta_map = {
        str(doc["_id"]): serialize_mongo_document(doc)
        for doc in subingestas_cursor
    }

    for dia in dias:
        for ing in dia.get("ingestas", []):
            _id_base = ing["intake_id"].split("-")[0]
            ing["detalles"] = subingesta_map.get(_id_base)

    result = {
    "_id": str(dieta["_id"]),
    "name": dieta["name"],
    "fecha_inicio": dieta["start_date"].isoformat() if isinstance(dieta["start_date"], datetime) else dieta["start_date"],
    "fecha_final": dieta["end_date"].isoformat() if isinstance(dieta["end_date"], datetime) else dieta["end_date"],
    "dias": dias,
    "paciente": dieta.get("paciente"),
    "nutricionista_email": dieta.get("nutricionista_email")
    }

    print("✅ Dieta encontrada:", result["name"])
    return jsonable_encoder(result)

@router.put("/editar_dieta/{id}")
async def editar_dieta(id: str, dieta_data: dict):
    try:
        obj_id = ObjectId(id)
        result = diet_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "name": dieta_data.get("name"),
                "start_date": dieta_data.get("start_date"),
                "end_date": dieta_data.get("end_date"),
                "dias": dieta_data.get("dias"),
                "paciente": dieta_data.get("paciente")
            }}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Dieta no encontrada")

        return {"message": "Dieta actualizada correctamente"}
    except Exception as e:
        print("❌ Error al actualizar dieta:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
    
