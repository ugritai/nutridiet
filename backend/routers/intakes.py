from fastapi import APIRouter, Path, Depends, HTTPException, status
from models.schemas import IntakeCreate
from database.connection import intake_collection, nutritionist_collection, pacient_collection
from fastapi.security import OAuth2PasswordBearer 
from .security import decode_jwt_token
from typing import List


router = APIRouter(tags=["Intakes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

@router.post("/crear_ingesta/{pacienteN}")
async def crear_ingesta(
    pacienteN: str = Path(..., description="ID o nombre del paciente"),
    ingesta: IntakeCreate = None,
    token: str = Depends(oauth2_scheme)
):
    print("Body recibido:", ingesta)
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

    paciente = pacient_collection.find_one({"name": pacienteN})
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Guardar la ingesta en la colección intake_collection
    nuevo_documento = {
        "paciente": pacienteN,
        "intake_type": ingesta.intake_type,
        "recipes": ingesta.recipes.dict(),  # Convierte a dict para Mongo
        "nutricionista_email": email_nutri,
    }

    result = intake_collection.insert_one(nuevo_documento)

    return {"mensaje": "Ingesta creada correctamente", "id": str(result.inserted_id)}

@router.get("/ingestas/{pacienteN}", response_model=List[dict])
async def obtener_ingestas_paciente(
    pacienteN: str = Path(..., description="Nombre del paciente"),
    #token: str = Depends(oauth2_scheme)
):
    #payload = decode_jwt_token(token)
    #if not payload:
    #    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    ingestas = list(intake_collection.find({"paciente": pacienteN}))

    for ingesta in ingestas:
        ingesta["_id"] = str(ingesta["_id"])  # Convertir ObjectId a string para JSON serializable

    return ingestas