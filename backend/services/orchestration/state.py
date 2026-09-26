from typing import List, Dict, Any, Optional, TypedDict, Annotated
import operator

class ExecutionLogEntry(TypedDict):
    node: str
    timestamp: float
    details: Optional[Dict[str, Any]]

class WorkflowState(TypedDict):
    query: str
    sessionId: str
    intent: str
    targetFlowId: Optional[str]
    routeResult: str
    toolOutputs: Annotated[List[Dict[str, Any]], operator.add]
    validatedOutput: str
    executionLog: Annotated[List[ExecutionLogEntry], operator.add]
