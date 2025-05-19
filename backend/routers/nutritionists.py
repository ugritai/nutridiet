from fastapi import APIRouter, HTTPException, status, Depends
from database.connection import nutritionist_collection
from fastapi.security import OAuth2PasswordBearer
from .security import decode_jwt_token
from models.schemas import NutricionistaUpdate
from passlib.context import CryptContext

router = APIRouter(tags=["Nutritionists"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/nutricionista_info")
async def get_nutricionista_info(token: str = Depends(oauth2_scheme)):
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    email_nutri = payload.get("sub")
    if not email_nutri:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    nutricionista = nutritionist_collection.find_one({"email": email_nutri})
    if not nutricionista:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nutricionista no encontrado")

    return {
        "name": nutricionista["name"],
        "email": nutricionista.get("email"),
        "phone": nutricionista.get("phone"),
        "idioma": nutricionista.get("language")
    }

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.put("/actualizar_nutricionista")
async def actualizar_nutricionista(
    data: NutricionistaUpdate,
    token: str = Depends(oauth2_scheme),
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

    update_data = {
        "name": data.name,
        "phone": data.phone,
        "idioma": data.language,
    }

    # Manejo de cambio de contraseña
    if data.old_password or data.new_password:
        if not data.old_password or not data.new_password:
            raise HTTPException(status_code=400, detail="Para cambiar la contraseña debe enviar la contraseña antigua y la nueva")
        
        # Verificamos la contraseña antigua
        if not verify_password(data.old_password, nutricionista["password"]):
            raise HTTPException(status_code=400, detail="Contraseña antigua incorrecta")
        
        # Hasheamos y actualizamos la nueva contraseña
        hashed_new_password = get_password_hash(data.new_password)
        update_data["password"] = hashed_new_password

    result = nutritionist_collection.update_one(
        {"email": nutricionista["email"]},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No se realizaron cambios")

    return {"message": "Perfil actualizado correctamente"}
