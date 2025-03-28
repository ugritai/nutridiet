from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr, validator
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from typing import List, Optional

app = FastAPI()

# Permite solicitudes CORS desde localhost:3000 (puerto donde React se ejecuta)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend en React
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP, como POST, GET, OPTIONS
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Configurar la conexión a MongoDB
client_host = MongoClient('mongodb://localhost:28018')
db_host = client_host['nutridiet']  # La base de datos en el anfitrión
nutritionist_collection = db_host['nutritionist']

class Nutritionist(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    language: str

    # Validación para verificar que la contraseña tenga una longitud mínima
    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class NutritionistResponse(BaseModel):
    id: Optional[str]
    name: str
    email: str
    phone: str
    language: str

    class Config:
        orm_mode = True

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Nutritionist API"}

@app.post("/register_nutritionist", status_code=status.HTTP_201_CREATED)
async def register_nutritionist(nutritionist: Nutritionist):
    # Verificar si el correo electrónico ya está registrado
    existing_nutritionist = nutritionist_collection.find_one({"email": nutritionist.email})
    if existing_nutritionist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Encriptar la contraseña
    hashed_password = bcrypt.hashpw(nutritionist.password.encode('utf-8'), bcrypt.gensalt())

    # Preparar el documento para insertar
    nutritionist_data = {
        "name": nutritionist.name,
        "email": nutritionist.email,
        "password": hashed_password,
        "phone": nutritionist.phone,
        "language": nutritionist.language
    }

    # Insertar el nutricionista en la base de datos
    try:
        nutritionist_collection.insert_one(nutritionist_data)
        return {"message": "Nutritionist registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering nutritionist: {e}")

@app.get("/get_first_5_nutritionists", response_model=List[NutritionistResponse])
async def get_first_5_nutritionists():
    # Buscar los primeros 5 nutricionistas en la colección
    nutritionists_cursor = nutritionist_collection.find().limit(5)
    
    nutritionists = []
    for nutritionist in nutritionists_cursor:
        # Convertir _id de MongoDB a string y agregar el campo 'id'
        nutritionist["_id"] = str(nutritionist["_id"])  # Convertir ObjectId a string
        # Usar 'NutritionistResponse' para asegurar la estructura de la respuesta
        nutritionists.append(NutritionistResponse(id=nutritionist["_id"], **nutritionist))

    if not nutritionists:
        raise HTTPException(status_code=404, detail="No nutritionists found in the database.")
    
    return nutritionists

# Inicia el servidor de FastAPI
# Usa uvicorn para ejecutar el servidor: uvicorn main:app --reload
