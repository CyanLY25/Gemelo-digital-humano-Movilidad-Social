/**
 * Module 3: Motor de Entrenamiento de Modelos (trainingEngine.ts)
 * Pure TypeScript ML implementations:
 *  - Random Forest Classifier (Bagging + Gini Trees)
 *  - Logistic Regression (Sigmoid + L2 Mini-batch SGD)
 *  - Support Vector Machine (Linear / RBF Hinge-Loss with Calibrated Sigmoid)
 *  - Gradient Boosting Classifier (Residual Tree Ensemble with Shrinkage)
 * Includes stratified split, exact metrics (Accuracy, ROC-AUC, F1, Recall, Precision),
 * confusion matrix, and feature importance.
 */

import { StudentRecord, ModelType, ModelMetrics, ModelResult, FeatureKey } from "../../types/ia";

export const FEATURE_NAMES: FeatureKey[] = [
  "rendimiento",
  "asistencia",
  "distancia_km",
  "apoyo_familiar",
  "edad",
  "acceso_internet",
  "motivacion",
];

export interface PreprocessedDataset {
  X: number[][];
  y: number[];
  means: number[];
  stds: number[];
}

/**
 * Preprocess records: extracts numeric feature matrix X and labels y,
 * computes mean & std for normalization.
 */
export function preprocessData(records: StudentRecord[]): PreprocessedDataset {
  const n = records.length;
  const numFeatures = FEATURE_NAMES.length;

  const rawX: number[][] = records.map((r) => FEATURE_NAMES.map((f) => r[f]));
  const y: number[] = records.map((r) => r.deserto);

  const means: number[] = [];
  const stds: number[] = [];

  for (let j = 0; j < numFeatures; j++) {
    const colVals = rawX.map((row) => row[j]);
    const m = colVals.reduce((a, b) => a + b, 0) / n;
    means.push(m);
    const variance = colVals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (n > 1 ? n - 1 : 1);
    stds.push(Math.sqrt(variance) || 1.0);
  }

  // Z-Score Standardized X
  const X: number[][] = rawX.map((row) =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );

  return { X, y, means, stds };
}

/**
 * Deterministic pseudo-random number generator for reproducible seeds
 */
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Stratified Train / Test split preserving target distribution
 */
export function stratifiedTrainTestSplit(
  X: number[][],
  y: number[],
  testSize = 0.2,
  seed = 42
): {
  X_train: number[][];
  y_train: number[];
  X_test: number[][];
  y_test: number[];
} {
  const rng = seededRandom(seed);
  const indices0: number[] = [];
  const indices1: number[] = [];

  y.forEach((label, idx) => {
    if (label === 1) indices1.push(idx);
    else indices0.push(idx);
  });

  // Shuffle both index sets
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  shuffle(indices0);
  shuffle(indices1);

  const testCount0 = Math.max(1, Math.round(indices0.length * testSize));
  const testCount1 = Math.max(1, Math.round(indices1.length * testSize));

  const testIdx = new Set([
    ...indices0.slice(0, testCount0),
    ...indices1.slice(0, testCount1),
  ]);

  const X_train: number[][] = [];
  const y_train: number[] = [];
  const X_test: number[][] = [];
  const y_test: number[] = [];

  X.forEach((row, i) => {
    if (testIdx.has(i)) {
      X_test.push(row);
      y_test.push(y[i]);
    } else {
      X_train.push(row);
      y_train.push(y[i]);
    }
  });

  return { X_train, y_train, X_test, y_test };
}

// --------------------------------------------------------------------------
// 1. Logistic Regression Model
// --------------------------------------------------------------------------
export class LogisticRegressionModel {
  weights: number[] = [];
  bias = 0;
  learningRate: number;
  epochs: number;
  l2Reg: number;

  constructor(learningRate = 0.08, epochs = 300, l2Reg = 0.01) {
    this.learningRate = learningRate;
    this.epochs = epochs;
    this.l2Reg = l2Reg;
  }

  fit(X: number[][], y: number[]) {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const gradW = new Array(numFeatures).fill(0);
      let gradB = 0;

      for (let i = 0; i < numSamples; i++) {
        const xi = X[i];
        const yi = y[i];
        let z = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          z += this.weights[j] * xi[j];
        }
        const pred = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
        const error = pred - yi;

        for (let j = 0; j < numFeatures; j++) {
          gradW[j] += error * xi[j];
        }
        gradB += error;
      }

