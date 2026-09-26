import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from backend.routers.simulation import router as simulation_router
from backend.routers.ml_crispdm import router as ml_crispdm_router
from backend.routers.early_warning import router as early_warning_router
from backend.routers.orchestration import router as orchestration_router
from backend.routers.voice_chat import router as voice_chat_router
from backend.routers.export_reports import router as export_reports_router

app = FastAPI(
    title="Social Mobility & Early Warning Simulator API (HDT Social v3.11)",
    description="Backend en Python 100% desacoplado (FastAPI, Pydantic v2, LangGraph, LangChain, Langflow v1.x, ML CRISP-DM, Speech/TTS, ReportGen).",
    version="3.11.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)
app.include_router(ml_crispdm_router)
app.include_router(early_warning_router)
app.include_router(orchestration_router)
app.include_router(voice_chat_router)
app.include_router(export_reports_router)

@app.get("/api/health", tags=["Health Check"])
async def health_check():
    """Chequeo de salud del servicio backend v3.11."""
    return {
        "status": "ok",
        "name": "HDT Social Simulator API (Python Stack v3.11)",
        "version": "3.11.0",
        "framework": "FastAPI + Pydantic v2 + HDT-ABM-RL + LangGraph + ML Pipeline",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
