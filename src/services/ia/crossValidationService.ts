/**
 * Module 5: Validación Cruzada Estratificada (crossValidationService.ts)
 * Stratified K-Fold Cross-Validation algorithm for assessing out-of-sample stability,
 * variance, and computing mean ± standard deviation across folds.
 */

import { StudentRecord, ModelType, CrossValidationResult, KFoldFoldResult } from "../../types/ia";
import {
  preprocessData,
  seededRandom,
  RandomForestModel,
  LogisticRegressionModel,
  SupportVectorMachineModel,
  GradientBoostingModel,
  evaluateClassificationMetrics,
} from "./trainingEngine";

/**
 * Stratified K-Fold generator preserving class proportions in each fold
 */
export function generateStratifiedKFolds(
  y: number[],
  k = 5,
  seed = 42
): { trainIndices: number[]; testIndices: number[] }[] {
  const rng = seededRandom(seed);
  const idx0: number[] = [];
  const idx1: number[] = [];

  y.forEach((label, idx) => {
    if (label === 1) idx1.push(idx);
    else idx0.push(idx);
  });

  // Fisher-Yates shuffle
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  shuffle(idx0);
  shuffle(idx1);

  // Divide into k buckets
  const folds0: number[][] = Array.from({ length: k }, () => []);
  const folds1: number[][] = Array.from({ length: k }, () => []);

  idx0.forEach((idx, i) => folds0[i % k].push(idx));
  idx1.forEach((idx, i) => folds1[i % k].push(idx));

  const folds: { trainIndices: number[]; testIndices: number[] }[] = [];

  for (let fold = 0; fold < k; fold++) {
    const testIndices = [...folds0[fold], ...folds1[fold]];
    const testSet = new Set(testIndices);
    const trainIndices: number[] = [];

    for (let i = 0; i < y.length; i++) {
      if (!testSet.has(i)) {
        trainIndices.push(i);
      }
    }

    folds.push({ trainIndices, testIndices });
  }

  return folds;
}

/**
 * Run Stratified K-Fold Cross Validation for a chosen model type
 */
export async function runStratifiedCrossValidation(
  records: StudentRecord[],
  modelType: ModelType = "random_forest",
  k = 5,
  seed = 42,
  onProgress?: (currentFold: number, totalFolds: number) => void
): Promise<CrossValidationResult> {
  const { X, y } = preprocessData(records);
  const folds = generateStratifiedKFolds(y, k, seed);
  const foldResults: KFoldFoldResult[] = [];

  for (let foldIdx = 0; foldIdx < k; foldIdx++) {
    if (onProgress) onProgress(foldIdx + 1, k);
    await new Promise((res) => setTimeout(res, 20)); // Keep UI responsive

    const { trainIndices, testIndices } = folds[foldIdx];
    const X_train = trainIndices.map((i) => X[i]);
    const y_train = trainIndices.map((i) => y[i]);
    const X_test = testIndices.map((i) => X[i]);
    const y_test = testIndices.map((i) => y[i]);

    let probs: number[] = [];

    switch (modelType) {
      case "random_forest": {
        const rf = new RandomForestModel(30, 5);
        rf.fit(X_train, y_train, seed + foldIdx);
        probs = rf.predictProba(X_test);
        break;
      }
      case "logistic_regression": {
        const lr = new LogisticRegressionModel(0.08, 250, 0.01);
        lr.fit(X_train, y_train);
        probs = lr.predictProba(X_test);
        break;
      }
      case "svm": {
        const svm = new SupportVectorMachineModel(1.0, 200);
        svm.fit(X_train, y_train);
        probs = svm.predictProba(X_test);
        break;
      }
      case "gradient_boosting": {
        const gb = new GradientBoostingModel(25, 0.1, 4);
        gb.fit(X_train, y_train, seed + foldIdx);
        probs = gb.predictProba(X_test);
        break;
      }
    }

    const metrics = evaluateClassificationMetrics(y_test, probs, 0.5);

    foldResults.push({
      fold: foldIdx + 1,
      accuracy: metrics.accuracy,
      rocAuc: metrics.rocAuc,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
    });
  }

  // Calculate Mean and Standard Deviation across folds
  const calcMeanStd = (vals: number[]) => {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length > 1 ? vals.length - 1 : 1);
    return {
      mean: parseFloat(mean.toFixed(4)),
      std: parseFloat(Math.sqrt(variance).toFixed(4)),
    };
  };

  const aucStats = calcMeanStd(foldResults.map((f) => f.rocAuc));
  const f1Stats = calcMeanStd(foldResults.map((f) => f.f1Score));
  const accStats = calcMeanStd(foldResults.map((f) => f.accuracy));

  return {
    k,
    folds: foldResults,
    meanRocAuc: aucStats.mean,
    stdRocAuc: aucStats.std,
    meanF1: f1Stats.mean,
    stdF1: f1Stats.std,
    meanAccuracy: accStats.mean,
    stdAccuracy: accStats.std,
  };
}
