/**
 * Agile Scrum Management Board & Product Backlog Studio
 * Complete Project Vision, 15 User Stories (118 Story Points), 3 Sprints & Burndown Charts
 */

import React, { useState } from "react";
import {
  Trello,
  CheckCircle2,
  Clock,
  UserCheck,
  Award,
  AlertCircle,
  TrendingDown,
  Filter,
  Search,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldAlert,
  Flame,
  Check
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface UserStory {
  id: string;
  role: "Administrador" | "Investigador Científico" | "Analista de Políticas" | "Trabajador Social";
  title: string;
  statement: string;
  points: number;
  priority: "Must Have" | "Should Have" | "Could Have";
  sprint: number; // 1, 2, or 3
  status: "Done" | "In Progress" | "Testing" | "Backlog";
  acceptanceCriteria: string[];
}

const PRODUCT_BACKLOG: UserStory[] = [
  // ROLE: Administrador (4 Stories - 26 pts)
  {
    id: "US-001",
    role: "Administrador",
    title: "Gestión de Roles y Control de Acceso RBAC",
    statement: "Como Administrador de la plataforma, quiero gestionar credenciales y roles con permisos diferenciados (Investigador, Analista, Operador) para proteger la privacidad de los microdatos confidenciales.",
    points: 8,
    priority: "Must Have",
    sprint: 1,
    status: "Done",
    acceptanceCriteria: [
      "Dado un usuario autenticado, cuando intente acceder a microdatos crudos, solo se le permitirá si posee rol 'Investigador' o 'Admin'.",
      "El sistema debe auditar los accesos en un log inmutable de seguridad."
    ]
  },
  {
    id: "US-002",
    role: "Administrador",
    title: "Pipeline Automatizado de MICE & Limpieza",
    statement: "Como Administrador de datos, quiero ejecutar un pipeline automatizado de imputación múltiple por ecuaciones encadenadas (MICE) para tratar valores nulos en encuestas longitudinales.",
    points: 8,
    priority: "Must Have",
    sprint: 1,
    status: "Done",
    acceptanceCriteria: [
      "El algoritmo MICE debe converger en menos de 10 iteraciones por variable con RMSE < 0.03.",
      "Se debe emitir un reporte de bondad de ajuste post-imputación."
    ]
  },
  {
    id: "US-003",
    role: "Administrador",
    title: "Monitoreo de Salud de Contenedores y Latencia",
    statement: "Como Administrador de infraestructura, quiero monitorear el uso de memoria RAM y latencia de inferencia de los modelos para escalar los pods de cálculo predictivo.",
    points: 5,
    priority: "Should Have",
    sprint: 2,
    status: "Done",
    acceptanceCriteria: [
      "Alerta visual cuando el consumo de RAM supere el 80% o la latencia exceda 100ms.",
      "Métricas de uptime disponibles en tiempo real."
    ]
  },
  {
    id: "US-004",
    role: "Administrador",
    title: "Exportación Masiva y Backups de Cohortes HDT",
    statement: "Como Administrador del sistema, quiero exportar snapshots cifrados de las cohortes simuladas para archivado institucional y cumplimiento normativo.",
    points: 5,
    priority: "Could Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Exportación en formato JSON y Parquet con compresión gzip.",
      "Verificación de hash SHA-256 para integridad de datos."
    ]
  },

  // ROLE: Investigador Científico (4 Stories - 33 pts)
  {
    id: "US-005",
    role: "Investigador Científico",
    title: "Calibración del Hiper-Espacio 5D de Capitales HDT",
    statement: "Como Investigador en Economía Social, quiero modelar el estado del agente como un vector 5D (Cognitivo, Humano, Social, Psicológico, Estructural) para capturar no-linealidades en la acumulación de capital.",
    points: 13,
    priority: "Must Have",
    sprint: 1,
    status: "Done",
    acceptanceCriteria: [
      "Cada agente debe instanciarse con distribuciones basadas en microdatos NIDS/POF/IHDS.",
      "Las correlaciones empíricas entre capitales deben verificarse con r > 0.60."
    ]
  },
  {
    id: "US-006",
    role: "Investigador Científico",
    title: "Motor de Aprendizaje por Refuerzo Deep RL para Agentes",
    statement: "Como Investigador, quiero simular la toma de decisiones vitales (educación, esfuerzo, búsqueda de empleo) mediante agentes RL con redes neuronales para modelar racionalidad acotada.",
    points: 13,
    priority: "Must Have",
    sprint: 2,
    status: "Done",
    acceptanceCriteria: [
      "Los agentes deben optimizar su utilidad intertemporal descontada con factor beta=0.96.",
      "La política de decisión debe reproducir tasas empíricas de deserción escolar."
    ]
  },
  {
    id: "US-007",
    role: "Investigador Científico",
    title: "Descomposición de Canales Oaxaca-Blinder & Shapley",
    statement: "Como Econometrista, quiero descomponer la varianza de la movilidad social en canales estructurales, familiares e institucionales para aislar el peso del origen socioeconómico.",
    points: 5,
    priority: "Should Have",
    sprint: 2,
    status: "Done",
    acceptanceCriteria: [
      "La descomposición debe sumar exactamente 100% de la brecha observada.",
      "Visualización en gráfico interactivo de barras de contribución porcentual."
    ]
  },
  {
    id: "US-008",
    role: "Investigador Científico",
    title: "Validación de Hechos Estilizados (5/5 Hypotheses Check)",
    statement: "Como Científico de Datos, quiero verificar automáticamente que la simulación cumpla las 5 leyes empíricas de movilidad intergeneracional de la literatura internacional.",
    points: 2,
    priority: "Must Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Confirmación de la Curva de Great Gatsby (R² > 0.85).",
      "Validación de asimetría de género y penalidad de segregación espacial."
    ]
  },

  // ROLE: Analista de Políticas (4 Stories - 36 pts)
  {
    id: "US-009",
    role: "Analista de Políticas",
    title: "Policy Studio: Simulación Contrafactual de Reformas",
    statement: "Como Analista de Políticas Públicas, quiero ajustar deslizadores de política (Impuesto a la Herencia, Desegregación, Cuotas, CCTs) para evaluar su impacto antes de implementar leyes.",
    points: 13,
    priority: "Must Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "El motor debe recalcular el Gini proyectado, el IGE y la tasa Q1->Q5 en tiempo real.",
      "Presupuesto de políticas con presets precargados (Nórdico, Brasil, Sudáfrica)."
    ]
  },
  {
    id: "US-010",
    role: "Analista de Políticas",
    title: "Explorador 3D WebGL de Trayectorias de Vida",
    statement: "Como Evaluador de impacto, quiero visualizar las líneas de vida de 1,000 agentes en un lienzo 3D interactivo para comunicar los cuellos de botella de movilidad a tomadores de decisión.",
    points: 13,
    priority: "Must Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Lienzo WebGL Three.js con rotación orbital de cámara, zoom y selección de nodos.",
      "Modos de visualización: Líneas de Vida, Hiper-Espacio HDT, Redes de Homofilia y Superficie Gatsby."
    ]
  },
  {
    id: "US-011",
    role: "Analista de Políticas",
    title: "Auditoría Ética & Algorithmic Impact Assessment (EIA)",
    statement: "Como Especialista en Ética de IA, quiero certificar el cumplimiento del estándar IEEE 7000-2021 verificando Paridad de Género, Regla de 4/5 e Impacto Dispar.",
    points: 5,
    priority: "Should Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Ratio de Paridad Demográfica > 0.90 y Regla de 4/5 validada.",
      "Descarga de reporte formal de cumplimiento en JSON."
    ]
  },
  {
    id: "US-012",
    role: "Analista de Políticas",
    title: "Generador de Informes Ejecutivos en PDF y Excel",
    statement: "Como Asesor de Gabinete, quiero descargar informes ejecutivos con microdatos y gráficos para fundamentar proyectos de ley presupuestarios.",
    points: 5,
    priority: "Should Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Generación de reportes estructurados con resumen ejecutivo y tablas de matriz de transición.",
      "Exportación directa de microdatos en formato XLSX / CSV."
    ]
  },

  // ROLE: Trabajador Social / Operador Territorial (3 Stories - 23 pts)
  {
    id: "US-013",
    role: "Trabajador Social",
    title: "Semáforo Territorial de Riesgo de Trampa de Pobreza",
    statement: "Como Operador Territorial, quiero identificar hogares con probabilidad > 75% de persistencia en trampa para priorizar visitas y asignación de subsidios de transporte y guarderías.",
    points: 8,
    priority: "Must Have",
    sprint: 2,
    status: "Done",
    acceptanceCriteria: [
      "Visualización clara de categorías de severidad: Baja, Moderada, Crónica y Estructural.",
      "Cálculo estimado de años requeridos para transición de quintil."
    ]
  },
  {
    id: "US-014",
    role: "Trabajador Social",
    title: "Explicabilidad XAI con SHAP Values por Hogar",
    statement: "Como Trabajador Social, quiero ver los 5 factores principales que frenan a una familia particular para diseñar un plan de acompañamiento familiar personalizado.",
    points: 8,
    priority: "Must Have",
    sprint: 3,
    status: "Done",
    acceptanceCriteria: [
      "Gráfico de barras con los 5 determinantes sociales de mayor impacto relativo.",
      "Prescripción automática de política óptima individualizada."
    ]
  },
  {
    id: "US-015",
    role: "Trabajador Social",
    title: "Simulador Contrafactual 'What-If' para Planes de Vida",
    statement: "Como Consejero Vocacional, quiero simular el efecto de una beca técnica o inserción en pasantías formales en la trayectoria futura de un joven vulnerable.",
    points: 7,
    priority: "Should Have",
    sprint: 3,
    status: "In Progress",
    acceptanceCriteria: [
      "Deslizador interactivo de aumento de Capital Humano/Social con recálculo instantáneo de salario final.",
      "Comparación visual de trayectoria 'Sin Beca' vs 'Con Beca'."
    ]
  },
];

