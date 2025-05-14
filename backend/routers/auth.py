# routers/auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from database.connection import nutritionist_collection
from models.schemas import LoginRequest, NutritionistCreate
from fastapi.security import OAuth2PasswordBearer
from .security import create_jwt_token, decode_jwt_token, ACCESS_TOKEN_EXPIRE, REFRESH_TOKEN_EXPIRE
import bcrypt

router = APIRouter(tags=["Authentication"])

@router.post("/login")
async def login(login_request: LoginRequest):
    nutritionist = nutritionist_collection.find_one({"email": login_request.email})
    if not nutritionist:
        raise HTTPException(status_code=401, detail="Email o contraseña inválidos")

    if not bcrypt.checkpw(login_request.password.encode(), nutritionist["password"].encode()):
        raise HTTPException(status_code=401, detail="Email o contraseña inválidos")

    access_token = create_jwt_token({"sub": nutritionist["email"], "type": "access"}, ACCESS_TOKEN_EXPIRE)
    refresh_token = create_jwt_token({"sub": nutritionist["email"], "type": "refresh"}, REFRESH_TOKEN_EXPIRE)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "email": nutritionist["email"],
        "name": nutritionist["name"]
    }

@router.post("/refresh-token")
async def refresh_token(refresh_token_data: dict):
    refresh_token = refresh_token_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No se proporcionó el token de refresco")

    payload = decode_jwt_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresco inválido")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    new_access_token = create_jwt_token(
        {"sub": email, "type": "access"},
        ACCESS_TOKEN_EXPIRE
    )

    return JSONResponse(content={
        "access_token": new_access_token,
        "token_type": "bearer",
        "message": "Token de acceso renovado exitosamente"
    })

@router.post("/register_nutritionist", status_code=status.HTTP_201_CREATED)
async def register_nutritionist(nutritionist: NutritionistCreate):
    existing_nutritionist = nutritionist_collection.find_one({"email": nutritionist.email})
    if existing_nutritionist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo electrónico ya registrado"
        )

    hashed_password = bcrypt.hashpw(nutritionist.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    nutritionist_data = {
        **nutritionist.dict(exclude={"password"}),
        "password": hashed_password
    }

    try:
        nutritionist_collection.insert_one(nutritionist_data)
        return {"message": "Nutricionista registrado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar nutricionista: {e}")
    
    
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.get("/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # descode JWT token
    payload = decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    email = payload.get("sub")  # obtener informacion del email
    user = nutritionist_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"email": user["email"], "name": user["name"]}  # return informacion usuario actual