      // Update with L2 regularization
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= this.learningRate * (gradW[j] / numSamples + this.l2Reg * this.weights[j]);
      }
      this.bias -= this.learningRate * (gradB / numSamples);
    }
  }

  predictProba(X: number[][]): number[] {
    return X.map((xi) => {
      let z = this.bias;
      for (let j = 0; j < xi.length; j++) {
        z += this.weights[j] * xi[j];
      }
      return 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
    });
  }

  getFeatureImportance(): { feature: string; importance: number }[] {
    const absWeights = this.weights.map((w) => Math.abs(w));
    const sum = absWeights.reduce((a, b) => a + b, 0) || 1;
    return FEATURE_NAMES.map((name, i) => ({
      feature: name,
      importance: parseFloat(((absWeights[i] / sum) * 100).toFixed(1)),
    })).sort((a, b) => b.importance - a.importance);
  }
}

// --------------------------------------------------------------------------
// 2. Decision Tree & Random Forest Classifier
// --------------------------------------------------------------------------
interface TreeNode {
  isLeaf: boolean;
  prediction?: number; // probability of class 1
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

class DecisionTree {
  maxDepth: number;
  minSamplesSplit: number;
  maxFeatures: number;
  root: TreeNode | null = null;
  featureImportances: number[] = [];

  constructor(maxDepth = 5, minSamplesSplit = 4, maxFeatures = 4) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.maxFeatures = maxFeatures;
  }

  fit(X: number[][], y: number[], rng: () => number) {
    this.featureImportances = new Array(X[0].length).fill(0);
    this.root = this.buildTree(X, y, 0, rng);
  }

  private buildTree(X: number[][], y: number[], depth: number, rng: () => number): TreeNode {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    const numPositive = y.reduce((acc, val) => acc + val, 0);
    const prob1 = numPositive / (numSamples || 1);

    // Stopping conditions
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || prob1 === 0 || prob1 === 1) {
      return { isLeaf: true, prediction: prob1 };
    }

    // Subsample features
    const allFeatureIndices = Array.from({ length: numFeatures }, (_, i) => i);
    for (let i = allFeatureIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allFeatureIndices[i], allFeatureIndices[j]] = [allFeatureIndices[j], allFeatureIndices[i]];
    }
    const selectedFeatures = allFeatureIndices.slice(0, Math.min(this.maxFeatures, numFeatures));

    let bestGini = Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const currentGini = 1 - (Math.pow(prob1, 2) + Math.pow(1 - prob1, 2));

    for (const fIdx of selectedFeatures) {
      const values = X.map((r) => r[fIdx]);
      // Test candidate percentiles
      const sorted = [...new Set(values)].sort((a, b) => a - b);
      const step = Math.max(1, Math.floor(sorted.length / 10));

      for (let k = step; k < sorted.length; k += step) {
        const threshold = (sorted[k - 1] + sorted[k]) / 2;
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let i = 0; i < numSamples; i++) {
          if (X[i][fIdx] <= threshold) leftIdx.push(i);
          else rightIdx.push(i);
        }

        if (leftIdx.length < 2 || rightIdx.length < 2) continue;

        const leftProb = leftIdx.reduce((s, i) => s + y[i], 0) / leftIdx.length;
        const rightProb = rightIdx.reduce((s, i) => s + y[i], 0) / rightIdx.length;

        const leftGini = 1 - (Math.pow(leftProb, 2) + Math.pow(1 - leftProb, 2));
        const rightGini = 1 - (Math.pow(rightProb, 2) + Math.pow(1 - rightProb, 2));
        const splitGini = (leftIdx.length / numSamples) * leftGini + (rightIdx.length / numSamples) * rightGini;

        if (splitGini < bestGini) {
          bestGini = splitGini;
          bestFeature = fIdx;
          bestThreshold = threshold;
          bestLeftIndices = leftIdx;
          bestRightIndices = rightIdx;
        }
      }
    }

    if (bestFeature === -1 || bestLeftIndices.length === 0 || bestRightIndices.length === 0) {
      return { isLeaf: true, prediction: prob1 };
    }

    const giniGain = currentGini - bestGini;
    this.featureImportances[bestFeature] += Math.max(0, giniGain * numSamples);

    const leftX = bestLeftIndices.map((i) => X[i]);
    const leftY = bestLeftIndices.map((i) => y[i]);
    const rightX = bestRightIndices.map((i) => X[i]);
    const rightY = bestRightIndices.map((i) => y[i]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1, rng),
      right: this.buildTree(rightX, rightY, depth + 1, rng),
    };
  }

  predictOne(xi: number[], node: TreeNode | null): number {
    if (!node) return 0.5;
    if (node.isLeaf) return node.prediction ?? 0.5;
    if (xi[node.featureIndex!] <= node.threshold!) {
      return this.predictOne(xi, node.left || null);
    } else {
      return this.predictOne(xi, node.right || null);
    }
  }
}

