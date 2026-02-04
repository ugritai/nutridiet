from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.connection import client_host
from routers import auth, nutritionists, recipes, pacientes, ingredients, intakes,diets
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from pathlib import Path

load_dotenv()
app = FastAPI()

# CORS
# Add nginx origin (http://localhost) so the browser can call nginx which proxies to backend.
# For local development you can also use ["*"] but be careful in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("static/images").mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

api_prefix = "/api"

app.include_router(auth.router, prefix=f"{api_prefix}/auth")
app.include_router(nutritionists.router, prefix=f"{api_prefix}/nutricionistas")
app.include_router(recipes.router, prefix=f"{api_prefix}/recetas")
app.include_router(ingredients.router, prefix=f"{api_prefix}/alimentos")
app.include_router(pacientes.router, prefix=f"{api_prefix}/pacientes")
app.include_router(intakes.router, prefix=f"{api_prefix}/planificacion_ingestas")
app.include_router(diets.router, prefix=f"{api_prefix}/planificacion_dietas")
@app.on_event("shutdown")
async def shutdown_db_client():
    client_host.close()

@app.get("/")
async def root():
    return {"message": "Welcome to the Nutritionist API"}