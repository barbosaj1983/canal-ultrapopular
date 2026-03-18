from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import get_pool, close_pool
from routes import auth, mensagens, admin
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()

app = FastAPI(
    title="Canal Ultra Popular API",
    version="2.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(mensagens.router)
app.include_router(admin.router)

@app.get("/")
def health():
    return {"status": "ok", "app": "canal-ultrapopular"}
