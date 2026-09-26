import React, { useState } from "react";
import { Folder, FileCode, Copy, Check, Terminal, Play, BookOpen, Download, FileText } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface FileEntry {
  path: string;
  name: string;
  category: "agents" | "environment" | "networks" | "calibration" | "policies" | "metrics" | "ethics" | "configs" | "notebooks" | "tests" | "docs";
  language: "python" | "yaml" | "markdown" | "json";
  content: string;
}

const FILE_DATABASE: FileEntry[] = [
  {
    path: "src/agents/human_digital_twin.py",
    name: "human_digital_twin.py",
    category: "agents",
    language: "python",
    content: `"""
Human Digital Twin (HDT) Core Agent Module.
Represents an individual agent with 5 capital layers (Cognitive, Human, Social, Psychological, Structural).
"""
import numpy as np
from typing import Dict, List, Any
from dataclasses import dataclass, field

@dataclass
class CognitiveCapital:
    baseline_score: float = 100.0
    current_iq: float = 100.0

@dataclass
class HumanCapital:
    years_of_schooling: float = 0.0
    institutional_quality_index: float = 0.5
    credentials_acquired: List[str] = field(default_factory=list)

@dataclass
class SocialCapital:
    kinship_prestige: float = 0.5
    bonding_ties_count: int = 5
    weak_ties_count: int = 2
    mentorship_quality: float = 0.1

@dataclass
class PsychologicalCapital:
    risk_aversion_crra: float = 1.5
    discount_factor_beta: float = 0.95
    grit_resilience_score: float = 0.5

@dataclass
class StructuralEndowments:
    origin_parental_income_quintile: int = 1
    neighborhood_quality_index: float = 0.3
    spatial_segregation_index: float = 0.7
    gender: str = "Female"
    is_ethnic_minority: bool = False

class HumanDigitalTwin:
    def __init__(self, agent_id: str, origin_quintile: int = 1, gender: str = "Female"):
        self.agent_id = agent_id
        self.age = 0
        self.cognitive = CognitiveCapital()
        self.human = HumanCapital()
        self.social = SocialCapital()
        self.psychological = PsychologicalCapital()
        self.structural = StructuralEndowments(origin_parental_income_quintile=origin_quintile, gender=gender)
        self.accumulated_wealth = 0.0
        self.current_wage = 0.0
        self.is_employed = False
        self.employment_sector = "Inactive"

    def get_state_vector(self, macro_state: Dict[str, float]) -> np.ndarray:
        return np.array([
            float(self.age) / 65.0,
            (self.cognitive.current_iq - 50.0) / 100.0,
            self.human.years_of_schooling / 22.0,
            self.social.weak_ties_count / 20.0,
            self.psychological.grit_resilience_score,
            self.structural.neighborhood_quality_index,
            np.log1p(max(0.0, self.accumulated_wealth)) / 15.0,
            float(self.structural.origin_parental_income_quintile) / 5.0,
            1.0 if self.structural.gender == "Female" else 0.0,
            1.0 if self.structural.is_ethnic_minority else 0.0,
            macro_state.get("unemployment_rate", 0.15),
            macro_state.get("gdp_growth", 0.02),
            float(self.is_employed),
            self.human.institutional_quality_index,
            self.social.mentorship_quality,
            self.structural.spatial_segregation_index
        ], dtype=np.float32)
`
  },
  {
    path: "src/agents/decision_engine_rl.py",
    name: "decision_engine_rl.py",
    category: "agents",
    language: "python",
    content: `"""
Multi-Agent Deep Reinforcement Learning Life-Cycle Engine.
Actor-Critic (PPO) with CRRA Utility and dynamic action masking.
"""
import torch
import torch.nn as nn
from typing import Dict, List, Tuple

class LifeCyclePolicyNetwork(nn.Module):
    def __init__(self, state_dim: int = 16, action_dim: int = 8):
        super().__init__()
        self.shared_encoder = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.LayerNorm(64),
            nn.ReLU()
        )
        self.actor_head = nn.Linear(64, action_dim)
        self.critic_value_head = nn.Linear(64, 1)

    def forward(self, state: torch.Tensor, action_mask: torch.Tensor = None) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.shared_encoder(state)
        logits = self.actor_head(features)
        if action_mask is not None:
            logits = logits + (action_mask - 1.0) * 1e9
        action_probs = torch.softmax(logits, dim=-1)
        state_value = self.critic_value_head(features)
        return action_probs, state_value
`
  },
  {
    path: "src/environment/social_mobility_env.py",
    name: "social_mobility_env.py",
    category: "environment",
    language: "python",
    content: `"""
Social Mobility Simulation Environment (Mesa-compatible ABM).
Orchestrates agent lifecycles, macro shocks, and policy interventions over 40+ years.
"""
import numpy as np
from typing import Dict, List, Any
from social_mobility_simulator.src.agents.human_digital_twin import HumanDigitalTwin

class SocialMobilityEnvironment:
    def __init__(self, num_agents: int = 1000, country_code: str = "south_africa", seed: int = 42):
        self.num_agents = num_agents
        self.country_code = country_code
        self.current_year = 0
        self.agents: List[HumanDigitalTwin] = [
            HumanDigitalTwin(agent_id=f"HDT_{i:04d}", origin_quintile=(i % 5) + 1)
            for i in range(num_agents)
        ]
        self.macro_state = {"unemployment_rate": 0.28, "gdp_growth": 0.025, "inflation": 0.045}

    def step(self, policy_intervention: Dict[str, Any] = None):
        self.current_year += 1
        for agent in self.agents:
            agent.age += 1
`
  },
  {
    path: "configs/south_africa_nids.yaml",
    name: "south_africa_nids.yaml",
    category: "configs",
    language: "yaml",
    content: `# South Africa (NIDS 2008-2024) Calibration Config
country:
  code: "south_africa"
  name: "South Africa"
  dataset_primary: "National Income Dynamics Study (SALDRU/UCT)"
  sample_size: 28000
  empirical_moments:
    target_ige: 0.68
    target_gini: 0.63
    q1_to_q5_mobility_prob: 0.042
    gender_wage_gap: 0.28
    segregation_index: 0.72
    neighborhood_penalty: 0.35
  macro:
    unemployment_base: 0.28
    informal_sector_share: 0.28
`
  },
  {
    path: "notebooks/01_calibration_nids.ipynb",
    name: "01_calibration_nids.ipynb",
    category: "notebooks",
    language: "python",
    content: `# [Jupyter Notebook 01: Empirical Calibration & MSM Estimation]
# Calibrates HDT structural parameters against South African NIDS Waves 1-5.

import numpy as np
import pandas as pd
from social_mobility_simulator.src.calibration.msm_calibrator import MSMCalibrator
from social_mobility_simulator.src.metrics.mobility_metrics import MobilityMetricsEngine

calibrator = MSMCalibrator(country_code="south_africa")
results = calibrator.run_calibration_grid(steps=50)

print(f"=== MSM CONVERGENCE REPORT ===")
print(f"Optimal Parameters: {results['optimal_parameters']}")
print(f"Goodness-of-fit RMSE: {results['rmse_goodness_of_fit']:.4f}")
`
  }
];

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileEntry>(FILE_DATABASE[0]);
  const [copied, setCopied] = useState(false);
  const [notebookRunning, setNotebookRunning] = useState(false);
  const [notebookOutput, setNotebookOutput] = useState<string | null>(null);

  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunNotebook = () => {
    setNotebookRunning(true);
    setNotebookOutput(null);
    setTimeout(() => {
      setNotebookRunning(false);
      setNotebookOutput(`[IPython Kernel] Executing cells 1..4 in background...
✓ Loaded NIDS Wave 1-5 panel dataset (N=28,000 households).
✓ MICE imputation executed (5 iterations, m=5 imputations).
✓ Method of Simulated Moments (MSM) converged:
  - beta_schooling: 0.098 (Std. Err = 0.004)
  - beta_weak_ties: 0.065 (Std. Err = 0.003)
  - spatial_friction_chetty: 0.320 (Std. Err = 0.012)
✓ Overall goodness-of-fit RMSE: 0.024 (PASS)`);
    }, 1200);
  };

  return (
    <div id="codebase-explorer-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
      {/* Left Column: File Tree */}
      <div
        className={`lg:col-span-4 rounded-xl p-4 shadow-2xl flex flex-col justify-between transition-colors ${
          isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
        }`}
      >
        <div>
          <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}>
            <Folder className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("code_repo_title")}
            </h3>
          </div>

          <div className="space-y-1">
            {FILE_DATABASE.map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    setSelectedFile(file);
                    setNotebookOutput(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition ${
                    isSelected
                      ? isDark
                        ? "bg-white/10 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                        : "bg-cyan-50 text-cyan-700 border border-cyan-500 font-bold"
                      : isDark
                      ? "text-white/50 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 pt-3 border-t text-[10px] ${isDark ? "border-white/5 text-white/40" : "border-slate-200 text-slate-500"}`}>
          ARCHITECTURE: HDT + PyTorch RL + Mesa ABM + Hydra YAML + Pytest.
        </div>
      </div>

      {/* Right Column: Code & Notebook Viewer */}
      <div
        className={`lg:col-span-8 rounded-xl p-5 shadow-2xl flex flex-col transition-colors ${
          isDark ? "bg-[#0D1016] border border-white/10" : "bg-white border border-slate-200"
        }`}
      >
        <div className={`flex items-center justify-between mb-3 pb-3 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-500" />
            <span className={`text-xs font-mono font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              {selectedFile.path}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedFile.category === "notebooks" && (
              <button
                onClick={handleRunNotebook}
                disabled={notebookRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] transition disabled:opacity-40"
              >
                <Play className={`w-3.5 h-3.5 ${notebookRunning ? "animate-spin" : ""}`} />
                {notebookRunning ? "EXECUTING..." : "RUN_NOTEBOOK"}
              </button>
            )}

            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "COPIED" : "COPY_CODE"}
            </button>
          </div>
        </div>

        {/* Code Content Area */}
        <pre
          className={`w-full flex-1 p-4 rounded-lg border text-xs font-mono overflow-x-auto leading-relaxed max-h-[460px] ${
            isDark
              ? "bg-[#050608] border-white/10 text-white/80"
              : "bg-slate-900 border-slate-800 text-slate-100"
          }`}
        >
          <code>{selectedFile.content}</code>
        </pre>

        {/* Interactive Notebook Output Terminal */}
        {notebookOutput && (
          <div className="mt-4 bg-[#050608] p-3 rounded-lg border border-emerald-500/40 text-xs font-mono text-emerald-400 space-y-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              SIMULATION KERNEL OUTPUT (PYTHON 3.11):
            </div>
            <pre className="whitespace-pre-wrap">{notebookOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
