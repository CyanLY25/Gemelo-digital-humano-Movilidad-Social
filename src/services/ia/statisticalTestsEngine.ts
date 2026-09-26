/**
 * Module 7: Pruebas Estadísticas Robustas (statisticalTestsEngine.ts)
 * Resampling Bootstrap (N = 500 - 2000), 95% Empirical Confidence Intervals,
 * One-Sample Student's t-test against H0: ROC-AUC = 0.5, and Recharts histogram format.
 */

import { StudentRecord, ModelType, BootstrapResult } from "../../types/ia";
import {
  preprocessData,
  stratifiedTrainTestSplit,
  RandomForestModel,
  GradientBoostingModel,
  LogisticRegressionModel,
  SupportVectorMachineModel,
  calculateRocAuc,
} from "./trainingEngine";

/**
 * Standard Normal / Student's t cumulative distribution function approximation
 */
function studentT_CDF(t: number, df: number): number {
  // For df >= 30, t-distribution converges closely to normal distribution
  // Standard polynomial approximation of standard normal error function
  const z = t / Math.sqrt(df / (df - 2 > 0 ? df - 2 : 1));
  const tAbs = Math.abs(z);
  const p = 0.2316419;
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const k = 1 / (1 + p * tAbs);
  const poly = k * (b1 + k * (b2 + k * (b3 + k * (b4 + k * b5))));
  const normPdf = Math.exp(-0.5 * tAbs * tAbs) / Math.sqrt(2 * Math.PI);
  const tail = normPdf * poly;

  return z >= 0 ? 1 - tail : tail;
}

/**
 * Run Bootstrap Resampling on test set predictions
 */
export async function runBootstrapStatisticalEvaluation(
  records: StudentRecord[],
  modelType: ModelType = "random_forest",
  iterations = 1000,
  onProgress?: (current: number, total: number) => void
): Promise<BootstrapResult> {
  const { X, y } = preprocessData(records);
  const { X_train, y_train, X_test, y_test } = stratifiedTrainTestSplit(X, y, 0.25, 42);

  // Train the base model once
  let testProbs: number[] = [];
  switch (modelType) {
    case "random_forest": {
      const rf = new RandomForestModel(35, 6);
      rf.fit(X_train, y_train, 42);
      testProbs = rf.predictProba(X_test);
      break;
    }
    case "gradient_boosting": {
      const gb = new GradientBoostingModel(30, 0.1, 4);
      gb.fit(X_train, y_train, 42);
      testProbs = gb.predictProba(X_test);
      break;
    }
    case "logistic_regression": {
      const lr = new LogisticRegressionModel(0.08, 300, 0.01);
      lr.fit(X_train, y_train);
      testProbs = lr.predictProba(X_test);
      break;
    }
    case "svm": {
      const svm = new SupportVectorMachineModel(1.0, 250);
      svm.fit(X_train, y_train);
      testProbs = svm.predictProba(X_test);
      break;
    }
  }

  const nTest = y_test.length;
  const bootstrapAucs: number[] = [];

  // Chunking to keep browser responsive
  const chunkSize = 100;
  for (let chunkStart = 0; chunkStart < iterations; chunkStart += chunkSize) {
    const chunkEnd = Math.min(iterations, chunkStart + chunkSize);

    for (let b = chunkStart; b < chunkEnd; b++) {
      // Sample indices with replacement
      const sampleY: number[] = [];
      const sampleProbs: number[] = [];

      for (let i = 0; i < nTest; i++) {
        const randIdx = Math.floor(Math.random() * nTest);
        sampleY.push(y_test[randIdx]);
        sampleProbs.push(testProbs[randIdx]);
      }

      // Check if both classes exist in the bootstrap sample
      const pos = sampleY.filter((v) => v === 1).length;
      if (pos > 0 && pos < nTest) {
        const auc = calculateRocAuc(sampleY, sampleProbs);
        bootstrapAucs.push(auc);
      } else {
        // Retry
        b--;
      }
    }

    if (onProgress) onProgress(chunkEnd, iterations);
    await new Promise((res) => setTimeout(res, 10));
  }

  bootstrapAucs.sort((a, b) => a - b);

  // Mean & Standard Error
  const totalSamples = bootstrapAucs.length;
  const meanAuc = bootstrapAucs.reduce((a, b) => a + b, 0) / totalSamples;
  const variance =
    bootstrapAucs.reduce((a, b) => a + Math.pow(b - meanAuc, 2), 0) / (totalSamples - 1);
  const stdDev = Math.sqrt(variance);
  const stdError = stdDev; // In bootstrap, SD of bootstrap distribution is SE of estimate

  // 95% Confidence Interval (2.5% and 97.5% empirical percentiles)
  const idxLower = Math.floor(0.025 * totalSamples);
  const idxUpper = Math.min(totalSamples - 1, Math.ceil(0.975 * totalSamples));
  const ciLower = bootstrapAucs[idxLower];
  const ciUpper = bootstrapAucs[idxUpper];

  // One-sample Student's t-test: H0: mu = 0.5 (random guess)
  const nullHypothesis = 0.5;
  const effectiveN = nTest; // Degrees of freedom based on original sample size
  const seTest = stdDev / Math.sqrt(totalSamples); // Standard error of the mean
  const tStatistic = (meanAuc - nullHypothesis) / (stdDev || 0.001);
  const df = effectiveN - 1;
  const cdfVal = studentT_CDF(tStatistic, df);
  const pValue = Math.max(1e-12, 1 - cdfVal);
  const isSignificant = pValue < 0.05 && meanAuc > 0.5;

  // Generate Recharts Histogram (20 bins)
  const numBins = 20;
  const minAuc = Math.max(0.4, Math.min(...bootstrapAucs) - 0.02);
  const maxAuc = Math.min(1.0, Math.max(...bootstrapAucs) + 0.02);
  const binWidth = (maxAuc - minAuc) / numBins;

  const bins: { binCenter: number; binLabel: string; frequency: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    const bMin = minAuc + i * binWidth;
    const bMax = bMin + binWidth;
    const center = (bMin + bMax) / 2;
    bins.push({
      binCenter: parseFloat(center.toFixed(4)),
      binLabel: `${(center * 100).toFixed(1)}%`,
      frequency: 0,
    });
  }

  bootstrapAucs.forEach((auc) => {
    let placed = false;
    for (let i = 0; i < numBins; i++) {
      const bMin = minAuc + i * binWidth;
      const bMax = bMin + binWidth;
      if (auc >= bMin && (i === numBins - 1 ? auc <= bMax : auc < bMax)) {
        bins[i].frequency++;
        placed = true;
        break;
      }
    }
    if (!placed && bins[numBins - 1]) {
      bins[numBins - 1].frequency++;
    }
  });

  return {
    iterations: totalSamples,
    meanAuc: parseFloat(meanAuc.toFixed(4)),
    stdError: parseFloat(stdError.toFixed(4)),
    ci95: {
      lower: parseFloat(ciLower.toFixed(4)),
      upper: parseFloat(ciUpper.toFixed(4)),
    },
    tStatistic: parseFloat(tStatistic.toFixed(3)),
    pValue: pValue < 0.0001 ? 0.0001 : parseFloat(pValue.toFixed(6)),
    isSignificant,
    distributionHistogram: bins,
  };
}
