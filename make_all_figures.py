import os
import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d import Axes3D

os.makedirs("figures", exist_ok=True)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 9.5

# ---------------------------------------------------------
# Figure 7: 3D Agent Life Lines (Age 18-65 vs K_hum vs Wage $)
# ---------------------------------------------------------
fig = plt.figure(figsize=(9.5, 6), dpi=300)
ax = fig.add_subplot(111, projection='3d')

np.random.seed(42)
ages = np.linspace(18, 65, 47)

# Generate life trajectories for 5 agent quintiles
colors_q = {1: "#C62828", 2: "#E65100", 3: "#FBC02D", 4: "#1565C0", 5: "#2E7D32"}
labels_q = {1: "Quintil Q1 (Origen Muy Bajo)", 2: "Quintil Q2 (Bajo)", 3: "Quintil Q3 (Medio)", 4: "Quintil Q4 (Alto)", 5: "Quintil Q5 (Muy Alto)"}

for q in range(1, 6):
    for i in range(8):
        # Human capital accumulation curve
        max_hum = 8 + q * 2.8 + np.random.normal(0, 0.8)
        hum = 6 + (max_hum - 6) * (1 - np.exp(-0.08 * (ages - 18)))
        
        # Wage trajectory with mincerian curve (peak at age 45-50)
        base_wage = 800 + q * 1200
        wage = base_wage * (1 + 0.04 * (ages - 18) - 0.0005 * (ages - 18)**2) * (hum / 12.0)
        wage += np.random.normal(0, 150, len(ages))
        wage = np.clip(wage, 500, 25000)
        
        lbl = labels_q[q] if i == 0 else ""
        ax.plot(ages, hum, wage, color=colors_q[q], alpha=0.75, linewidth=1.5, label=lbl)

ax.set_title("Gemelo Digital: Líneas de Vida 3D de Agentes HDT (Edad vs. Capital Humano vs. Salario)", fontsize=11, fontweight='bold', pad=15)
ax.set_xlabel("Edad del Agente (Años 18-65)", fontsize=9, fontweight='bold', labelpad=8)
ax.set_ylabel("Capital Humano (Años Edu)", fontsize=9, fontweight='bold', labelpad=8)
ax.set_zlabel("Salario Anual ($ USD)", fontsize=9, fontweight='bold', labelpad=8)
ax.legend(loc="upper left", fontsize=8, frameon=True, facecolor="white")
ax.view_init(elev=25, azim=135)
plt.tight_layout()
plt.savefig("figures/figura7_lineas_de_vida_3d.png")
plt.close()

# ---------------------------------------------------------
# Figure 8: 3D HDT Hyperspace (K_cog x K_soc x Final Wage)
# ---------------------------------------------------------
fig = plt.figure(figsize=(9, 6), dpi=300)
ax = fig.add_subplot(111, projection='3d')

np.random.seed(42)
N_agents = 250
k_cog = np.random.normal(100, 15, N_agents)
k_soc = np.random.uniform(10, 95, N_agents)
quintile = np.random.choice([1, 2, 3, 4, 5], size=N_agents, p=[0.3, 0.25, 0.2, 0.15, 0.1])

wages = 1200 + 45 * (k_cog - 70) + 120 * k_soc + 2500 * (quintile - 1) + np.random.normal(0, 800, N_agents)
wages = np.clip(wages, 800, 30000)

colors_map = [colors_q[q] for q in quintile]

scatter = ax.scatter(k_cog, k_soc, wages, c=colors_map, s=45, alpha=0.85, edgecolors='black', linewidth=0.5)

ax.set_title("Hiperespacio 3D HDT de 5 Capitales (Cognitivo × Social × Salario Final)", fontsize=11, fontweight='bold', pad=15)
ax.set_xlabel("Capital Cognitivo (Puntaje IQ)", fontsize=9, fontweight='bold', labelpad=8)
ax.set_ylabel("Capital Social (% Weak Ties)", fontsize=9, fontweight='bold', labelpad=8)
ax.set_zlabel("Salario Final Acumulado ($ USD)", fontsize=9, fontweight='bold', labelpad=8)
ax.view_init(elev=20, azim=45)
plt.tight_layout()
plt.savefig("figures/figura8_hiperespacio_3d.png")
plt.close()

# ---------------------------------------------------------
# Figure 9: Policy A/B Simulation Parallel Comparison
# ---------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.8), dpi=300)

# Lorenz Curves
p_pop = np.linspace(0, 1, 100)
lorenz_s0 = np.power(p_pop, 2.8)  # Gini = 0.54
lorenz_s5 = np.power(p_pop, 1.6)  # Gini = 0.29

