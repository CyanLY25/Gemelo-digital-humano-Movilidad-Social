import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, Any

def render_tab_02_simulador_politicas(api_client, country_id: str, active_policy: Dict[str, Any]):
    st.header("🧪 Pestaña 2: Simulador & Políticas Públicas (Horizonte 40 Años)")
    st.caption("Evalúe escenarios contrafactuales a 40 años con palancas de ajuste fino en tiempo real.")

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1: edu_acc = st.slider("Expansión Cobertura Terciaria", 0.0, 1.0, float(active_policy.get("educationAccess", 0.0)), 0.05)
    with c2: inst_qual = st.slider("Calidad Institucional Pública", 0.0, 1.0, float(active_policy.get("institutionalQuality", 0.0)), 0.05)
    with c3: inh_tax = st.slider("Impuesto a la Herencia (>P90)", 0.0, 0.5, float(active_policy.get("inheritanceTaxRate", 0.0)), 0.05)
    with c4: early_eff = st.slider("Primera Infancia (0-5 Años)", 0.0, 1.0, float(active_policy.get("earlyChildhoodEffect", 0.0)), 0.05)
    with c5: deseg = st.slider("Desegregación & Subsidio Movilidad", 0.0, 1.0, float(active_policy.get("segregationReduction", 0.0)), 0.05)

    pol_custom = dict(active_policy)
    pol_custom.update({
        "educationAccess": edu_acc,
        "institutionalQuality": inst_qual,
        "inheritanceTaxRate": inh_tax,
        "earlyChildhoodEffect": early_eff,
        "segregationReduction": deseg,
    })

    if st.button("🚀 RUN_SIMULATION (40 YRS)", type="primary"):
        st.session_state["policy_sim_run"] = True

    with st.spinner("Ejecutando horizonte de 40 años de ciclo de vida..."):
        sim = api_client.run_simulation(country_id=country_id, policy_dict=pol_custom, num_agents=500)

    st.markdown("---")
    m1, m2, m3, m4 = st.columns(4)
    base_g = sim["country"]["baselineGini"]
    base_ige = sim["country"]["baselineIGE"]
    
    with m1: st.metric("Gini Proyectado (40 Años)", f"{sim['estimatedGini']:.3f}", f"{sim['estimatedGini'] - base_g:.3f} vs Base", delta_color="inverse")
    with m2: st.metric("Elasticidad IGE Proyectada", f"{sim['estimatedIGE']:.3f}", f"{sim['estimatedIGE'] - base_ige:.3f} vs Base", delta_color="inverse")
    with m3: st.metric("Ascenso Q1 ➔ Q5", f"{sim['q1ToQ5MobilityRate']*100:.1f}%", f"+{(sim['q1ToQ5MobilityRate'] - sim['country']['q1ToQ5Mobility'])*100:.1f}%")
    with m4: st.metric("Pobreza Multidimensional", f"{sim['multidimensionalPovertyRate']*100:.1f}%", "-3.2% Impacto", delta_color="inverse")

    st.markdown("---")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Curva de Lorenz Interactiva")
        lorenz = sim["lorenzCurve"]
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=[0,1], y=[0,1], mode="lines", name="Igualdad Perfecta (45°)", line=dict(color="#9E9E9E", dash="dash")))
        fig.add_trace(go.Scatter(
            x=[p["populationFraction"] for p in lorenz],
            y=[p["incomeFraction"] for p in lorenz],
            mode="lines+markers", name=f"Lorenz (Gini={sim['estimatedGini']:.3f})",
            line=dict(color="#00E676", width=3), fill="tonexty", fillcolor="rgba(0,230,118,0.12)"
        ))
        fig.update_layout(title="Curva de Lorenz vs Igualdad Perfecta", template="plotly_dark", height=420)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("📈 Trayectorias Salariales por 10 Deciles (Años 0-45)")
        dec_data = sim["decileTrajectories"]
        ages = [d["age"] for d in dec_data]
        fig2 = go.Figure()
        for dec in range(1, 11):
            wages = [d[f"decile{dec}"] for d in dec_data]
            fig2.add_trace(go.Scatter(x=ages, y=wages, mode="lines", name=f"Decil {dec}", line=dict(width=2.5 if dec in (1,5,10) else 1.2)))
        fig2.update_layout(title="Trayectorias Longitudinales Salariales", template="plotly_dark", height=420)
        st.plotly_chart(fig2, use_container_width=True)
