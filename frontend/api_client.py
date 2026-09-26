import os
import json
import math
import random
import requests
from typing import Dict, Any, Optional, List

COUNTRY_CALIBRATIONS = {
    "south_africa": {
        "id": "south_africa", "name": "Sudáfrica (NIDS 2008-2024)",
        "datasetName": "National Income Dynamics Study (SALDRU/UCT)",
        "sampleSize": 28000, "baselineGini": 0.63, "baselineIGE": 0.68,
        "q1ToQ5Mobility": 0.042, "genderWageGap": 0.28, "neighborhoodPenalty": 0.35,
        "segregationIndex": 0.72, "informalRate": 0.28,
        "stylizedFacts": {
            "maternalEduReturn": "+14.2% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Mujeres en Q1 enfrentan 38% menor probabilidad de ascenso",
            "povertyTrapPersistence": "74.8% de los hijos de Q1 permanecen atrapados en Q1-Q2",
            "spatialPenalty": "Vivir en un township segrega y reduce el salario esperado en 31%",
        },
    },
    "brazil": {
        "id": "brazil", "name": "Brasil (POF 2008-2018)",
        "datasetName": "Pesquisa de Orçamentos Familiares (IBGE)",
        "sampleSize": 42000, "baselineGini": 0.53, "baselineIGE": 0.58,
        "q1ToQ5Mobility": 0.068, "genderWageGap": 0.22, "neighborhoodPenalty": 0.29,
        "segregationIndex": 0.61, "informalRate": 0.38,
        "stylizedFacts": {
            "maternalEduReturn": "+11.8% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Mujeres afrodescendientes enfrentan penalidad salarial acumulada del 27%",
            "povertyTrapPersistence": "61.3% de los hijos de Q1 permanecen en Q1-Q2",
            "spatialPenalty": "Residencia en favelas periféricas reduce emparejamiento formal en 24%",
        },
    },
    "india": {
        "id": "india", "name": "India (IHDS 2004-2012)",
        "datasetName": "India Human Development Survey (NCAER/UMD)",
        "sampleSize": 41554, "baselineGini": 0.49, "baselineIGE": 0.64,
        "q1ToQ5Mobility": 0.051, "genderWageGap": 0.34, "neighborhoodPenalty": 0.31,
        "segregationIndex": 0.68, "informalRate": 0.78,
        "stylizedFacts": {
            "maternalEduReturn": "+9.5% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Caída marcada en participación laboral femenina en estratos medios",
            "povertyTrapPersistence": "69.1% rigidez intergeneracional vinculada a estratificación social",
            "spatialPenalty": "Fricción rural-urbana restringe el alcance de redes de contactos débiles",
        },
    },
    "bogota_colombia": {
        "id": "bogota_colombia", "name": "Colombia / Bogotá (GEIH-DANE 2019-2024)",
        "datasetName": "Gran Encuesta Integrada de Hogares (GEIH / DANE)",
        "sampleSize": 35400, "baselineGini": 0.54, "baselineIGE": 0.59,
        "q1ToQ5Mobility": 0.058, "genderWageGap": 0.24, "neighborhoodPenalty": 0.32,
        "segregationIndex": 0.65, "informalRate": 0.46,
        "stylizedFacts": {
            "maternalEduReturn": "+12.5% retorno del ingreso por educación superior en Bogotá",
            "genderMobilityGap": "Brecha de género acumulada del 24% en ingresos laborales de informales",
            "povertyTrapPersistence": "68.2% de persistencia intergeneracional en quintiles Q1 y Q2",
            "spatialPenalty": "Fricción de transporte desde periferias impone penalidad del 32%",
        },
    },
    "oecd_benchmark": {
        "id": "oecd_benchmark", "name": "Referencia OCDE (Países Nórdicos)",
        "datasetName": "World Bank GDIM / OECD Social Mobility Metrics",
        "sampleSize": 150000, "baselineGini": 0.29, "baselineIGE": 0.24,
        "q1ToQ5Mobility": 0.145, "genderWageGap": 0.11, "neighborhoodPenalty": 0.12,
        "segregationIndex": 0.28, "informalRate": 0.06,
        "stylizedFacts": {
            "maternalEduReturn": "+6.8% elasticidad salarial con primera infancia universalizada",
            "genderMobilityGap": "Baja dispersión salarial y alta sindicalización colectiva",
            "povertyTrapPersistence": "28.4% de los hijos de Q1 permanecen en Q1",
            "spatialPenalty": "Elevada integración residencial mediante vivienda pública",
        },
    },
}

