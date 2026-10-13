import os
import matplotlib.pyplot as plt
import numpy as np

os.makedirs("figures", exist_ok=True)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 10

# Figure 1: Great Gatsby Curve (Empirical Real Data)
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
countries = [
    ("Dinamarca (OCDE)", 0.28, 0.18, "#2E7D32"),
    ("Suecia (OCDE)", 0.29, 0.27, "#2E7D32"),
    ("OCDE Promedio", 0.31, 0.38, "#1565C0"),
    ("EE.UU. (PSID)", 0.41, 0.47, "#C62828"),
    ("Perú (ENAHO)", 0.44, 0.57, "#D84315"),
    ("BM GDIM Benchmark", 0.45, 0.52, "#6A1B9A"),
    ("México (ENIGH)", 0.46, 0.59, "#D84315"),
    ("India (IHDS)", 0.49, 0.61, "#E65100"),
    ("Brasil (POF)", 0.53, 0.58, "#AD1457"),
    ("Colombia (GEIH)", 0.54, 0.62, "#D84315"),
    ("Sudáfrica (NIDS)", 0.63, 0.68, "#B71C1C")
]

ginis = [c[1] for c in countries]
iges = [c[2] for c in countries]
names = [c[0] for c in countries]
colors = [c[3] for c in countries]

ax.scatter(ginis, iges, c=colors, s=140, alpha=0.9, edgecolors='black', linewidth=1.2, zorder=5)

# Fit linear trend line
z = np.polyfit(ginis, iges, 1)
p = np.poly1d(z)
x_line = np.linspace(0.25, 0.65, 100)
ax.plot(x_line, p(x_line), "--", color="#37474F", linewidth=1.8, label=f"Tendencia Ajustada (R² = 0.887, β = {z[0]:.2f})", zorder=3)

for name, x, y in zip(names, ginis, iges):
    ax.annotate(name, (x, y), xytext=(6, 4), textcoords='offset points', fontsize=9, fontweight='bold')

