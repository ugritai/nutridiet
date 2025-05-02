from fastapi import APIRouter, HTTPException, status
from database.connection import pacient_collection
from utils.nutricion import calcular_tmb, calcular_kcal, calcular_pro, calcular_car
from models.schemas import Pacient
import bcrypt

router = APIRouter(tags=["Pacientes"])

@router.post("/crear_paciente/")
async def crear_paciente(pacient: Pacient):
    # Validar si el email ya existe
    if await pacient_collection.find_one({"email": pacient.email}):
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

    result = await pacient_collection.insert_one(paciente_dict)
    return {"mensaje": "Paciente creado exitosamente", "id": str(result.inserted_id)}

