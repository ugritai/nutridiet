from fastapi import APIRouter, HTTPException, status, Depends
from database.connection import pacient_collection, nutritionist_collection
from utils.nutricion import calcular_tmb, calcular_kcal, calcular_pro, calcular_car
from models.schemas import Pacient, PacientOut
from fastapi.security import OAuth2PasswordBearer
from .security import decode_jwt_token
import bcrypt
from typing import List
import logging

router = APIRouter(tags=["Pacientes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

@router.post("/crear_paciente/")
async def crear_paciente(pacient: Pacient, token: str = Depends(oauth2_scheme)):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

    if pacient_collection.find_one({"email": pacient.email}):
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    pacient.password = bcrypt.hashpw(pacient.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Calcular valores nutricionales con nuevos campos
    pacient.tmb = int(calcular_tmb(pacient.gender, pacient.weight, pacient.height, pacient.bornDate))
    pacient.restrictionsKcal = int(calcular_kcal(pacient.tmb, pacient.activityLevel))
    pacient.dailyProIntake = calcular_pro(pacient.gender, pacient.weight, pacient.activityLevel)
    pacient.dailyCaloricIntake = calcular_car(pacient.gender, pacient.weight, pacient.activityLevel)

    paciente_dict = pacient.dict()
    paciente_dict["bornDate"] = pacient.bornDate.isoformat()
    paciente_dict["nutricionista_id"] = nutricionista["_id"]
    paciente_dict["nutricionista_email"] = nutricionista["email"]
    
    # Añadir los campos calculados manualmente
    paciente_dict["tmb"] = pacient.tmb
    paciente_dict["restrictionsKcal"] = pacient.restrictionsKcal
    paciente_dict["dailyProIntake"] = pacient.dailyProIntake
    paciente_dict["dailyCaloricIntake"] = pacient.dailyCaloricIntake

    result = pacient_collection.insert_one(paciente_dict)

    return {
        "mensaje": "Paciente creado exitosamente"
    }

@router.get("/mis_pacientes/", response_model=List[PacientOut])
async def listar_pacientes(token: str = Depends(oauth2_scheme)):
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

        pacientes_cursor = pacient_collection.find({"nutricionista_email": email_nutri})

        pacientes = []
        for paciente in pacientes_cursor:
            paciente["id"] = str(paciente["_id"])
            del paciente["_id"]
            paciente.pop("password", None)
            pacientes.append(paciente)

        return pacientes
    except Exception as e:
        import traceback
        logging.error(f"Error en listar_pacientes: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/paciente_info/{name}")
async def obtener_info_paciente(name: str):
    paciente = pacient_collection.find_one({"name": name})
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    return {
        "name": paciente["name"],
        "kcal": paciente.get("restrictionsKcal"),
        "pro": paciente.get("dailyProIntake"),
        "car": paciente.get("dailyCaloricIntake")
    }
