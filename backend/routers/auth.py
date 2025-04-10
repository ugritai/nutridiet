from fastapi import APIRouter, HTTPException, status
from database.connection import nutritionist_collection
from models.schemas import LoginRequest, NutritionistCreate
import bcrypt

router = APIRouter(tags=["Authentication"])

@router.post("/login")
async def login(login_request: LoginRequest):
    nutritionist = nutritionist_collection.find_one({"email": login_request.email})
    if not nutritionist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña inválidos"
        )
    
    try:
        password_matches = bcrypt.checkpw(
            login_request.password.encode('utf-8'),
            nutritionist['password'].encode('utf-8')
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar la contraseña"
        )

    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña inválidos"
        )

    return {
        "message": "Inicio de sesión exitoso",
        "email": nutritionist['email'],
        "name": nutritionist['name']  # Añadir esta línea
    }

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