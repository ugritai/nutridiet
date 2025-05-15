from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import date
from typing import Optional

class NutritionistBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    language: str
    
class NutritionistCreate(NutritionistBase):
    password: str

    @validator('password')
    def password_length(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres.')
        return v

class NutritionistResponse(NutritionistBase):
    id: Optional[str]
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class IngredientCategory(BaseModel):
    name_esp: str      
    image_url: str     
    search_term: str   
    

class Pacient(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    genero: str
    fechaNacimiento: date
    altura: float
    peso: float
    actividad: int

    # Campos calculados
    tmb: Optional[float] = None
    kcal: Optional[float] = None
    pro: Optional[float] = None
    car: Optional[float] = None

    # Relación con el nutricionista
    nutricionista_id: Optional[str] = None
    nutricionista_email: Optional[str] = None

class PacientOut(BaseModel):
    id: str
    nombre: str
    email: EmailStr
    genero: str
    fechaNacimiento: date
    altura: float
    peso: float
    actividad: int
    tmb: int
    kcal: int
    pro: float
    car: float

    class Config:
        orm_mode = True
        fields = {'id': '_id'}