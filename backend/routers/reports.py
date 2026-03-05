# routers/reports.py
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from database.connection import reports_collection, nutritionist_collection
from .auth import oauth2_scheme # Importamos el esquema ya definido
from .security import decode_jwt_token # Importamos el decodificador que ya usas

router = APIRouter(tags=["Reports"])

# Función para obtener el usuario actual (basada en tu routers/auth.py)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    email = payload.get("sub")
    user = nutritionist_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user

@router.post("/report_issue")
async def report_issue(data: dict, current_user: dict = Depends(get_current_user)):
    try:
        print(f"DEBUG: Recibiendo reporte de {current_user.get('email')}")
        
        report = {
            "user_id": str(current_user["_id"]),
            "user_email": current_user.get("email"),
            "item_name": data.get("item_name"), # Nombre genérico
            "item_type": data.get("item_type"), # 'alimento' o 'receta'
            "error_type": data.get("error_type"),
            "description": data.get("description"),
            "timestamp": datetime.utcnow(),
            "status": "pending",
            "metadata": data.get("metadata", {})
        }
        
        reports_collection.insert_one(report)
        return {"message": "Reporte guardado correctamente"}
    except Exception as e:
        print(f"Error insertando reporte: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")