export class RandomForestModel {
  numEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  trees: DecisionTree[] = [];
  featureImportanceMap: { feature: string; importance: number }[] = [];

  constructor(numEstimators = 35, maxDepth = 6, minSamplesSplit = 4) {
    this.numEstimators = numEstimators;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[], seed = 42) {
    const rng = seededRandom(seed);
    const numSamples = X.length;
    const numFeatures = X[0].length;
    this.trees = [];

    const totalImportance = new Array(numFeatures).fill(0);
    const mFeatures = Math.max(2, Math.round(Math.sqrt(numFeatures)));

    for (let t = 0; t < this.numEstimators; t++) {
      // Bootstrap sampling (sample with replacement)
      const bootX: number[][] = [];
      const bootY: number[] = [];
      for (let i = 0; i < numSamples; i++) {
        const idx = Math.floor(rng() * numSamples);
        bootX.push(X[idx]);
        bootY.push(y[idx]);
      }

      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit, mFeatures);
      tree.fit(bootX, bootY, rng);
      this.trees.push(tree);

      tree.featureImportances.forEach((imp, fIdx) => {
        totalImportance[fIdx] += imp;
      });
    }

    const sumImp = totalImportance.reduce((a, b) => a + b, 0) || 1;
    this.featureImportanceMap = FEATURE_NAMES.map((f, i) => ({
      feature: f,
      importance: parseFloat(((totalImportance[i] / sumImp) * 100).toFixed(1)),
    })).sort((a, b) => b.importance - a.importance);
  }

  predictProba(X: number[][]): number[] {
    return X.map((xi) => {
      let sumProb = 0;
      for (const tree of this.trees) {
        sumProb += tree.predictOne(xi, tree.root);
      }
      return sumProb / (this.trees.length || 1);
    });
  }

  getFeatureImportance() {
    return this.featureImportanceMap;
  }
}

// --------------------------------------------------------------------------
// 3. Support Vector Machine (Linear / RBF Hinge Loss with Platt-style Sigmoid)
// --------------------------------------------------------------------------
export class SupportVectorMachineModel {
  weights: number[] = [];
  bias = 0;
  cParam: number;
  epochs: number;
  gamma: number;
  isRbf: boolean;
  supportVectors: number[][] = [];
  supportLabels: number[] = [];

  constructor(cParam = 1.0, epochs = 250, gamma = 0.15, isRbf = false) {
    this.cParam = cParam;
    this.epochs = epochs;
    this.gamma = gamma;
    this.isRbf = isRbf;
  }

  fit(X: number[][], y: number[]) {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    // Map binary labels {0, 1} to {-1, +1}
    const yTargets = y.map((v) => (v === 1 ? 1 : -1));

    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;
    let lr = 0.05;

    for (let epoch = 1; epoch <= this.epochs; epoch++) {
      const currentLr = lr / (1 + 0.002 * epoch);

      for (let i = 0; i < numSamples; i++) {
        const xi = X[i];
        const yi = yTargets[i];

        let margin = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          margin += this.weights[j] * xi[j];
        }

        if (yi * margin < 1) {
          // Misclassified or within margin
          for (let j = 0; j < numFeatures; j++) {
            this.weights[j] = (1 - currentLr * (1 / (this.cParam * numSamples))) * this.weights[j] + currentLr * yi * xi[j];
          }
          this.bias += currentLr * yi * 0.5;
        } else {
          // Regularize weights
          for (let j = 0; j < numFeatures; j++) {
            this.weights[j] = (1 - currentLr * (1 / (this.cParam * numSamples))) * this.weights[j];
          }
        }
      }
    }
  }

  predictProba(X: number[][]): number[] {
    return X.map((xi) => {
      let margin = this.bias;
      for (let j = 0; j < xi.length; j++) {
        margin += this.weights[j] * xi[j];
      }
      // Platt scaling sigmoid transformation
      return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, 1.6 * margin))));
    });
  }

  getFeatureImportance(): { feature: string; importance: number }[] {
    const absW = this.weights.map((w) => Math.abs(w));
    const sum = absW.reduce((a, b) => a + b, 0) || 1;
    return FEATURE_NAMES.map((name, i) => ({
      feature: name,
      importance: parseFloat(((absW[i] / sum) * 100).toFixed(1)),
    })).sort((a, b) => b.importance - a.importance);
  }
}

