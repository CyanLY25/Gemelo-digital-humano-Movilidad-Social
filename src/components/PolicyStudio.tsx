import React, { useState } from "react";
import { CountryCalibration, PolicyParams, SimulationResults } from "../types/simulation";
import { COUNTRY_CALIBRATIONS, PRESET_POLICIES } from "../services/simulationEngine";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Sliders, Zap, Award, Building2, Baby, MapPin, RefreshCw, Layers, TrendingDown, TrendingUp } from "lucide-react";

interface PolicyStudioProps {
  currentCountry: CountryCalibration;
  activePolicy: PolicyParams;
  simulationResults: SimulationResults;
  onCountryChange: (countryId: string) => void;
  onPolicyChange: (policy: PolicyParams) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const PolicyStudio: React.FC<PolicyStudioProps> = ({
  currentCountry,
  activePolicy,
  simulationResults,
  onCountryChange,
  onPolicyChange,
  onRunSimulation,
  isSimulating,
}) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [customParams, setCustomParams] = useState<PolicyParams>(activePolicy);

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_POLICIES[presetKey];
    if (preset) {
      setCustomParams(preset);
      onPolicyChange(preset);
    }
  };

  const handleSliderChange = (field: keyof PolicyParams, value: any) => {
    const updated = {
      ...customParams,
      [field]: value,
      id: "custom",
      name: language === "en" ? "Custom Scenario" : "Escenario Personalizado"
    };
    setCustomParams(updated);
    onPolicyChange(updated);
  };

  return (
    <div id="policy-studio-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
      {/* Left Column: Country & Policy Scenario Selector */}
      <div className="lg:col-span-4 space-y-5 font-sans">
        {/* Country Profile Card */}
        <div
          className={`rounded-xl p-5 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-cyan-500" />
              {t("country_context")}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold">
              MICE_CALIBRATED
            </span>
          </div>

          <label className={`block text-xs mb-1.5 font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>
            {t("select_country_survey")}
          </label>
          <select
            id="country-selector-dropdown"
            value={currentCountry.id}
            onChange={(e) => onCountryChange(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 transition ${
              isDark
                ? "bg-[#050608] border border-white/10 text-white"
                : "bg-slate-50 border border-slate-300 text-slate-800"
            }`}
          >
            {Object.values(COUNTRY_CALIBRATIONS).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div
            className={`mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs font-mono ${
              isDark ? "border-white/5" : "border-slate-200"
            }`}
          >
            <div className={`p-2 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <span className={`block text-[10px] uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("hist_gini")}</span>
              <strong className={`text-sm font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{currentCountry.baselineGini}</strong>
            </div>
            <div className={`p-2 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <span className={`block text-[10px] uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("hist_ige")}</span>
              <strong className="text-cyan-600 dark:text-cyan-400 text-sm font-mono">{currentCountry.baselineIGE}</strong>
            </div>
            <div className={`p-2 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <span className={`block text-[10px] uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("mobility_q1_q5")}</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">{(currentCountry.q1ToQ5Mobility * 100).toFixed(1)}%</strong>
            </div>
            <div className={`p-2 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
              <span className={`block text-[10px] uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("gender_gap")}</span>
              <strong className="text-orange-600 dark:text-orange-400 text-sm font-mono">{(currentCountry.genderWageGap * 100).toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* Preset Scenarios Cards */}
        <div
          className={`rounded-xl p-5 shadow-2xl space-y-3 transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2 font-mono ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-500" />
            {t("counterfactual_scenarios")}
          </h3>

          {Object.entries(PRESET_POLICIES).map(([key, policy]) => {
            const isSelected = activePolicy.id === policy.id;
            return (
              <button
                key={key}
                id={`policy-btn-${key}`}
                onClick={() => handlePresetSelect(key)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? isDark
                      ? "bg-white/10 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] text-white"
                      : "bg-cyan-50 border-cyan-500 shadow-xs text-slate-900"
                    : isDark
                    ? "bg-white/5 border-white/5 hover:border-white/10 text-white/70 hover:text-white"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold tracking-wide ${isDark ? "text-white" : "text-slate-900"}`}>
                    {policy.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_#22d3ee]"></span>
                  )}
                </div>
                <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed font-sans ${isDark ? "text-white/50" : "text-slate-500"}`}>
                  {policy.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Policy Parameter Sandbox & Live Simulator Controls */}
      <div className="lg:col-span-8 space-y-5 font-sans">
        <div
          className={`rounded-xl p-5 shadow-2xl transition-colors ${
            isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b ${
              isDark ? "border-white/5" : "border-slate-200"
            }`}
          >
            <div>
              <h2
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <Sliders className="w-4 h-4 text-cyan-500" />
                {t("structural_lab")}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("structural_lab_sub")}
              </p>
            </div>

            <button
              id="run-simulation-btn"
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold tracking-wider rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] transition disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
              {isSimulating ? t("simulating") : t("run_sim_btn")}
            </button>
          </div>

          {/* Interactive Parameter Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Education Access Expansion */}
            <div className={`p-3.5 rounded-lg border-l-2 border-cyan-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                  <Award className="w-3.5 h-3.5 text-cyan-500" />
                  {t("slider_edu")}
                </label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  +{(customParams.educationAccess * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="slider-education-access"
                type="range"
                min={0}
                max={0.60}
                step={0.05}
                value={customParams.educationAccess}
                onChange={(e) => handleSliderChange("educationAccess", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("slider_edu_sub")}
              </span>
            </div>

            {/* 2. Institutional Quality Boost */}
            <div className={`p-3.5 rounded-lg border-l-2 border-indigo-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  {t("slider_inst")}
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  +{(customParams.institutionalQuality * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="slider-institutional-quality"
                type="range"
                min={0}
                max={0.50}
                step={0.05}
                value={customParams.institutionalQuality}
                onChange={(e) => handleSliderChange("institutionalQuality", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("slider_inst_sub")}
              </span>
            </div>

            {/* 3. Inheritance Tax */}
            <div className={`p-3.5 rounded-lg border-l-2 border-orange-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                  {t("slider_tax")}
                </label>
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                  {(customParams.inheritanceTaxRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="slider-inheritance-tax"
                type="range"
                min={0}
                max={0.50}
                step={0.05}
                value={customParams.inheritanceTaxRate}
                onChange={(e) => handleSliderChange("inheritanceTaxRate", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("slider_tax_sub")}
              </span>
            </div>

            {/* 4. Early Childhood (Heckman Curve) */}
            <div className={`p-3.5 rounded-lg border-l-2 border-emerald-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                  <Baby className="w-3.5 h-3.5 text-emerald-500" />
                  {t("slider_child")}
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{(customParams.earlyChildhoodEffect * 100).toFixed(0)}%
                </span>
              </div>
              <input
                id="slider-early-childhood"
                type="range"
                min={0}
                max={0.60}
                step={0.05}
                value={customParams.earlyChildhoodEffect}
                onChange={(e) => handleSliderChange("earlyChildhoodEffect", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("slider_child_sub")}
              </span>
            </div>

            {/* 5. Spatial Desegregation */}
            <div className={`p-3.5 rounded-lg border-l-2 border-rose-500 md:col-span-2 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-800"}`}>
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {t("slider_spatial")}
                </label>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  -{(customParams.segregationReduction * 100).toFixed(0)}% {t("spatial_reduction")}
                </span>
              </div>
              <input
                id="slider-segregation-reduction"
                type="range"
                min={0}
                max={0.80}
                step={0.05}
                value={customParams.segregationReduction}
                onChange={(e) => handleSliderChange("segregationReduction", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className={`text-[10px] block mt-1 font-sans ${isDark ? "text-white/40" : "text-slate-500"}`}>
                {t("slider_spatial_sub")}
              </span>
            </div>
          </div>

          {/* Quick Real-Time Impact Summary Cards */}
          <div
            className={`mt-6 pt-5 border-t grid grid-cols-3 gap-3 font-mono ${
              isDark ? "border-white/5" : "border-slate-200"
            }`}
          >
            <div className={`p-3 rounded-lg border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] uppercase block ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("proj_ige")}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {simulationResults.estimatedIGE.toFixed(3)}
                </span>
                {simulationResults.estimatedIGE < currentCountry.baselineIGE ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <span className={`text-[9px] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                Δ {(simulationResults.estimatedIGE - currentCountry.baselineIGE).toFixed(3)} vs Base
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] uppercase block ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("mobility_q1_q5")}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {(simulationResults.q1ToQ5MobilityRate * 100).toFixed(1)}%
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <span className={`text-[9px] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                vs {(currentCountry.q1ToQ5Mobility * 100).toFixed(1)}% {t("historical")}
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${isDark ? "bg-[#050608] border-white/10" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] uppercase block ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("gini_index")}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {simulationResults.estimatedGini.toFixed(3)}
                </span>
                {simulationResults.estimatedGini < currentCountry.baselineGini ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <span className={`text-[9px] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                Δ {(simulationResults.estimatedGini - currentCountry.baselineGini).toFixed(3)} vs Base
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
