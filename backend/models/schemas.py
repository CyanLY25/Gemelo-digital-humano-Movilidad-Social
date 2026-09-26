from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ── HDT-ABM Schemas ───────────────────────────────────────────────────────────
class CountryCalibration(BaseModel):
    id: str
    name: str
    datasetName: str
    sampleSize: int
    baselineGini: float
    baselineIGE: float
    q1ToQ5Mobility: float
    genderWageGap: float
    neighborhoodPenalty: float
    segregationIndex: float
    informalRate: float
    stylizedFacts: Dict[str, str]

class PolicyParams(BaseModel):
    id: str = "base"
    name: str = "Escenario Base (Status Quo)"
    description: str = "Replicación histórica sin intervención adicional."
    educationAccess: float = Field(default=0.0, ge=0.0, le=1.0)
    institutionalQuality: float = Field(default=0.0, ge=0.0, le=1.0)
    inheritanceTaxRate: float = Field(default=0.0, ge=0.0, le=1.0)
    earlyChildhoodEffect: float = Field(default=0.0, ge=0.0, le=1.0)
    segregationReduction: float = Field(default=0.0, ge=0.0, le=1.0)
    affirmativeActionQuota: float = Field(default=0.0, ge=0.0, le=1.0)
    conditionalCashTransfers: bool = True

class SimulationRequest(BaseModel):
    country_id: str = "bogota_colombia"
    policy: PolicyParams = Field(default_factory=PolicyParams)
    num_agents: int = Field(default=1000, ge=50, le=10000)
    discount_beta: float = Field(default=0.95, ge=0.8, le=0.99)
    edu_return_rho: float = Field(default=0.095, ge=0.01, le=0.3)
    macro_shock: float = Field(default=0.0, ge=-0.5, le=0.5)

class AgentCapitals(BaseModel):
    cognitive: float
    human: float
    social: float
    psychological: float
    structural: float

class AgentLifecyclePoint(BaseModel):
    age: int
    wage: int
    wealth: int
    socialStatus: float
    degree: str
    employment: str
    actionTaken: str
    weakTiesCount: int

class AgentHDT(BaseModel):
    id: str
    gender: str
    originQuintile: int
    isMinority: bool
    capital: AgentCapitals
    finalWage: int
    finalWealth: int
    finalSocialStatus: float
    finalQuintile: int
    highestDegree: str
    trajectory: List[AgentLifecyclePoint]

class FairnessMetrics(BaseModel):
    demographicParityGender: float
    disparateImpactMinority: float
    equalizedOddsDifference: float

class ShapValue(BaseModel):
    feature: str
    importance: float
    impact: str

class ChannelDecomposition(BaseModel):
    channel: str
    percentage: float
    description: str

class LorenzPoint(BaseModel):
    populationFraction: float
    incomeFraction: float

class DecileTrajectoryPoint(BaseModel):
    age: int
    decile1: float
    decile2: float
    decile3: float
    decile4: float
    decile5: float
    decile6: float
    decile7: float
    decile8: float
    decile9: float
    decile10: float

class SimulationResultsResponse(BaseModel):
    country: CountryCalibration
    activePolicy: PolicyParams
    numAgents: int
    totalYears: int
    estimatedIGE: float
    estimatedGini: float
    q1ToQ5MobilityRate: float
    transitionMatrix: List[List[float]]
    averageWageByQuintile: List[int]
    lorenzCurve: List[LorenzPoint]
    decileTrajectories: List[DecileTrajectoryPoint]
    channelDecomposition: List[ChannelDecomposition]
    agents: List[AgentHDT]
    fairnessMetrics: FairnessMetrics
    shapValues: List[ShapValue]
    p90p10Ratio: float
    multidimensionalPovertyRate: float
    relativeIntergenerationalMobility: float

# ── ML CRISP-DM Schemas ───────────────────────────────────────────────────────
class ModelMetrics(BaseModel):
    model_name: str
    f1_score: float
    auc_roc: float
    latency_ms: float
    explicability_score: float
    brier_score: float
    confusion_matrix: List[List[int]]
    roc_fpr: List[float]
    roc_tpr: List[float]

