from fastapi import APIRouter, Path, Depends, HTTPException, status, Request
from models.schemas import DietaCreate
from database.connection import intake_collection, nutritionist_collection, diet_collection
from fastapi.security import OAuth2PasswordBearer 
from .security import decode_jwt_token
from typing import List
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
    dieta: DietaCreate,
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

@router.get("/dietas_paciente/{pacienteN}")
async def obtener_dietas_paciente(pacienteN: str):
    try:
        print (pacienteN)
        dietas_cursor = diet_collection.find({"paciente": pacienteN})
        resultado = []
        for dieta in dietas_cursor:
            nombre_dieta = dieta.get("name")
            fecha_inicio = dieta.get("start_date")
            fecha_final = dieta.get("end_date")
            
            resultado.append({
                "nombre_dieta": nombre_dieta,
                "fecha_inicio": fecha_inicio,
                "fecha_final": fecha_final
            })
            
        return resultado
    except Exception as e:
        print("❌ ERROR AL OBTENER DIETAS:", e)
        raise HTTPException(status_code=500, detail=str(e))
