from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import date
from typing import Optional, Dict

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
    nutritionist_id: Optional[str] = None
    nutritionist_email: Optional[str] = None
    
class PacienteUpdate(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    gender: Optional[str]
    bornDate: Optional[date]
    height: Optional[float]
    weight: Optional[float]
    activityLevel: Optional[int]
    
class DietaActualOut(BaseModel):
    id: str
    name: str
    start_date: str
    end_date: str

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
    current_diet: Optional[DietaActualOut] = None

    class Config:
        orm_mode = True

class PatientInfo(BaseModel):
    id: str
    name: str
  
class Recipe(BaseModel):
    id: str
    name: str
    recipe_type: str
    kcal: float
    pro: float
    car: float

class IntakeCreate(BaseModel):
    intake_type: str
    intake_name: str
    intake_universal: bool
    recipes: List[Recipe]
       # Relación con el nutricionista
    nutritionist_id: Optional[str] = None
    nutritionist_email: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None

class IntakeInfo(BaseModel):
    intake_id: str

class DietDay(BaseModel):
    date: date
    intakes: List[IntakeInfo]

class DietCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    days: List[DietDay]
     # Relación con el nutricionista
    nutritionist_id: Optional[str] = None
    nutritionist_email: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None

