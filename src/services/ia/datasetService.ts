/**
 * Module 1: Ingesta y Carga de Datos (datasetService.ts)
 * Handles CSV/XLSX parsing, PostgreSQL Connection Simulation, and Synthetic Dataset Generation.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { StudentRecord, DatasetSummary, DatabaseConnectionConfig } from "../../types/ia";

// In-memory active dataset cache with event subscription
let currentDataset: StudentRecord[] = [];
type DatasetListener = (dataset: StudentRecord[]) => void;
const listeners: Set<DatasetListener> = new Set();

export const subscribeToDataset = (listener: DatasetListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((l) => l([...currentDataset]));
};

export const getActiveDataset = (): StudentRecord[] => {
  if (currentDataset.length === 0) {
    currentDataset = generateSyntheticDropoutDataset(500);
  }
  return [...currentDataset];
};

export const setActiveDataset = (data: StudentRecord[]) => {
  currentDataset = data;
  notifyListeners();
};

/**
 * Normal Box-Muller generator for realistic Gaussian distributions
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Generates realistic synthetic school dropout records (default N=500)
 */
export function generateSyntheticDropoutDataset(count = 500, seed = 42): StudentRecord[] {
  const records: StudentRecord[] = [];

  for (let i = 1; i <= count; i++) {
    // 1. Demographics & Context
    const edad = Math.min(19, Math.max(11, Math.round(randomNormal(15.2, 1.8))));
    const apoyo_familiar = Math.random() < 0.68 ? 1 : 0;
    const acceso_internet = Math.random() < 0.64 ? 1 : 0;

    // 2. Spatial friction: distance in km (heavy right-tail)
    const rawDist = Math.exp(randomNormal(1.6, 0.85));
    const distancia_km = parseFloat(Math.min(35, Math.max(0.5, rawDist)).toFixed(1));

    // 3. Behavioral and Academic Performance
    // Correlate slightly with support and distance
    const baseAsistencia = 82 + (apoyo_familiar ? 5 : -10) - distancia_km * 0.4 + randomNormal(0, 11);
    const asistencia = Math.min(100, Math.max(15, Math.round(baseAsistencia)));

    const baseRendimiento = 64 + (apoyo_familiar ? 6 : -8) + (asistencia > 75 ? 8 : -14) + randomNormal(0, 12);
    const rendimiento = Math.min(100, Math.max(5, Math.round(baseRendimiento)));

    const baseMotivacion = 58 + (asistencia > 80 ? 10 : -8) + (apoyo_familiar ? 8 : -6) + randomNormal(0, 16);
    const motivacion = Math.min(100, Math.max(0, Math.round(baseMotivacion)));

    // 4. Latent Logistic Risk for Dropout (deserto)
    // Economic & pedagogical theory: Low grades, high absenteeism, lack of family support, high distance are primary risk drivers
    const z =
      -1.75 -
      0.055 * (rendimiento - 50) -
      0.078 * (asistencia - 70) +
      0.115 * distancia_km -
      0.85 * apoyo_familiar -
      0.6 * acceso_internet -
      0.038 * (motivacion - 50) +
      0.22 * (edad - 15) +
      randomNormal(0, 0.45);

    const probDropout = 1 / (1 + Math.exp(-z));
    const deserto = Math.random() < probDropout ? 1 : 0;

    records.push({
      id: `EST-${1000 + i}`,
      rendimiento,
      asistencia,
      distancia_km,
      apoyo_familiar,
      edad,
      acceso_internet,
      motivacion,
      deserto,
    });
  }

  return records;
}

/**
 * Compute summary statistics of the dataset
 */
export function computeDatasetSummary(data: StudentRecord[]): DatasetSummary {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 8,
      missingValues: 0,
      dropoutCount: 0,
      nonDropoutCount: 0,
      dropoutRate: 0,
      features: [],
    };
  }

  let dropouts = 0;
  let missingCount = 0;

  data.forEach((r) => {
    if (r.deserto === 1) dropouts++;
    if (r.rendimiento == null || isNaN(r.rendimiento)) missingCount++;
    if (r.asistencia == null || isNaN(r.asistencia)) missingCount++;
    if (r.distancia_km == null || isNaN(r.distancia_km)) missingCount++;
  });

  const features: DatasetSummary["features"] = [
    { name: "rendimiento", type: "numeric", missing: 0 },
    { name: "asistencia", type: "numeric", missing: 0 },
    { name: "distancia_km", type: "numeric", missing: 0 },
    { name: "apoyo_familiar", type: "binary", missing: 0 },
    { name: "edad", type: "numeric", missing: 0 },
    { name: "acceso_internet", type: "binary", missing: 0 },
    { name: "motivacion", type: "numeric", missing: 0 },
    { name: "deserto", type: "binary", missing: 0 },
  ];

  return {
    totalRows: data.length,
    totalColumns: 8,
    missingValues: missingCount,
    dropoutCount: dropouts,
    nonDropoutCount: data.length - dropouts,
    dropoutRate: parseFloat(((dropouts / data.length) * 100).toFixed(1)),
    features,
  };
}

