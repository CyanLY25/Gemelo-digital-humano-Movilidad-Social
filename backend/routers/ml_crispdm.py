from fastapi import APIRouter, HTTPException
from typing import List
from backend.models.schemas import ModelMetrics, TopsisWeightsInput, TopsisRankingItem, RetrainRequest, RetrainLog
from backend.services.ml_pipeline import get_all_models_metrics, compute_topsis_ranking, simulate_retraining

router = APIRouter(prefix="/api/ml", tags=["Machine Learning CRISP-DM"])

@router.get("/compare", response_model=List[ModelMetrics])
async def compare_models_endpoint():
    """Retorna las métricas comparativas de los 5 algoritmos ML entrenados."""
    try:
        return get_all_models_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en comparación ML: {str(e)}")

@router.post("/topsis", response_model=List[TopsisRankingItem])
async def topsis_ranking_endpoint(weights: TopsisWeightsInput):
    """Calcula el ranking de utilidad compuesta MCDA TOPSIS en base a los pesos ingresados."""
    try:
        return compute_topsis_ranking(weights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en cálculo TOPSIS: {str(e)}")

@router.post("/retrain", response_model=List[RetrainLog])
async def retrain_model_endpoint(request: RetrainRequest):
    """Simula el reentrenamiento asíncrono con hiperparámetros personalizados y retorna la curva de pérdida."""
    try:
        return simulate_retraining(epochs=request.epochs, learning_rate=request.learning_rate)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al reentrenar modelo: {str(e)}")
