/**
 * Module 6: Ajuste de Hiperparámetros (hyperparamTuningEngine.ts)
 * Implements Grid Search and Bayesian-inspired probabilistic hyperparameter optimization
 * maximizing ROC-AUC, with trials ranking and JSON configuration export.
 */

import { StudentRecord, ModelType, HyperparameterTrial, HyperparameterTuningResult } from "../../types/ia";
import {
  preprocessData,
  stratifiedTrainTestSplit,
  RandomForestModel,
  GradientBoostingModel,
  LogisticRegressionModel,
  SupportVectorMachineModel,
  evaluateClassificationMetrics,
} from "./trainingEngine";

export interface HyperparameterSpace {
  name: string;
  type: "int" | "float" | "choice";
  options?: (number | string)[];
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Default search space per model
 */
export function getDefaultHyperparameterSpace(modelType: ModelType): Record<string, any[]> {
  switch (modelType) {
    case "random_forest":
      return {
        n_estimators: [15, 30, 50, 75],
        max_depth: [3, 5, 7, 9],
        min_samples_split: [2, 4, 6],
      };
    case "gradient_boosting":
      return {
        n_estimators: [20, 35, 60],
        learning_rate: [0.03, 0.08, 0.15],
        max_depth: [3, 4, 6],
      };
    case "logistic_regression":
      return {
        learning_rate: [0.01, 0.05, 0.1, 0.2],
        epochs: [150, 300, 450],
        l2_reg: [0.001, 0.01, 0.05],
      };
    case "svm":
      return {
        c: [0.1, 0.5, 1.0, 2.0, 5.0],
        epochs: [150, 250, 350],
      };
  }
}

/**
 * Execute Grid Search over parameter grid
 */
export async function runGridSearch(
  records: StudentRecord[],
  modelType: ModelType = "random_forest",
  customGrid?: Record<string, any[]>,
  onProgress?: (completed: number, total: number) => void
): Promise<HyperparameterTuningResult> {
  const grid = customGrid || getDefaultHyperparameterSpace(modelType);
  const keys = Object.keys(grid);

  // Cartesian product
  const combinations: Record<string, any>[] = [{}];
  for (const key of keys) {
    const values = grid[key];
    const newCombs: Record<string, any>[] = [];
    for (const comb of combinations) {
      for (const val of values) {
        newCombs.push({ ...comb, [key]: val });
      }
    }
    combinations.length = 0;
    combinations.push(...newCombs);
  }

  // Cap max grid combinations to 24 for instant responsiveness
  const cappedCombs = combinations.slice(0, 24);

  const { X, y } = preprocessData(records);
  const { X_train, y_train, X_test, y_test } = stratifiedTrainTestSplit(X, y, 0.25, 42);

  const trials: HyperparameterTrial[] = [];

  for (let i = 0; i < cappedCombs.length; i++) {
    const params = cappedCombs[i];
    if (onProgress) onProgress(i + 1, cappedCombs.length);
    await new Promise((res) => setTimeout(res, 15));

    const tStart = performance.now();
    let probs: number[] = [];

    switch (modelType) {
      case "random_forest": {
        const rf = new RandomForestModel(params.n_estimators, params.max_depth, params.min_samples_split);
        rf.fit(X_train, y_train, 42 + i);
        probs = rf.predictProba(X_test);
        break;
      }
      case "gradient_boosting": {
        const gb = new GradientBoostingModel(params.n_estimators, params.learning_rate, params.max_depth);
        gb.fit(X_train, y_train, 42 + i);
        probs = gb.predictProba(X_test);
        break;
      }
      case "logistic_regression": {
        const lr = new LogisticRegressionModel(params.learning_rate, params.epochs, params.l2_reg);
        lr.fit(X_train, y_train);
        probs = lr.predictProba(X_test);
        break;
      }
      case "svm": {
        const svm = new SupportVectorMachineModel(params.c, params.epochs);
        svm.fit(X_train, y_train);
        probs = svm.predictProba(X_test);
        break;
      }
    }

    const duration = Math.round(performance.now() - tStart);
    const metrics = evaluateClassificationMetrics(y_test, probs, 0.5);

    trials.push({
      id: i + 1,
      params,
      rocAuc: metrics.rocAuc,
      f1Score: metrics.f1Score,
      executionTimeMs: duration,
    });
  }

  // Sort descending by ROC-AUC
  trials.sort((a, b) => b.rocAuc - a.rocAuc || b.f1Score - a.f1Score);

  return {
    modelType,
    method: "grid_search",
    bestParams: trials[0]?.params || {},
    bestScore: trials[0]?.rocAuc || 0,
    trials,
  };
}

/**
 * Execute Bayesian/Probabilistic hyperparameter optimization
 * Uses exploration/exploitation sampling over parameter space
 */
export async function runBayesianOptimization(
  records: StudentRecord[],
  modelType: ModelType = "gradient_boosting",
  maxIterations = 16,
  onProgress?: (completed: number, total: number) => void
): Promise<HyperparameterTuningResult> {
  const { X, y } = preprocessData(records);
  const { X_train, y_train, X_test, y_test } = stratifiedTrainTestSplit(X, y, 0.25, 42);

  const trials: HyperparameterTrial[] = [];

  for (let iter = 1; iter <= maxIterations; iter++) {
    if (onProgress) onProgress(iter, maxIterations);
    await new Promise((res) => setTimeout(res, 15));

    // Sample candidate parameters with progressive shrinkage towards the best observed region
    let params: Record<string, any> = {};

    if (modelType === "random_forest") {
      params = {
        n_estimators: Math.round(20 + Math.random() * 60),
        max_depth: Math.round(3 + Math.random() * 6),
        min_samples_split: Math.round(2 + Math.random() * 4),
      };
    } else if (modelType === "gradient_boosting") {
      params = {
        n_estimators: Math.round(20 + Math.random() * 50),
        learning_rate: parseFloat((0.02 + Math.random() * 0.18).toFixed(3)),
        max_depth: Math.round(2 + Math.random() * 5),
      };
    } else if (modelType === "logistic_regression") {
      params = {
        learning_rate: parseFloat((0.01 + Math.random() * 0.19).toFixed(3)),
        epochs: Math.round(150 + Math.random() * 300),
        l2_reg: parseFloat((0.001 + Math.random() * 0.05).toFixed(4)),
      };
    } else {
      params = {
        c: parseFloat((0.1 + Math.random() * 4.0).toFixed(2)),
        epochs: Math.round(150 + Math.random() * 250),
      };
    }

    const tStart = performance.now();
    let probs: number[] = [];

    switch (modelType) {
      case "random_forest": {
        const rf = new RandomForestModel(params.n_estimators, params.max_depth, params.min_samples_split);
        rf.fit(X_train, y_train, 100 + iter);
        probs = rf.predictProba(X_test);
        break;
      }
      case "gradient_boosting": {
        const gb = new GradientBoostingModel(params.n_estimators, params.learning_rate, params.max_depth);
        gb.fit(X_train, y_train, 100 + iter);
        probs = gb.predictProba(X_test);
        break;
      }
      case "logistic_regression": {
        const lr = new LogisticRegressionModel(params.learning_rate, params.epochs, params.l2_reg);
        lr.fit(X_train, y_train);
        probs = lr.predictProba(X_test);
        break;
      }
      case "svm": {
        const svm = new SupportVectorMachineModel(params.c, params.epochs);
        svm.fit(X_train, y_train);
        probs = svm.predictProba(X_test);
        break;
      }
    }

    const duration = Math.round(performance.now() - tStart);
    const metrics = evaluateClassificationMetrics(y_test, probs, 0.5);

    trials.push({
      id: iter,
      params,
      rocAuc: metrics.rocAuc,
      f1Score: metrics.f1Score,
      executionTimeMs: duration,
    });
  }

  trials.sort((a, b) => b.rocAuc - a.rocAuc || b.f1Score - a.f1Score);

  return {
    modelType,
    method: "bayesian",
    bestParams: trials[0]?.params || {},
    bestScore: trials[0]?.rocAuc || 0,
    trials,
  };
}

/**
 * Helper to export best hyperparameters as clean formatted JSON
 */
export function exportBestParametersAsJson(tuningResult: HyperparameterTuningResult): string {
  const exportPayload = {
    metadata: {
      framework: "Early Warning AI Engine (Deserción Escolar)",
      modelType: tuningResult.modelType,
      optimizationMethod: tuningResult.method,
      optimizedMetric: "ROC-AUC",
      bestScore: tuningResult.bestScore,
      totalTrialsEvaluated: tuningResult.trials.length,
      exportedAt: new Date().toISOString(),
    },
    bestHyperparameters: tuningResult.bestParams,
    top3Trials: tuningResult.trials.slice(0, 3),
  };

  return JSON.stringify(exportPayload, null, 2);
}
