import time
import json
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from backend.services.orchestration.state import WorkflowState, ExecutionLogEntry
from backend.services.orchestration.tools import (
    econometric_calculator,
    dropout_risk_scorer,
    knowledge_lookup,
)
from backend.services.orchestration.langflow_client import LangflowClient
from backend.models.schemas import OrchestrationRequest, OrchestrationResponse, ExecutionStepLog

class GraphOrchestrator:
    def __init__(self):
        self.langflow_client = LangflowClient()
        self.checkpointer = MemorySaver()
        self.compiled_graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(WorkflowState)

        # 1. Classification Node
        async def classify_intent_node(state: WorkflowState) -> Dict[str, Any]:
            q = state.get("query", "").lower()
            if "langflow" in q or "flujo" in q or "flow" in q:
                intent = "langflow"
            elif "documental" in q or "rag" in q or "corpus" in q or "teoría" in q:
                intent = "langchain"
            elif any(k in q for k in ["calcula", "gini", "riesgo", "asistencia", "herramienta", "tool"]):
                intent = "agent"
            else:
                intent = "agent"

            entry: ExecutionLogEntry = {
                "node": "classify_intent",
                "timestamp": time.time(),
                "details": {"detectedIntent": intent, "query": state.get("query")},
            }
            return {"intent": intent, "executionLog": [entry]}

        # 2A. Node Langflow
        async def nodo_langflow(state: WorkflowState) -> Dict[str, Any]:
            flow_id = state.get("targetFlowId") or "dropout-early-warning-flow"
            res = await self.langflow_client.run_flow(flow_id=flow_id, input_value=state.get("query", ""))
            
            entry: ExecutionLogEntry = {
                "node": "nodo_langflow",
                "timestamp": time.time(),
                "details": {"flowId": flow_id, "status": res.get("status")},
            }
            return {
                "routeResult": res.get("result", "Flujo Langflow completado."),
                "executionLog": [entry],
            }

        # 2B. Node LangChain
        async def nodo_langchain(state: WorkflowState) -> Dict[str, Any]:
            query = state.get("query", "")
            snippet_json = knowledge_lookup.invoke({"query": query})
            parsed = json.loads(snippet_json)
            
            response_text = (
                f"[LangChain Knowledge Chain]: Análisis completado para consulta '{query}'.\n"
                f"Base empírica: {parsed.get('foundDocumentSnippet', '')}\n"
                f"Dictamen técnico: Se recomienda calibrar la intervención con retroalimentación en bucle cerrado."
            )

            entry: ExecutionLogEntry = {
                "node": "nodo_langchain",
                "timestamp": time.time(),
                "details": {"chain": "LangChainKnowledgeChain", "status": "success"},
            }
            return {
                "routeResult": response_text,
                "executionLog": [entry],
            }

        # 2C. Node Agent
        async def nodo_agent(state: WorkflowState) -> Dict[str, Any]:
            q = state.get("query", "").lower()
            tool_outputs: List[Dict[str, Any]] = []

            if "gini" in q or "desigualdad" in q:
                res_str = econometric_calculator.invoke({
                    "metric": "Gini Intergeneracional",
                    "baseline_value": 0.62,
                    "target_value": 0.54,
                })
                parsed = json.loads(res_str)
                tool_outputs.append(parsed)
                summary_text = f"[Agente con Herramientas]: Herramienta 'econometric_calculator' ejecutada. Variación: {parsed.get('percentageChange')}%. {parsed.get('interpretation')}"
            elif "riesgo" in q or "deserción" in q or "asistencia" in q:
                res_str = dropout_risk_scorer.invoke({
                    "attendance": 64.0,
                    "gpa": 52.0,
                    "distance_km": 8.5,
                })
                parsed = json.loads(res_str)
                tool_outputs.append(parsed)
                summary_text = f"[Agente con Herramientas]: Herramienta 'dropout_risk_scorer' ejecutada. Riesgo: {parsed.get('dropoutProbability')} ({parsed.get('riskLevel')}). Recomendación: {parsed.get('primaryRecommendation')}"
            else:
                res_str = knowledge_lookup.invoke({"query": state.get("query", "")})
                parsed = json.loads(res_str)
                tool_outputs.append(parsed)
                summary_text = f"[Agente con Herramientas]: Herramienta 'knowledge_lookup' invocada. {parsed.get('foundDocumentSnippet')}"

            entry: ExecutionLogEntry = {
                "node": "nodo_agent",
                "timestamp": time.time(),
                "details": {"toolsInvokedCount": len(tool_outputs)},
            }
            return {
                "routeResult": summary_text,
                "toolOutputs": tool_outputs,
                "executionLog": [entry],
            }

        # 3. Validation Node
        async def validate_output_node(state: WorkflowState) -> Dict[str, Any]:
            candidate = state.get("routeResult", "") or "Sin respuesta generada."
            validated = candidate.strip() if len(candidate.strip()) > 0 else "[Validación]: Respuesta vacía corregida con fallback."

            entry: ExecutionLogEntry = {
                "node": "validate_output",
                "timestamp": time.time(),
                "details": {"outputLength": len(validated), "status": "validated"},
            }
            return {
                "validatedOutput": validated,
                "executionLog": [entry],
            }

        # Routing logic function
        def route_by_intent(state: WorkflowState) -> str:
            intent = state.get("intent", "agent")
            if intent == "langflow":
                return "nodo_langflow"
            elif intent == "langchain":
                return "nodo_langchain"
            return "nodo_agent"

        # Graph Construction
        builder.add_node("classify_intent", classify_intent_node)
        builder.add_node("nodo_langflow", nodo_langflow)
        builder.add_node("nodo_langchain", nodo_langchain)
        builder.add_node("nodo_agent", nodo_agent)
        builder.add_node("validate_output", validate_output_node)

        builder.add_edge(START, "classify_intent")
        builder.add_conditional_edges(
            "classify_intent",
            route_by_intent,
            {
                "nodo_langflow": "nodo_langflow",
                "nodo_langchain": "nodo_langchain",
                "nodo_agent": "nodo_agent",
            },
        )

        builder.add_edge("nodo_langflow", "validate_output")
        builder.add_edge("nodo_langchain", "validate_output")
        builder.add_edge("nodo_agent", "validate_output")
        builder.add_edge("validate_output", END)

        return builder.compile(checkpointer=self.checkpointer)

    async def run(self, request: OrchestrationRequest) -> OrchestrationResponse:
        session_id = request.sessionId or f"session-{int(time.time())}"
        config = {"configurable": {"thread_id": session_id}}

        initial_state: WorkflowState = {
            "query": request.query,
            "sessionId": session_id,
            "intent": "agent",
            "targetFlowId": request.flowId,
            "routeResult": "",
            "toolOutputs": [],
            "validatedOutput": "",
            "executionLog": [],
        }

        final_state = await self.compiled_graph.ainvoke(initial_state, config=config)

        execution_steps = [
            ExecutionStepLog(
                node=item["node"],
                timestamp=item["timestamp"],
                details=item.get("details"),
            )
            for item in final_state.get("executionLog", [])
        ]

        return OrchestrationResponse(
            sessionId=session_id,
            query=request.query,
            intent=final_state.get("intent", "agent"),
            routeExecuted=f"nodo_{final_state.get('intent', 'agent')}",
            response=final_state.get("validatedOutput", ""),
            executionSteps=execution_steps,
            stateCheckpointed=True,
            metadata={
                "totalSteps": len(execution_steps),
                "toolsUsed": len(final_state.get("toolOutputs", [])),
            },
        )
