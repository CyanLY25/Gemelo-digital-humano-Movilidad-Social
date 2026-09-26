import streamlit as st
import plotly.graph_objects as go
import numpy as np
from typing import Dict, Any
from frontend.api_client import PRESET_POLICIES

def render_tab_policy_studio(api_client, country_id: str):
    st.header("🧪 Policy Studio: Laboratorio de Evaluación Contrafactual A/B")
    st.caption("Compare el impacto cuantitativo de políticas públicas sobre la densidad salarial, Gini proyectado y SROI.")

    col_a, col_b = st.columns(2)
    with col_a:
        pk_a = st.selectbox("Política A (Línea Base)", options=list(PRESET_POLICIES.keys()),
                             format_func=lambda k: PRESET_POLICIES[k]["name"], index=0, key="pol_a")
        pol_a = dict(PRESET_POLICIES[pk_a])
    with col_b:
        pk_b = st.selectbox("Política B (Intervención)", options=list(PRESET_POLICIES.keys()),
                             format_func=lambda k: PRESET_POLICIES[k]["name"], index=3, key="pol_b")
        pol_b = dict(PRESET_POLICIES[pk_b])

    with st.expander("🛠️ Ajustar hiperparámetros Política B", expanded=False):
        c1, c2, c3 = st.columns(3)
        with c1:
            pol_b["earlyChildhoodEffect"] = st.slider("Primera Infancia (0-5 años)", 0.0, 1.0, float(pol_b["earlyChildhoodEffect"]), 0.05)
            pol_b["educationAccess"] = st.slider("Cobertura Edu Superior", 0.0, 1.0, float(pol_b["educationAccess"]), 0.05)
        with c2:
            pol_b["inheritanceTaxRate"] = st.slider("Impuesto Herencia (>P90)", 0.0, 0.5, float(pol_b["inheritanceTaxRate"]), 0.05)
            pol_b["segregationReduction"] = st.slider("Desegregación / Transporte", 0.0, 1.0, float(pol_b["segregationReduction"]), 0.05)
        with c3:
            pol_b["institutionalQuality"] = st.slider("Calidad Institucional", 0.0, 1.0, float(pol_b["institutionalQuality"]), 0.05)

    with st.spinner("Ejecutando simulaciones A/B..."):
        res_a = api_client.run_simulation(country_id=country_id, policy_dict=pol_a, num_agents=500)
        res_b = api_client.run_simulation(country_id=country_id, policy_dict=pol_b, num_agents=500)

    st.markdown("---")
    st.subheader("⚡ Comparativo de Métricas Clave")
    m1, m2, m3, m4 = st.columns(4)
    gini_diff = res_b["estimatedGini"] - res_a["estimatedGini"]
    ige_diff = res_b["estimatedIGE"] - res_a["estimatedIGE"]
    mob_diff = (res_b["q1ToQ5MobilityRate"] - res_a["q1ToQ5MobilityRate"]) * 100
    fiscal_cost = (pol_b.get("earlyChildhoodEffect",0)*120 + pol_b.get("educationAccess",0)*80 + pol_b.get("segregationReduction",0)*50) + 1.0
    sroi = round((abs(gini_diff)*450 + mob_diff*1.8) / max(0.1, fiscal_cost/50), 2)

    with m1: st.metric("Gini (B)", f"{res_b['estimatedGini']:.3f}", f"{gini_diff:.3f} vs A", delta_color="inverse")
    with m2: st.metric("IGE (B)", f"{res_b['estimatedIGE']:.3f}", f"{ige_diff:.3f} vs A", delta_color="inverse")
    with m3: st.metric("Q1→Q5 (B)", f"{res_b['q1ToQ5MobilityRate']*100:.1f}%", f"+{mob_diff:.1f}% vs A")
    with m4: st.metric("SROI", f"{sroi:.2f}x", "Alta Eficiencia" if sroi > 2.0 else "Moderada")

    st.markdown("---")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 KDE — Densidad Salarial Comparada")
        wages_a = np.array([a["finalWage"] for a in res_a["agents"]], dtype=float)
        wages_b = np.array([a["finalWage"] for a in res_b["agents"]], dtype=float)

        try:
            from scipy.stats import gaussian_kde
            lo = min(wages_a.min(), wages_b.min()); hi = max(wages_a.max(), wages_b.max())
            xs = np.linspace(lo, hi, 200)
            da = gaussian_kde(wages_a)(xs); db = gaussian_kde(wages_b)(xs)
        except Exception:
            xs = np.linspace(0, 200000, 50)
            da = np.zeros(50); db = np.zeros(50)

        fig_k = go.Figure()
        fig_k.add_trace(go.Scatter(x=xs, y=da, mode="lines", name=f"A: {pol_a['name'][:30]}",
                                    line=dict(color="#FF5252",width=2,dash="dash"),
                                    fill="tozeroy", fillcolor="rgba(255,82,82,0.12)"))
        fig_k.add_trace(go.Scatter(x=xs, y=db, mode="lines", name=f"B: {pol_b['name'][:30]}",
                                    line=dict(color="#00E676",width=3),
                                    fill="tozeroy", fillcolor="rgba(0,230,118,0.18)"))
        fig_k.update_layout(title="KDE — Densidad de Probabilidad Salarial",
                             xaxis_title="Ingreso Final ($)", yaxis_title="Densidad f(w)",
                             template="plotly_dark", height=400, margin=dict(l=30,r=30,t=40,b=30))
        st.plotly_chart(fig_k, use_container_width=True)

    with col2:
        st.subheader("🔮 Proyección Gini a 5, 10, 20 Años")
        yrs = [0,5,10,15,20]
        base_g = res_a["country"]["baselineGini"]
        diff_g = base_g - res_b["estimatedGini"]
        traj_a = [base_g, base_g*0.99, base_g*0.98, base_g*0.97, res_a["estimatedGini"]]
        traj_b = [base_g,
                  base_g - diff_g*0.35, base_g - diff_g*0.70,
                  base_g - diff_g*0.90, res_b["estimatedGini"]]
        fig_p = go.Figure()
        fig_p.add_trace(go.Scatter(x=yrs, y=traj_a, mode="lines+markers", name="Política A",
                                    line=dict(color="#FF5252",width=2)))
        fig_p.add_trace(go.Scatter(x=yrs, y=traj_b, mode="lines+markers", name="Política B",
                                    line=dict(color="#00E676",width=3)))
        fig_p.update_layout(title="Convergencia Proyectada del Gini",
                             xaxis_title="Horizonte (Años)", yaxis_title="Gini Proyectado",
                             template="plotly_dark", height=400, margin=dict(l=30,r=30,t=40,b=30))
        st.plotly_chart(fig_p, use_container_width=True)

    st.markdown("### 🧩 Canales de Movilidad (Oaxaca-Blinder / Shapley) — Política B")
    cols = st.columns(len(res_b["channelDecomposition"]))
    for idx, d in enumerate(res_b["channelDecomposition"]):
        with cols[idx]:
            st.metric(d["channel"][:25], f"{d['percentage']:.0f}%", help=d["description"])
