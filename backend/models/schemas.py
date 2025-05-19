from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
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

class NutricionistaUpdate(BaseModel):
    name: str
    phone: str
    language: str
    old_password: Optional[str] = Field(None, alias="old_password")
    new_password: Optional[str] = Field(None, alias="new_password")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class IngredientCategory(BaseModel):
    name_esp: str      
    image_url: str     
    search_term: str   
    

class Pacient(BaseModel):
    name: str
    email: EmailStr
    password: str
    gender: str
    bornDate: date
    height: float
    weight: float
    activityLevel: int

    # Campos calculados
    tmb: Optional[float] = None
    restrictionsKcal: Optional[float] = None
    dailyProIntake: Optional[float] = None
    dailyCalIntake: Optional[float] = None

    # Relación con el nutricionista
    nutricionista_id: Optional[str] = None
    nutricionista_email: Optional[str] = None
    
class PacienteUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    gender: Optional[str]
    bornDate: Optional[date]
    height: Optional[float]
    weight: Optional[float]
    activityLevel: Optional[int]

class PacientOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    gender: str
    bornDate: date
    height: float
    weight: float
    activityLevel: int
    tmb: int
    restrictionsKcal: float
    dailyProIntake: float
    dailyCalIntake: float

    class Config:
        orm_mode = True

class PatientInfo(BaseModel):
    id: str
    name: str
  
class Receta(BaseModel):
    name: str
    kcal: Optional[float]
    pro: Optional[float]
    car: Optional[float]

class IntakePorTipo(BaseModel):
    entrante: Optional[List[Receta]] = []
    primer_plato: Optional[List[Receta]] = []
    segundo_plato: Optional[List[Receta]] = []
    postre: Optional[List[Receta]] = []
    bebida: Optional[List[Receta]] = []

    @validator('*', pre=True, always=True)
    def ensure_list(cls, v):
        return v or []

class IntakeCreate(BaseModel):
    intake_type: str 
    recipes: IntakePorTipo
    nutricionista_email: Optional[str] = None
    paciente: Optional[str] = None
    
class IntakeInfo(BaseModel):
    intake_id: str
    
class DiaDieta(BaseModel):
    fecha: date
    ingestas: List[IntakeInfo]

class DietaCreate(BaseModel):
    paciente: str
    name: str
    start_date: date
    end_date: date
    dias: List[DiaDieta]
    nutricionista_email: Optional[str] = None