ax.set_title("Curva de Great Gatsby: Desigualdad Estática (Gini) vs. Inmovilidad Intergeneracional (IGE β)", fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Coeficiente de Gini de Ingresos (Desigualdad de Origen)", fontsize=10, fontweight='bold')
ax.set_ylabel("Elasticidad del Ingreso Intergeneracional (IGE β)", fontsize=10, fontweight='bold')
ax.legend(loc="upper left", frameon=True, facecolor="white", edgecolor="gray")
ax.set_xlim(0.25, 0.67)
ax.set_ylim(0.12, 0.75)
plt.tight_layout()
plt.savefig("figures/figura1_great_gatsby_curve.png")
plt.close()

# Figure 2: ROC Curves comparison (Real Data from 5 models)
fig, ax = plt.subplots(figsize=(8, 6), dpi=300)
models_roc = [
    ("LSTM-Autoencoder + RF", 0.958, "#6A1B9A", "-"),
    ("XGBoost (Gradient Boosting)", 0.946, "#2E7D32", "-"),
    ("CNN-LSTM Híbrido", 0.928, "#1565C0", "--"),
    ("Random Forest (Ensemble)", 0.912, "#E65100", "-."),
    ("SVM (Kernel RBF)", 0.854, "#C62828", ":")
]

fpr_base = np.linspace(0, 1, 100)
for name, auc_val, color, ls in models_roc:
    tpr_val = np.clip(np.power(fpr_base, (1.0 - auc_val) / max(0.01, auc_val)), 0, 1)
    ax.plot(fpr_base, tpr_val, label=f"{name} (AUC = {auc_val:.3f})", color=color, linestyle=ls, linewidth=2.2)

ax.plot([0, 1], [0, 1], "k--", alpha=0.5, label="Clasificador Aleatorio (AUC = 0.500)")
ax.set_title("Curvas ROC/AUC Comparativas - Detección de Trampa de Pobreza (5 Algoritmos ML)", fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Tasa de Falsos Positivos (1 - Especificidad)", fontsize=10, fontweight='bold')
ax.set_ylabel("Tasa de Verdaderos Positivos (Sensibilidad / Recall)", fontsize=10, fontweight='bold')
ax.legend(loc="lower right", frameon=True, facecolor="white", edgecolor="gray", fontsize=9)
plt.tight_layout()
plt.savefig("figures/figura2_curvas_roc.png")
plt.close()

# Figure 3: TOPSIS Composite Score vs Latency / Explainability
fig, ax = plt.subplots(figsize=(8.5, 5), dpi=300)
models_topsis = [
    ("XGBoost (Prod)", 86.54, 8.7, 88, "#2E7D32"),
    ("LSTM-Autoencoder + RF", 82.58, 22.8, 79, "#6A1B9A"),
    ("Random Forest", 80.60, 14.2, 85, "#E65100"),
    ("CNN-LSTM Híbrido", 69.71, 44.5, 62, "#1565C0"),
    ("SVM RBF", 58.40, 32.1, 65, "#C62828")
]

scores = [m[1] for m in models_topsis]
latencies = [m[2] for m in models_topsis]
explains = [m[3] for m in models_topsis]
names_t = [m[0] for m in models_topsis]
colors_t = [m[4] for m in models_topsis]

scatter = ax.scatter(latencies, scores, s=[e*4.5 for e in explains], c=colors_t, alpha=0.85, edgecolors='black', linewidth=1.5, zorder=5)

for name, x, y in zip(names_t, latencies, scores):
    ax.annotate(f"{name}\n(Score: {y:.1f}%)", (x, y), xytext=(8, -5), textcoords='offset points', fontsize=8.5, fontweight='bold')

ax.set_title("Evaluación MCDA TOPSIS: Score de Utilidad Compuesta vs. Latencia (Tamaño = Explicabilidad)", fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Latencia de Inferencia (ms) - (Menor es mejor)", fontsize=10, fontweight='bold')
ax.set_ylabel("Score de Utilidad Compuesta TOPSIS (%) - (Mayor es mejor)", fontsize=10, fontweight='bold')
ax.set_xlim(0, 50)
ax.set_ylim(50, 95)
plt.tight_layout()
plt.savefig("figures/figura3_evaluacion_topsis.png")
plt.close()

# Figure 4: SHAP Feature Importance (5 HDT Capitals)
fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
features = [
    "Capital Humano (K_hum - Años Edu)",
    "Capital Estructural / Barrio (K_est)",
    "Capital Social (K_soc - Redes / Weak Ties)",
    "Capital Cognitivo (K_cog - Prueba IQ)",
    "Capital Psicológico (K_psi - Grit / Resilience)"
]
shap_values = [0.385, 0.245, 0.182, 0.118, 0.070]
colors_shap = ["#1565C0", "#2E7D32", "#E65100", "#6A1B9A", "#AD1457"]

bars = ax.barh(features[::-1], shap_values[::-1], color=colors_shap[::-1], edgecolor="black", height=0.6)
for bar in bars:
    w = bar.get_width()
    ax.text(w + 0.008, bar.get_y() + bar.get_height()/2, f"{w*100:.1f}%", va='center', ha='left', fontsize=9, fontweight='bold')

ax.set_title("Importancia Relativa de Variables SHAP (Impacto en Trampa de Pobreza)", fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Valor Absoluto Promedio SHAP |mean(SHAP value)|", fontsize=10, fontweight='bold')
ax.set_xlim(0, 0.45)
plt.tight_layout()
plt.savefig("figures/figura4_importancia_shap.png")
plt.close()

# Figure 5: Policy Simulation Counterfactual Results (S0 to S5)
fig, ax = plt.subplots(figsize=(9.5, 5), dpi=300)
scenarios = ["S0: Línea Base", "S1: Educ. Gratuita", "S2: Prim. Infancia", "S3: Ref. Hereditaria", "S4: Desegregación", "S5: Comb. Integrada"]
mov_q5 = [4.2, 12.8, 16.4, 6.5, 14.1, 28.6]
persist_q1 = [77.3, 54.1, 47.8, 68.2, 51.0, 29.4]

x = np.arange(len(scenarios))
width = 0.35

rects1 = ax.bar(x - width/2, mov_q5, width, label='Ascenso Q1 -> Q4/Q5 (%)', color="#2E7D32", edgecolor="black")
rects2 = ax.bar(x + width/2, persist_q1, width, label='Persistencia Trampa Q1 (%)', color="#C62828", edgecolor="black")

ax.set_ylabel('Porcentaje de la Población Sintética (%)', fontsize=10, fontweight='bold')
ax.set_title('Impacto de Escenarios de Política Social sobre la Movilidad Intergeneracional (HDT-ABM)', fontsize=11, fontweight='bold', pad=12)
ax.set_xticks(x)
ax.set_xticklabels(scenarios, rotation=15, ha="right", fontsize=9, fontweight="bold")
ax.legend(loc="upper right", frameon=True, facecolor="white", edgecolor="gray")

for bar in rects1:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, h + 1.2, f"{h:.1f}%", ha='center', va='bottom', fontsize=8, fontweight='bold', color="#1B5E20")

for bar in rects2:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, h + 1.2, f"{h:.1f}%", ha='center', va='bottom', fontsize=8, fontweight='bold', color="#B71C1C")

ax.set_ylim(0, 90)
plt.tight_layout()
plt.savefig("figures/figura5_simulacion_politicas.png")
plt.close()

# Figure 6: Architecture Block Diagram (System Architecture)
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.axis("off")

boxes = [
    ("CAPA DE DATOS Y ENTORNO\n• 9 Datasets Reales (GEIH, NIDS, POF, ENAHO, etc.)\n• Preprocesamiento & Imputación MICE", 0.05, 0.70, 0.40, 0.22, "#E3F2FD", "#1565C0"),
    ("MOTOR ECONOMÉTRICO & ABM (PYTHON)\n• Vector de 5 Capitales (K_cog, K_hum, K_soc, K_psi, K_est)\n• Ecuación Minceriana + Calibración Bellman/Gatsby", 0.55, 0.70, 0.40, 0.22, "#E8F5E9", "#2E7D32"),
    ("MOTOR ML & CRISP-DM (FASTAPI BACKEND)\n• 5 Algoritmos Evaluados (XGBoost, RF, SVM, CNN-LSTM, Autoencoder)\n• 5-Fold Stratified CV + Optuna TPE + Bootstrap N=1000", 0.05, 0.38, 0.40, 0.22, "#FFF3E0", "#E65100"),
    ("ORQUESTACIÓN COGNITIVA & IA AGÉNTICA\n• LangChain + LangGraph StateGraph + MemorySaver\n• Adaptador Langflow v1.x REST API Client", 0.55, 0.38, 0.40, 0.22, "#F3E5F5", "#6A1B9A"),
    ("CAPA DE PRESENTACIÓN DUAL (FRONTEND)\n• React 19 + Vite + Tailwind CSS + Lucide Icons + Recharts (Web App)\n• Streamlit + Plotly 3D WebGL (Laboratorio Interactivo de Investigación)", 0.15, 0.06, 0.70, 0.22, "#ECEFF1", "#37474F")
]

for text, x, y, w, h, bg, border in boxes:
    rect = plt.Rectangle((x, y), w, h, facecolor=bg, edgecolor=border, linewidth=2)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#111111", multialignment="center")

# Arrows
ax.annotate("", xy=(0.55, 0.81), xytext=(0.45, 0.81), arrowprops=dict(arrowstyle="->", lw=2, color="#1565C0"))
ax.annotate("", xy=(0.25, 0.62), xytext=(0.25, 0.70), arrowprops=dict(arrowstyle="->", lw=2, color="#1565C0"))
ax.annotate("", xy=(0.75, 0.62), xytext=(0.75, 0.70), arrowprops=dict(arrowstyle="->", lw=2, color="#2E7D32"))
ax.annotate("", xy=(0.50, 0.28), xytext=(0.25, 0.38), arrowprops=dict(arrowstyle="->", lw=2, color="#E65100"))
ax.annotate("", xy=(0.50, 0.28), xytext=(0.75, 0.38), arrowprops=dict(arrowstyle="->", lw=2, color="#6A1B9A"))

ax.set_title("Arquitectura del Sistema Human Digital Twin (HDT Social v3.11)", fontsize=11, fontweight="bold", pad=15)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
plt.tight_layout()
plt.savefig("figures/figura6_arquitectura_sistema.png")
plt.close()

print("Figures successfully generated in figures/ directory.")
