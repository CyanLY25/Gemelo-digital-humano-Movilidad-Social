/**
 * Module 8: Calculadora de Alerta Temprana e Intervenciones (earlyWarningEngine.ts)
 * Computes individual risk scoring, classifies student into risk tiers (Red / Yellow / Green),
 * generates prioritized interventions, and calculates individual factor contributions.
 */

import { StudentRecord, EarlyWarningPrediction, RiskLevel, FeatureKey } from "../../types/ia";
import { FEATURE_NAMES, PreprocessedDataset } from "./trainingEngine";

export interface StudentInputProfile {
  rendimiento: number;
  asistencia: number;
  distancia_km: number;
  apoyo_familiar: number;
  edad: number;
  acceso_internet: number;
  motivacion: number;
}

export const DEFAULT_STUDENT_PROFILE: StudentInputProfile = {
  rendimiento: 52,
  asistencia: 68,
  distancia_km: 8.5,
  apoyo_familiar: 0,
  edad: 16,
  acceso_internet: 1,
  motivacion: 45,
};

// Cohort benchmarks for comparison
const POPULATION_BENCHMARKS: Record<FeatureKey, number> = {
  rendimiento: 65,
  asistencia: 82,
  distancia_km: 5.2,
  apoyo_familiar: 0.68,
  edad: 15.2,
  acceso_internet: 0.64,
  motivacion: 60,
};

const FACTOR_LABELS: Record<FeatureKey, string> = {
  rendimiento: "Rendimiento Académico",
  asistencia: "Asistencia a Clases",
  distancia_km: "Distancia al Establecimiento",
  apoyo_familiar: "Apoyo y Contención Familiar",
  edad: "Edad / Rezago Escolar",
  acceso_internet: "Acceso a Conectividad Digital",
  motivacion: "Motivación e Interés Escolar",
};

/**
 * Predicts dropout probability and produces full risk assessment & actionable plan
 */