class TopsisWeightsInput(BaseModel):
    weight_f1: float = Field(default=0.30, ge=0.0, le=1.0)
    weight_auc: float = Field(default=0.25, ge=0.0, le=1.0)
    weight_latency: float = Field(default=0.20, ge=0.0, le=1.0)
    weight_explicability: float = Field(default=0.15, ge=0.0, le=1.0)
    weight_brier: float = Field(default=0.10, ge=0.0, le=1.0)

class TopsisRankingItem(BaseModel):
    rank: int
    model_name: str
    closeness_score: float

class RetrainRequest(BaseModel):
    epochs: int = Field(default=50, ge=5, le=200)
    learning_rate: float = Field(default=0.001, ge=0.0001, le=0.1)
    batch_size: int = Field(default=32, ge=8, le=256)
    smote_ratio: float = Field(default=0.5, ge=0.1, le=1.0)

class RetrainLog(BaseModel):
    epoch: int
    loss: float
    val_loss: float
    f1: float

# ── Early Warning Schemas ─────────────────────────────────────────────────────
class StudentProfileInput(BaseModel):
    rendimiento: float = Field(default=52.0, ge=0.0, le=100.0)
    asistencia: float = Field(default=68.0, ge=0.0, le=100.0)
    distancia_km: float = Field(default=8.5, ge=0.0, le=50.0)
    apoyo_familiar: float = Field(default=0.0, ge=0.0, le=1.0)
    edad: float = Field(default=16.0, ge=5.0, le=25.0)
    acceso_internet: float = Field(default=1.0, ge=0.0, le=1.0)
    motivacion: float = Field(default=45.0, ge=0.0, le=100.0)
    ingreso_hogar: Optional[float] = Field(default=350000.0, ge=0.0)
    nivel_edu_materno: Optional[float] = Field(default=2.0, ge=0.0, le=5.0)

class DropoutRecommendation(BaseModel):
    title: str
    description: str
    priority: str
    category: str

class FactorContribution(BaseModel):
    factor: str
    label: str
    userValue: float
    benchmarkValue: float
    contribution: float
    direction: str

class DropoutPredictionResponse(BaseModel):
    probability: float
    riskLevel: str
    anticipationWindow: str
    recommendations: List[DropoutRecommendation]
    factorContributions: List[FactorContribution]

# ── Voice & Chatbot Schemas ───────────────────────────────────────────────────
class VoiceChatRequest(BaseModel):
    text_query: Optional[str] = None
    audio_base64: Optional[str] = None
    session_id: str = "voice-session-01"
    simulation_context: Optional[Dict[str, Any]] = None

class VoiceChatResponse(BaseModel):
    transcription: str
    response_text: str
    audio_response_base64: Optional[str] = None
    detected_intent: str

# ── Orchestration Schemas ─────────────────────────────────────────────────────
class OrchestrationRequest(BaseModel):
    query: str
    sessionId: Optional[str] = "default-session"
    flowId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExecutionStepLog(BaseModel):
    node: str
    timestamp: float
    details: Optional[Dict[str, Any]] = None

class OrchestrationResponse(BaseModel):
    sessionId: str
    query: str
    intent: str
    routeExecuted: str
    response: str
    executionSteps: List[ExecutionStepLog]
    stateCheckpointed: bool
    metadata: Dict[str, Any]

class OrchestrationStatusResponse(BaseModel):
    status: str
    engine: str
    config: Dict[str, Any]
    availableTools: List[str]
    nodes: List[str]

# ── Export Reports Schemas ────────────────────────────────────────────────────
class ExportReportRequest(BaseModel):
    format_type: str = Field(default="pdf", pattern="^(pdf|docx|xlsx)$")
    country_id: str = "bogota_colombia"
    simulation_results: Optional[Dict[str, Any]] = None
    audit_results: Optional[Dict[str, Any]] = None
