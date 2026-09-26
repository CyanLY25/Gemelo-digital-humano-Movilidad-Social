import React from "react";
import { SimulationResults } from "../types/simulation";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Grid, BarChart3, TrendingDown, Layers, ArrowUpRight, HelpCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface MetricsViewProps {
  simulationResults: SimulationResults;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ simulationResults }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    transitionMatrix,
    estimatedIGE,
    estimatedGini,
    q1ToQ5MobilityRate,
    channelDecomposition,
    country
  } = simulationResults;

  // Format Gatsby Curve International Benchmark Points
  const gatsbyData = [
    { name: language === "en" ? "Denmark" : "Dinamarca", gini: 0.27, ige: 0.15, fill: "#10b981" },
    { name: language === "en" ? "Norway" : "Noruega", gini: 0.26, ige: 0.17, fill: "#10b981" },
    { name: language === "en" ? "Canada" : "Canadá", gini: 0.32, ige: 0.29, fill: "#06b6d4" },
    { name: language === "en" ? "Germany" : "Alemania", gini: 0.30, ige: 0.32, fill: "#3b82f6" },
    { name: language === "en" ? "United Kingdom" : "Reino Unido", gini: 0.35, ige: 0.50, fill: "#8b5cf6" },
    { name: language === "en" ? "United States" : "Estados Unidos", gini: 0.41, ige: 0.47, fill: "#f59e0b" },
    { name: "India (IHDS)", gini: 0.49, ige: 0.64, fill: "#f97316" },
    { name: "Brasil (POF)", gini: 0.53, ige: 0.58, fill: "#ec4899" },
    { name: "South Africa (NIDS)", gini: 0.63, ige: 0.68, fill: "#ef4444" },
    {
      name: `${language === "en" ? "Active Simulation" : "Simulación Activa"} (${country.name.split(" ")[0]})`,
      gini: estimatedGini,
      ige: estimatedIGE,
      fill: "#38bdf8",
      isCurrent: true,
    }
  ];

  const qLabels = [
    language === "en" ? "Q1 (Poorest)" : "Q1 (Más Pobre)",
    "Q2",
    "Q3",
    "Q4",
    language === "en" ? "Q5 (Richest)" : "Q5 (Más Rico)"
  ];

  const getCellColor = (val: number, isDiag: boolean) => {
    if (isDiag) {
      if (val > 0.5) return isDark ? "bg-rose-950/70 text-rose-300 border-rose-500/40" : "bg-rose-100 text-rose-800 border-rose-300";
      if (val > 0.35) return isDark ? "bg-amber-950/70 text-amber-300 border-amber-500/40" : "bg-amber-100 text-amber-800 border-amber-300";
      return isDark ? "bg-white/10 text-white border-white/10" : "bg-slate-100 text-slate-800 border-slate-300";
    }
    if (val > 0.15) return isDark ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40" : "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (val > 0.08) return isDark ? "bg-cyan-950/70 text-cyan-300 border-cyan-500/40" : "bg-cyan-100 text-cyan-800 border-cyan-300";
    return isDark ? "bg-[#050608] text-white/40 border-white/5" : "bg-slate-50 text-slate-500 border-slate-200";
  };

  return (
    <div id="metrics-view-root" className="space-y-6">
      {/* Top Econometric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`rounded-xl p-4 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <span className={`text-[10px] block font-mono uppercase tracking-wider ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {t("estimated_ige")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
              {estimatedIGE.toFixed(3)}
            </span>
            <span className="text-[10px] text-cyan-500 dark:text-cyan-400 font-mono">β_OLS</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {estimatedIGE > 0.5
              ? (language === "en" ? "High persistence (low social mobility)." : "Alta persistencia (baja movilidad).")
              : (language === "en" ? "Fluid social mobility." : "Movilidad social fluida.")}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <span className={`text-[10px] block font-mono uppercase tracking-wider ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {t("q1_to_q5_ascent")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400">
              {(q1ToQ5MobilityRate * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono font-medium">Top-Bottom</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "Conditional probability of rising from the bottom 20% to top 20%."
              : "Probabilidad condicional de ascenso del 20% más pobre al 20% más rico."}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <span className={`text-[10px] block font-mono uppercase tracking-wider ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {t("gini_index")}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
              {estimatedGini.toFixed(3)}
            </span>
            <span className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>Dispersion</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "Wage inequality among the 1,000 simulated agents."
              : "Desigualdad salarial entre los 1,000 agentes simulados."}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <span className={`text-[10px] block font-mono uppercase tracking-wider ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en" ? "Poverty Trap (Q1 ➔ Q1-Q2)" : "Trampa de Pobreza (Q1 ➔ Q1-Q2)"}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-orange-500 dark:text-orange-400">
              {((transitionMatrix[0][0] + transitionMatrix[0][1]) * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-orange-500 dark:text-orange-400 font-mono font-medium">Rigidity</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "Q1 descendants remaining trapped in the bottom 40%."
              : "Descendientes de Q1 que permanecen en el 40% inferior."}
          </p>
        </div>
      </div>

      {/* Main Grid: 5x5 Transition Matrix & Great Gatsby Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5x5 Intergenerational Transition Matrix */}
        <div
          className={`lg:col-span-6 rounded-xl p-5 shadow-2xl flex flex-col justify-between transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Grid className="w-4 h-4 text-cyan-500" />
                {t("matrix_title")}
              </h3>
              <span className="text-[10px] text-cyan-500 dark:text-cyan-400 font-mono">P(Child | Parent)</span>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-white/40" : "text-slate-500"}`}>
              {language === "en"
                ? "Each row sums to 100%. Main diagonal indicates dynastic persistence; corners indicate high mobility."
                : "Cada fila suma 100%. La diagonal principal refleja inercia dinástica; las esquinas reflejan movilidad extrema."}
            </p>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className={`p-2 text-[10px] font-semibold text-left font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
                      {language === "en" ? "Parent \\ Child" : "Padre \\ Hijo"}
                    </th>
                    {qLabels.map((ql, idx) => (
                      <th key={idx} className={`p-2 text-[10px] font-semibold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                        Q{idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transitionMatrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className={`p-2 text-xs font-semibold text-left font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
                        Q{rIdx + 1}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        const pct = (val * 100).toFixed(1);
                        return (
                          <td key={cIdx} className="p-1">
                            <div
                              className={`p-2.5 rounded border text-xs font-mono font-bold transition-all ${getCellColor(
                                val,
                                isDiag
                              )}`}
                              title={`Q${rIdx + 1} ➔ Q${cIdx + 1}: ${pct}%`}
                            >
                              {pct}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? "border-white/5 text-white/40" : "border-slate-200 text-slate-500"
            }`}
          >
            <span>
              {language === "en" ? "Poverty Inertia (Q1➔Q1): " : "Inercia en Pobreza (Q1➔Q1): "}
              <strong className="text-rose-500 dark:text-rose-400 font-bold">{(transitionMatrix[0][0] * 100).toFixed(1)}%</strong>
            </span>
            <span>
              {language === "en" ? "Elite Inertia (Q5➔Q5): " : "Inercia en Élite (Q5➔Q5): "}
              <strong className="text-orange-500 dark:text-orange-400 font-bold">{(transitionMatrix[4][4] * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Great Gatsby Curve Interactive Chart */}
        <div
          className={`lg:col-span-6 rounded-xl p-5 shadow-2xl flex flex-col justify-between transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                {t("gatsby_title")}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                CORAK / KRUEGER
              </span>
            </div>
            <p className={`text-xs mb-4 ${isDark ? "text-white/40" : "text-slate-500"}`}>
              {language === "en"
                ? "Empirical international correlation between income inequality (Gini) and dynastic persistence (IGE)."
                : "Correlación empírica internacional entre la desigualdad de ingresos (Gini) y la persistencia dinástica (IGE)."}
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <XAxis
                    type="number"
                    dataKey="gini"
                    name="Gini"
                    domain={[0.2, 0.7]}
                    tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10, fontFamily: "monospace" }}
                    label={{
                      value: language === "en" ? "Gini Coefficient" : "Coeficiente de Gini",
                      position: "insideBottom",
                      offset: -12,
                      fill: isDark ? "#94a3b8" : "#475569",
                      fontSize: 10,
                      fontFamily: "monospace"
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="ige"
                    name="IGE"
                    domain={[0.1, 0.8]}
                    tick={{ fill: isDark ? "#64748b" : "#475569", fontSize: 10, fontFamily: "monospace" }}
                    label={{
                      value: language === "en" ? "IGE (Persistence)" : "IGE (Persistencia)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 5,
                      fill: isDark ? "#94a3b8" : "#475569",
                      fontSize: 10,
                      fontFamily: "monospace"
                    }}
                  />
                  <ZAxis range={[70, 220]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          className={`p-2.5 rounded border text-xs shadow-2xl font-mono ${
                            isDark ? "bg-[#050608] border-white/10 text-white" : "bg-white border-slate-300 text-slate-900"
                          }`}
                        >
                          <strong className="text-cyan-500 block">{data.name}</strong>
                          <div className="mt-1">Gini: {data.gini.toFixed(3)}</div>
                          <div>IGE: {data.ige.toFixed(3)}</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter name="Países" data={gatsbyData}>
                    {gatsbyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke={entry.isCurrent ? (isDark ? "#ffffff" : "#0f172a") : "none"}
                        strokeWidth={entry.isCurrent ? 2 : 0}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className={`mt-2 text-[11px] font-mono p-2.5 rounded-lg border ${
              isDark ? "bg-[#050608] border-white/5 text-white/40" : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
              {language === "en" ? "ACTIVE NODE:" : "NODO ACTIVO:"}
            </span>{" "}
            {language === "en"
              ? "Simulated position. Targeted interventions push the economy toward the high-mobility Nordic cluster."
              : "Posición simulada. Intervenciones integradas desplazan la economía hacia el cuadrante nórdico de alta movilidad."}
          </div>
        </div>
      </div>

      {/* Oaxaca-Blinder / Shapley Channel Decomposition */}
      <div
        className={`rounded-xl p-5 shadow-2xl transition-colors ${
          isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-500" />
            {t("oaxaca_title")}
          </h3>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
            {language === "en" ? "VARIANCE ATTRIBUTION" : "ATRIBUCIÓN DE VARIANZA"}
          </span>
        </div>
        <p className={`text-xs mb-4 ${isDark ? "text-white/40" : "text-slate-500"}`}>
          {language === "en"
            ? "Percentage of child wage variance explained by each capital transmission channel."
            : "Porcentaje de la varianza en los ingresos filiales explicada por cada vector de capital."}
        </p>

        <div className="space-y-3 font-mono">
          {channelDecomposition.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{item.channel}</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{item.percentage}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-200 border-slate-300"}`}>
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className={`text-[10px] block font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