export function predictStudentEarlyWarning(
  profile: StudentInputProfile,
  customModelWeights?: { weights: number[]; bias: number; means: number[]; stds: number[] }
): EarlyWarningPrediction {
  let probDropout = 0;

  // If weights are provided from trained Logistic Regression
  if (customModelWeights && customModelWeights.weights.length === FEATURE_NAMES.length) {
    const { weights, bias, means, stds } = customModelWeights;
    let z = bias;
    FEATURE_NAMES.forEach((key, idx) => {
      const val = profile[key];
      const normVal = (val - means[idx]) / (stds[idx] || 1);
      z += weights[idx] * normVal;
    });
    probDropout = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  } else {
    // Calibrated empirical logistic scoring model
    const z =
      -1.75 -
      0.058 * (profile.rendimiento - 50) -
      0.082 * (profile.asistencia - 70) +
      0.12 * profile.distancia_km -
      0.88 * profile.apoyo_familiar -
      0.62 * profile.acceso_internet -
      0.04 * (profile.motivacion - 50) +
      0.24 * (profile.edad - 15);

    probDropout = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  }

  const probPercent = parseFloat((probDropout * 100).toFixed(1));

  // Risk Classification
  let riskLevel: RiskLevel;
  let anticipationWindow: string;

  if (probPercent >= 70) {
    riskLevel = "ALERTA_ROJA";
    anticipationWindow = "6 a 12 Meses (Acción Inmediata Requerida)";
  } else if (probPercent >= 40) {
    riskLevel = "RIESGO_MODERADO";
    anticipationWindow = "8 a 12 Meses (Monitoreo Focalizado)";
  } else {
    riskLevel = "SIN_ALERTA";
    anticipationWindow = "Preventivo / Regular (Bajo Riesgo)";
  }

  // Interventions catalog based on profile conditions
  const recommendations: EarlyWarningPrediction["recommendations"] = [];

  if (riskLevel === "ALERTA_ROJA") {
    recommendations.push({
      title: "Activación de Protocolo de Alerta Roja y Beca de Emergencia",
      description: "Asignar de forma inmediata beca de retención estudiantil, subsidio alimentario escolar y contacto telefónico directo con la familia dentro de 48 horas.",
      priority: "Alta",
      category: "Socioeconómico",
    });
  }

  if (profile.asistencia < 75) {
    recommendations.push({
      title: "Plan de Rescate de Asistencia y Alerta Temprana de Inasistencia",
      description: `El estudiante registra ${profile.asistencia}% de asistencia (bajo el umbral crítico del 75%). Asignar tutor de seguimiento diario y mediador escolar.`,
      priority: "Alta",
      category: "Académico",
    });
  }

  if (profile.rendimiento < 60) {
    recommendations.push({
      title: "Tutorías Académicas Intensivas y Refuerzo Pedagógico",
      description: `Promedio actual de ${profile.rendimiento}/100 indica riesgo de reprobación. Vincular a clínica pedagógica quincenal en materias prioritarias.`,
      priority: "Alta",
      category: "Académico",
    });
  }

  if (profile.distancia_km > 7.0) {
    recommendations.push({
      title: "Bono de Movilidad / Transporte Escolar Municipal",
      description: `La distancia de ${profile.distancia_km} km incrementa la fricción espacial de traslado matutino y fatiga. Gestionar pase escolar o ruta de transporte asistido.`,
      priority: "Media",
      category: "Logístico",
    });
  }

  if (profile.apoyo_familiar === 0) {
    recommendations.push({
      title: "Intervención de Asistente Social y Red Familiar Extensa",
      description: "Detectada carencia de soporte o contención en el hogar. Derivar a trabajador social escolar para evaluar entorno y generar compromiso de acompañamiento.",
      priority: "Alta",
      category: "Socioeconómico",
    });
  }

  if (profile.motivacion < 50) {
    recommendations.push({
      title: "Mentoría Vocacional y Acompañamiento Psicoeducativo",
      description: "Puntaje de motivación intrínseca bajo (45/100). Integrar en talleres extracurriculares, artes, deportes y tutoría vocacional de proyecto de vida.",
      priority: "Media",
      category: "Psicopedagógico",
    });
  }

  if (profile.acceso_internet === 0) {
    recommendations.push({
      title: "Kit de Conectividad y Acceso a Biblioteca Digital",
      description: "Sin internet en el hogar. Proveer chip SIM de conectividad escolar para tareas y acceso prioritario a computadores del centro.",
      priority: "Baja",
      category: "Logístico",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Monitoreo Preventivo Regular",
      description: "Mantener registro bimensual de asistencia y notas en plataforma SIMCE/SIGE sin necesidad de intervención reactiva.",
      priority: "Baja",
      category: "Académico",
    });
  }

  // Decompose Factor Contributions (how much each factor deviates from population benchmark)
  const factorContributions: EarlyWarningPrediction["factorContributions"] = [
    {
      factor: "asistencia",
      label: FACTOR_LABELS.asistencia,
      userValue: profile.asistencia,
      benchmarkValue: POPULATION_BENCHMARKS.asistencia,
      contribution: parseFloat(((POPULATION_BENCHMARKS.asistencia - profile.asistencia) * 0.45).toFixed(1)),
      direction: profile.asistencia < POPULATION_BENCHMARKS.asistencia ? "increases_risk" : "protects",
    },
    {
      factor: "rendimiento",
      label: FACTOR_LABELS.rendimiento,
      userValue: profile.rendimiento,
      benchmarkValue: POPULATION_BENCHMARKS.rendimiento,
      contribution: parseFloat(((POPULATION_BENCHMARKS.rendimiento - profile.rendimiento) * 0.38).toFixed(1)),
      direction: profile.rendimiento < POPULATION_BENCHMARKS.rendimiento ? "increases_risk" : "protects",
    },
    {
      factor: "distancia_km",
      label: FACTOR_LABELS.distancia_km,
      userValue: profile.distancia_km,
      benchmarkValue: POPULATION_BENCHMARKS.distancia_km,
      contribution: parseFloat(((profile.distancia_km - POPULATION_BENCHMARKS.distancia_km) * 1.2).toFixed(1)),
      direction: profile.distancia_km > POPULATION_BENCHMARKS.distancia_km ? "increases_risk" : "protects",
    },
    {
      factor: "apoyo_familiar",
      label: FACTOR_LABELS.apoyo_familiar,
      userValue: profile.apoyo_familiar,
      benchmarkValue: POPULATION_BENCHMARKS.apoyo_familiar,
      contribution: profile.apoyo_familiar === 0 ? 12.5 : -10.0,
      direction: profile.apoyo_familiar === 0 ? "increases_risk" : "protects",
    },
    {
      factor: "motivacion",
      label: FACTOR_LABELS.motivacion,
      userValue: profile.motivacion,
      benchmarkValue: POPULATION_BENCHMARKS.motivacion,
      contribution: parseFloat(((POPULATION_BENCHMARKS.motivacion - profile.motivacion) * 0.28).toFixed(1)),
      direction: profile.motivacion < POPULATION_BENCHMARKS.motivacion ? "increases_risk" : "protects",
    },
    {
      factor: "edad",
      label: FACTOR_LABELS.edad,
      userValue: profile.edad,
      benchmarkValue: POPULATION_BENCHMARKS.edad,
      contribution: parseFloat(((profile.edad - POPULATION_BENCHMARKS.edad) * 2.5).toFixed(1)),
      direction: profile.edad > POPULATION_BENCHMARKS.edad ? "increases_risk" : "protects",
    },
    {
      factor: "acceso_internet",
      label: FACTOR_LABELS.acceso_internet,
      userValue: profile.acceso_internet,
      benchmarkValue: POPULATION_BENCHMARKS.acceso_internet,
      contribution: profile.acceso_internet === 0 ? 7.0 : -6.0,
      direction: profile.acceso_internet === 0 ? "increases_risk" : "protects",
    },
  ];

  // Sort by highest risk contribution
  factorContributions.sort((a, b) => b.contribution - a.contribution);

  return {
    probability: probPercent,
    riskLevel,
    anticipationWindow,
    recommendations,
    factorContributions,
  };
}
