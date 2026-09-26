import os
import httpx
from typing import Dict, Any, List, Optional

class LangflowClient:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        flow_id: Optional[str] = None,
        timeout_seconds: float = 15.0,
    ):
        self.base_url = (base_url or os.getenv("LANGFLOW_BASE_URL", "http://localhost:7860")).rstrip("/")
        self.api_key = api_key or os.getenv("LANGFLOW_API_KEY")
        self.default_flow_id = flow_id or os.getenv("LANGFLOW_FLOW_ID", "dropout-early-warning-flow")
        self.timeout_seconds = timeout_seconds

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def run_flow(
        self,
        flow_id: Optional[str] = None,
        input_value: str = "",
        tweaks: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        target_flow = flow_id or self.default_flow_id
        endpoint = f"{self.base_url}/api/v1/run/{target_flow}"
        payload = {
            "input_value": input_value,
            "output_type": "chat",
            "input_type": "chat",
            "tweaks": tweaks or {},
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(endpoint, headers=self._get_headers(), json=payload)
                if response.status_code == 200:
                    data = response.json()
                    extracted = self._extract_message_text(data)
                    return {
                        "status": "success",
                        "result": extracted or str(data),
                        "raw": data,
                    }
                else:
                    return {
                        "status": "fallback",
                        "result": f"[Langflow HTTP {response.status_code}]: Respuesta no exitosa del servidor.",
                        "error": f"HTTP {response.status_code}: {response.text[:200]}",
                    }
        except Exception as err:
            return {
                "status": "fallback",
                "result": f"[Simulación Langflow]: Servidor Langflow en {self.base_url} inaccesible (offline). Flujo '{target_flow}' ejecutado en modo fallback local para input: \"{input_value}\".",
                "error": str(err),
            }

    async def list_flows(self) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/api/v1/flows"
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(endpoint, headers=self._get_headers())
                if response.status_code == 200:
                    return {"success": True, "flows": response.json()}
                return {
                    "success": False,
                    "flows": [
                        {
                            "id": "fallback-dropout-risk-flow",
                            "name": "Dropout Risk Assessment (Local Mock)",
                            "description": "Flujo simulado de evaluación de riesgo escolar.",
                            "updated_at": "2026-09-21T00:00:00Z",
                        }
                    ],
                    "error": f"HTTP {response.status_code}",
                }
        except Exception as err:
            return {
                "success": False,
                "flows": [
                    {
                        "id": "fallback-dropout-risk-flow",
                        "name": "Dropout Risk Assessment (Local Mock)",
                        "description": "Flujo simulado de evaluación de riesgo escolar.",
                        "updated_at": "2026-09-21T00:00:00Z",
                    }
                ],
                "error": f"Conexión rechazada: {str(err)}",
            }

    def _extract_message_text(self, data: Dict[str, Any]) -> Optional[str]:
        try:
            if isinstance(data.get("result"), str):
                return data["result"]
            outputs = data.get("outputs", [])
            if outputs:
                first_out = outputs[0].get("outputs", [{}])[0]
                results = first_out.get("results", {})
                if "message" in results and "text" in results["message"]:
                    return results["message"]["text"]
                if "artifacts" in first_out and "text" in first_out["artifacts"]:
                    return first_out["artifacts"]["text"]
        except Exception:
            pass
        return None

    def get_config(self) -> Dict[str, Any]:
        return {
            "langflowBaseUrl": self.base_url,
            "langflowApiKey": self.api_key or "N/A",
            "langflowFlowId": self.default_flow_id,
            "timeoutSeconds": self.timeout_seconds,
        }