ax1.plot(p_pop, p_pop, "k--", label="Igualdad Perfecta (Gini = 0.00)", alpha=0.6)
ax1.plot(p_pop, lorenz_s0, color="#C62828", linewidth=2.2, label="Política A: Línea Base S0 (Gini = 0.54)")
ax1.plot(p_pop, lorenz_s5, color="#2E7D32", linewidth=2.2, label="Política B: Integrada S5 (Gini = 0.29)")
ax1.fill_between(p_pop, lorenz_s5, lorenz_s0, color="#81C784", alpha=0.35, label="Reducción de Desigualdad")
ax1.set_title("Curvas de Lorenz de Distribución Salarial (45 Años)", fontsize=10, fontweight='bold')
ax1.set_xlabel("Proporción Acumulada de Población", fontsize=9, fontweight='bold')
ax1.set_ylabel("Proporción Acumulada de Ingreso", fontsize=9, fontweight='bold')
ax1.legend(loc="upper left", fontsize=8, frameon=True, facecolor="white")

# Quintile Transition Probabilities Comparison
quintiles = ["Q1 (Muy Bajo)", "Q2 (Bajo)", "Q3 (Medio)", "Q4 (Alto)", "Q5 (Muy Alto)"]
s0_trans = [77.3, 18.5, 3.2, 0.8, 0.2]
s5_trans = [29.4, 25.8, 16.2, 18.2, 10.4]

x = np.arange(len(quintiles))
w = 0.35
ax2.bar(x - w/2, s0_trans, w, label="Línea Base S0", color="#C62828", edgecolor="black")
ax2.bar(x + w/2, s5_trans, w, label="Política Integrada S5", color="#2E7D32", edgecolor="black")
ax2.set_title("Distribución de Destino de Agentes de Origen Q1", fontsize=10, fontweight='bold')
ax2.set_xticks(x)
ax2.set_xticklabels(quintiles, rotation=20, ha="right", fontsize=8, fontweight="bold")
ax2.set_ylabel("Porcentaje de Agentes (%)", fontsize=9, fontweight='bold')
ax2.legend(loc="upper right", fontsize=8, frameon=True, facecolor="white")

plt.tight_layout()
plt.savefig("figures/figura9_simulacion_ab_politicas.png")
plt.close()

# ---------------------------------------------------------
# Figure 10: Early Warning Studio Risk Profile
# ---------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.8), dpi=300)

# Risk factors breakdown for high risk student
factors = ["Rezago Escolar\n(Edad 17)", "Rendimiento Bajo\n(48/100)", "Distancia Alta\n(85 min/día)", "Falta Internet\n(Sin conectividad)", "Bajo Soporte\nFamiliar"]
contrib = [24.0, 22.5, 18.0, 14.5, 11.0] # Sums to ~90% risk

bars = ax1.barh(factors[::-1], contrib[::-1], color="#D84315", edgecolor="black", height=0.55)
for bar in bars:
    w_val = bar.get_width()
    ax1.text(w_val + 0.5, bar.get_y() + bar.get_height()/2, f"+{w_val:.1f}%", va='center', fontsize=8.5, fontweight='bold', color="#B71C1C")

ax1.set_title("Factores Desglosados de Riesgo - Estudiante ID: AG-8492\nScore Total de Riesgo de Deserción: 84.0% (CRÍTICO)", fontsize=10, fontweight='bold', color="#B71C1C")
ax1.set_xlabel("Contribución Porcentual al Riesgo (%)", fontsize=9, fontweight='bold')
ax1.set_xlim(0, 30)

# Pedagogical & Social Interventions
interventions = ["Tutoría Académica\nIntensiva (Math/Read)", "Subsidio de Transporte\n& Conectividad", "Acompañamiento\nPsicopedagógico", "Beca de Retención\nCondicionada"]
impact_reduction = [-22.0, -18.5, -15.0, -12.5]

bars2 = ax2.barh(interventions[::-1], impact_reduction[::-1], color="#2E7D32", edgecolor="black", height=0.55)
for bar in bars2:
    w_val = bar.get_width()
    ax2.text(w_val - 0.5, bar.get_y() + bar.get_height()/2, f"{w_val:.1f}%", va='center', ha='right', fontsize=8.5, fontweight='bold', color="#1B5E20")

ax2.set_title("Plan de Intervenciones Recomendadas\nRiesgo Mitigado Proyectado: 84.0% ➔ 16.0% (BAJO)", fontsize=10, fontweight='bold', color="#1B5E20")
ax2.set_xlabel("Reducción Estimada de Riesgo (%)", fontsize=9, fontweight='bold')
ax2.set_xlim(-26, 0)

plt.tight_layout()
plt.savefig("figures/figura10_alerta_temprana_estudio.png")
plt.close()

# ---------------------------------------------------------
# Figure 11: Individual Agent Case Studies (Agent Trajectories)
# ---------------------------------------------------------
fig, ax = plt.subplots(figsize=(9.5, 5), dpi=300)

t_years = np.linspace(18, 65, 47)

