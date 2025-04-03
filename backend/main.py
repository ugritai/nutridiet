from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.connection import client_host
from routers import auth, nutritionists

app = FastAPI()

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加路由
app.include_router(auth.router)
app.include_router(nutritionists.router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client_host.close()

@app.get("/")
async def root():
    return {"message": "Welcome to the Nutritionist API"}