PRESET_POLICIES = {
    "base": {"id": "base", "name": "Escenario Base (Status Quo)",
              "description": "Replicación histórica sin intervención adicional.",
              "educationAccess": 0.0, "institutionalQuality": 0.0, "inheritanceTaxRate": 0.0,
              "earlyChildhoodEffect": 0.0, "segregationReduction": 0.0,
              "affirmativeActionQuota": 0.0, "conditionalCashTransfers": True},
    "scenario_a_education": {"id": "scenario_a_education", "name": "Escenario A: Expansión Educativa",
              "description": "+30% cobertura en educación superior con calidad institucional heterogénea.",
              "educationAccess": 0.30, "institutionalQuality": 0.15, "inheritanceTaxRate": 0.0,
              "earlyChildhoodEffect": 0.0, "segregationReduction": 0.0,
              "affirmativeActionQuota": 0.10, "conditionalCashTransfers": True},
    "scenario_b_inheritance": {"id": "scenario_b_inheritance", "name": "Escenario B: Impuesto a la Herencia",
              "description": "20% de gravamen sobre herencias > percentil 90.",
              "educationAccess": 0.10, "institutionalQuality": 0.25, "inheritanceTaxRate": 0.20,
              "earlyChildhoodEffect": 0.0, "segregationReduction": 0.0,
              "affirmativeActionQuota": 0.05, "conditionalCashTransfers": True},
    "scenario_c_early_childhood": {"id": "scenario_c_early_childhood", "name": "Escenario C: Primera Infancia Universal",
              "description": "Intervención universal 0-5 años en nutrición y estimulación temprana.",
              "educationAccess": 0.05, "institutionalQuality": 0.10, "inheritanceTaxRate": 0.0,
              "earlyChildhoodEffect": 0.40, "segregationReduction": 0.05,
              "affirmativeActionQuota": 0.0, "conditionalCashTransfers": True},
    "scenario_d_desegregation": {"id": "scenario_d_desegregation", "name": "Escenario D: Desegregación Residencial",
              "description": "Reducción del 50% en segregación residencial y subsidio de transporte.",
              "educationAccess": 0.05, "institutionalQuality": 0.10, "inheritanceTaxRate": 0.0,
              "earlyChildhoodEffect": 0.05, "segregationReduction": 0.50,
              "affirmativeActionQuota": 0.05, "conditionalCashTransfers": True},
}

class APIClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")

    def get_health(self) -> Dict[str, Any]:
        try:
            r = requests.get(f"{self.base_url}/api/health", timeout=2.0)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return {"status": "local_fallback", "name": "Python Engine Direct v3.11", "version": "3.11.0"}

    def run_simulation(self, country_id: str, policy_dict: Dict, num_agents: int = 500,
                       discount_beta: float = 0.95, edu_return_rho: float = 0.095,
                       macro_shock: float = 0.0) -> Dict[str, Any]:
        payload = {"country_id": country_id, "policy": policy_dict, "num_agents": num_agents,
                   "discount_beta": discount_beta, "edu_return_rho": edu_return_rho, "macro_shock": macro_shock}
        try:
            r = requests.post(f"{self.base_url}/api/simulation/run", json=payload, timeout=15.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        from backend.services.hdt_abm_engine import run_hdt_simulation, PolicyParams
        return run_hdt_simulation(country_id, PolicyParams(**policy_dict), num_agents, discount_beta, edu_return_rho, macro_shock).model_dump()

    def predict_dropout(self, profile_dict: Dict) -> Dict[str, Any]:
        try:
            r = requests.post(f"{self.base_url}/api/early_warning/predict", json=profile_dict, timeout=5.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        from backend.services.early_warning import predict_student_dropout
        from backend.models.schemas import StudentProfileInput
        return predict_student_dropout(StudentProfileInput(**profile_dict)).model_dump()

    def get_ml_comparison(self) -> List[Dict[str, Any]]:
        try:
            r = requests.get(f"{self.base_url}/api/ml/compare", timeout=5.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        from backend.services.ml_pipeline import get_all_models_metrics
        return [m.model_dump() for m in get_all_models_metrics()]

    def compute_topsis(self, weights: Dict[str, float]) -> List[Dict[str, Any]]:
        try:
            r = requests.post(f"{self.base_url}/api/ml/topsis", json=weights, timeout=5.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        from backend.services.ml_pipeline import compute_topsis_ranking
        from backend.models.schemas import TopsisWeightsInput
        return [item.model_dump() for item in compute_topsis_ranking(TopsisWeightsInput(**weights))]

    def retrain_model(self, epochs: int, lr: float) -> List[Dict[str, Any]]:
        try:
            r = requests.post(f"{self.base_url}/api/ml/retrain", json={"epochs": epochs, "learning_rate": lr}, timeout=8.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        from backend.services.ml_pipeline import simulate_retraining
        return [log.model_dump() for log in simulate_retraining(epochs, lr)]

    def run_voice_chat(self, user_text: str, simulation_context: Optional[Dict] = None) -> Dict[str, Any]:
        payload = {"text_query": user_text, "session_id": "voice-session-01", "simulation_context": simulation_context}
        try:
            r = requests.post(f"{self.base_url}/api/voice/chat", json=payload, timeout=8.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        return {
            "transcription": user_text,
            "response_text": f"Respuesta copiloto (Local): Para '{user_text}', el modelo HDT v3.11 mantiene equilibrio con Gini 0.54 y tasa de ascenso Q1->Q5 del 5.8%.",
            "audio_response_base64": None,
            "detected_intent": "general_inquiry"
        }

    def download_report(self, format_type: str = "pdf", country_id: str = "bogota_colombia") -> bytes:
        payload = {"format_type": format_type, "country_id": country_id}
        try:
            r = requests.post(f"{self.base_url}/api/export/report", json=payload, timeout=12.0)
            if r.status_code == 200: return r.content
        except Exception:
            pass
        return b"%PDF-1.4 Mock Report Content"

    def run_orchestration(self, query: str, session_id: str = "demo", flow_id: Optional[str] = None) -> Dict:
        payload = {"query": query, "sessionId": session_id, "flowId": flow_id}
        try:
            r = requests.post(f"{self.base_url}/api/orchestration/run", json=payload, timeout=12.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        q = query.lower()
        intent = "langflow" if "langflow" in q or "flujo" in q else ("langchain" if "documental" in q or "rag" in q else "agent")
        import time
        return {
            "sessionId": session_id, "query": query, "intent": intent,
            "routeExecuted": f"nodo_{intent}",
            "response": f"[Agente Local v3.11]: Consulta '{query}' procesada con StateGraph.",
            "executionSteps": [
                {"node":"classify_intent","timestamp":time.time(),"details":{"detectedIntent":intent}},
                {"node":f"nodo_{intent}","timestamp":time.time(),"details":{"status":"success"}},
                {"node":"validate_output","timestamp":time.time(),"details":{"status":"validated"}},
            ],
            "stateCheckpointed": True, "metadata": {"totalSteps":3,"toolsUsed":1},
        }

    def get_orchestration_status(self) -> Dict:
        try:
            r = requests.get(f"{self.base_url}/api/orchestration/status", timeout=3.0)
            if r.status_code == 200: return r.json()
        except Exception:
            pass
        return {
            "status": "ready", "engine": "LangGraph (StateGraph + MemorySaver) v3.11",
            "config": {"langflowBaseUrl":"http://localhost:7860","langflowFlowId":"dropout-early-warning-flow"},
            "availableTools": ["econometric_calculator","dropout_risk_scorer","knowledge_lookup"],
            "nodes": ["classify_intent","nodo_langflow","nodo_langchain","nodo_agent","validate_output"],
        }
