/**
 * Orchestration Studio Component
 * Interactive visual console to execute, monitor and inspect
 * LangChain, LangGraph, and Langflow unified workflows in real time.
 */

import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  WorkflowOutput,
  IntentCategory,
} from "../services/orchestration/types";
import {
  GitFork,
  Cpu,
  Workflow,
  Send,
  CheckCircle2,
  Clock,
  Wrench,
  Bot,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  FileCode,
  Sliders,
  AlertTriangle,
} from "lucide-react";

export const OrchestrationStudio: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState(`thread-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<WorkflowOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Status & Connectivity
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [langflowFlows, setLangflowFlows] = useState<any[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch engine status
  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/orchestration/status");
      if (res.ok) {
        const data = await res.json();
        setEngineStatus(data);
      }

      const flowsRes = await fetch("/api/orchestration/flows");
      if (flowsRes.ok) {
        const flowsData = await flowsRes.json();
        setLangflowFlows(flowsData.flows || []);
      }
    } catch (err: any) {
      console.warn("Error checking orchestration status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Execute workflow
  const handleExecute = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/orchestration/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          sessionId,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || `HTTP ${response.status}`);
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err.message || "Error al ejecutar el flujo.");
    } finally {
      setIsRunning(false);
    }
  };

  const presetExamples = [
    {
      title: "Agente + Herramienta Gini (LangChain)",
      query: "Calcula el coeficiente de Gini para valor base 0.63 y meta 0.52",
      badge: "LangChain Tool",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Agente + Riesgo Escolar (LangChain)",
      query: "Evalúa el riesgo de deserción con asistencia 50%, notas 45 y 12 km de distancia",
      badge: "LangChain Tool",
      color: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    },
    {
      title: "Cadena Documental / RAG (LangChain)",
      query: "Consulta documental sobre evidencia empírica de deserción escolar",
      badge: "LangChain Chain",
      color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    },
    {
      title: "Flujo Visual Remoto (Langflow v1.x)",
      query: "Ejecutar flujo de Langflow de evaluación de impacto",
      badge: "Langflow API",
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isDark
            ? "bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20"
            : "bg-gradient-to-r from-indigo-50 via-white to-slate-50 border-indigo-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Módulo Desacoplado
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Activo & Listo
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Orquestador IA: LangGraph + LangChain + Langflow
            </h1>
            <p className={`text-xs max-w-3xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Módulo desacoplado de orquestación por grafos de estados finitos. Enruta consultas
              automáticamente entre herramientas de <strong>LangChain</strong>, cadenas documentales y
              flujos visuales de <strong>Langflow v1.x</strong> con memoria checkpointed vía{" "}
              <strong>LangGraph</strong>.
            </p>
          </div>

          <button
            onClick={checkStatus}
            disabled={statusLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium border transition-all ${
              isDark
                ? "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} />
            <span>Sincronizar Estado</span>
          </button>
        </div>

        {/* Status Pills */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200"}`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Grafo de Estados</div>
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mt-0.5">
              <GitFork className="w-3.5 h-3.5" />
              <span>LangGraph StateGraph</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200"}`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Herramientas & Tools</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>LangChain @core (3 Tools)</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200"}`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Cliente Langflow</div>
            <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5 mt-0.5">
              <Server className="w-3.5 h-3.5" />
              <span>v1.x ({engineStatus?.config?.langflowBaseUrl || "localhost:7860"})</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200"}`}>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Checkpointer</div>
            <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MemorySaver (Multi-Turn)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual State Graph Architecture Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isDark ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
              Topología del Grafo de Estados (LangGraph State Machine)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Thread activo: <code className="text-indigo-400 font-bold">{sessionId}</code>
          </span>
        </div>

        {/* Visual Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Step 1: Input */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDark ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Nodo Inicial</div>
              <div className="font-semibold text-xs mt-1 text-slate-200">START</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Recibe query, sesión e historial conversacional.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
              <span>➔</span> Continúa a clasificación
            </div>
          </div>

          {/* Step 2: Classifier */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              result?.intent
                ? "border-indigo-500/50 bg-indigo-500/10"
                : isDark
                ? "bg-black/30 border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Clasificación</div>
              <div className="font-semibold text-xs mt-1 text-indigo-300">classify_intent</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Analiza intenciones: <em>langflow</em>, <em>langchain</em> o <em>agent</em>.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-indigo-400">
              {result ? `Detectado: ${result.intent}` : "Ruteo condicional"}
            </div>
          </div>

          {/* Step 3: Conditional Branching */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDark ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Ramas de Ejecución</div>
              <div className="font-semibold text-xs mt-1 text-purple-300">3 Nodos Paralelos</div>
              <div className="mt-1 space-y-1 text-[10px] font-mono">
                <div className={result?.routeExecuted === "nodo_agent" ? "text-emerald-400 font-bold" : "text-slate-400"}>
                  • nodo_agent (Tools)
                </div>
                <div className={result?.routeExecuted === "nodo_langchain" ? "text-blue-400 font-bold" : "text-slate-400"}>
                  • nodo_langchain (RAG)
                </div>
                <div className={result?.routeExecuted === "nodo_langflow" ? "text-purple-400 font-bold" : "text-slate-400"}>
                  • nodo_langflow (API)
                </div>
              </div>
            </div>
            <div className="mt-3 text-[10px] font-mono text-purple-400">Ejecución aislada</div>
          </div>

          {/* Step 4: Validate Output */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              result
                ? "border-emerald-500/50 bg-emerald-500/10"
                : isDark
                ? "bg-black/30 border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Validación</div>
              <div className="font-semibold text-xs mt-1 text-emerald-300">validate_output</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Audita consistencia y previene salidas vacías.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-emerald-400">Verificado</div>
          </div>

          {/* Step 5: Checkpointer */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDark ? "bg-black/30 border-white/10" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Estado & Memoria</div>
              <div className="font-semibold text-xs mt-1 text-cyan-300">MemorySaver (END)</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Persiste checkpoint inmutable en memoria del hilo.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-cyan-400">Turno preservado</div>
          </div>
        </div>
      </div>

      {/* Interactive Execution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Ejemplos Rápidos de Verificación</span>
            </h3>

            <div className="space-y-2">
              {presetExamples.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.query);
                    handleExecute(item.query);
                  }}
                  disabled={isRunning}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{item.query}</p>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <label className="text-[11px] font-mono font-medium text-slate-400 block">
                Consulta Personalizada:
              </label>
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Escribe una pregunta para el agente, consulta documental o comando de flujo..."
                  rows={3}
                  className={`w-full p-3 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all ${
                    isDark
                      ? "bg-black/40 border-white/10 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="ID de Sesión"
                  className={`px-3 py-2 rounded-xl text-xs font-mono border w-36 focus:outline-none ${
                    isDark
                      ? "bg-black/30 border-white/10 text-slate-300"
                      : "bg-slate-100 border-slate-300 text-slate-700"
                  }`}
                  title="Thread ID para el checkpointer de LangGraph"
                />

                <button
                  onClick={() => handleExecute()}
                  disabled={isRunning || !query.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all shadow-md ${
                    isRunning || !query.trim()
                      ? "opacity-50 cursor-not-allowed bg-indigo-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98]"
                  }`}
                >
                  <Send className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                  <span>{isRunning ? "Orquestando..." : "Ejecutar en Grafo"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output & Trace Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-5 rounded-2xl border min-h-[380px] flex flex-col justify-between transition-all ${
              isDark ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                    Traza de Ejecución en Vivo (State Output)
                  </h3>
                </div>
                {result && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ruta: {result.routeExecuted}
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono mb-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Error en la ejecución:</span> {error}
                  </div>
                </div>
              )}

              {/* Response box */}
              {result ? (
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border font-mono text-xs leading-relaxed ${
                      isDark
                        ? "bg-black/50 border-emerald-500/30 text-emerald-300"
                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-sans font-semibold">
                      Salida Sintetizada y Validada:
                    </div>
                    {result.response}
                  </div>

                  {/* Execution Timeline */}
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                      Pasos Registrados en el Grafo:
                    </div>
                    <div className="space-y-1.5">
                      {result.executionSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between ${
                            isDark ? "bg-black/30 border-white/5" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-300">{step.node}</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Checkpointer card */}
                  <div
                    className={`p-3 rounded-xl border text-[11px] font-mono grid grid-cols-3 gap-2 text-center ${
                      isDark ? "bg-white/5 border-white/5 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="text-slate-400 text-[10px]">Herramientas</div>
                      <div className="font-bold text-indigo-400 mt-0.5">{String(result.metadata?.toolsUsed ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Mensajes en Hilo</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{String(result.metadata?.messagesCount ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Checkpointed</div>
                      <div className="font-bold text-cyan-400 mt-0.5">{result.stateCheckpointed ? "SÍ (Memoria)" : "NO"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <Workflow className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
                  <p className="text-xs font-mono">
                    Selecciona uno de los ejemplos de la izquierda o escribe una consulta para ejecutar
                    el flujo en vivo en el grafo de estados.
                  </p>
                </div>
              )}
            </div>

            {/* Footer API Info */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Endpoint: POST /api/orchestration/run</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                API Lista
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
