from fastapi import APIRouter, HTTPException, status, Depends
from database.connection import pacient_collection, nutritionist_collection
from utils.nutricion import calcular_tmb, calcular_kcal, calcular_pro, calcular_car
from models.schemas import Pacient, PacientOut
from fastapi.security import OAuth2PasswordBearer
from .security import decode_jwt_token
from fastapi import Depends
import bcrypt
from typing import List
import logging

router = APIRouter(tags=["Pacientes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/crear_paciente/")
async def crear_paciente(pacient: Pacient, token: str = Depends(oauth2_scheme)):
    # Decodificar token y obtener email
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

    # Validar si paciente ya existe
    if pacient_collection.find_one({"email": pacient.email}):
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    # Hashear contraseña
    pacient.password = bcrypt.hashpw(pacient.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Calcular valores nutricionales
    pacient.tmb = int(calcular_tmb(pacient.genero, pacient.peso, pacient.altura, pacient.fechaNacimiento))
    pacient.kcal = int(calcular_kcal(pacient.tmb, pacient.actividad))
    pacient.pro = calcular_pro(pacient.genero, pacient.peso, pacient.actividad)
    pacient.car = calcular_car(pacient.genero, pacient.peso, pacient.actividad)

    paciente_dict = pacient.dict()
    paciente_dict["fechaNacimiento"] = pacient.fechaNacimiento.isoformat()

    # Guardar referencia al nutricionista
    paciente_dict["nutricionista_id"] = nutricionista["_id"]
    paciente_dict["nutricionista_email"] = nutricionista["email"]

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
        logging.error(f"Error en listar_pacientes: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
