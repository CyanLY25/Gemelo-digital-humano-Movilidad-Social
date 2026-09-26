import math
from typing import List, Dict, Any
from backend.models.schemas import (
    StudentProfileInput,
    DropoutPredictionResponse,
    DropoutRecommendation,
    FactorContribution,
)

POPULATION_BENCHMARKS: Dict[str, float] = {
    "rendimiento": 65.0,
    "asistencia": 82.0,
    "distancia_km": 5.2,
    "apoyo_familiar": 0.68,
    "edad": 15.2,
    "acceso_internet": 0.64,
    "motivacion": 60.0,
}

FACTOR_LABELS: Dict[str, str] = {
    "rendimiento": "Rendimiento Académico",
    "asistencia": "Asistencia a Clases",
    "distancia_km": "Distancia al Establecimiento",
    "apoyo_familiar": "Apoyo y Contención Familiar",
    "edad": "Edad / Rezago Escolar",
    "acceso_internet": "Acceso a Conectividad Digital",
    "motivacion": "Motivación e Interés Escolar",
}

def predict_student_dropout(profile: StudentProfileInput) -> DropoutPredictionResponse:
    # Empirical calibrated logistic regression formula
    z = (
        -1.75
        - 0.058 * (profile.rendimiento - 50.0)
        - 0.082 * (profile.asistencia - 70.0)
        + 0.12 * profile.distancia_km
        - 0.88 * profile.apoyo_familiar
        - 0.62 * profile.acceso_internet
        - 0.04 * (profile.motivacion - 50.0)
        + 0.24 * (profile.edad - 15.0)
    )

    bounded_z = max(-20.0, min(20.0, z))
    prob_dropout = 1.0 / (1.0 + math.exp(-bounded_z))
    prob_percent = round(prob_dropout * 100.0, 1)

    if prob_percent >= 70.0:
        risk_level = "ALERTA_ROJA"
        anticipation_window = "6 a 12 Meses (Acción Inmediata Requerida)"
    elif prob_percent >= 40.0:
        risk_level = "RIESGO_MODERADO"
        anticipation_window = "8 a 12 Meses (Monitoreo Focalizado)"
    else:
        risk_level = "SIN_ALERTA"
        anticipation_window = "Preventivo / Regular (Bajo Riesgo)"

    recommendations: List[DropoutRecommendation] = []

    if risk_level == "ALERTA_ROJA":
        recommendations.append(
            DropoutRecommendation(
                title="Activación de Protocolo de Alerta Roja y Beca de Emergencia",
                description="Asignar de forma inmediata beca de retención estudiantil, subsidio alimentario escolar y contacto telefónico directo con la familia dentro de 48 horas.",
                priority="Alta",
                category="Socioeconómico",
            )
        )

    if profile.asistencia < 75.0:
        recommendations.append(
            DropoutRecommendation(
                title="Plan de Rescate de Asistencia y Alerta Temprana de Inasistencia",
                description=f"El estudiante registra {profile.asistencia}% de asistencia (bajo el umbral crítico del 75%). Asignar tutor de seguimiento diario y mediador escolar.",
                priority="Alta",
                category="Académico",
            )
        )

    if profile.rendimiento < 60.0:
        recommendations.append(
            DropoutRecommendation(
                title="Tutorías Académicas Intensivas y Refuerzo Pedagógico",
                description=f"Promedio actual de {profile.rendimiento}/100 indica riesgo de reprobación. Vincular a clínica pedagógica quincenal en materias prioritarias.",
                priority="Alta",
                category="Académico",
            )
        )

    if profile.distancia_km > 7.0:
        recommendations.append(
            DropoutRecommendation(
                title="Bono de Movilidad / Transporte Escolar Municipal",
                description=f"La distancia de {profile.distancia_km} km incrementa la fricción espacial de traslado matutino y fatiga. Gestionar pase escolar o ruta de transporte asistido.",
                priority="Media",
                category="Logístico",
            )
        )

    if profile.apoyo_familiar == 0.0:
        recommendations.append(
            DropoutRecommendation(
                title="Intervención de Asistente Social y Red Familiar Extensa",
                description="Detectada carencia de soporte o contención en el hogar. Derivar a trabajador social escolar para evaluar entorno y generar compromiso de acompañamiento.",
                priority="Alta",
                category="Socioeconómico",
            )
        )

    if profile.motivacion < 50.0:
        recommendations.append(
            DropoutRecommendation(
                title="Mentoría Vocacional y Acompañamiento Psicoeducativo",
                description=f"Puntaje de motivación intrínseca bajo ({profile.motivacion}/100). Integrar en talleres extracurriculares, artes, deportes y tutoría vocacional de proyecto de vida.",
                priority="Media",
                category="Psicopedagógico",
            )
        )

    if profile.acceso_internet == 0.0:
        recommendations.append(
            DropoutRecommendation(
                title="Kit de Conectividad y Acceso a Biblioteca Digital",
                description="Sin internet en el hogar. Proveer chip SIM de conectividad escolar para tareas y acceso prioritario a computadores del centro.",
                priority="Baja",
                category="Logístico",
            )
        )

    if not recommendations:
        recommendations.append(
            DropoutRecommendation(
                title="Monitoreo Preventivo Regular",
                description="Mantener registro bimensual de asistencia y notas en plataforma SIMCE/SIGE sin necesidad de intervención reactiva.",
                priority="Baja",
                category="Académico",
            )
        )

    # Calculate factor contributions
    factors: List[FactorContribution] = [
        FactorContribution(
            factor="asistencia",
            label=FACTOR_LABELS["asistencia"],
            userValue=profile.asistencia,
            benchmarkValue=POPULATION_BENCHMARKS["asistencia"],
            contribution=round((POPULATION_BENCHMARKS["asistencia"] - profile.asistencia) * 0.45, 1),
            direction="increases_risk" if profile.asistencia < POPULATION_BENCHMARKS["asistencia"] else "protects",
        ),
        FactorContribution(
            factor="rendimiento",
            label=FACTOR_LABELS["rendimiento"],
            userValue=profile.rendimiento,
            benchmarkValue=POPULATION_BENCHMARKS["rendimiento"],
            contribution=round((POPULATION_BENCHMARKS["rendimiento"] - profile.rendimiento) * 0.38, 1),
            direction="increases_risk" if profile.rendimiento < POPULATION_BENCHMARKS["rendimiento"] else "protects",
        ),
        FactorContribution(
            factor="distancia_km",
            label=FACTOR_LABELS["distancia_km"],
            userValue=profile.distancia_km,
            benchmarkValue=POPULATION_BENCHMARKS["distancia_km"],
            contribution=round((profile.distancia_km - POPULATION_BENCHMARKS["distancia_km"]) * 1.2, 1),
            direction="increases_risk" if profile.distancia_km > POPULATION_BENCHMARKS["distancia_km"] else "protects",
        ),
        FactorContribution(
            factor="apoyo_familiar",
            label=FACTOR_LABELS["apoyo_familiar"],
            userValue=profile.apoyo_familiar,
            benchmarkValue=POPULATION_BENCHMARKS["apoyo_familiar"],
            contribution=12.5 if profile.apoyo_familiar == 0.0 else -10.0,
            direction="increases_risk" if profile.apoyo_familiar == 0.0 else "protects",
        ),
        FactorContribution(
            factor="motivacion",
            label=FACTOR_LABELS["motivacion"],
            userValue=profile.motivacion,
            benchmarkValue=POPULATION_BENCHMARKS["motivacion"],
            contribution=round((POPULATION_BENCHMARKS["motivacion"] - profile.motivacion) * 0.28, 1),
            direction="increases_risk" if profile.motivacion < POPULATION_BENCHMARKS["motivacion"] else "protects",
        ),
        FactorContribution(
            factor="edad",
            label=FACTOR_LABELS["edad"],
            userValue=profile.edad,
            benchmarkValue=POPULATION_BENCHMARKS["edad"],
            contribution=round((profile.edad - POPULATION_BENCHMARKS["edad"]) * 2.5, 1),
            direction="increases_risk" if profile.edad > POPULATION_BENCHMARKS["edad"] else "protects",
        ),
        FactorContribution(
            factor="acceso_internet",
            label=FACTOR_LABELS["acceso_internet"],
            userValue=profile.acceso_internet,
            benchmarkValue=POPULATION_BENCHMARKS["acceso_internet"],
            contribution=7.0 if profile.acceso_internet == 0.0 else -6.0,
            direction="increases_risk" if profile.acceso_internet == 0.0 else "protects",
        ),
    ]

    factors.sort(key=lambda x: x.contribution, reverse=True)

    return DropoutPredictionResponse(
        probability=prob_percent,
        riskLevel=risk_level,
        anticipationWindow=anticipation_window,
        recommendations=recommendations,
        factorContributions=factors,
    )
