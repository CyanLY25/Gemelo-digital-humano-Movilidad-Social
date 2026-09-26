/**
 * Module 4: Selección y Comparación de Modelos (modelSelectionService.ts)
 * Trains all 4 classification models on the identical stratified split,
 * builds a sortable comparison leaderboard, and generates superimposed ROC curves.
 */

import { StudentRecord, ModelType, ModelResult } from "../../types/ia";
import {
  preprocessData,
  stratifiedTrainTestSplit,
  RandomForestModel,
  LogisticRegressionModel,
  SupportVectorMachineModel,
  GradientBoostingModel,
  evaluateClassificationMetrics,
  calculateRocCurve,
} from "./trainingEngine";

export interface SuperimposedRocPoint {
  fpr: number;
  randomForestTpr?: number;
  logisticRegressionTpr?: number;
  svmTpr?: number;
  gradientBoostingTpr?: number;
  baseline: number;
}

export interface ModelComparisonResult {
  models: ModelResult[];
  championModel: ModelResult;
  superimposedRocData: SuperimposedRocPoint[];
  trainCount: number;
  testCount: number;
}

/**
 * Execute all 4 algorithms on identical stratified training/test sets
 */
export async function compareAllModels(
  records: StudentRecord[],
  testSize = 0.2,
  seed = 42
): Promise<ModelComparisonResult> {
  const { X, y } = preprocessData(records);
  const { X_train, y_train, X_test, y_test } = stratifiedTrainTestSplit(X, y, testSize, seed);

  // 1. Random Forest
  const t0 = performance.now();
  await new Promise((res) => setTimeout(res, 15));
  const rf = new RandomForestModel(35, 6);
  rf.fit(X_train, y_train, seed);
  const rfProbs = rf.predictProba(X_test);
  const rfTime = Math.round(performance.now() - t0);
  const rfMetrics = evaluateClassificationMetrics(y_test, rfProbs, 0.5, rfTime, rf.getFeatureImportance());
  const rfRoc = calculateRocCurve(y_test, rfProbs);

  const rfResult: ModelResult = {
    id: "random_forest",
    name: "Random Forest Classifier",
    description: "Ensemble de 35 árboles con muestreo Bootstrap y subespacios de variables.",
    metrics: rfMetrics,
    rocCurve: rfRoc,
  };

  // 2. Logistic Regression
  const t1 = performance.now();
  await new Promise((res) => setTimeout(res, 15));
  const lr = new LogisticRegressionModel(0.08, 300, 0.01);
  lr.fit(X_train, y_train);
  const lrProbs = lr.predictProba(X_test);
  const lrTime = Math.round(performance.now() - t1);
  const lrMetrics = evaluateClassificationMetrics(y_test, lrProbs, 0.5, lrTime, lr.getFeatureImportance());
  const lrRoc = calculateRocCurve(y_test, lrProbs);

  const lrResult: ModelResult = {
    id: "logistic_regression",
    name: "Regresión Logística",
    description: "Modelo discriminativo lineal con sigmoide y regularización L2.",
    metrics: lrMetrics,
    rocCurve: lrRoc,
  };

  // 3. SVM
  const t2 = performance.now();
  await new Promise((res) => setTimeout(res, 15));
  const svm = new SupportVectorMachineModel(1.0, 250);
  svm.fit(X_train, y_train);
  const svmProbs = svm.predictProba(X_test);
  const svmTime = Math.round(performance.now() - t2);
  const svmMetrics = evaluateClassificationMetrics(y_test, svmProbs, 0.5, svmTime, svm.getFeatureImportance());
  const svmRoc = calculateRocCurve(y_test, svmProbs);

  const svmResult: ModelResult = {
    id: "svm",
    name: "Support Vector Machine (SVM)",
    description: "Maximizador de margen suave con penalidad C y calibración sigmoidal.",
    metrics: svmMetrics,
    rocCurve: svmRoc,
  };

  // 4. Gradient Boosting
  const t3 = performance.now();
  await new Promise((res) => setTimeout(res, 15));
  const gb = new GradientBoostingModel(30, 0.1, 4);
  gb.fit(X_train, y_train, seed);
  const gbProbs = gb.predictProba(X_test);
  const gbTime = Math.round(performance.now() - t3);
  const gbMetrics = evaluateClassificationMetrics(y_test, gbProbs, 0.5, gbTime, gb.getFeatureImportance());
  const gbRoc = calculateRocCurve(y_test, gbProbs);

  const gbResult: ModelResult = {
    id: "gradient_boosting",
    name: "Gradient Boosting (GBDT)",
    description: "Ensemble aditivo de árboles optimizados por descenso de gradiente.",
    metrics: gbMetrics,
    rocCurve: gbRoc,
  };

  const models = [rfResult, gbResult, lrResult, svmResult];

  // Select champion based on highest ROC-AUC (break tie with F1)
  const sorted = [...models].sort((a, b) => b.metrics.rocAuc - a.metrics.rocAuc || b.metrics.f1Score - a.metrics.f1Score);
  const championModel = sorted[0];

  // Align ROC curve points along a uniform FPR grid [0..1]
  const fprSteps = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const interpolateTpr = (curve: { fpr: number; tpr: number }[], targetFpr: number): number => {
    for (let i = 0; i < curve.length - 1; i++) {
      const p1 = curve[i];
      const p2 = curve[i + 1];
      if (targetFpr >= p1.fpr && targetFpr <= p2.fpr) {
        if (p2.fpr === p1.fpr) return p2.tpr;
        const ratio = (targetFpr - p1.fpr) / (p2.fpr - p1.fpr);
        return parseFloat((p1.tpr + ratio * (p2.tpr - p1.tpr)).toFixed(3));
      }
    }
    return targetFpr >= 1 ? 1 : 0;
  };

  const superimposedRocData: SuperimposedRocPoint[] = fprSteps.map((fpr) => ({
    fpr,
    randomForestTpr: interpolateTpr(rfRoc, fpr),
    logisticRegressionTpr: interpolateTpr(lrRoc, fpr),
    svmTpr: interpolateTpr(svmRoc, fpr),
    gradientBoostingTpr: interpolateTpr(gbRoc, fpr),
    baseline: fpr,
  }));

  return {
    models,
    championModel,
    superimposedRocData,
    trainCount: X_train.length,
    testCount: X_test.length,
  };
}
