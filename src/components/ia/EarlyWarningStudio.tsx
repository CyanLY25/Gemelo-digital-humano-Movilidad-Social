/**
 * EarlyWarningStudio.tsx
 * Interfaz Principal del Sistema de Alerta Temprana de Deserción Escolar
 * Integra armónicamente los 8 módulos de Inteligencia Artificial Predictiva:
 *  1. Ingesta y Carga de Datos (CSV, XLSX, Postgres Mock, Sintético 500)
 *  2. Análisis Exploratorio de Datos (EDA, Pearson, Histogramas, Boxplots)
 *  3. Entrenamiento de Modelos (RF, Reg. Logística, SVM, GB, Métricas, Matriz de Confusión)
 *  4. Selección y Comparación de Modelos (Leaderboard, Curvas ROC Superpuestas)
 *  5. Validación Cruzada Estratificada (Stratified K-Fold K={3,5,7,10}, Medias ± Desv.)
 *  6. Ajuste de Hiperparámetros (GridSearch / Bayesian, Exportación JSON)
 *  7. Pruebas Estadísticas Robustas (Bootstrap N=500-2000, IC 95%, t-Student H0: 0.5)
 *  8. Calculadora de Alerta Temprana (Formulario, Gauge de Riesgo, Desglose, Intervenciones)
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StudentRecord,
  DatasetSummary,
  EDAMetric,
  ModelType,
  ModelResult,
  CrossValidationResult,
  HyperparameterTuningResult,
  BootstrapResult,
  EarlyWarningPrediction,
  DatabaseConnectionConfig,
  FeatureKey,
} from "../../types/ia";
import {
  getActiveDataset,
  setActiveDataset,
  generateSyntheticDropoutDataset,
  computeDatasetSummary,
  parseUploadedDataset,
  testAndQueryPostgreSQLDatabase,
} from "../../services/ia/datasetService";
import {
  computeDescriptiveStatistics,
  computeClassDistribution,
  computePearsonCorrelationMatrix,
  computeSegmentedHistogram,
  computeSegmentedBoxplot,
} from "../../services/ia/edaService";
import {
  trainModel,
  PreprocessedDataset,
} from "../../services/ia/trainingEngine";
import {
  compareAllModels,
  ModelComparisonResult,
} from "../../services/ia/modelSelectionService";
import {
  runStratifiedCrossValidation,
} from "../../services/ia/crossValidationService";
import {
  runGridSearch,
  runBayesianOptimization,
  exportBestParametersAsJson,
} from "../../services/ia/hyperparamTuningEngine";
import {
  runBootstrapStatisticalEvaluation,
} from "../../services/ia/statisticalTestsEngine";
import {
  predictStudentEarlyWarning,
  DEFAULT_STUDENT_PROFILE,
  StudentInputProfile,
} from "../../services/ia/earlyWarningEngine";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

// Recharts visualization components
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";

import {
  Upload,
  Database,
  Sparkles,
  Search,
  Filter,
  BarChart3,
  Cpu,
  Trophy,
  GitCompare,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Play,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Activity,
  Award,
  ShieldCheck,
  Info,
  Clock,
  Zap,
  HelpCircle,
  TrendingDown,
  GraduationCap,
  Users,
  Target,
  ExternalLink,
} from "lucide-react";

export function EarlyWarningStudio() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { language } = useLanguage();
  const isEn = language === "en";

  // Module active subtab (1 to 8)
  const [activeModule, setActiveModule] = useState<number>(1);

  // 1. Dataset state
  const [dataset, setDataset] = useState<StudentRecord[]>(() => getActiveDataset());
  const [summary, setSummary] = useState<DatasetSummary>(() => computeDatasetSummary(dataset));
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // PostgreSQL modal & state
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbConfig, setDbConfig] = useState<DatabaseConnectionConfig>({
    host: "db.educacion-gob.internal",
    port: 5432,
    database: "sis_escolar_nacional",
    user: "sec_analytics",
    password: "••••••••",
    tableName: "registros_matricula_desercion",
  });
  const [isConnectingDb, setIsConnectingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // 2. EDA state
  const [edaMetrics, setEdaMetrics] = useState<EDAMetric[]>(() => computeDescriptiveStatistics(dataset));
  const [classDist, setClassDist] = useState(() => computeClassDistribution(dataset));
  const [pearsonMatrix, setPearsonMatrix] = useState(() => computePearsonCorrelationMatrix(dataset));
  const [selectedEdaFeature, setSelectedEdaFeature] = useState<FeatureKey>("asistencia");

  // 3. Training state
  const [selectedModelType, setSelectedModelType] = useState<ModelType>("random_forest");
  const [testSplitPercent, setTestSplitPercent] = useState<number>(20);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainedModelResult, setTrainedModelResult] = useState<ModelResult | null>(null);

  // 4. Comparison state
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ModelComparisonResult | null>(null);
  const [leaderboardSortKey, setLeaderboardSortKey] = useState<"rocAuc" | "f1Score" | "recall" | "accuracy">("rocAuc");

  // 5. Cross-validation state
  const [cvK, setCvK] = useState<number>(5);
  const [cvModel, setCvModel] = useState<ModelType>("random_forest");
  const [isCvRunning, setIsCvRunning] = useState<boolean>(false);
  const [cvProgress, setCvProgress] = useState<{ current: number; total: number } | null>(null);
  const [cvResult, setCvResult] = useState<CrossValidationResult | null>(null);

  // 6. Hyperparameter Tuning state
  const [tuningMethod, setTuningMethod] = useState<"grid_search" | "bayesian">("grid_search");
  const [tuningModel, setTuningModel] = useState<ModelType>("gradient_boosting");
  const [isTuning, setIsTuning] = useState<boolean>(false);
  const [tuningProgress, setTuningProgress] = useState<{ current: number; total: number } | null>(null);
  const [tuningResult, setTuningResult] = useState<HyperparameterTuningResult | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // 7. Statistical Tests state
  const [bootstrapN, setBootstrapN] = useState<number>(1000);
  const [bootstrapModel, setBootstrapModel] = useState<ModelType>("random_forest");
  const [isBootstrapRunning, setIsBootstrapRunning] = useState<boolean>(false);
  const [bootstrapProgress, setBootstrapProgress] = useState<{ current: number; total: number } | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<BootstrapResult | null>(null);

  // 8. Early Warning Calculator state
  const [studentProfile, setStudentProfile] = useState<StudentInputProfile>(DEFAULT_STUDENT_PROFILE);
  const [prediction, setPrediction] = useState<EarlyWarningPrediction>(() => predictStudentEarlyWarning(DEFAULT_STUDENT_PROFILE));

  // Recalculate EDA when dataset updates
  useEffect(() => {
    const sum = computeDatasetSummary(dataset);
    setSummary(sum);
    setEdaMetrics(computeDescriptiveStatistics(dataset));
    setClassDist(computeClassDistribution(dataset));
    setPearsonMatrix(computePearsonCorrelationMatrix(dataset));
  }, [dataset]);

  // Recalculate prediction when profile changes
  useEffect(() => {
    const res = predictStudentEarlyWarning(studentProfile);
    setPrediction(res);
  }, [studentProfile]);

  // Handlers for dataset operations
  const handleRegenerateSynthetic = (count = 500) => {
    const newData = generateSyntheticDropoutDataset(count, Date.now());
    setDataset(newData);
    setActiveDataset(newData);
    setPage(1);
    setTrainedModelResult(null);
    setComparisonResult(null);
    setCvResult(null);
    setTuningResult(null);
    setBootstrapResult(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const parsed = await parseUploadedDataset(file);
      setDataset(parsed);
      setActiveDataset(parsed);
      setPage(1);
    } catch (err: any) {
      setUploadError(err?.message || "Error al procesar el archivo subido.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConnectDb = async () => {
    setIsConnectingDb(true);
    setDbStatusMsg(null);
    try {
      const res = await testAndQueryPostgreSQLDatabase(dbConfig, 500);
      if (res.success) {
        setDataset(res.rows);
        setActiveDataset(res.rows);
        setDbStatusMsg({ success: true, text: `${res.message} (${res.latencyMs}ms)` });
        setTimeout(() => setShowDbModal(false), 1200);
      } else {
        setDbStatusMsg({ success: false, text: res.message });
      }
    } catch (err: any) {
      setDbStatusMsg({ success: false, text: err?.message || "Fallo en conexión." });
    } finally {
      setIsConnectingDb(false);
    }
  };

  // 3. Train single model handler
  const handleRunTraining = async () => {
    setIsTraining(true);
    try {
      const res = await trainModel(selectedModelType, dataset, testSplitPercent / 100, randomSeed);
      setTrainedModelResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  };

  // 4. Model comparison handler
  const handleRunComparison = async () => {
    setIsComparing(true);
    try {
      const res = await compareAllModels(dataset, testSplitPercent / 100, randomSeed);
      setComparisonResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  // 5. Cross validation handler
  const handleRunCV = async () => {
    setIsCvRunning(true);
    setCvProgress({ current: 1, total: cvK });
    try {
      const res = await runStratifiedCrossValidation(dataset, cvModel, cvK, randomSeed, (cur, tot) => {
        setCvProgress({ current: cur, total: tot });
      });
      setCvResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCvRunning(false);
      setCvProgress(null);
    }
  };

  // 6. Hyperparameter tuning handler
  const handleRunTuning = async () => {
    setIsTuning(true);
    setTuningProgress({ current: 1, total: tuningMethod === "grid_search" ? 24 : 16 });
    try {
      let res: HyperparameterTuningResult;
      if (tuningMethod === "grid_search") {
        res = await runGridSearch(dataset, tuningModel, undefined, (cur, tot) => {
          setTuningProgress({ current: cur, total: tot });
        });
      } else {
        res = await runBayesianOptimization(dataset, tuningModel, 16, (cur, tot) => {
          setTuningProgress({ current: cur, total: tot });
        });
      }
      setTuningResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTuning(false);
      setTuningProgress(null);
    }
  };

  // Export parameters
  const handleExportJson = () => {
    if (!tuningResult) return;
    const jsonStr = exportBestParametersAsJson(tuningResult);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `best_hyperparameters_${tuningResult.modelType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!tuningResult) return;
    const jsonStr = exportBestParametersAsJson(tuningResult);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // 7. Bootstrap handler
  const handleRunBootstrap = async () => {
    setIsBootstrapRunning(true);
    setBootstrapProgress({ current: 0, total: bootstrapN });
    try {
      const res = await runBootstrapStatisticalEvaluation(dataset, bootstrapModel, bootstrapN, (cur, tot) => {
        setBootstrapProgress({ current: cur, total: tot });
      });
      setBootstrapResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBootstrapRunning(false);
      setBootstrapProgress(null);
    }
  };

  // Presets for student calculator
  const applyStudentPreset = (preset: "critico" | "vulnerable" | "estable") => {
    if (preset === "critico") {
      setStudentProfile({
        rendimiento: 41,
        asistencia: 58,
        distancia_km: 14.5,
        apoyo_familiar: 0,
        edad: 17,
        acceso_internet: 0,
        motivacion: 32,
      });
    } else if (preset === "vulnerable") {
      setStudentProfile({
        rendimiento: 58,
        asistencia: 74,
        distancia_km: 8.0,
        apoyo_familiar: 1,
        edad: 15,
        acceso_internet: 1,
        motivacion: 55,
      });
    } else {
      setStudentProfile({
        rendimiento: 88,
        asistencia: 96,
        distancia_km: 2.5,
        apoyo_familiar: 1,
        edad: 15,
        acceso_internet: 1,
        motivacion: 85,
      });
    }
  };

  // Filtered dataset rows
  const filteredRows = useMemo(() => {
    if (!searchTerm) return dataset;
    const q = searchTerm.toLowerCase();
    return dataset.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.rendimiento.toString().includes(q) ||
        r.asistencia.toString().includes(q)
    );
  }, [dataset, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Segmented histogram data for Module 2
  const segmentedHistData = useMemo(() => {
    return computeSegmentedHistogram(dataset, selectedEdaFeature, 8);
  }, [dataset, selectedEdaFeature]);

  const segmentedBoxData = useMemo(() => {
    return computeSegmentedBoxplot(dataset, selectedEdaFeature);
  }, [dataset, selectedEdaFeature]);

  // Modules catalog definition
  const modulesList = [
    { id: 1, name: "1. Ingesta & Dataset", short: "Ingesta", icon: Database },
    { id: 2, name: "2. EDA Exploratorio", short: "EDA", icon: BarChart3 },
    { id: 3, name: "3. Entrenamiento", short: "Entrenar", icon: Cpu },
    { id: 4, name: "4. Comparación ROC", short: "Modelos", icon: Trophy },
    { id: 5, name: "5. Stratified K-Fold", short: "CV Folds", icon: GitCompare },
    { id: 6, name: "6. Hiperparámetros", short: "Tuning", icon: Sliders },
    { id: 7, name: "7. Bootstrap & Tests", short: "Estadística", icon: Activity },
    { id: 8, name: "8. Alerta Temprana", short: "Calculadora", icon: AlertTriangle },
  ];

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${isDark ? "bg-[#050608] text-[#D1D5DB]" : "bg-slate-50 text-slate-800"}`}>
      {/* Header Banner */}
      <div className={`border-b px-4 sm:px-6 py-4 transition-colors ${isDark ? "border-white/10 bg-[#0A0C10]" : "border-slate-200 bg-white shadow-xs"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-slate-900"}`}>
                  {isEn ? "School Dropout Early Warning AI Engine" : "Motor Predictivo de Alerta Temprana de Deserción Escolar"}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  ML-v3.2 BINARY
                </span>
              </div>
              <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                {isEn
                  ? "End-to-end Machine Learning pipeline: Ingestion, EDA, Training, Superimposed ROC Curves, Stratified K-Fold, Hyperparameter Tuning, Bootstrap Resampling, and Individual Student Risk Scoring."
                  : "Pipeline completo de Machine Learning: Ingesta, EDA, Entrenamiento, Curvas ROC superpuestas, Validación Estratificada, Optimización de Hiperparámetros, Bootstrap y Scoring Individual."}
              </p>
            </div>
          </div>

          {/* Quick Dataset Pill Status */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}>
              <Users className="w-3.5 h-3.5 text-cyan-500" />
              <span>{dataset.length} Registros</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{summary.dropoutRate}% Deserción</span>
            </div>
          </div>
        </div>

        {/* 8-Step Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 overflow-x-auto">
          <div className="flex gap-1.5 pb-1 border-b border-transparent">
            {modulesList.map((m) => {
              const Icon = m.icon;
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  id={`btn-module-${m.id}`}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
                    isActive
                      ? isDark
                        ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        : "bg-cyan-600 text-white font-semibold shadow-xs"
                      : isDark
                      ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                      : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Module Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* ========================================================================= */}
        {/* MODULE 1: INGESTA Y CARGA DE DATOS */}
        {/* ========================================================================= */}
        {activeModule === 1 && (
          <div className="space-y-6">
            {/* Top Action Controls: Upload, DB, Synthetic */}
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Orígenes de Datos Escolares
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Sube archivos CSV/Excel de matrícula, simula conexión directa a PostgreSQL institucional, o genera 500 registros sintéticos calibrados.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Local file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls,.ods"
                    className="hidden"
                    id="file-upload-input"
                  />
                  <button
                    id="btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-white border-white/15"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{isUploading ? "Cargando..." : "Subir CSV / XLSX"}</span>
                  </button>

                  {/* PostgreSQL Simulator Button */}
                  <button
                    id="btn-open-postgres-modal"
                    onClick={() => setShowDbModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium border transition-all ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-indigo-400 border-indigo-500/30"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Conexión BD (PostgreSQL)</span>
                  </button>

                  {/* Generate 500 Synthetic */}
                  <button
                    id="btn-generate-synthetic"
                    onClick={() => handleRegenerateSynthetic(500)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar Sintético (500)</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Metric Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>
                    Total Filas
                  </div>
                  <div className={`text-xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                    {summary.totalRows}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>
                    Variables (Cols)
                  </div>
                  <div className={`text-xl font-bold font-mono text-cyan-500`}>
                    {summary.totalColumns}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>
                    Valores Nulos
                  </div>
                  <div className={`text-xl font-bold font-mono ${summary.missingValues > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {summary.missingValues}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`text-[10px] uppercase tracking-wider font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>
                    Tasa Deserción (Y=1)
                  </div>
                  <div className={`text-xl font-bold font-mono text-rose-500`}>
                    {summary.dropoutRate}% ({summary.dropoutCount})
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Paginated Preview Table */}
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Vista Previa del Dataset Activo
                  </h4>
                  <span className={`text-[11px] font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
                    ({filteredRows.length} coincidencias)
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="input-dataset-search"
                    type="text"
                    placeholder="Buscar por ID, nota, asistencia..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-mono border focus:outline-hidden focus:ring-1 focus:ring-cyan-500 ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-white/30"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"}>
                    <tr>
                      <th className="py-2.5 px-3">ID Estudiante</th>
                      <th className="py-2.5 px-3">Rendimiento</th>
                      <th className="py-2.5 px-3">Asistencia</th>
                      <th className="py-2.5 px-3">Distancia (km)</th>
                      <th className="py-2.5 px-3">Apoyo Familiar</th>
                      <th className="py-2.5 px-3">Edad</th>
                      <th className="py-2.5 px-3">Internet</th>
                      <th className="py-2.5 px-3">Motivación</th>
                      <th className="py-2.5 px-3 text-right">Deserción (Target)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200"}`}>
                    {currentRows.map((r) => (
                      <tr key={r.id} className={isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                        <td className="py-2 px-3 font-semibold text-cyan-600 dark:text-cyan-400">{r.id}</td>
                        <td className="py-2 px-3">{r.rendimiento}/100</td>
                        <td className="py-2 px-3">
                          <span className={r.asistencia < 70 ? "text-rose-500 font-bold" : ""}>
                            {r.asistencia}%
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.distancia_km} km</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${r.apoyo_familiar ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"}`}>
                            {r.apoyo_familiar ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.edad} a</td>
                        <td className="py-2 px-3">{r.acceso_internet ? "Sí" : "No"}</td>
                        <td className="py-2 px-3">{r.motivacion}/100</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.deserto === 1
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {r.deserto === 1 ? "1 (Desertó)" : "0 (Permanece)"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              <div className="flex items-center justify-between mt-3 text-xs font-mono">
                <span className={isDark ? "text-white/50" : "text-slate-500"}>
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-prev-page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-1.5 rounded border disabled:opacity-40 ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-100"}`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-next-page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`p-1.5 rounded border disabled:opacity-40 ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-100"}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 2: ANÁLISIS EXPLORATORIO DE DATOS (EDA) */}
        {/* ========================================================================= */}
        {activeModule === 2 && (
          <div className="space-y-6">
            {/* Descriptive Statistics Table */}
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Métricas Descriptivas de las Variables
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Media, desviación estándar, rango intercuartil (IQR), mín/máx y nulos para la cohorte analizada.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"}>
                    <tr>
                      <th className="py-2.5 px-3">Variable</th>
                      <th className="py-2.5 px-3">Media (μ)</th>
                      <th className="py-2.5 px-3">Desv. Est. (σ)</th>
                      <th className="py-2.5 px-3">Mín</th>
                      <th className="py-2.5 px-3">Q25</th>
                      <th className="py-2.5 px-3">Mediana</th>
                      <th className="py-2.5 px-3">Q75</th>
                      <th className="py-2.5 px-3">Máx</th>
                      <th className="py-2.5 px-3 text-right">Nulos</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200"}`}>
                    {edaMetrics.map((m) => (
                      <tr key={m.feature} className={isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                        <td className="py-2.5 px-3 font-semibold text-cyan-600 dark:text-cyan-400">{m.label}</td>
                        <td className="py-2.5 px-3 font-bold">{m.mean}</td>
                        <td className="py-2.5 px-3">{m.std}</td>
                        <td className="py-2.5 px-3">{m.min}</td>
                        <td className="py-2.5 px-3">{m.q25}</td>
                        <td className="py-2.5 px-3">{m.median}</td>
                        <td className="py-2.5 px-3">{m.q75}</td>
                        <td className="py-2.5 px-3">{m.max}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">{m.missing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual EDA: Class Distribution & Pearson Correlation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Balance */}
              <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Distribución de la Clase Objetivo (Deserción)
                </h4>
                <p className={`text-xs mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                  Proporción de estudiantes que permanecen vs los que desertaron en el periodo académico.
                </p>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classDist}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                        label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                      >
                        {classDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pearson Correlation Matrix Grid */}
              <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Matriz de Correlación Lineal de Pearson (r)
                </h4>
                <p className={`text-xs mb-3 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                  Intensidad y sentido de asociación respecto a la deserción escolar (-1.0 a +1.0).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[11px] font-mono">
                    <thead>
                      <tr>
                        <th className="py-1 px-1 text-left">Var</th>
                        {pearsonMatrix.vars.map((v) => (
                          <th key={v} className="py-1 px-1 capitalize">
                            {v.slice(0, 4)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pearsonMatrix.vars.map((vA) => (
                        <tr key={vA}>
                          <td className="py-1 px-1 text-left font-semibold text-slate-400 capitalize">{vA.slice(0, 7)}</td>
                          {pearsonMatrix.vars.map((vB) => {
                            const val = pearsonMatrix.grid?.[vA]?.[vB] ?? 0;
                            // Heatmap color logic
                            let bg = "bg-transparent";
                            if (val > 0.5) bg = "bg-rose-500/25 text-rose-300 font-bold";
                            else if (val > 0.2) bg = "bg-rose-500/10 text-rose-400";
                            else if (val < -0.5) bg = "bg-emerald-500/25 text-emerald-300 font-bold";
                            else if (val < -0.2) bg = "bg-emerald-500/10 text-emerald-400";

                            return (
                              <td key={vB} className={`py-1 px-1 rounded ${bg}`}>
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Segmented Feature Histogram */}
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Histograma Segmentado por Deserción (0 vs 1)
                  </h4>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Compara la distribución de frecuencias para identificar umbrales críticos de separación.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Variable:</span>
                  <select
                    id="select-eda-feature"
                    value={selectedEdaFeature}
                    onChange={(e) => setSelectedEdaFeature(e.target.value as FeatureKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="asistencia">Asistencia (%)</option>
                    <option value="rendimiento">Rendimiento Académico</option>
                    <option value="distancia_km">Distancia (km)</option>
                    <option value="motivacion">Motivación (0-100)</option>
                    <option value="edad">Edad (Años)</option>
                  </select>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentedHistData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"} />
                    <XAxis dataKey="binLabel" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                    <YAxis tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                        borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="noDropout" name="Permanece (Deserto = 0)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="dropout" name="Desertó (Deserto = 1)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 3: ENTRENAMIENTO DE MODELOS */}
        {/* ========================================================================= */}
        {activeModule === 3 && (
          <div className="space-y-6">
            {/* Training Settings & Action */}
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Configuración del Motor de Entrenamiento
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Entrena modelos de clasificación binaria implementados nativamente en TypeScript con partición estratificada.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Algoritmo ML</label>
                    <select
                      id="select-training-algo"
                      value={selectedModelType}
                      onChange={(e) => setSelectedModelType(e.target.value as ModelType)}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value="random_forest">Random Forest Classifier</option>
                      <option value="gradient_boosting">Gradient Boosting (GBDT)</option>
                      <option value="logistic_regression">Regresión Logística</option>
                      <option value="svm">Support Vector Machine (SVM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Test Split (%)</label>
                    <select
                      id="select-test-split"
                      value={testSplitPercent}
                      onChange={(e) => setTestSplitPercent(Number(e.target.value))}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value={15}>15% Test</option>
                      <option value={20}>20% Test (Estándar)</option>
                      <option value={25}>25% Test</option>
                      <option value={30}>30% Test</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Semilla (Seed)</label>
                    <input
                      id="input-random-seed"
                      type="number"
                      value={randomSeed}
                      onChange={(e) => setRandomSeed(Number(e.target.value))}
                      className={`w-20 px-2.5 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    />
                  </div>

                  <button
                    id="btn-run-train-model"
                    onClick={handleRunTraining}
                    disabled={isTraining}
                    className="self-end px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTraining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isTraining ? "Entrenando..." : "Entrenar Modelo"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Training Results */}
            {trainedModelResult && (
              <div className="space-y-6">
                {/* 6 Key Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">ROC-AUC</div>
                    <div className="text-xl font-bold font-mono text-cyan-500">
                      {(trainedModelResult.metrics.rocAuc * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Capacidad discriminante</div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">F1-Score</div>
                    <div className="text-xl font-bold font-mono text-indigo-500">
                      {(trainedModelResult.metrics.f1Score * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Media armónica</div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Recall (Sensib.)</div>
                    <div className="text-xl font-bold font-mono text-rose-500">
                      {(trainedModelResult.metrics.recall * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Deserción detectada</div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Precisión</div>
                    <div className="text-xl font-bold font-mono text-amber-500">
                      {(trainedModelResult.metrics.precision * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Fiabilidad alerta</div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Accuracy</div>
                    <div className="text-xl font-bold font-mono text-emerald-500">
                      {(trainedModelResult.metrics.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Exactitud global</div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Tiempo Ajuste</div>
                    <div className="text-xl font-bold font-mono text-purple-400">
                      {trainedModelResult.metrics.trainingTimeMs} ms
                    </div>
                    <div className="text-[10px] text-slate-500">Latencia en cliente</div>
                  </div>
                </div>

                {/* Confusion Matrix & Feature Importance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Annotated Confusion Matrix */}
                  <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      Matriz de Confusión Anotada (Conjunto Test)
                    </h4>
                    <p className={`text-xs mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                      Distribución de Aciertos y Errores (Verdaderos y Falsos Positivos/Negativos).
                    </p>

                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono">
                      {/* True Negatives */}
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          TN (Verdadero Negativo)
                        </div>
                        <div className="text-2xl font-bold text-emerald-500 my-1">
                          {trainedModelResult.metrics.confusionMatrix.tn}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Predecido: Permanece / Real: Permanece
                        </div>
                      </div>

                      {/* False Positives */}
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase">
                          FP (Falsa Alarma)
                        </div>
                        <div className="text-2xl font-bold text-amber-500 my-1">
                          {trainedModelResult.metrics.confusionMatrix.fp}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Predecido: Desertó / Real: Permanece
                        </div>
                      </div>

                      {/* False Negatives */}
                      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase">
                          FN (Deserción Omitida)
                        </div>
                        <div className="text-2xl font-bold text-rose-500 my-1">
                          {trainedModelResult.metrics.confusionMatrix.fn}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Predecido: Permanece / Real: Desertó
                        </div>
                      </div>

                      {/* True Positives */}
                      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                        <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                          TP (Verdadero Positivo)
                        </div>
                        <div className="text-2xl font-bold text-cyan-500 my-1">
                          {trainedModelResult.metrics.confusionMatrix.tp}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Predecido: Desertó / Real: Desertó
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Importance Bar Chart */}
                  <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      Importancia Relativa de Variables (Feature Importance)
                    </h4>
                    <p className={`text-xs mb-3 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                      Ganancia de información / ponderación en las decisiones del modelo.
                    </p>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={trainedModelResult.metrics.featureImportance}
                          margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"} />
                          <XAxis type="number" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                          <YAxis dataKey="feature" type="category" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                              fontFamily: "monospace",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="importance" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 4: SELECCIÓN Y COMPARACIÓN DE MODELOS (ROC SUPERPUESTAS) */}
        {/* ========================================================================= */}
        {activeModule === 4 && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Comparación y Curvas ROC Superpuestas
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Compara simultáneamente los 4 algoritmos (Random Forest, Gradient Boosting, Regresión Logística y SVM) en la misma partición.
                  </p>
                </div>

                <button
                  id="btn-run-all-comparison"
                  onClick={handleRunComparison}
                  disabled={isComparing}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
                >
                  {isComparing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                  <span>{isComparing ? "Evaluando Algoritmos..." : "Ejecutar Torneo de Modelos"}</span>
                </button>
              </div>
            </div>

            {comparisonResult && (
              <div className="space-y-6">
                {/* Superimposed ROC Curves Chart */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                      Curvas ROC Superpuestas (FPR vs TPR)
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-500">
                      Campeón: {comparisonResult.championModel.name}
                    </span>
                  </div>
                  <p className={`text-xs mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Mayor área bajo la curva (AUC) indica mayor capacidad para distinguir estudiantes en riesgo. Línea diagonal gris representa el clasificador aleatorio.
                  </p>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonResult.superimposedRocData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"} />
                        <XAxis
                          dataKey="fpr"
                          type="number"
                          domain={[0, 1]}
                          tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                          label={{ value: "Falso Positivo (1 - Especificidad)", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis
                          type="number"
                          domain={[0, 1]}
                          tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }}
                          label={{ value: "Verdadero Positivo (Sensibilidad)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          type="monotone"
                          dataKey="randomForestTpr"
                          name="Random Forest"
                          stroke="#06B6D4"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="gradientBoostingTpr"
                          name="Gradient Boosting"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="logisticRegressionTpr"
                          name="Regresión Logística"
                          stroke="#6366F1"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="svmTpr"
                          name="SVM"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="linear"
                          dataKey="baseline"
                          name="Azar (AUC=0.5)"
                          stroke="#64748b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Leaderboard Table */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Tabla Comparativa de Modelos (Leaderboard)
                  </h4>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"}>
                        <tr>
                          <th className="py-2.5 px-3">Ranking</th>
                          <th className="py-2.5 px-3">Modelo</th>
                          <th className="py-2.5 px-3">ROC-AUC</th>
                          <th className="py-2.5 px-3">F1-Score</th>
                          <th className="py-2.5 px-3">Recall</th>
                          <th className="py-2.5 px-3">Precisión</th>
                          <th className="py-2.5 px-3">Accuracy</th>
                          <th className="py-2.5 px-3 text-right">Tiempo (ms)</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200"}`}>
                        {comparisonResult.models
                          .sort((a, b) => b.metrics[leaderboardSortKey] - a.metrics[leaderboardSortKey])
                          .map((m, rank) => {
                            const isChampion = m.id === comparisonResult.championModel.id;
                            return (
                              <tr key={m.id} className={isChampion ? (isDark ? "bg-cyan-500/10" : "bg-cyan-50/70") : ""}>
                                <td className="py-2.5 px-3 font-bold">
                                  {rank === 0 ? <span className="text-amber-400">#1 👑</span> : `#${rank + 1}`}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">
                                  {m.name}
                                  {isChampion && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">
                                      Campeón
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-cyan-500">{(m.metrics.rocAuc * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-3 font-bold text-indigo-400">{(m.metrics.f1Score * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-3">{(m.metrics.recall * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-3">{(m.metrics.precision * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-3">{(m.metrics.accuracy * 100).toFixed(1)}%</td>
                                <td className="py-2.5 px-3 text-right">{m.metrics.trainingTimeMs} ms</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 5: VALIDACIÓN CRUZADA ESTRATIFICADA (K-FOLD) */}
        {/* ========================================================================= */}
        {activeModule === 5 && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Validación Cruzada Estratificada (Stratified K-Fold)
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Particiona el dataset en K subconjuntos preservando la tasa de deserción en cada pliegue para medir estabilidad y evitar sobreajuste.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Modelo</label>
                    <select
                      id="select-cv-model"
                      value={cvModel}
                      onChange={(e) => setCvModel(e.target.value as ModelType)}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value="random_forest">Random Forest</option>
                      <option value="gradient_boosting">Gradient Boosting</option>
                      <option value="logistic_regression">Regresión Logística</option>
                      <option value="svm">SVM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Folds (K)</label>
                    <select
                      id="select-cv-k"
                      value={cvK}
                      onChange={(e) => setCvK(Number(e.target.value))}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value={3}>K = 3</option>
                      <option value={5}>K = 5 (Estándar)</option>
                      <option value={7}>K = 7</option>
                      <option value={10}>K = 10</option>
                    </select>
                  </div>

                  <button
                    id="btn-run-cv"
                    onClick={handleRunCV}
                    disabled={isCvRunning}
                    className="self-end px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCvRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                    <span>{isCvRunning ? `Fold ${cvProgress?.current}/${cvProgress?.total}...` : "Ejecutar Stratified K-Fold"}</span>
                  </button>
                </div>
              </div>
            </div>

            {cvResult && (
              <div className="space-y-6">
                {/* Summary Stability Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Media ROC-AUC (μ ± σ)</div>
                    <div className="text-2xl font-bold font-mono text-cyan-500 mt-1">
                      {(cvResult.meanRocAuc * 100).toFixed(1)}% <span className="text-sm font-normal text-slate-400">± {(cvResult.stdRocAuc * 100).toFixed(2)}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Desv. estándar baja (&lt; 3%) indica robustez frente al muestreo.
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Media F1-Score (μ ± σ)</div>
                    <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                      {(cvResult.meanF1 * 100).toFixed(1)}% <span className="text-sm font-normal text-slate-400">± {(cvResult.stdF1 * 100).toFixed(2)}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Consistencia en detección armónica de casos positivos.
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Media Accuracy (μ ± σ)</div>
                    <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                      {(cvResult.meanAccuracy * 100).toFixed(1)}% <span className="text-sm font-normal text-slate-400">± {(cvResult.stdAccuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Tasa de acierto global promedio en {cvResult.k} pliegues.
                    </div>
                  </div>
                </div>

                {/* Fold-by-fold results table */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Resultados Detallados Pliegue por Pliegue (Fold 1 a {cvResult.k})
                  </h4>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"}>
                        <tr>
                          <th className="py-2.5 px-3">Pliegue (Fold)</th>
                          <th className="py-2.5 px-3">ROC-AUC</th>
                          <th className="py-2.5 px-3">F1-Score</th>
                          <th className="py-2.5 px-3">Recall</th>
                          <th className="py-2.5 px-3">Precisión</th>
                          <th className="py-2.5 px-3 text-right">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200"}`}>
                        {cvResult.folds.map((f) => (
                          <tr key={f.fold} className={isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                            <td className="py-2.5 px-3 font-semibold text-cyan-400">Fold #{f.fold}</td>
                            <td className="py-2.5 px-3 font-bold text-cyan-500">{(f.rocAuc * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-indigo-400">{(f.f1Score * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3">{(f.recall * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3">{(f.precision * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-500">{(f.accuracy * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 6: AJUSTE DE HIPERPARÁMETROS (GRID SEARCH / BAYESIAN) */}
        {/* ========================================================================= */}
        {activeModule === 6 && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Optimización y Búsqueda de Hiperparámetros
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Explora el espacio de configuración (n_estimators, max_depth, learning_rate, C) maximizando ROC-AUC.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Método</label>
                    <select
                      id="select-tuning-method"
                      value={tuningMethod}
                      onChange={(e) => setTuningMethod(e.target.value as any)}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value="grid_search">Grid Search (Búsqueda en Grilla)</option>
                      <option value="bayesian">Optimización Bayesiana (Probabilística)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Modelo Objetivo</label>
                    <select
                      id="select-tuning-model"
                      value={tuningModel}
                      onChange={(e) => setTuningModel(e.target.value as ModelType)}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value="gradient_boosting">Gradient Boosting</option>
                      <option value="random_forest">Random Forest</option>
                      <option value="logistic_regression">Regresión Logística</option>
                      <option value="svm">SVM</option>
                    </select>
                  </div>

                  <button
                    id="btn-run-tuning"
                    onClick={handleRunTuning}
                    disabled={isTuning}
                    className="self-end px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTuning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                    <span>{isTuning ? `Ensayo ${tuningProgress?.current}/${tuningProgress?.total}...` : "Iniciar Búsqueda"}</span>
                  </button>
                </div>
              </div>
            </div>

            {tuningResult && (
              <div className="space-y-6">
                {/* Best Trial Banner */}
                <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDark ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200 shadow-xs"
                }`}>
                  <div>
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Mejor Combinación Encontrada ({tuningResult.method === "grid_search" ? "Grid Search" : "Bayesian"})</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-500 mt-1">
                      ROC-AUC: {(tuningResult.bestScore * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Parámetros: {JSON.stringify(tuningResult.bestParams)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-copy-json"
                      onClick={handleCopyJson}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border transition-all ${
                        isDark ? "bg-white/10 hover:bg-white/15 text-white border-white/20" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                      }`}
                    >
                      {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJson ? "Copiado!" : "Copiar JSON"}</span>
                    </button>

                    <button
                      id="btn-export-json"
                      onClick={handleExportJson}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar JSON</span>
                    </button>
                  </div>
                </div>

                {/* Trials Ranking Table */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Ranking de Ensayos Evaluados ({tuningResult.trials.length} configuraciones)
                  </h4>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className={isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"}>
                        <tr>
                          <th className="py-2.5 px-3">Ranking</th>
                          <th className="py-2.5 px-3">Hiperparámetros Evaluados</th>
                          <th className="py-2.5 px-3">ROC-AUC</th>
                          <th className="py-2.5 px-3">F1-Score</th>
                          <th className="py-2.5 px-3 text-right">Tiempo (ms)</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200"}`}>
                        {tuningResult.trials.map((t, idx) => (
                          <tr key={t.id} className={idx === 0 ? (isDark ? "bg-cyan-500/10" : "bg-cyan-50") : ""}>
                            <td className="py-2.5 px-3 font-bold">
                              {idx === 0 ? "👑 #1" : `#${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-400">
                              {Object.entries(t.params)
                                .map(([k, v]) => `${k}=${v}`)
                                .join(" | ")}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-cyan-500">{(t.rocAuc * 100).toFixed(2)}%</td>
                            <td className="py-2.5 px-3 text-indigo-400">{(t.f1Score * 100).toFixed(2)}%</td>
                            <td className="py-2.5 px-3 text-right">{t.executionTimeMs} ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 7: PRUEBAS ESTADÍSTICAS ROBUSTAS (BOOTSTRAP + T-STUDENT) */}
        {/* ========================================================================= */}
        {activeModule === 7 && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Inferencia Estadística Robusta (Bootstrap & Contraste de Hipótesis)
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Remuestreo Bootstrap con reemplazo (N = 500 a 2000) para construir la distribución empírica del ROC-AUC, Intervalos de Confianza al 95% y prueba t de Student contra H0: AUC = 0.5.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Modelo</label>
                    <select
                      id="select-bootstrap-model"
                      value={bootstrapModel}
                      onChange={(e) => setBootstrapModel(e.target.value as ModelType)}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value="random_forest">Random Forest</option>
                      <option value="gradient_boosting">Gradient Boosting</option>
                      <option value="logistic_regression">Regresión Logística</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">Iteraciones (N)</label>
                    <select
                      id="select-bootstrap-n"
                      value={bootstrapN}
                      onChange={(e) => setBootstrapN(Number(e.target.value))}
                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-100 border-slate-300 text-slate-800"}`}
                    >
                      <option value={500}>N = 500</option>
                      <option value={1000}>N = 1,000 (Recomendado)</option>
                      <option value={1500}>N = 1,500</option>
                      <option value={2000}>N = 2,000</option>
                    </select>
                  </div>

                  <button
                    id="btn-run-bootstrap"
                    onClick={handleRunBootstrap}
                    disabled={isBootstrapRunning}
                    className="self-end px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isBootstrapRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    <span>{isBootstrapRunning ? `Remuestreo ${bootstrapProgress?.current}/${bootstrapProgress?.total}...` : "Ejecutar Bootstrap"}</span>
                  </button>
                </div>
              </div>
            </div>

            {bootstrapResult && (
              <div className="space-y-6">
                {/* Hypothesis Test & CI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Media AUC Bootstrap</div>
                    <div className="text-2xl font-bold font-mono text-cyan-500 mt-1">
                      {(bootstrapResult.meanAuc * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Error estándar SE = {bootstrapResult.stdError}</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Intervalo Confianza 95%</div>
                    <div className="text-xl font-bold font-mono text-amber-500 mt-1">
                      [{(bootstrapResult.ci95.lower * 100).toFixed(1)}%, {(bootstrapResult.ci95.upper * 100).toFixed(1)}%]
                    </div>
                    <div className="text-[10px] text-slate-500">Percentiles empíricos 2.5% - 97.5%</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">Estadístico t-Student</div>
                    <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                      t = {bootstrapResult.tStatistic}
                    </div>
                    <div className="text-[10px] text-slate-500">H0: AUC = 0.5 (clasificador al azar)</div>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="text-[10px] uppercase font-mono text-slate-400">p-valor / Significancia</div>
                    <div className="text-xl font-bold font-mono text-emerald-500 mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span>{bootstrapResult.pValue < 0.0001 ? "p < 0.0001" : `p = ${bootstrapResult.pValue}`}</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Rechaza H0 con 99.9% de confianza
                    </div>
                  </div>
                </div>

                {/* Histogram Chart */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Distribución de Probabilidad Empírica de ROC-AUC ({bootstrapResult.iterations} remuestreos)
                  </h4>
                  <p className={`text-xs mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Línea roja discontinua representa la hipótesis nula ($H_0 = 0.5$). Las líneas ámbar delimitan el IC 95% y la cian marca la media muestral.
                  </p>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bootstrapResult.distributionHistogram} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"} />
                        <XAxis dataKey="binLabel" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                        <YAxis tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        />
                        <Area type="monotone" dataKey="frequency" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 8: CALCULADORA DE ALERTA TEMPRANA E INTERVENCIONES */}
        {/* ========================================================================= */}
        {activeModule === 8 && (
          <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    Calculadora de Alerta Temprana e Intervenciones Preventivas
                  </h3>
                  <p className={`text-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Simula el perfil individual de un estudiante para predecir en tiempo real su probabilidad de abandono, clasificar el riesgo y generar recomendaciones focalizadas.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Presets:</span>
                  <button
                    id="btn-preset-critico"
                    onClick={() => applyStudentPreset("critico")}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30"
                  >
                    Riesgo Crítico
                  </button>
                  <button
                    id="btn-preset-vulnerable"
                    onClick={() => applyStudentPreset("vulnerable")}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30"
                  >
                    Vulnerable
                  </button>
                  <button
                    id="btn-preset-estable"
                    onClick={() => applyStudentPreset("estable")}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/30"
                  >
                    Estable
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Input Controls */}
              <div className={`lg:col-span-5 p-5 rounded-xl border space-y-4 ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  Parámetros del Estudiante
                </h4>

                {/* Rendimiento slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className={isDark ? "text-white/80" : "text-slate-700"}>Rendimiento Académico:</span>
                    <span className="font-bold text-cyan-500">{studentProfile.rendimiento}/100</span>
                  </div>
                  <input
                    id="input-calc-rendimiento"
                    type="range"
                    min="0"
                    max="100"
                    value={studentProfile.rendimiento}
                    onChange={(e) => setStudentProfile({ ...studentProfile, rendimiento: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Asistencia slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className={isDark ? "text-white/80" : "text-slate-700"}>Asistencia a Clases:</span>
                    <span className="font-bold text-cyan-500">{studentProfile.asistencia}%</span>
                  </div>
                  <input
                    id="input-calc-asistencia"
                    type="range"
                    min="0"
                    max="100"
                    value={studentProfile.asistencia}
                    onChange={(e) => setStudentProfile({ ...studentProfile, asistencia: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Distancia slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className={isDark ? "text-white/80" : "text-slate-700"}>Distancia al Colegio:</span>
                    <span className="font-bold text-cyan-500">{studentProfile.distancia_km} km</span>
                  </div>
                  <input
                    id="input-calc-distancia"
                    type="range"
                    min="0.5"
                    max="35"
                    step="0.5"
                    value={studentProfile.distancia_km}
                    onChange={(e) => setStudentProfile({ ...studentProfile, distancia_km: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Motivacion slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className={isDark ? "text-white/80" : "text-slate-700"}>Motivación Intrínseca:</span>
                    <span className="font-bold text-cyan-500">{studentProfile.motivacion}/100</span>
                  </div>
                  <input
                    id="input-calc-motivacion"
                    type="range"
                    min="0"
                    max="100"
                    value={studentProfile.motivacion}
                    onChange={(e) => setStudentProfile({ ...studentProfile, motivacion: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Edad slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className={isDark ? "text-white/80" : "text-slate-700"}>Edad:</span>
                    <span className="font-bold text-cyan-500">{studentProfile.edad} años</span>
                  </div>
                  <input
                    id="input-calc-edad"
                    type="range"
                    min="11"
                    max="19"
                    value={studentProfile.edad}
                    onChange={(e) => setStudentProfile({ ...studentProfile, edad: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Binary Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                    <label className="block text-[11px] font-mono mb-2">Apoyo Familiar</label>
                    <div className="flex gap-2">
                      <button
                        id="btn-toggle-apoyo-si"
                        onClick={() => setStudentProfile({ ...studentProfile, apoyo_familiar: 1 })}
                        className={`flex-1 py-1 rounded text-xs font-mono ${studentProfile.apoyo_familiar === 1 ? "bg-emerald-600 text-white font-bold" : isDark ? "bg-white/5" : "bg-slate-200"}`}
                      >
                        Sí
                      </button>
                      <button
                        id="btn-toggle-apoyo-no"
                        onClick={() => setStudentProfile({ ...studentProfile, apoyo_familiar: 0 })}
                        className={`flex-1 py-1 rounded text-xs font-mono ${studentProfile.apoyo_familiar === 0 ? "bg-rose-600 text-white font-bold" : isDark ? "bg-white/5" : "bg-slate-200"}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                    <label className="block text-[11px] font-mono mb-2">Acceso a Internet</label>
                    <div className="flex gap-2">
                      <button
                        id="btn-toggle-internet-si"
                        onClick={() => setStudentProfile({ ...studentProfile, acceso_internet: 1 })}
                        className={`flex-1 py-1 rounded text-xs font-mono ${studentProfile.acceso_internet === 1 ? "bg-emerald-600 text-white font-bold" : isDark ? "bg-white/5" : "bg-slate-200"}`}
                      >
                        Sí
                      </button>
                      <button
                        id="btn-toggle-internet-no"
                        onClick={() => setStudentProfile({ ...studentProfile, acceso_internet: 0 })}
                        className={`flex-1 py-1 rounded text-xs font-mono ${studentProfile.acceso_internet === 0 ? "bg-rose-600 text-white font-bold" : isDark ? "bg-white/5" : "bg-slate-200"}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Risk Gauge & Classification & Recommendations */}
              <div className="lg:col-span-7 space-y-6">
                {/* Risk Gauge & Tier Badge Card */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Semi-donut Gauge Chart */}
                    <div className="w-56 h-36 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Verde (0-40%)", value: 40, fill: "#10B981" },
                              { name: "Amarillo (40-70%)", value: 30, fill: "#F59E0B" },
                              { name: "Rojo (70-100%)", value: 30, fill: "#EF4444" },
                            ]}
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            cx="50%"
                            cy="90%"
                            innerRadius={65}
                            outerRadius={95}
                            stroke="none"
                          >
                            <Cell fill="#10B981" />
                            <Cell fill="#F59E0B" />
                            <Cell fill="#EF4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Gauge Numeric Overlay */}
                      <div className="absolute bottom-2 text-center">
                        <span className="text-3xl font-extrabold font-mono text-white">
                          {prediction.probability}%
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                          Riesgo Estimado
                        </div>
                      </div>
                    </div>

                    {/* Alert Status Banner */}
                    <div className="flex-1 text-center sm:text-left">
                      {prediction.riskLevel === "ALERTA_ROJA" && (
                        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            <span>🔴 ALERTA ROJA (RIESGO ALTO)</span>
                          </div>
                          <p className="text-xs text-rose-300/80 mt-1 font-mono">
                            Anticipación: {prediction.anticipationWindow}
                          </p>
                        </div>
                      )}

                      {prediction.riskLevel === "RIESGO_MODERADO" && (
                        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span>🟡 RIESGO MODERADO</span>
                          </div>
                          <p className="text-xs text-amber-300/80 mt-1 font-mono">
                            Anticipación: {prediction.anticipationWindow}
                          </p>
                        </div>
                      )}

                      {prediction.riskLevel === "SIN_ALERTA" && (
                        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>🟢 SIN ALERTA (BAJO RIESGO)</span>
                          </div>
                          <p className="text-xs text-emerald-300/80 mt-1 font-mono">
                            Anticipación: {prediction.anticipationWindow}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Factor Contribution Waterfall Bar */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Desglose de Contribución de Factores al Riesgo
                  </h4>
                  <p className={`text-xs mb-3 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                    Valores positivos incrementan el riesgo relativo; valores negativos actúan como amortiguadores/protectores.
                  </p>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={prediction.factorContributions}
                        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"} />
                        <XAxis type="number" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 }} />
                        <YAxis dataKey="label" type="category" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#0A0C10" : "#ffffff",
                            borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        />
                        <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
                        <Bar
                          dataKey="contribution"
                          name="Impacto (%)"
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            const isPositive = payload.contribution >= 0;
                            const fill = isPositive ? "#EF4444" : "#10B981";
                            return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />;
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Actionable Interventions Catalog */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0A0C10] border-white/10" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Recomendaciones e Intervenciones Priorizadas
                  </h4>

                  <div className="space-y-2.5">
                    {prediction.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border flex items-start gap-3 ${
                          rec.priority === "Alta"
                            ? isDark
                              ? "bg-rose-500/10 border-rose-500/30"
                              : "bg-rose-50 border-rose-200"
                            : isDark
                            ? "bg-white/5 border-white/5"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold mt-0.5 ${
                            rec.priority === "Alta"
                              ? "bg-rose-500 text-white"
                              : rec.priority === "Media"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-500 text-white"
                          }`}
                        >
                          {rec.priority}
                        </span>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {rec.title}
                            </h5>
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                              {rec.category}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-slate-600"}`}>
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PostgreSQL Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${isDark ? "bg-[#0D1117] border-white/10" : "bg-white border-slate-200"} shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  Conexión PostgreSQL
                </h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Host</label>
                <input
                  type="text"
                  value={dbConfig.host}
                  onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Puerto</label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) })}
                    className={`w-full px-3 py-1.5 rounded border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base de Datos</label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={dbConfig.user}
                    onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tabla</label>
                  <input
                    type="text"
                    value={dbConfig.tableName}
                    onChange={(e) => setDbConfig({ ...dbConfig, tableName: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded border ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"}`}
                  />
                </div>
              </div>

              {dbStatusMsg && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    dbStatusMsg.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {dbStatusMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowDbModal(false)}
                  className={`px-3 py-1.5 rounded border ${isDark ? "border-white/10 text-white/60" : "border-slate-300 text-slate-600"}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConnectDb}
                  disabled={isConnectingDb}
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isConnectingDb && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{isConnectingDb ? "Conectando..." : "Conectar & Extraer"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
