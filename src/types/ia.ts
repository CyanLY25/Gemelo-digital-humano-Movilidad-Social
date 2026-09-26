/**
 * Types and Interfaces for the School Dropout Early Warning AI Engine
 * (Sistema de Alerta Temprana de Deserción Escolar - Clasificación Binaria)
 */

export interface StudentRecord {
  id: string;
  rendimiento: number; // 0 - 100
  asistencia: number; // 0 - 100 (%)
  distancia_km: number; // 0.5 - 35 km
  apoyo_familiar: number; // 0 or 1
  edad: number; // 11 - 19
  acceso_internet: number; // 0 or 1
  motivacion: number; // 0 - 100
  deserto: number; // 0 (No) or 1 (Sí) - Target
}

export type FeatureKey = Exclude<keyof StudentRecord, 'id' | 'deserto'>;

export interface DatasetSummary {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  dropoutCount: number;
  nonDropoutCount: number;
  dropoutRate: number;
  features: {
    name: string;
    type: 'numeric' | 'binary' | 'categorical';
    missing: number;
  }[];
}

export interface EDAMetric {
  feature: FeatureKey;
  label: string;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  missing: number;
}

export interface CorrelationPair {
  featureA: string;
  featureB: string;
  coefficient: number;
}

export interface SegmentedDistributionPoint {
  binLabel: string;
  noDropout: number;
  dropout: number;
}

export interface ModelMetrics {
  accuracy: number;
  rocAuc: number;
  precision: number;
  recall: number; // Sensibilidad
  specificity: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  featureImportance: {
    feature: string;
    importance: number;
  }[];
  trainingTimeMs: number;
}

export type ModelType = 'random_forest' | 'logistic_regression' | 'svm' | 'gradient_boosting';

export interface ModelResult {
  id: ModelType;
  name: string;
  description: string;
  metrics: ModelMetrics;
  rocCurve: { fpr: number; tpr: number }[];
}

export interface KFoldFoldResult {
  fold: number;
  accuracy: number;
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface CrossValidationResult {
  k: number;
  folds: KFoldFoldResult[];
  meanRocAuc: number;
  stdRocAuc: number;
  meanF1: number;
  stdF1: number;
  meanAccuracy: number;
  stdAccuracy: number;
}

export interface HyperparameterTrial {
  id: number;
  params: Record<string, number | string>;
  rocAuc: number;
  f1Score: number;
  executionTimeMs: number;
}

export interface HyperparameterTuningResult {
  modelType: ModelType;
  method: 'grid_search' | 'bayesian';
  bestParams: Record<string, number | string>;
  bestScore: number;
  trials: HyperparameterTrial[];
}

export interface BootstrapResult {
  iterations: number;
  meanAuc: number;
  stdError: number;
  ci95: {
    lower: number;
    upper: number;
  };
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
  distributionHistogram: {
    binCenter: number;
    binLabel: string;
    frequency: number;
  }[];
}

export type RiskLevel = 'ALERTA_ROJA' | 'RIESGO_MODERADO' | 'SIN_ALERTA';

export interface EarlyWarningPrediction {
  probability: number; // 0 - 100 %
  riskLevel: RiskLevel;
  anticipationWindow: string;
  recommendations: {
    title: string;
    description: string;
    priority: 'Alta' | 'Media' | 'Baja';
    category: 'Académico' | 'Socioeconómico' | 'Psicopedagógico' | 'Logístico';
  }[];
  factorContributions: {
    factor: string;
    label: string;
    contribution: number; // positive increases risk, negative decreases
    direction: 'increases_risk' | 'protects';
    userValue: number;
    benchmarkValue: number;
  }[];
}

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  tableName: string;
}
