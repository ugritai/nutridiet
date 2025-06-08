from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from models.schemas import DietCreate
from database.connection import intake_collection, nutritionist_collection, diet_collection, pacient_collection
from fastapi.security import OAuth2PasswordBearer 
from .security import decode_jwt_token
import datetime
from bson import ObjectId
from typing import Any, Dict, List


router = APIRouter(tags=["Diets"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

from datetime import datetime
def ensure_datetime(value):
    if isinstance(value, datetime):
        return value
    elif isinstance(value, str):
        return datetime.fromisoformat(value)
    elif isinstance(value, dict): 
        return datetime(value["year"], value["month"], value["day"])
    else:
        raise ValueError("Fecha no válida")

def convert_date_to_datetime(dieta_dict: Dict) -> Dict:
    for day in dieta_dict["days"]:
        day["date"] = ensure_datetime(day["date"])

    dieta_dict["start_date"] = ensure_datetime(dieta_dict["start_date"])
    dieta_dict["end_date"] = ensure_datetime(dieta_dict["end_date"])
    return dieta_dict

from fastapi import Path

@router.post("/crear_dieta/{pacienteN}")
async def crear_dieta(
    pacienteN: str = Path(..., description="Nombre del paciente o su ID"),
    dieta: DietCreate = None,
    token: str = Depends(oauth2_scheme),
):
    print("Payload recibido:", dieta)
    try:
        # Validar token
        payload = decode_jwt_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        email_nutri = payload.get("sub")
        if not email_nutri:
            raise HTTPException(status_code=401, detail="Token inválido")

        # Buscar nutricionista
        nutricionista = nutritionist_collection.find_one({"email": email_nutri})
        if not nutricionista:
            raise HTTPException(status_code=404, detail="Nutricionista no encontrado")

        # Buscar paciente (por nombre o ID)
        paciente = pacient_collection.find_one({
            "$or": [
                {"name": pacienteN},
                {"_id": ObjectId(pacienteN)} if ObjectId.is_valid(pacienteN) else {"_id": None}
            ]
        })
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Preparar datos
        dieta_dict = dieta.dict()
        dieta_dict["nutritionist_email"] = nutricionista["email"]
        dieta_dict["nutritionist_id"] = str(nutricionista["_id"])
        dieta_dict["patient_name"] = paciente["name"]
        dieta_dict["patient_id"] = str(paciente["_id"])

        dieta_dict = convert_date_to_datetime(dieta_dict)

        # Insertar en MongoDB
        result = diet_collection.insert_one(dieta_dict)

        return {
            "message": "Dieta creada exitosamente",
            "id": str(result.inserted_id)
        }

    except Exception as e:
        print("❌ Error al crear dieta:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/dietas/{pacienteN}", response_model=List[dict])
async def obtener_dietas_paciente(
    pacienteN: str = Path(..., description="Nombre del paciente")
):
    dietas = list(diet_collection.find({"patient_name": pacienteN}))

    # Convertir ObjectId a string
    for dieta in dietas:
        dieta["_id"] = str(dieta["_id"])

    return dietas

@router.get("/ver_dieta_detalle/{dieta_id}")
async def ver_dieta_detalle(dieta_id: str):
    dieta = diet_collection.find_one({"_id": ObjectId(dieta_id)})

    if not dieta:
        raise HTTPException(status_code=404, detail="Dieta no encontrada")

    # Obtener detalles de cada ingesta
    for dia in dieta.get("days", []):
        detalle_ingestas = []
        for ing in dia.get("intakes", []):
            ing_id = ing.get("intake_id")
            if not ing_id:
                continue
            ingesta = intake_collection.find_one({"_id": ObjectId(ing_id.split("-")[0])})
            if ingesta:
                ingesta["_id"] = str(ingesta["_id"])
                detalle_ingestas.append(ingesta)
        dia["intakes"] = detalle_ingestas  # sobrescribe la lista simple

    # Limpiar _id principal
    dieta["_id"] = str(dieta["_id"])
    return dieta

@router.put("/editar_dieta/{pacienteN}/{id}")
async def editar_dieta(pacienteN: str, id: str, dieta_data: dict):
    try:
        obj_id = ObjectId(id)

        # Validar si existe la dieta Y si pertenece al paciente
        dieta_existente = diet_collection.find_one({
            "_id": obj_id,
            "patient_name": pacienteN
        })

        if not dieta_existente:
            raise HTTPException(status_code=404, detail="Dieta no encontrada para este paciente")

        # Convertir fechas a datetime si vienen como string o dict
        dieta_data = convert_date_to_datetime(dieta_data)

        # Actualizar los campos
        result = diet_collection.update_one(
            {"_id": obj_id},
            {"$set": {
                "name": dieta_data.get("name"),
                "start_date": dieta_data.get("start_date"),
                "end_date": dieta_data.get("end_date"),
                "days": dieta_data.get("days"),
                "patient_name": pacienteN
            }}
        )

        return {"message": "Dieta actualizada correctamente"}

    except Exception as e:
        print("❌ Error al actualizar dieta:", e)
        raise HTTPException(status_code=500, detail="Error interno al actualizar la dieta")

@router.delete("/eliminar_dieta/{pacienteN}/{id}")
async def eliminar_dieta(pacienteN: str, id: str):
    try:
        obj_id = ObjectId(id)
        result = diet_collection.delete_one({
            "_id": obj_id,
            "patient_name": pacienteN
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dieta no encontrada")
        return {"message": "Dieta eliminada correctamente"}
    except Exception as e:
        print("❌ Error al eliminar dieta:", e)
        raise HTTPException(status_code=500, detail="Error interno al eliminar la dieta")
