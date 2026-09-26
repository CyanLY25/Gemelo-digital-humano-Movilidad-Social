/**
 * Module 2: Análisis Exploratorio de Datos - EDA (edaService.ts)
 * Computes descriptive statistics, Pearson correlation matrix, and Recharts-formatted data for distributions.
 */

import { StudentRecord, EDAMetric, FeatureKey, SegmentedDistributionPoint } from "../../types/ia";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  rendimiento: "Rendimiento Académico (0-100)",
  asistencia: "Asistencia Escolar (%)",
  distancia_km: "Distancia al Colegio (km)",
  apoyo_familiar: "Apoyo Familiar (0/1)",
  edad: "Edad del Estudiante (Años)",
  acceso_internet: "Acceso a Internet (0/1)",
  motivacion: "Motivación Intrínseca (0-100)",
};

const NUMERIC_FEATURES: FeatureKey[] = [
  "rendimiento",
  "asistencia",
  "distancia_km",
  "edad",
  "motivacion",
];

/**
 * Compute descriptive statistics for each feature
 */
export function computeDescriptiveStatistics(records: StudentRecord[]): EDAMetric[] {
  if (!records || records.length === 0) return [];

  const keys: FeatureKey[] = [
    "rendimiento",
    "asistencia",
    "distancia_km",
    "apoyo_familiar",
    "edad",
    "acceso_internet",
    "motivacion",
  ];

  return keys.map((key) => {
    const values = records.map((r) => r[key]).filter((v) => typeof v === "number" && !isNaN(v));
    values.sort((a, b) => a - b);

    const n = values.length;
    if (n === 0) {
      return {
        feature: key,
        label: FEATURE_LABELS[key],
        mean: 0,
        std: 0,
        min: 0,
        q25: 0,
        median: 0,
        q75: 0,
        max: 0,
        missing: records.length,
      };
    }

    const mean = values.reduce((acc, v) => acc + v, 0) / n;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const std = Math.sqrt(variance);

    const min = values[0];
    const max = values[n - 1];

    const getPercentile = (p: number) => {
      const idx = p * (n - 1);
      const low = Math.floor(idx);
      const high = Math.ceil(idx);
      if (low === high) return values[low];
      return values[low] + (values[high] - values[low]) * (idx - low);
    };

    return {
      feature: key,
      label: FEATURE_LABELS[key],
      mean: parseFloat(mean.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      q25: parseFloat(getPercentile(0.25).toFixed(2)),
      median: parseFloat(getPercentile(0.5).toFixed(2)),
      q75: parseFloat(getPercentile(0.75).toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      missing: records.length - n,
    };
  });
}

/**
 * Target class distribution for Pie/Bar charts
 */
export function computeClassDistribution(records: StudentRecord[]) {
  const total = records.length;
  if (total === 0) return [];

  let dropouts = 0;
  records.forEach((r) => {
    if (r.deserto === 1) dropouts++;
  });
  const noDropouts = total - dropouts;

  return [
    {
      name: "No Desertó (0)",
      label: "Permanece en el Sistema",
      count: noDropouts,
      percentage: parseFloat(((noDropouts / total) * 100).toFixed(1)),
      color: "#10B981", // Emerald
    },
    {
      name: "Desertó (1)",
      label: "Abandono Escolar",
      count: dropouts,
      percentage: parseFloat(((dropouts / total) * 100).toFixed(1)),
      color: "#EF4444", // Rose/Red
    },
  ];
}

/**
 * Pearson Correlation Matrix between numerical features & target 'deserto'
 */
export function computePearsonCorrelationMatrix(records: StudentRecord[]) {
  const allVars: (FeatureKey | "deserto")[] = [
    "rendimiento",
    "asistencia",
    "distancia_km",
    "apoyo_familiar",
    "edad",
    "acceso_internet",
    "motivacion",
    "deserto",
  ];

  const n = records.length;
  if (n < 2) {
    return { vars: allVars, matrix: [] };
  }

  // Precompute means and variances
  const means: Record<string, number> = {};
  const stds: Record<string, number> = {};

  allVars.forEach((v) => {
    const vals = records.map((r) => r[v]);
    const m = vals.reduce((a, b) => a + b, 0) / n;
    means[v] = m;
    const vSum = vals.reduce((a, b) => a + Math.pow(b - m, 2), 0);
    stds[v] = Math.sqrt(vSum);
  });

  const matrix: { varA: string; varB: string; corr: number; displayCorr: string }[] = [];
  const tableMatrix: Record<string, Record<string, number>> = {};

  allVars.forEach((vA) => {
    tableMatrix[vA] = {};
    allVars.forEach((vB) => {
      if (vA === vB) {
        matrix.push({ varA: vA, varB: vB, corr: 1.0, displayCorr: "1.00" });
        tableMatrix[vA][vB] = 1.0;
        return;
      }

      let cov = 0;
      for (let i = 0; i < n; i++) {
        cov += (records[i][vA] - means[vA]) * (records[i][vB] - means[vB]);
      }

      const denom = stds[vA] * stds[vB];
      const r = denom === 0 ? 0 : cov / denom;
      const cleanR = parseFloat(r.toFixed(3));

      matrix.push({ varA: vA, varB: vB, corr: cleanR, displayCorr: cleanR.toFixed(2) });
      tableMatrix[vA][vB] = cleanR;
    });
  });

  return {
    vars: allVars,
    flatPairs: matrix,
    grid: tableMatrix,
  };
}

/**
 * Segmented Histogram bins comparing deserto = 0 vs deserto = 1
 */
export function computeSegmentedHistogram(
  records: StudentRecord[],
  feature: FeatureKey,
  numBins = 8
): SegmentedDistributionPoint[] {
  if (!records || records.length === 0) return [];

  const vals = records.map((r) => r[feature]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  if (min === max) {
    return [
      {
        binLabel: `${min}`,
        noDropout: records.filter((r) => r.deserto === 0).length,
        dropout: records.filter((r) => r.deserto === 1).length,
      },
    ];
  }

  const binWidth = (max - min) / numBins;
  const bins: { label: string; min: number; max: number; no: number; yes: number }[] = [];

  for (let i = 0; i < numBins; i++) {
    const bMin = min + i * binWidth;
    const bMax = i === numBins - 1 ? max : bMin + binWidth;
    bins.push({
      label: `${bMin.toFixed(0)}-${bMax.toFixed(0)}`,
      min: bMin,
      max: bMax,
      no: 0,
      yes: 0,
    });
  }

  records.forEach((r) => {
    const val = r[feature];
    const isDropout = r.deserto === 1;

    for (let i = 0; i < bins.length; i++) {
      const b = bins[i];
      if (val >= b.min && (i === bins.length - 1 ? val <= b.max : val < b.max)) {
        if (isDropout) b.yes++;
        else b.no++;
        break;
      }
    }
  });

  return bins.map((b) => ({
    binLabel: b.label,
    noDropout: b.no,
    dropout: b.yes,
  }));
}

/**
 * Boxplot statistics segmented by target class
 */
export function computeSegmentedBoxplot(records: StudentRecord[], feature: FeatureKey) {
  const calcBox = (subset: StudentRecord[]) => {
    const vals = subset.map((r) => r[feature]).sort((a, b) => a - b);
    const n = vals.length;
    if (n === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0 };

    const getP = (p: number) => {
      const idx = p * (n - 1);
      const l = Math.floor(idx);
      const h = Math.ceil(idx);
      return vals[l] + (vals[h] - vals[l]) * (idx - l);
    };

    const q1 = getP(0.25);
    const median = getP(0.5);
    const q3 = getP(0.75);
    const iqr = q3 - q1;
    const minWhisker = Math.max(vals[0], q1 - 1.5 * iqr);
    const maxWhisker = Math.min(vals[n - 1], q3 + 1.5 * iqr);
    const mean = vals.reduce((a, b) => a + b, 0) / n;

    return {
      min: parseFloat(minWhisker.toFixed(1)),
      q1: parseFloat(q1.toFixed(1)),
      median: parseFloat(median.toFixed(1)),
      q3: parseFloat(q3.toFixed(1)),
      max: parseFloat(maxWhisker.toFixed(1)),
      mean: parseFloat(mean.toFixed(1)),
    };
  };

  const noDropoutSubset = records.filter((r) => r.deserto === 0);
  const dropoutSubset = records.filter((r) => r.deserto === 1);

  return [
    {
      group: "No Desertó (0)",
      stats: calcBox(noDropoutSubset),
      count: noDropoutSubset.length,
      fill: "#10B981",
    },
    {
      group: "Desertó (1)",
      stats: calcBox(dropoutSubset),
      count: dropoutSubset.length,
      fill: "#EF4444",
    },
  ];
}