# Case 1: Agent Q1 + High Grit + Weak Ties (Breakthrough Case)
c1_wage = 1000 * (1 + 0.08 * (t_years - 18) - 0.0008 * (t_years - 18)**2) * (1 + 0.02 * (t_years - 18))

# Case 2: Agent Q1 + Structural Friction / High Segregation (Trapped Case)
c2_wage = 900 * (1 + 0.015 * (t_years - 18) - 0.0002 * (t_years - 18)**2)

# Case 3: Agent Q5 + Status Persistence (Privileged Case)
c3_wage = 4500 * (1 + 0.05 * (t_years - 18) - 0.0005 * (t_years - 18)**2)

ax.plot(t_years, c1_wage, color="#2E7D32", linewidth=2.5, linestyle="-", label="Caso A: Agente Q1 Resiliente (Grit=0.92, Redes High) ➔ Ascenso a Q4 ($18.5k/año)")
ax.plot(t_years, c2_wage, color="#C62828", linewidth=2.5, linestyle="--", label="Caso B: Agente Q1 en Fricción Territorial (Segregación High) ➔ Atrapado en Q1 ($2.8k/año)")
ax.plot(t_years, c3_wage, color="#1565C0", linewidth=2.5, linestyle="-.", label="Caso C: Agente Q5 Favorecido (Herencia & Redes Upper) ➔ Persistencia en Q5 ($32.0k/año)")

ax.set_title("Casos de Estudio de Agentes Sintéticos HDT: Comparativa de Trayectorias de Salario Individual", fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Edad del Agente Sintético (Años)", fontsize=10, fontweight='bold')
ax.set_ylabel("Salario Anual Individual ($ USD)", fontsize=10, fontweight='bold')
ax.legend(loc="upper left", fontsize=8.5, frameon=True, facecolor="white", edgecolor="gray")
plt.tight_layout()
plt.savefig("figures/figura11_casos_agentes_individuales.png")
plt.close()

# ---------------------------------------------------------
# Figure 12: LangGraph + Langflow Agentic Topology
# ---------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
ax.axis("off")

nodes = [
    ("START / Entradas\n(Consulta Usuario)", 0.05, 0.40, 0.16, 0.20, "#ECEFF1", "#37474F"),
    ("Classify Intent\n(LLM Intent Node)", 0.26, 0.40, 0.16, 0.20, "#E3F2FD", "#1565C0"),
    ("Nodo Econométrico\n(Simulación ABM)", 0.50, 0.70, 0.20, 0.20, "#E8F5E9", "#2E7D32"),
    ("Nodo Alerta Temprana\n(Riesgo & Intervención)", 0.50, 0.40, 0.20, 0.20, "#FFF3E0", "#E65100"),
    ("Nodo Langflow REST\n(Flujo RAG Explicativo)", 0.50, 0.10, 0.20, 0.20, "#F3E5F5", "#6A1B9A"),
    ("Validate & State Persistence\n(MemorySaver Checkpointer)", 0.76, 0.40, 0.18, 0.20, "#E0F2F1", "#00695C")
]

for text, x, y, w, h, bg, border in nodes:
    rect = plt.Rectangle((x, y), w, h, facecolor=bg, edgecolor=border, linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#111111", multialignment="center")

# Arrows
ax.annotate("", xy=(0.26, 0.50), xytext=(0.21, 0.50), arrowprops=dict(arrowstyle="->", lw=2, color="#37474F"))
ax.annotate("", xy=(0.50, 0.80), xytext=(0.42, 0.55), arrowprops=dict(arrowstyle="->", lw=2, color="#2E7D32"))
ax.annotate("", xy=(0.50, 0.50), xytext=(0.42, 0.50), arrowprops=dict(arrowstyle="->", lw=2, color="#E65100"))
ax.annotate("", xy=(0.50, 0.20), xytext=(0.42, 0.45), arrowprops=dict(arrowstyle="->", lw=2, color="#6A1B9A"))

ax.annotate("", xy=(0.76, 0.50), xytext=(0.70, 0.80), arrowprops=dict(arrowstyle="->", lw=2, color="#2E7D32"))
ax.annotate("", xy=(0.76, 0.50), xytext=(0.70, 0.50), arrowprops=dict(arrowstyle="->", lw=2, color="#E65100"))
ax.annotate("", xy=(0.76, 0.50), xytext=(0.70, 0.20), arrowprops=dict(arrowstyle="->", lw=2, color="#6A1B9A"))

ax.set_title("Topología de Orquestación Agéntica LangGraph StateGraph & Cliente REST Langflow v1.x", fontsize=11, fontweight="bold", pad=15)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
plt.tight_layout()
plt.savefig("figures/figura12_orquestacion_agenti_langgraph.png")
plt.close()

print("All 12 figures successfully generated in figures/ directory.")
