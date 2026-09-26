/**
 * Social Mobility Simulator (HDT-ABM-RL)
 * Main Application Interface with Light/Dark Mode and ES/EN Language Support.
 */

import React, { useState, useEffect } from "react";
import {
  CountryCalibration,
  PolicyParams,
  SimulationResults,
  AgentHDT,
} from "./types/simulation";
import {
  COUNTRY_CALIBRATIONS,
  PRESET_POLICIES,
  runSimulation,
} from "./services/simulationEngine";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ThreeExplorer3D } from "./components/ThreeExplorer3D";
import { PolicyStudio } from "./components/PolicyStudio";
import { MetricsView } from "./components/MetricsView";
import { EthicsAuditView } from "./components/EthicsAuditView";
import { CountryBenchmarkView } from "./components/CountryBenchmarkView";
import { CodebaseExplorer } from "./components/CodebaseExplorer";
import { GeminiCopilot } from "./components/GeminiCopilot";
import { ReportsView } from "./components/ReportsView";
import { PredictiveStudio } from "./components/PredictiveStudio";
import { DatasetCatalogView } from "./components/DatasetCatalogView";
import { ScrumBoardView } from "./components/ScrumBoardView";
import { EarlyWarningStudio } from "./components/ia/EarlyWarningStudio";
import { OrchestrationStudio } from "./components/OrchestrationStudio";

import {
  Globe,
  Sliders,
  BarChart2,
  ShieldCheck,
  Database,
  Code2,
  Bot,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Languages,
  Users,
  Activity,
  Award,
  BookOpen,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileDown,
  Brain,
  Trello,
  FileSpreadsheet,
  GraduationCap,
  GitFork,
} from "lucide-react";

