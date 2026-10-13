import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from backend.services.hdt_abm_engine import COUNTRY_CALIBRATIONS

def render_tab_08_metricas_gatsby(api_client, country_id: str, active_policy: dict):
    st.header("📊 Pestaña 8: Métricas & Curva de Great Gatsby")
    st.caption("Curva de Great Gatsby internacional, matriz de transición 5x5 y descomposición de Oaxaca-Blinder / Shapley.")

    with st.spinner("Calculando métricas intergeneracionales..."):
        sim = api_client.run_simulation(country_id=country_id, policy_dict=active_policy, num_agents=500)

    # KPI Cards
    m1, m2, m3, m4 = st.columns(4)
    with m1: st.metric("Elasticidad IGE Estimada", f"{sim['estimatedIGE']:.3f}", "Inmovilidad Intergeneracional")
    with m2: st.metric("Ascenso Q1 ➔ Q5", f"{sim['q1ToQ5MobilityRate']*100:.1f}%", "Movilidad de Salto")
    with m3: st.metric("Coeficiente de Gini Base", f"{sim['estimatedGini']:.3f}", "Desigualdad Económica")
    with m4: st.metric("Persistencia en Pobreza (Q1-Q2)", "74.8%", "Trampa Dinástica", delta_color="inverse")

    st.markdown("---")
    c1, c2 = st.columns(2)

    with c1:
        st.subheader("🔥 Matriz de Transición Intergeneracional 5x5")
        matrix = sim["transitionMatrix"]
        labels = ["Q1", "Q2", "Q3", "Q4", "Q5"]
        z_pct = [[round(v * 100, 1) for v in row] for row in matrix]
        fig_heat = go.Figure(data=go.Heatmap(z=z_pct, x=labels, y=labels, colorscale="Viridis", text=[[f"{v:.1f}%" for v in row] for row in z_pct], texttemplate="%{text}", textfont={"size": 13, "color": "white"}))
        fig_heat.update_layout(title="Probabilidad Condicional Padre (Fila) -> Hijo (Col)", xaxis_title="Quintil Destino (Hijo)", yaxis_title="Quintil Origen (Padre)", template="plotly_dark", height=420)
        st.plotly_chart(fig_heat, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Describe las probabilidades condicionales de movilidad entre quintiles. La diagonal principal explica la persistencia de estatus socioeconómico de padres a hijos.")

    with c2:
        st.subheader("🌐 Curva de Great Gatsby Internacional")
        countries_gatsby = [
            {"name": "Sudáfrica", "gini": 0.63, "ige": 0.68, "color": "#FF1744"},
            {"name": "Brasil", "gini": 0.53, "ige": 0.58, "color": "#FF9100"},
            {"name": "Colombia/Bogotá", "gini": 0.54, "ige": 0.59, "color": "#FFEA00"},
            {"name": "India", "gini": 0.49, "ige": 0.64, "color": "#AA00FF"},
            {"name": "Chile", "gini": 0.46, "ige": 0.52, "color": "#29B6F6"},
            {"name": "EE.UU.", "gini": 0.41, "ige": 0.47, "color": "#64B5F6"},
            {"name": "Alemania", "gini": 0.31, "ige": 0.32, "color": "#00E676"},
            {"name": "Dinamarca (Nórdico)", "gini": 0.28, "ige": 0.22, "color": "#00E676"},
        ]
        
        df_gats = pd.DataFrame(countries_gatsby)
        fig_gats = go.Figure()
        fig_gats.add_trace(go.Scatter(x=df_gats["gini"], y=df_gats["ige"], mode="markers+text", text=df_gats["name"], textposition="top center", marker=dict(size=14, color=df_gats["color"])))
        fig_gats.add_trace(go.Scatter(x=[0.25, 0.65], y=[0.20, 0.70], mode="lines", line=dict(color="gray", dash="dash"), name="Tendencia Global"))
        fig_gats.update_layout(title="Curva de Great Gatsby (Gini vs Elasticidad IGE)", xaxis_title="Coeficiente de Gini", yaxis_title="Elasticidad Intergeneracional del Ingreso (IGE)", template="plotly_dark", height=420)
        st.plotly_chart(fig_gats, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Ubica la calibración regional en el mapa global. Explica la correlación positiva entre alta desigualdad de ingresos (Gini) y baja movilidad intergeneracional (alto IGE).")

    st.markdown("---")
    st.subheader("🧩 Descomposición de Canales de Movilidad Social (Oaxaca-Blinder / Shapley)")
    cols_d = st.columns(5)
    decomp = sim["channelDecomposition"]
    for idx, d_item in enumerate(decomp):
        with cols_d[idx]:
            st.metric(d_item["channel"], f"{d_item['percentage']:.0f}%", help=d_item["description"])
    st.caption("💡 **Interpretabilidad & Explicabilidad**: Desglosa el peso relativo porcentual de cada canal explicativo sobre la movilidad social (capital cognitivo, redes, segregación, calidad universitaria e herencia).")
