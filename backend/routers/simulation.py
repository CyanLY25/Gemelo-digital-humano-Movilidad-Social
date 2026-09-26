from fastapi import APIRouter, HTTPException
from backend.models.schemas import SimulationRequest, SimulationResultsResponse
from backend.services.econometric_engine import (
    COUNTRY_CALIBRATIONS,
    PRESET_POLICIES,
    run_simulation,
)

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.get("/parameters")
async def get_calibration_parameters():
    """Retorna los parámetros empíricos y matrices de calibración por país y políticas predefinidas."""
    return {
        "countries": list(COUNTRY_CALIBRATIONS.values()),
        "policies": list(PRESET_POLICIES.values()),
    }

@router.post("/run", response_model=SimulationResultsResponse)
async def run_simulation_endpoint(request: SimulationRequest):
    """Ejecuta el motor econométrico HDT-ABM-RL con hiperparámetros y retorna datos para 2D/3D."""
    try:
        results = run_simulation(
            country_id=request.country_id,
            policy=request.policy,
            num_agents=request.num_agents,
            discount_beta=request.discount_beta,
            edu_return_rho=request.edu_return_rho,
            macro_shock=request.macro_shock,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al ejecutar la simulación: {str(e)}")
