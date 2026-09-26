import React, { useState } from "react";
import { SimulationResults } from "../types/simulation";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, Award, Zap, Download } from "lucide-react";

interface EthicsAuditViewProps {
  simulationResults: SimulationResults;
}

export const EthicsAuditView: React.FC<EthicsAuditViewProps> = ({ simulationResults }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { fairnessMetrics, shapValues, activePolicy, country } = simulationResults;
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadEIA = () => {
    const eiaContent = {
      assessment_id: `EIA-2026-${country.id.toUpperCase()}-${activePolicy.id.toUpperCase()}`,
      title: "Ethical Impact Assessment & Algorithmic Fairness Audit",
      date_generated: new Date().toISOString(),
      standards_evaluated: ["IEEE 7000-2021", "EU AI Act High-Risk Policy Sandbox", "OECD Recommendation on AI (2024)"],
      evaluated_country: country.name,
      evaluated_policy: activePolicy.name,
      summary_findings: {
        demographic_parity_gender: `${fairnessMetrics.demographicParityGender} (Compliance threshold >= 0.80)`,
        disparate_impact_minority: `${fairnessMetrics.disparateImpactMinority} (EEOC 80% Rule)`,
        equalized_odds_gap: `${fairnessMetrics.equalizedOddsDifference} (Target < 0.10)`,
      },
      shap_feature_importance: shapValues,
      prescriptive_guidance: [
        "The HDT-RL model must be used strictly for macro-policy evaluation and never for individual credit/social scoring.",
        "MICE multiple imputation is applied to prevent attrition bias across panel datasets."
      ]
    };

    const blob = new Blob([JSON.stringify(eiaContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EIA_Report_${country.id}_${activePolicy.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div id="ethics-audit-view-root" className="space-y-6 font-mono">
      {/* Top Banner: Ethical Standards Certification */}
      <div
        className={`rounded-xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4 font-sans transition-colors ${
          isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("ethics_title")}
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {t("ethics_sub")}
          </p>
        </div>

        <button
          id="btn-download-eia"
          onClick={handleDownloadEIA}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg border transition shadow-xs ${
            isDark
              ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
              : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-500" />
          {downloaded ? "REPORT_EXPORTED_JSON" : "EXPORT_EIA_REPORT.JSON"}
        </button>
      </div>

      {/* Fairness Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
        {/* Metric 1: Demographic Parity */}
        <div
          className={`rounded-xl p-5 shadow-2xl space-y-3 transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/70" : "text-slate-600"}`}>
              {t("fairness_parity")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {fairnessMetrics.demographicParityGender}
            </span>
            <span className={`text-xs font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>Ratio (M/F)</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"
              style={{ width: `${Math.min(100, fairnessMetrics.demographicParityGender * 100)}%` }}
            />
          </div>
          <p className={`text-[11px] leading-relaxed font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "Measures if upward social mobility probability is balanced across genders (Threshold >= 0.80)."
              : "Mide si la probabilidad de ascenso social es equilibrada entre géneros (Umbral >= 0.80)."}
          </p>
        </div>

        {/* Metric 2: Disparate Impact Ratio */}
        <div
          className={`rounded-xl p-5 shadow-2xl space-y-3 transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/70" : "text-slate-600"}`}>
              {t("fairness_impact")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {fairnessMetrics.disparateImpactMinority}
            </span>
            <span className={`text-xs font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>EEOC 80%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="h-full bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]"
              style={{ width: `${Math.min(100, fairnessMetrics.disparateImpactMinority * 100)}%` }}
            />
          </div>
          <p className={`text-[11px] leading-relaxed font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "Formal employment access rate for vulnerable groups vs reference group."
              : "Tasa de acceso a empleos formales en grupos vulnerables vs grupo de referencia."}
          </p>
        </div>

        {/* Metric 3: Equalized Odds */}
        <div
          className={`rounded-xl p-5 shadow-2xl space-y-3 transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/70" : "text-slate-600"}`}>
              {t("fairness_odds")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {fairnessMetrics.equalizedOddsDifference}
            </span>
            <span className={`text-xs font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>TPR Gap</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"
              style={{ width: `${Math.max(10, (1 - fairnessMetrics.equalizedOddsDifference) * 100)}%` }}
            />
          </div>
          <p className={`text-[11px] leading-relaxed font-mono ${isDark ? "text-white/40" : "text-slate-500"}`}>
            {language === "en"
              ? "True positive rate in tertiary admissions conditional on ability."
              : "Tasa de verdaderos positivos en admisiones terciarias condicional a habilidad."}
          </p>
        </div>
      </div>

      {/* SHAP Feature Attributions Waterfall */}
      <div
        className={`rounded-xl p-5 shadow-2xl font-sans transition-colors ${
          isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
            <Zap className="w-4 h-4 text-orange-500" />
            {t("shap_title")}
          </h3>
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">TREESHAP / KERNELSHAP</span>
        </div>
        <p className={`text-xs mb-4 ${isDark ? "text-white/40" : "text-slate-500"}`}>
          {language === "en"
            ? "Marginal contribution of each capital attribute to agent lifetime reward and terminal wage."
            : "Contribución marginal de cada factor en la recompensa acumulada y el salario terminal del agente."}
        </p>

        <div className="space-y-3 font-mono">
          {shapValues.map((item, idx) => {
            const isPositive = item.importance > 0;
            const widthPct = Math.abs(item.importance) * 200;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between gap-4 ${
                  isDark ? "bg-[#050608] border-white/10" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{item.feature}</span>
                    <span className={`font-mono font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isPositive ? `+${item.importance}` : `${item.importance}`} SHAP
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                    <div
                      className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, widthPct)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>{item.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
