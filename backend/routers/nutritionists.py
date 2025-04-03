from fastapi import APIRouter, HTTPException
from database.connection import nutritionist_collection
from models.schemas import NutritionistResponse
from typing import List

router = APIRouter(tags=["Nutritionists"])

@router.get("/get_first_5_nutritionists", response_model=List[NutritionistResponse])
async def get_first_5_nutritionists():
    nutritionists_cursor = nutritionist_collection.find().limit(5)
    
    nutritionists = []
    for nutritionist in nutritionists_cursor:
        nutritionist["_id"] = str(nutritionist["_id"])
        nutritionists.append(NutritionistResponse(**nutritionist))

    if not nutritionists:
        raise HTTPException(status_code=404, detail="No se encontraron nutricionistas en la base de datos.")
    
    return nutritionists