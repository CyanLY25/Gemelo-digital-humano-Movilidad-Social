from fastapi import APIRouter, HTTPException
from backend.models.schemas import (
    OrchestrationRequest,
    OrchestrationResponse,
    OrchestrationStatusResponse,
)
from backend.services.orchestration.graph import GraphOrchestrator

router = APIRouter(prefix="/api/orchestration", tags=["Orchestration"])

orchestrator = GraphOrchestrator()

@router.post("/run", response_model=OrchestrationResponse)
async def run_orchestration_endpoint(request: OrchestrationRequest):
    """Ejecuta el StateGraph de LangGraph de manera asíncrona con el checkpointer de estado."""
    try:
        return await orchestrator.run(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en orquestación IA: {str(e)}")

@router.get("/status", response_model=OrchestrationStatusResponse)
async def get_orchestration_status():
    """Reporta herramientas activas, nodos del grafo y configuración de Langflow."""
    config = orchestrator.langflow_client.get_config()
    return OrchestrationStatusResponse(
        status="ready",
        engine="LangGraph (StateGraph + MemorySaver) + LangChain + Langflow v1.x",
        config=config,
        availableTools=["econometric_calculator", "dropout_risk_scorer", "knowledge_lookup"],
        nodes=["classify_intent", "nodo_langflow", "nodo_langchain", "nodo_agent", "validate_output"],
    )

@router.get("/flows")
async def get_langflow_flows():
    """Consulta flujos disponibles en la instancia de Langflow."""
    try:
        return await orchestrator.langflow_client.list_flows()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar flujos de Langflow: {str(e)}")