// Burndown Chart Data across 3 Sprints (Sprint 1: 31pts, Sprint 2: 34pts, Sprint 3: 53pts => 118 Total Points)
const BURNDOWN_SPRINT_DATA = [
  { day: "Día 1", ideal: 118, actual: 118, remaining: 118 },
  { day: "Día 4", ideal: 106, actual: 110, remaining: 110 },
  { day: "Día 8 (Fin Sprint 1)", ideal: 87, actual: 87, remaining: 87 }, // -31 pts
  { day: "Día 12", ideal: 74, actual: 78, remaining: 78 },
  { day: "Día 16 (Fin Sprint 2)", ideal: 53, actual: 53, remaining: 53 }, // -34 pts
  { day: "Día 20", ideal: 35, actual: 32, remaining: 32 },
  { day: "Día 24", ideal: 18, actual: 14, remaining: 14 },
  { day: "Día 28 (Sprint 3 Active)", ideal: 0, actual: 7, remaining: 7 }, // 111 pts done, 7 in progress
];

export function ScrumBoardView() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isEs = language === "es";

  const [activeScrumTab, setActiveScrumTab] = useState<"vision" | "backlog" | "kanban" | "burndown">("vision");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedSprint, setSelectedSprint] = useState<string>("ALL");
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>("US-009");

  // Summary KPIs
  const totalPoints = PRODUCT_BACKLOG.reduce((acc, curr) => acc + curr.points, 0); // 118
  const donePoints = PRODUCT_BACKLOG.filter((s) => s.status === "Done").reduce((acc, curr) => acc + curr.points, 0);
  const completionRate = Math.round((donePoints / totalPoints) * 100);

  // Filtered stories
  const filteredStories = PRODUCT_BACKLOG.filter((story) => {
    const roleMatch = selectedRole === "ALL" || story.role === selectedRole;
    const sprintMatch = selectedSprint === "ALL" || String(story.sprint) === selectedSprint;
    return roleMatch && sprintMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div
        className={`p-5 rounded-xl border shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDark
            ? "bg-gradient-to-r from-[#0D1016] via-[#111622] to-[#0D1016] border-cyan-500/20"
            : "bg-gradient-to-r from-white via-cyan-50/50 to-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Trello className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold tracking-wide font-mono uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
                {isEs ? "Tablero de Gestión Ágil SCRUM & Product Backlog" : "Agile Scrum Management Board & Backlog"}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                118 STORY POINTS // 3 SPRINTS
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? "text-white/60" : "text-slate-600"}`}>
              {isEs
                ? "Metodología ágil aplicada al desarrollo del Gemelo Digital Social (HDT-ABM-RL) con 15 Historias de Usuario."
                : "Agile Scrum framework for the Social Mobility Digital Twin with 15 User Stories across 4 roles."}
            </p>
          </div>
        </div>

        {/* Global Scrum Navigation Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border font-mono text-xs" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}>
          {[
            { id: "vision", label: isEs ? "Visión del Proyecto" : "Project Vision" },
            { id: "backlog", label: isEs ? "Product Backlog (15 US)" : "Product Backlog (15 US)" },
            { id: "kanban", label: isEs ? "Tablero Kanban" : "Kanban Board" },
            { id: "burndown", label: isEs ? "Burndown Chart" : "Burndown Chart" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveScrumTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition ${
                activeScrumTab === tab.id
                  ? "bg-cyan-500 text-black font-bold shadow-sm"
                  : isDark
                  ? "text-white/60 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: VISIÓN DEL PROYECTO & METAS ESTRATÉGICAS */}
      {/* ========================================================================= */}
      {activeScrumTab === "vision" && (
        <div className="space-y-6">
          {/* Main Strategic Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-cyan-500/30" : "bg-white border-slate-200"}`}>
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                1. Romper la Persistencia Intergeneracional
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-slate-600"}`}>
                Reducir la elasticidad intergeneracional de ingresos (IGE) de 0.68 a menos de 0.45 en 10 años mediante políticas tempranas focalizadas en segregación y educación preescolar.
              </p>
              <div className="pt-2 text-[11px] font-mono text-cyan-400 font-bold">
                KPI Target: IGE &lt; 0.45 (Nivel OCDE)
              </div>
            </div>

            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-emerald-500/30" : "bg-white border-slate-200"}`}>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                2. Detección Temprana de Trampas (≥ 85% Precisión)
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-slate-600"}`}>
                Identificar con alta precisión los hogares y jóvenes en riesgo de inmovilidad crónica mediante modelos ensemble de Deep Learning (LSTM-Autoencoder + XGBoost) con valor F1 &ge; 0.90.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-400 font-bold">
                KPI Target: F1-Score &ge; 0.90 // AUC-ROC &ge; 0.94
              </div>
            </div>

            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-indigo-500/30" : "bg-white border-slate-200"}`}>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className={`text-sm font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                3. Optimización del Gasto Social Público
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-white/60" : "text-slate-600"}`}>
                Proveer un entorno contrafactual digital para simular el retorno social por cada dólar invertido en programas sociales, maximizando el ascenso del quintil 1 al quintil 5.
              </p>
              <div className="pt-2 text-[11px] font-mono text-indigo-400 font-bold">
                KPI Target: Ascenso Q1➔Q5 &gt; 15% (Efecto +3.8x)
              </div>
            </div>
          </div>

          {/* Project Metrics Summary Bar */}
          <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                {isEs ? "Estado de Avance General del Proyecto" : "General Project Progress"}
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400">{completionRate}% COMPLETADO (111 / 118 PTS)</span>
            </div>

            <div className={`w-full h-3 rounded-full overflow-hidden mb-4 ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
              <div className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 rounded-full" style={{ width: `${completionRate}%` }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-center">
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <span className="text-[10px] text-white/40 block">Historias Totales</span>
                <span className="text-sm font-bold text-white">15 Historias (US)</span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <span className="text-[10px] text-white/40 block">Story Points</span>
                <span className="text-sm font-bold text-cyan-400">118 Puntos</span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <span className="text-[10px] text-white/40 block">Sprints Ejecutados</span>
                <span className="text-sm font-bold text-emerald-400">3 Sprints (2 Cerrados, 1 Activo)</span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <span className="text-[10px] text-white/40 block">Roles de Usuario</span>
                <span className="text-sm font-bold text-indigo-400">4 Roles Diferenciados</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: PRODUCT BACKLOG (15 USER STORIES) */}
      {/* ========================================================================= */}
      {activeScrumTab === "backlog" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={isDark ? "text-white/40" : "text-slate-500"}>Filtrar por Rol:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  isDark ? "bg-[#050608] border-white/20 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              >
                <option value="ALL">Todos los Roles (4)</option>
                <option value="Administrador">Administrador</option>
                <option value="Investigador Científico">Investigador Científico</option>
                <option value="Analista de Políticas">Analista de Políticas</option>
                <option value="Trabajador Social">Trabajador Social</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={isDark ? "text-white/40" : "text-slate-500"}>Sprint:</span>
              <select
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  isDark ? "bg-[#050608] border-white/20 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              >
                <option value="ALL">Todos los Sprints (1, 2 y 3)</option>
                <option value="1">Sprint 1 (31 pts)</option>
                <option value="2">Sprint 2 (34 pts)</option>
                <option value="3">Sprint 3 (53 pts)</option>
              </select>
            </div>
          </div>

          {/* User Stories List */}
          <div className="space-y-3">
            {filteredStories.map((story) => {
              const isExpanded = expandedStoryId === story.id;
              return (
                <div
                  key={story.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDark ? "bg-[#0D1016] border-white/10 hover:border-cyan-500/40" : "bg-white border-slate-200 hover:border-cyan-400"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => setExpandedStoryId(isExpanded ? null : story.id)}>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-center">
                        {story.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                            {story.title}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${
                            story.role === "Administrador"
                              ? "bg-purple-500/20 text-purple-400"
                              : story.role === "Investigador Científico"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : story.role === "Analista de Políticas"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}>
                            {story.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-bold">
                        {story.points} Story Points
                      </span>
                      <span className="text-[11px] text-white/50">Sprint {story.sprint}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        story.status === "Done"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {story.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </div>

                  {/* Expanded Criteria Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3 font-mono text-xs">
                      <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                        <span className="text-[10px] uppercase text-cyan-400 font-bold block mb-1">Enunciado Ágil:</span>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-white/80" : "text-slate-700"}`}>{story.statement}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1.5">Criterios de Aceptación (Gherkin):</span>
                        <ul className="space-y-1.5 text-[11px] text-white/70 pl-2">
                          {story.acceptanceCriteria.map((crit, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{crit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: TABLERO KANBAN */}
      {/* ========================================================================= */}
      {activeScrumTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          {/* Column: Backlog / To Do */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white/60 uppercase">To Do (0 US)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5">0 pts</span>
            </div>
            <div className="text-center py-6 text-[11px] text-white/30 italic">
              No hay historias pendientes en cola.
            </div>
          </div>

          {/* Column: In Progress */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-amber-500/20" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-amber-400 uppercase">In Progress (1 US)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">7 pts</span>
            </div>

            <div className={`p-3 rounded-lg border border-amber-500/30 ${isDark ? "bg-amber-500/5" : "bg-amber-50"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-amber-400">US-015</span>
                <span className="text-[9px] text-white/40">7 pts</span>
              </div>
              <h5 className={`font-bold font-sans text-xs mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                Simulador Contrafactual 'What-If'
              </h5>
              <span className="text-[10px] text-orange-400">Trabajador Social</span>
            </div>
          </div>

          {/* Column: Code Review / Testing */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-indigo-500/20" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-indigo-400 uppercase">Testing / QA (0 US)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">0 pts</span>
            </div>
            <div className="text-center py-6 text-[11px] text-white/30 italic">
              Todas las revisiones de código aprobadas.
            </div>
          </div>

          {/* Column: Done */}
          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-emerald-500/20" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-emerald-400 uppercase">Done (14 US)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">111 pts</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {PRODUCT_BACKLOG.filter((s) => s.status === "Done").map((s) => (
                <div key={s.id} className={`p-2.5 rounded-lg border border-emerald-500/20 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-bold text-cyan-400">{s.id}</span>
                    <span className="text-[9px] text-emerald-400 font-bold">{s.points} pts</span>
                  </div>
                  <div className={`font-sans font-semibold text-xs line-clamp-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                    {s.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: SPRINT BURNDOWN CHART */}
      {/* ========================================================================= */}
      {activeScrumTab === "burndown" && (
        <div className="space-y-6">
          <div className={`p-5 rounded-xl border space-y-4 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  {isEs ? "Gráfico Burndown Acumulado (118 Story Points a través de 3 Sprints)" : "Cumulative Sprint Burndown Chart"}
                </h3>
                <p className={`text-[11px] mt-0.5 ${isDark ? "text-white/50" : "text-slate-500"}`}>
                  Sprint 1 (31 pts) + Sprint 2 (34 pts) + Sprint 3 (53 pts) = 118 pts totales.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">VELOCIDAD: 39.3 PTS/SPRINT</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={BURNDOWN_SPRINT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis dataKey="day" tick={{ fill: isDark ? "#888" : "#555", fontSize: 10 }} />
                  <YAxis domain={[0, 130]} tick={{ fill: isDark ? "#888" : "#555", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? "#0A0C10" : "#FFF", fontSize: 11, fontFamily: "monospace" }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="ideal" name="Burndown Ideal (Lineal)" stroke="#71717A" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Puntos Restantes Reales" stroke="#10B981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5 text-center font-mono text-xs">
              <div className={`p-3 rounded-lg border border-emerald-500/20 ${isDark ? "bg-emerald-500/5" : "bg-emerald-50"}`}>
                <span className="text-[10px] text-emerald-400 block font-bold">Sprint 1: Fundaciones HDT</span>
                <span className="text-sm font-bold text-white">31 / 31 pts (100% Done)</span>
              </div>
              <div className={`p-3 rounded-lg border border-emerald-500/20 ${isDark ? "bg-emerald-500/5" : "bg-emerald-50"}`}>
                <span className="text-[10px] text-emerald-400 block font-bold">Sprint 2: Motor Predictivo IA</span>
                <span className="text-sm font-bold text-white">34 / 34 pts (100% Done)</span>
              </div>
              <div className={`p-3 rounded-lg border border-cyan-500/20 ${isDark ? "bg-cyan-500/5" : "bg-cyan-50"}`}>
                <span className="text-[10px] text-cyan-400 block font-bold">Sprint 3: 3D, Políticas & Ética</span>
                <span className="text-sm font-bold text-cyan-400">46 / 53 pts (87% Done)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