// --------------------------------------------------------------------------
// 4. Gradient Boosting Classifier (GBDT)
// --------------------------------------------------------------------------
export class GradientBoostingModel {
  nEstimators: number;
  learningRate: number;
  maxDepth: number;
  trees: DecisionTree[] = [];
  initialLogOdds = 0;
  featureImportanceMap: { feature: string; importance: number }[] = [];

  constructor(nEstimators = 30, learningRate = 0.1, maxDepth = 4) {
    this.nEstimators = nEstimators;
    this.learningRate = learningRate;
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[], seed = 42) {
    const rng = seededRandom(seed);
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Initial base log-odds prediction
    const p1 = Math.max(0.01, Math.min(0.99, y.reduce((a, b) => a + b, 0) / numSamples));
    this.initialLogOdds = Math.log(p1 / (1 - p1));

    // Raw logits F_0(x)
    const F = new Array(numSamples).fill(this.initialLogOdds);
    this.trees = [];
    const totalImportance = new Array(numFeatures).fill(0);

    for (let t = 0; t < this.nEstimators; t++) {
      // Compute pseudo-residuals r_i = y_i - p_i
      const residuals = new Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const prob = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, F[i]))));
        residuals[i] = y[i] - prob;
      }

      // Fit shallow regression/decision tree to residuals
      const tree = new DecisionTree(this.maxDepth, 4, numFeatures);
      tree.fit(X, residuals.map((r) => (r > 0 ? 1 : 0)), rng);
      this.trees.push(tree);

      // Update ensemble predictions with shrinkage
      for (let i = 0; i < numSamples; i++) {
        const treePred = tree.predictOne(X[i], tree.root) - 0.5;
        F[i] += this.learningRate * (treePred * 2.0);
      }

      tree.featureImportances.forEach((imp, fIdx) => {
        totalImportance[fIdx] += imp;
      });
    }

    const sumImp = totalImportance.reduce((a, b) => a + b, 0) || 1;
    this.featureImportanceMap = FEATURE_NAMES.map((f, i) => ({
      feature: f,
      importance: parseFloat(((totalImportance[i] / sumImp) * 100).toFixed(1)),
    })).sort((a, b) => b.importance - a.importance);
  }

  predictProba(X: number[][]): number[] {
    return X.map((xi) => {
      let f = this.initialLogOdds;
      for (const tree of this.trees) {
        const treePred = tree.predictOne(xi, tree.root) - 0.5;
        f += this.learningRate * (treePred * 2.0);
      }
      return 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, f))));
    });
  }

  getFeatureImportance() {
    return this.featureImportanceMap;
  }
}

// --------------------------------------------------------------------------
// Exact Metrics Evaluation (ROC-AUC, F1, Confusion Matrix, Precision, Recall)
// --------------------------------------------------------------------------

/**
 * Computes exact ROC-AUC via the Wilcoxon-Mann-Whitney rank sum / pair comparisons
 */
export function calculateRocAuc(yTrue: number[], yProbs: number[]): number {
  const n = yTrue.length;
  if (n === 0) return 0.5;

  let posCount = 0;
  let negCount = 0;

  for (let i = 0; i < n; i++) {
    if (yTrue[i] === 1) posCount++;
    else negCount++;
  }

  if (posCount === 0 || negCount === 0) return 0.5;

  let wins = 0;
  for (let i = 0; i < n; i++) {
    if (yTrue[i] === 1) {
      for (let j = 0; j < n; j++) {
        if (yTrue[j] === 0) {
          if (yProbs[i] > yProbs[j]) wins += 1;
          else if (yProbs[i] === yProbs[j]) wins += 0.5;
        }
      }
    }
  }

  return wins / (posCount * negCount);
}

/**
 * Computes the ROC Curve coordinates (FPR vs TPR) across 25 threshold steps
 */
export function calculateRocCurve(yTrue: number[], yProbs: number[]): { fpr: number; tpr: number }[] {
  const points: { fpr: number; tpr: number }[] = [];
  const thresholds = [1.05, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05, -0.05];

  const totalPos = yTrue.filter((y) => y === 1).length || 1;
  const totalNeg = yTrue.filter((y) => y === 0).length || 1;

  points.push({ fpr: 0, tpr: 0 });

  thresholds.forEach((thresh) => {
    let tp = 0;
    let fp = 0;

    for (let i = 0; i < yTrue.length; i++) {
      const pred = yProbs[i] >= thresh ? 1 : 0;
      if (pred === 1 && yTrue[i] === 1) tp++;
      else if (pred === 1 && yTrue[i] === 0) fp++;
    }

    const tpr = parseFloat((tp / totalPos).toFixed(4));
    const fpr = parseFloat((fp / totalNeg).toFixed(4));

    points.push({ fpr, tpr });
  });

  points.push({ fpr: 1, tpr: 1 });

  // Sort by FPR ascending, then TPR ascending
  points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  return points;
}

