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

    recipes_list = [receta.dict() for receta in ingesta.recipes]


    nuevo_documento = {
    "paciente": pacienteN,
    "nombre_ingesta": ingesta.intake_name, 
    "intake_type": ingesta.intake_type,
    "ingesta_universal": ingesta.ingesta_universal, 
    "recipes": recipes_list, 
    "nutricionista_email": email_nutri,
    }

    result = intake_collection.insert_one(nuevo_documento)

    return {"mensaje": "Ingesta creada correctamente", "id": str(result.inserted_id)}

@router.get("/ingestas/{pacienteN}", response_model=List[dict])
async def obtener_ingestas_paciente(
    pacienteN: str = Path(..., description="Nombre del paciente"),
):
    ingestas_crudas = list(intake_collection.find({"paciente": pacienteN}))

    agrupadas = {}

    for ingesta in ingestas_crudas:
        # Convertir ID a string
        ingesta["_id"] = str(ingesta["_id"])

        # Asegurar nombre de ingesta consistente
        nombre = ingesta.get("nombre_ingesta") or ingesta.get("intake_name") or "Sin nombre"

        if nombre not in agrupadas:
            agrupadas[nombre] = {
                "intake_name": nombre,
                "subingestas": []
            }

        agrupadas[nombre]["subingestas"].append(ingesta)

    # Convertimos a lista
    salida = list(agrupadas.values())

    # Aseguramos que todos tengan lista de subingestas aunque esté vacía
    for grupo in salida:
        if "subingestas" not in grupo or not isinstance(grupo["subingestas"], list):
            grupo["subingestas"] = []

    return salida

@router.put("/editar_ingesta/{pacienteN}/{nombreIngesta}")
async def editar_ingesta(
    pacienteN: str = Path(...),
    nombreIngesta: str = Path(...),
    ingesta: IntakeCreate = None,
    token: str = Depends(oauth2_scheme)
):
    print("Body recibido para editar:", ingesta)
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

    recipes_list = [receta.dict() for receta in ingesta.recipes]

    resultado = intake_collection.update_one(
        {
            "paciente": pacienteN,
            "nombre_ingesta": nombreIngesta,
            "intake_type": ingesta.intake_type,  # importante: match por tipo
            "nutricionista_email": email_nutri
        },
        {
            "$set": {
                "ingesta_universal": ingesta.ingesta_universal,
                "recipes": recipes_list
            }
        }
    )

    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada")

    return {"mensaje": f"Ingesta '{ingesta.intake_type}' actualizada correctamente"}

@router.get("/ver_ingesta/{pacienteN}/{nombre_ingesta}")
async def ver_ingesta_agrupada(
    pacienteN: str = Path(...),
    nombre_ingesta: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    ingestas = list(intake_collection.find({
        "paciente": pacienteN,
        "$or": [
            {"intake_name": nombre_ingesta},
            {"nombre_ingesta": nombre_ingesta}
        ],
        "nutricionista_email": email
    }))

    if not ingestas:
        raise HTTPException(status_code=404, detail="No se encontraron ingestas con ese nombre")

    for ing in ingestas:
        ing["_id"] = str(ing["_id"])

    tipo_diario = "3 comidas" if len(ingestas) == 3 else "5 comidas"

    return {
        "intake_name": nombre_ingesta,
        "tipo_diario": tipo_diario,
        "subingestas": ingestas
    }
