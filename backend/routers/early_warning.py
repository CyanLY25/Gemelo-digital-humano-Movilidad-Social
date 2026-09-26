from fastapi import APIRouter, HTTPException
from backend.models.schemas import StudentProfileInput, DropoutPredictionResponse
from backend.services.early_warning import predict_student_dropout

router = APIRouter(prefix="/api/early_warning", tags=["Early Warning"])

@router.post("/predict", response_model=DropoutPredictionResponse)
async def predict_early_warning_endpoint(profile: StudentProfileInput):
    """Calcula la probabilidad de deserción escolar dado el perfil del estudiante y genera intervenciones."""
    try:
        return predict_student_dropout(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la predicción de deserción: {str(e)}")
