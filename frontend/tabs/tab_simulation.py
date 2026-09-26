import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, Any

def render_tab_simulation(api_client, country_id: str, active_policy: Dict[str, Any]):
    st.header("📈 Simulador Macro / Micro: Evolución Temporal y Distribución")
    st.caption("Modela las dinámicas distributivas, trayectorias salariales por deciles y el coeficiente de Gini en tiempo real.")

    c1, c2, c3, c4, c5 = st.columns(5)
    with c1: horizon_t = st.slider("Horizonte T (Años)", 10, 45, 45, 5)
    with c2: beta = st.slider("Descuento β", 0.80, 0.99, 0.95, 0.01)
    with c3: rho = st.slider("Retorno Edu ρ", 0.05, 0.25, 0.095, 0.005)
    with c4: tmc = st.selectbox("TMC Activa", [True, False], index=0, format_func=lambda v: "Sí" if v else "No")
    with c5: shock = st.slider("Shock Macro", -0.30, 0.30, 0.00, 0.05)

    policy = dict(active_policy)
    policy["conditionalCashTransfers"] = tmc

    with st.spinner("Ejecutando simulación HDT-ABM-RL..."):
        sim = api_client.run_simulation(
            country_id=country_id, policy_dict=policy, num_agents=500,
            discount_beta=beta, edu_return_rho=rho, macro_shock=shock,
        )

    st.markdown("---")
    m1, m2, m3, m4 = st.columns(4)
    baseline_gini = sim["country"]["baselineGini"]
    with m1:
        st.metric("Coeficiente de Gini", f"{sim['estimatedGini']:.3f}",
                  f"{sim['estimatedGini'] - baseline_gini:.3f} vs Base", delta_color="inverse")
    with m2:
        st.metric("Brecha P90/P10", f"{sim['p90p10Ratio']:.2f}x", help="Ratio Percentil 90 / Percentil 10")
    with m3:
        st.metric("Pobreza Multidimensional", f"{sim['multidimensionalPovertyRate']*100:.1f}%",
                  "-2.4% con TMC" if tmc else "+1.8%", delta_color="inverse")
    with m4:
        st.metric("Movilidad Relativa (1-IGE)", f"{sim['relativeIntergenerationalMobility']:.3f}")

    st.markdown("---")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Curva de Lorenz Interactiva")
        lorenz = sim["lorenzCurve"]
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=[0,1], y=[0,1], mode="lines", name="Igualdad Perfecta (45°)",
                                  line=dict(color="#9E9E9E", dash="dash", width=2)))
        fig.add_trace(go.Scatter(
            x=[p["populationFraction"] for p in lorenz],
            y=[p["incomeFraction"] for p in lorenz],
            mode="lines+markers", name=f"Lorenz (Gini={sim['estimatedGini']:.3f})",
            line=dict(color="#00E676", width=3),
            fill="tonexty", fillcolor="rgba(0,230,118,0.12)"))
        fig.update_layout(title="Curva de Lorenz vs. Distribución Equitativa",
                          xaxis_title="Proporción Acumulada de Población",
                          yaxis_title="Proporción Acumulada de Ingreso",
                          template="plotly_dark", height=420,
                          margin=dict(l=40,r=40,t=50,b=40))
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("📈 Evolución por 10 Deciles Salariales")
        dec_data = [d for d in sim["decileTrajectories"] if d["age"] <= horizon_t]
        ages = [d["age"] for d in dec_data]
        fig2 = go.Figure()
        for dec in range(1, 11):
            wages = [d[f"decile{dec}"] for d in dec_data]
            fig2.add_trace(go.Scatter(x=ages, y=wages, mode="lines",
                                       name=f"Decil {dec}",
                                       line=dict(width=2.5 if dec in (1,5,10) else 1.2)))
        fig2.update_layout(title=f"Trayectorias Salariales (Años 0 a {horizon_t})",
                           xaxis_title="Edad (Años)", yaxis_title="Salario Anual ($)",
                           template="plotly_dark", height=420,
                           margin=dict(l=40,r=40,t=50,b=40))
        st.plotly_chart(fig2, use_container_width=True)