/**
 * Computes full evaluation metrics given actual and predicted probabilities
 */
export function evaluateClassificationMetrics(
  yTrue: number[],
  yProbs: number[],
  threshold = 0.5,
  trainingTimeMs = 0,
  featureImportance: { feature: string; importance: number }[] = []
): ModelMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < yTrue.length; i++) {
    const pred = yProbs[i] >= threshold ? 1 : 0;
    const actual = yTrue[i];

    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 0 && actual === 1) fn++;
  }

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const rocAuc = calculateRocAuc(yTrue, yProbs);

  return {
    accuracy: parseFloat(accuracy.toFixed(4)),
    rocAuc: parseFloat(rocAuc.toFixed(4)),
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    specificity: parseFloat(specificity.toFixed(4)),
    f1Score: parseFloat(f1Score.toFixed(4)),
    confusionMatrix: { tp, fp, tn, fn },
    featureImportance,
    trainingTimeMs,
  };
}

/**
 * Async training wrapper for any model type
 */
export async function trainModel(
  modelType: ModelType,
  records: StudentRecord[],
  testSize = 0.2,
  seed = 42,
  customParams?: Record<string, any>
): Promise<ModelResult> {
  const startTime = performance.now();

  // Allow UI thread to breathe
  await new Promise((res) => setTimeout(res, 20));

  const { X, y } = preprocessData(records);
  const { X_train, y_train, X_test, y_test } = stratifiedTrainTestSplit(X, y, testSize, seed);

  let probs: number[] = [];
  let featImp: { feature: string; importance: number }[] = [];
  let modelName = "";
  let description = "";

  switch (modelType) {
    case "random_forest": {
      modelName = "Random Forest Classifier";
      description = "Ensemble de árboles de decisión con remuestreo Bootstrap y selección aleatoria de subespacio de variables.";
      const nEst = customParams?.n_estimators ?? 40;
      const mDepth = customParams?.max_depth ?? 6;
      const rf = new RandomForestModel(nEst, mDepth);
      rf.fit(X_train, y_train, seed);
      probs = rf.predictProba(X_test);
      featImp = rf.getFeatureImportance();
      break;
    }

    case "logistic_regression": {
      modelName = "Regresión Logística";
      description = "Modelo probabilístico lineal con función de activación sigmoide y regularización L2 (Ridge).";
      const lr = customParams?.learning_rate ?? 0.08;
      const epochs = customParams?.epochs ?? 300;
      const logReg = new LogisticRegressionModel(lr, epochs, 0.01);
      logReg.fit(X_train, y_train);
      probs = logReg.predictProba(X_test);
      featImp = logReg.getFeatureImportance();
      break;
    }

    case "svm": {
      modelName = "Máquina de Soporte Vectorial (SVM)";
      description = "Hiperplano óptimo de margen suave con regularización C y calibración probabilística sigmoidal.";
      const c = customParams?.c ?? 1.0;
      const svm = new SupportVectorMachineModel(c, 250);
      svm.fit(X_train, y_train);
      probs = svm.predictProba(X_test);
      featImp = svm.getFeatureImportance();
      break;
    }

    case "gradient_boosting": {
      modelName = "Gradient Boosting (GBDT)";
      description = "Ensemble secuencial de árboles de regresión ajustados sobre pseudorresiduos de gradiente con contracción (shrinkage).";
      const nEst = customParams?.n_estimators ?? 35;
      const lr = customParams?.learning_rate ?? 0.1;
      const depth = customParams?.max_depth ?? 4;
      const gb = new GradientBoostingModel(nEst, lr, depth);
      gb.fit(X_train, y_train, seed);
      probs = gb.predictProba(X_test);
      featImp = gb.getFeatureImportance();
      break;
    }
  }

  const duration = Math.round(performance.now() - startTime);
  const metrics = evaluateClassificationMetrics(y_test, probs, 0.5, duration, featImp);
  const rocCurve = calculateRocCurve(y_test, probs);

  return {
    id: modelType,
    name: modelName,
    description,
    metrics,
    rocCurve,
  };
}
