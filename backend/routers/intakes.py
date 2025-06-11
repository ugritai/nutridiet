from fastapi import APIRouter, Path, Depends, HTTPException, status, Request
from models.schemas import IntakeCreate
from database.connection import intake_collection, nutritionist_collection, pacient_collection
from fastapi.security import OAuth2PasswordBearer 
from .security import decode_jwt_token
from typing import List
from unidecode import unidecode
from utils.food_utils import remove_stop_words

router = APIRouter(tags=["Intakes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

@router.post("/crear_ingesta/{pacienteN}")
async def crear_ingesta(
    pacienteN: str = Path(..., description="Nombre del paciente"),
    ingesta: IntakeCreate = None,
    token: str = Depends(oauth2_scheme)
):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=404, detail="Nutricionista no encontrado")

    paciente = pacient_collection.find_one({"name": pacienteN})
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    recipes_list = [receta.dict() for receta in ingesta.recipes]

    nuevo_documento = {
        "patient_name": paciente["name"],
        "patient_id": str(paciente["_id"]),
        "intake_name": ingesta.intake_name,
        "intake_type": ingesta.intake_type,
        "intake_universal": ingesta.intake_universal,
        "recipes": recipes_list,
        "nutritionist_email": email_nutri,
        "nutritionist_id": str(nutricionista["_id"]),
    }

    result = intake_collection.insert_one(nuevo_documento)

    return {
        "mensaje": "Ingesta creada correctamente",
        "ingesta_id": str(result.inserted_id),
        "nombre": ingesta.intake_name
    }

@router.get("/ingestas/{pacienteN}", response_model=List[dict])
async def obtener_ingestas_paciente(
    pacienteN: str = Path(..., description="Nombre del paciente")
):
    ingestas_crudas = list(
        intake_collection.find({
            "$or": [
                {"patient_name": pacienteN},
                {"intake_universal": True}
            ]
        }).sort("_id", -1)
    )

    for ingesta in ingestas_crudas:
        ingesta["_id"] = str(ingesta["_id"])

    return ingestas_crudas

@router.put("/editar_ingesta/{pacienteN}/{nombreIngesta}")
async def editar_ingesta(
    pacienteN: str = Path(...),
    nombreIngesta: str = Path(...),
    ingesta: IntakeCreate = None,
    token: str = Depends(oauth2_scheme)
):    
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
            "patient_name": pacienteN,
            "intake_name": nombreIngesta,
            "intake_type": ingesta.intake_type,
            "nutritionist_email": email_nutri
        },
        {
            "$set": {
                "intake_universal": ingesta.intake_universal,
                "recipes": recipes_list
            }
        }
    )

    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada")

    return {"mensaje": f"Ingesta '{ingesta.intake_type}' actualizada correctamente"}


from bson import ObjectId

@router.get("/ver_ingesta/{pacienteN}/{id_ingesta}")
async def ver_ingesta_simple(
    pacienteN: str = Path(...),
    id_ingesta: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    ingesta = intake_collection.find_one({
        "_id": ObjectId(id_ingesta),
        "patient_name": pacienteN,
        "nutritionist_email": email
    })

    if not ingesta:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada")
    
    recetas = []
    for r in ingesta.get("recipes", []):
        recetas.append({
            "id": r.get("id", ""),
            "name": r.get("name", ""),
            "recipe_type": r.get("recipe_type", ""),
            "kcal": r.get("kcal", 0),
            "pro": r.get("pro", 0),
            "car": r.get("car", 0),
        })

    return {
        "_id": str(ingesta["_id"]),
        "intake_name": ingesta.get("intake_name", ""),
        "intake_type": ingesta.get("intake_type", ""),
        "intake_universal": ingesta.get("intake_universal", False),
        "recipes": recetas
    }

def capitalizar_primera_letra(texto: str) -> str:
    return texto.strip().capitalize()

@router.get("/buscar_ingestas/{nombre}")
async def buscar_ingestas(nombre: str, limit: int = 5):
    nombre = unidecode(nombre.lower())
    sugerencias = set()

    cursor = intake_collection.find({})
    for doc in cursor:
        intake_name = doc.get("intake_name", "")
        if not intake_name:
            continue

        intake_sin_tildes = unidecode(intake_name.lower())
        if nombre in intake_sin_tildes:
            sugerencias.add(capitalizar_primera_letra(intake_name))

        if len(sugerencias) >= limit:
            break

    if sugerencias:
        return [{"intake_name": s} for s in list(sugerencias)[:limit]]
    else:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada")
    
@router.get("/ver_ingesta_detalle/{nombre_ingesta}")
async def ver_ingesta_detalle(nombre_ingesta: str):
    doc = intake_collection.find_one({
        "intake_name": nombre_ingesta
    })

    if not doc:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada")

    recetas = []
    for r in doc.get("recipes", []):
        recetas.append({
            "id": r.get("id", ""),
            "name": r.get("name", ""),
            "recipe_type": r.get("recipe_type", ""),
            "kcal": r.get("kcal", 0),
            "pro": r.get("pro", 0),
            "car": r.get("car", 0),
        })

    return {
        "_id": str(doc["_id"]),
        "intake_name": doc.get("intake_name", ""),
        "intake_type": doc.get("intake_type", ""),
        "intake_universal": doc.get("intake_universal", False),
        "recipes": recetas
    }


@router.delete("/eliminar_ingesta/{pacienteN}/{id_ingesta}")
async def eliminar_ingesta_por_id(
    pacienteN: str = Path(...),
    id_ingesta: str = Path(...),
    token: str = Depends(oauth2_scheme)
):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    resultado = intake_collection.delete_one({
        "_id": ObjectId(id_ingesta),
        "patient_name": pacienteN,
        "nutritionist_email": email
    })

    if resultado.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ingesta no encontrada o no autorizada")

    return {"detail": "Ingesta eliminada exitosamente"}
