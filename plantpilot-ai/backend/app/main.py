import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .core.config import settings
from .routes.chat import router as chat_router
from .routes.documents import router as documents_router
from .routes.health import router as health_router
from .rag.pipeline import rag_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plantpilot.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PlantPilot AI RAG Pipeline & ChromaDB vector store...")
    rag_pipeline.initialize()
    logger.info("Knowledge base successfully initialized with all manufacturing SOPs.")
    yield
    logger.info("Shutting down PlantPilot AI backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Document-grounded manufacturing SOP and safety copilot for Kaveri Precision Components, Hosur.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend and local Wi-Fi devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(health_router)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "plant": settings.PLANT_NAME,
        "location": settings.PLANT_LOCATION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "chat": "/api/chat",
            "documents": "/api/documents",
            "health": "/api/health",
            "history": "/api/history"
        }
    }