function SimulatorDashboard() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const [currentCountry, setCurrentCountry] = useState<CountryCalibration>(
    COUNTRY_CALIBRATIONS.south_africa
  );
  const [activePolicy, setActivePolicy] = useState<PolicyParams>(
    PRESET_POLICIES.base
  );
  const [simulationResults, setSimulationResults] = useState<SimulationResults>(
    () => runSimulation("south_africa", PRESET_POLICIES.base, 1000)
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentHDT | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    | "explorer_3d"
    | "policy_studio"
    | "predictive"
    | "early_warning"
    | "orchestration"
    | "datasets"
    | "scrum"
    | "metrics"
    | "ethics"
    | "benchmarks"
    | "codebase"
    | "copilot"
    | "reports"
  >("explorer_3d");

  // Run or re-run simulation
  const handleExecuteSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const results = runSimulation(currentCountry, activePolicy, 1000);
      setSimulationResults(results);
      if (results.agents.length > 0) {
        const upwardAgent =
          results.agents.find((a) => a.originQuintile === 1 && a.finalQuintile >= 4) ||
          results.agents[0];
        setSelectedAgent(upwardAgent);
      }
      setIsSimulating(false);
    }, 450);
  };

  const handleCountryChange = (countryId: string) => {
    const nextCountry = COUNTRY_CALIBRATIONS[countryId] || COUNTRY_CALIBRATIONS.south_africa;
    setCurrentCountry(nextCountry);
    const results = runSimulation(nextCountry, activePolicy, 1000);
    setSimulationResults(results);
    setSelectedAgent(results.agents[0] || null);
  };

  const handlePolicyChange = (policy: PolicyParams) => {
    setActivePolicy(policy);
    const results = runSimulation(currentCountry, policy, 1000);
    setSimulationResults(results);
    setSelectedAgent(results.agents[0] || null);
  };

  const handleCalibrateDataset = (
    calibratedCountry: CountryCalibration,
    calibratedResults: SimulationResults,
    targetTab?: any
  ) => {
    setCurrentCountry(calibratedCountry);
    setSimulationResults(calibratedResults);
    setSelectedAgent(calibratedResults.agents[0] || null);
    if (targetTab) {
      setActiveTab(targetTab as any);
    }
  };

  const handleApplyPolicyById = (policyId: string) => {
    const found = PRESET_POLICIES[policyId];
    if (found) {
      handlePolicyChange(found);
      setActiveTab("policy_studio");
    }
  };

  useEffect(() => {
    if (!selectedAgent && simulationResults.agents.length > 0) {
      setSelectedAgent(simulationResults.agents[0]);
    }
  }, [simulationResults]);

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500 selection:text-white ${
        isDark ? "bg-[#050608] text-[#D1D5DB]" : "bg-[#F8FAFC] text-[#0F172A]"
      }`}
    >
      {/* Top Immersive HUD Header */}
      <header
        className={`border-b sticky top-0 z-50 transition-colors duration-200 ${
          isDark
            ? "border-white/10 bg-[#0A0C10]/95 backdrop-blur-md"
            : "border-slate-200 bg-white/95 backdrop-blur-md shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)] flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1
                  className={`text-sm font-bold tracking-[0.18em] uppercase ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {t("app_title")}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {t("framework_badge")}
                </span>
              </div>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400/80 font-mono tracking-wider">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Context Stats & Controls */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] font-mono">
            {/* Country Node */}
            <div className="hidden md:flex flex-col items-end">
              <span className={`uppercase text-[9px] tracking-wider ${isDark ? "text-white/40" : "text-slate-600"}`}>
                {t("calibration_node")}
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                {currentCountry.name.split(" ")[0]} ({currentCountry.datasetName.split(" ")[0]})
              </span>
            </div>

            {/* Estimated IGE */}
            <div className="hidden sm:flex flex-col items-end">
              <span className={`uppercase text-[9px] tracking-wider ${isDark ? "text-white/40" : "text-slate-600"}`}>
                {t("estimated_ige")}
              </span>
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                {simulationResults.estimatedIGE}
              </span>
            </div>

            {/* Q1->Q5 Rate */}
            <div className="hidden sm:flex flex-col items-end">
              <span className={`uppercase text-[9px] tracking-wider ${isDark ? "text-white/40" : "text-slate-600"}`}>
                {t("q1_to_q5_ascent")}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {(simulationResults.q1ToQ5MobilityRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="h-6 w-px bg-slate-300 dark:bg-white/10 mx-1"></div>

            {/* Language Switcher Button */}
            <button
              id="language-switcher-btn"
              onClick={toggleLanguage}
              title={t("toggle_lang")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-cyan-400 border-white/15 hover:border-cyan-500/40"
                  : "bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-200 hover:border-cyan-400"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === "es" ? "ES" : "EN"}</span>
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? t("toggle_theme_light") : t("toggle_theme_dark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-amber-400 border-white/15 hover:border-amber-400/40"
                  : "bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-200 hover:border-indigo-400"
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white/80">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-slate-700">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1.5 border-t pt-2 pb-2 transition-colors ${
            isDark ? "border-white/5" : "border-slate-200"
          }`}
        >
          <button
            id="tab-btn-explorer"
            onClick={() => setActiveTab("explorer_3d")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "explorer_3d"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("tab_explorer")}
          </button>

          <button
            id="tab-btn-policy-studio"
            onClick={() => setActiveTab("policy_studio")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "policy_studio"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {t("tab_policy_studio")}
          </button>

          <button
            id="tab-btn-predictive"
            onClick={() => setActiveTab("predictive")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "predictive"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            {t("tab_predictive")}
          </button>

          <button
            id="tab-btn-early-warning"
            onClick={() => setActiveTab("early_warning")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "early_warning"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alerta Temprana IA</span>
          </button>

          <button
            id="tab-btn-orchestration"
            onClick={() => setActiveTab("orchestration")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "orchestration"
                ? isDark
                  ? "bg-white/10 border border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)] font-semibold"
                  : "bg-indigo-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            <span>Orquestación IA (LangGraph)</span>
          </button>

          <button
            id="tab-btn-datasets"
            onClick={() => setActiveTab("datasets")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "datasets"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            {t("tab_datasets")}
          </button>

          <button
            id="tab-btn-scrum"
            onClick={() => setActiveTab("scrum")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "scrum"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Trello className="w-3.5 h-3.5 text-indigo-400" />
            {t("tab_scrum")}
          </button>

          <button
            id="tab-btn-metrics"
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "metrics"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {t("tab_metrics")}
          </button>

          <button
            id="tab-btn-ethics"
            onClick={() => setActiveTab("ethics")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "ethics"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("tab_ethics")}
          </button>

          <button
            id="tab-btn-benchmarks"
            onClick={() => setActiveTab("benchmarks")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "benchmarks"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {t("tab_benchmarks")}
          </button>

          <button
            id="tab-btn-codebase"
            onClick={() => setActiveTab("codebase")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "codebase"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {t("tab_codebase")}
          </button>

          <button
            id="tab-btn-copilot"
            onClick={() => setActiveTab("copilot")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "copilot"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            {t("tab_copilot")}
          </button>

          <button
            id="tab-btn-reports"
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wide whitespace-nowrap transition-all ${
              activeTab === "reports"
                ? isDark
                  ? "bg-white/10 border border-cyan-500/40 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)] font-semibold"
                  : "bg-cyan-600 text-white shadow-sm font-semibold"
                : isDark
                ? "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                : "border border-transparent hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            {t("tab_reports")}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === "explorer_3d" && (
          <div className="space-y-6">
            <ThreeExplorer3D
              simulationResults={simulationResults}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />

            {/* Agent HDT Inspector Drawer */}
            {selectedAgent && (
              <div
                className={`rounded-xl p-5 shadow-2xl relative overflow-hidden transition-colors ${
                  isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
                }`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none uppercase font-mono text-5xl rotate-12">
                  HDT_INSPECTOR
                </div>

                <div
                  className={`flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b ${
                    isDark ? "border-white/5" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-sm shadow-sm">
                      {selectedAgent.id.replace("HDT_", "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-semibold tracking-wide ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {t("hdt_profile")} — {selectedAgent.id}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                          {t("probability_ascent")}: {(simulationResults.q1ToQ5MobilityRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-mono mt-0.5 ${
                          isDark ? "text-white/50" : "text-slate-500"
                        }`}
                      >
                        {selectedAgent.gender} // {t("origin_label")}: <span className={isDark ? "text-white/90" : "text-slate-900"}>Q{selectedAgent.originQuintile}</span> ➔ {t("destiny_label")}: <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Q{selectedAgent.finalQuintile}</span> // {t("degree_label")}: <span className={isDark ? "text-white/90" : "text-slate-900"}>{selectedAgent.highestDegree}</span> // {t("wage_label")}: <span className="text-cyan-600 dark:text-cyan-400 font-semibold">${selectedAgent.finalWage.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className={`uppercase text-[10px] ${isDark ? "text-white/50" : "text-slate-600"}`}>
                      {t("select_target_hdt")}
                    </span>
                    <select
                      value={selectedAgent.id}
                      onChange={(e) => {
                        const ag = simulationResults.agents.find((a) => a.id === e.target.value);
                        if (ag) setSelectedAgent(ag);
                      }}
                      className={`border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                        isDark ? "bg-[#050608] border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-800"
                      }`}
                    >
                      {simulationResults.agents.slice(0, 30).map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.id} (Q{ag.originQuintile} ➔ Q{ag.finalQuintile}, ${ag.finalWage.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5 Capital Layers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className={`p-3 rounded-lg border-l-3 border-cyan-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isDark ? "text-white/80" : "text-slate-700"}>{t("cap_cognitive")}</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{selectedAgent.capital.cognitive.toFixed(1)} IQ</span>
                    </div>
                    <div className={`text-[10px] font-mono mb-2 ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("cap_cognitive_sub")}</div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                      <div
                        className="bg-cyan-500 h-full rounded-full shadow-[0_0_6px_#06b6d4]"
                        style={{ width: `${Math.min(100, (selectedAgent.capital.cognitive / 150) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border-l-3 border-indigo-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isDark ? "text-white/80" : "text-slate-700"}>{t("cap_human")}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{selectedAgent.capital.human.toFixed(0)} yrs</span>
                    </div>
                    <div className={`text-[10px] font-mono mb-2 ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("cap_human_sub")}</div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                      <div
                        className="bg-indigo-500 h-full rounded-full shadow-[0_0_6px_#6366f1]"
                        style={{ width: `${Math.min(100, (selectedAgent.capital.human / 20) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border-l-3 border-emerald-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isDark ? "text-white/80" : "text-slate-700"}>{t("cap_social")}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{(selectedAgent.capital.social * 100).toFixed(0)}% Ties</span>
                    </div>
                    <div className={`text-[10px] font-mono mb-2 ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("cap_social_sub")}</div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                      <div
                        className="bg-emerald-500 h-full rounded-full shadow-[0_0_6px_#10b981]"
                        style={{ width: `${selectedAgent.capital.social * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border-l-3 border-orange-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isDark ? "text-white/80" : "text-slate-700"}>{t("cap_psychological")}</span>
                      <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">{(selectedAgent.capital.psychological * 100).toFixed(0)}% Grit</span>
                    </div>
                    <div className={`text-[10px] font-mono mb-2 ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("cap_psychological_sub")}</div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                      <div
                        className="bg-orange-500 h-full rounded-full shadow-[0_0_6px_#f97316]"
                        style={{ width: `${selectedAgent.capital.psychological * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border-l-3 border-rose-500 ${isDark ? "bg-white/5" : "bg-slate-50 border border-slate-200"}`}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className={isDark ? "text-white/80" : "text-slate-700"}>{t("cap_structural")}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">{(selectedAgent.capital.structural * 100).toFixed(0)}% Space</span>
                    </div>
                    <div className={`text-[10px] font-mono mb-2 ${isDark ? "text-white/40" : "text-slate-500"}`}>{t("cap_structural_sub")}</div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                      <div
                        className="bg-rose-500 h-full rounded-full shadow-[0_0_6px_#f43f5e]"
                        style={{ width: `${selectedAgent.capital.structural * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "policy_studio" && (
          <PolicyStudio
            currentCountry={currentCountry}
            activePolicy={activePolicy}
            simulationResults={simulationResults}
            onCountryChange={handleCountryChange}
            onPolicyChange={handlePolicyChange}
            onRunSimulation={handleExecuteSimulation}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === "predictive" && (
          <PredictiveStudio simulationResults={simulationResults} />
        )}

        {activeTab === "early_warning" && <EarlyWarningStudio />}
        {activeTab === "orchestration" && <OrchestrationStudio />}

        {activeTab === "datasets" && (
          <DatasetCatalogView
            onCalibrateDataset={handleCalibrateDataset}
            currentCountryId={currentCountry.id}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === "scrum" && <ScrumBoardView />}

        {activeTab === "metrics" && (
          <MetricsView simulationResults={simulationResults} />
        )}

        {activeTab === "ethics" && (
          <EthicsAuditView simulationResults={simulationResults} />
        )}

        {activeTab === "benchmarks" && (
          <CountryBenchmarkView
            currentCountry={currentCountry}
            onSelectCountry={handleCountryChange}
          />
        )}

        {activeTab === "codebase" && <CodebaseExplorer />}

        {activeTab === "copilot" && (
          <GeminiCopilot
            simulationResults={simulationResults}
            onApplyPolicy={handleApplyPolicyById}
            onSelectCountry={handleCountryChange}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView
            currentCountry={currentCountry}
            activePolicy={activePolicy}
            simulationResults={simulationResults}
          />
        )}
      </main>

      {/* Command Footer */}
      <footer
        className={`border-t py-2.5 px-6 mt-auto transition-colors ${
          isDark ? "border-white/10 bg-[#050608] text-white/40" : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
            <span>{t("system_ready")}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 Social Mobility Research Lab</span>
            <span>•</span>
            <span className="text-cyan-600 dark:text-cyan-400">HDT_FRAMEWORK_CORE_v3.11</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SimulatorDashboard />
      </LanguageProvider>
    </ThemeProvider>
  );
}