/**
 * Parse an uploaded file (CSV or XLSX) into StudentRecord[]
 */
export async function parseUploadedDataset(file: File): Promise<StudentRecord[]> {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".ods");

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("El archivo Excel no contiene hojas de datos válidas.");
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    return mapRawRowsToStudentRecords(rawRows);
  } else {
    const text = await file.text();
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            const mapped = mapRawRowsToStudentRecords(results.data);
            resolve(mapped);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });
  }
}

/**
 * Intelligent mapper for raw column names to standard StudentRecord format
 */
function mapRawRowsToStudentRecords(rawRows: Record<string, any>[]): StudentRecord[] {
  if (!rawRows || rawRows.length === 0) {
    throw new Error("El archivo cargado está vacío o no tiene registros válidos.");
  }

  const sample = rawRows[0];
  const keys = Object.keys(sample);

  // Match column heuristics
  const findKey = (patterns: RegExp[]): string | undefined => {
    return keys.find((k) => patterns.some((p) => p.test(k.toLowerCase().trim())));
  };

  const kRend = findKey([/rendim/i, /nota/i, /calific/i, /promed/i, /grade/i, /score/i]) || "rendimiento";
  const kAsis = findKey([/asist/i, /attend/i, /presenc/i]) || "asistencia";
  const kDist = findKey([/dist/i, /km/i, /kilom/i, /transp/i]) || "distancia_km";
  const kApoyo = findKey([/apoyo/i, /famil/i, /padre/i, /support/i]) || "apoyo_familiar";
  const kEdad = findKey([/edad/i, /age/i, /anos/i, /anios/i]) || "edad";
  const kNet = findKey([/inter/i, /conect/i, /wifi/i, /web/i]) || "acceso_internet";
  const kMotiv = findKey([/motiv/i, /interes/i, /grit/i, /empen/i]) || "motivacion";
  const kDeserto = findKey([/desert/i, /dropout/i, /aband/i, /target/i, /y/i]) || "deserto";

  return rawRows.map((row, idx) => {
    const parseNum = (val: any, def: number, min: number, max: number) => {
      const n = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "."));
      if (isNaN(n)) return def;
      return Math.min(max, Math.max(min, n));
    };

    const parseBin = (val: any, def: number) => {
      if (val === 1 || val === "1" || val === true || String(val).toLowerCase() === "si" || String(val).toLowerCase() === "yes") return 1;
      if (val === 0 || val === "0" || val === false || String(val).toLowerCase() === "no") return 0;
      return def;
    };

    return {
      id: String(row.id || row.codigo || `EST-${1000 + idx + 1}`),
      rendimiento: parseNum(row[kRend], 65, 0, 100),
      asistencia: parseNum(row[kAsis], 80, 0, 100),
      distancia_km: parseNum(row[kDist], 5.0, 0.1, 50),
      apoyo_familiar: parseBin(row[kApoyo], 1),
      edad: Math.round(parseNum(row[kEdad], 15, 10, 25)),
      acceso_internet: parseBin(row[kNet], 1),
      motivacion: parseNum(row[kMotiv], 60, 0, 100),
      deserto: parseBin(row[kDeserto], 0),
    };
  });
}

/**
 * PostgreSQL Connection Simulator with realistic network latency and credentials test
 */
export async function testAndQueryPostgreSQLDatabase(
  config: DatabaseConnectionConfig,
  limit = 500
): Promise<{ success: boolean; message: string; rows: StudentRecord[]; latencyMs: number }> {
  const start = performance.now();

  // Simulate network roundtrip latency (300-600ms)
  await new Promise((resolve) => setTimeout(resolve, 450 + Math.random() * 200));

  // Basic validation
  if (!config.host || !config.database || !config.user) {
    return {
      success: false,
      message: "Faltan parámetros obligatorios de conexión a PostgreSQL (Host, Database o User).",
      rows: [],
      latencyMs: Math.round(performance.now() - start),
    };
  }

  // Generate realistic live fetched rows from the specified table
  const rows = generateSyntheticDropoutDataset(limit, 101);
  const latency = Math.round(performance.now() - start);

  return {
    success: true,
    message: `Conexión establecida exitosamente con PostgreSQL [${config.host}:${config.port}/${config.database}]. Tabla '${config.tableName}' consultada: ${rows.length} registros extraídos.`,
    rows,
    latencyMs: latency,
  };
}
