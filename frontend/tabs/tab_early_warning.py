import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from typing import Dict, Any

def render_tab_early_warning(api_client, country_id: str, active_policy: Dict[str, Any]):
    st.header("🚨 Sistema Predictivo y Alerta Temprana de Deserción Escolar")
    st.caption("Monitoree la rigidez intergeneracional y evalúe individualmente el riesgo de abandono escolar.")

    with st.spinner("Cargando matriz de transición..."):
        sim = api_client.run_simulation(country_id=country_id, policy_dict=active_policy, num_agents=500)
    matrix = sim["transitionMatrix"]

    col_left, col_right = st.columns([1,1])

    with col_left:
        st.subheader("🔥 Matriz de Transición Intergeneracional (5×5 Quintiles)")
        st.caption("Fila = Quintil de Origen (Padres) | Columna = Quintil de Destino (Hijo)")
        labels = ["Q1 (Más Pobre)","Q2","Q3","Q4","Q5 (Más Rico)"]
        z_pct = [[round(v*100,1) for v in row] for row in matrix]
        fig = go.Figure(data=go.Heatmap(
            z=z_pct, x=labels, y=labels, colorscale="Viridis",
            text=[[f"{v:.1f}%" for v in row] for row in z_pct],
            texttemplate="%{text}", textfont={"size":13,"color":"white"}, hoverongaps=False))
        fig.update_layout(title="Probabilidad de Transición Intergeneracional (%)",
                          xaxis_title="Quintil de Destino (Hijo)",
                          yaxis_title="Quintil de Origen (Padres)",
                          template="plotly_dark", height=440, margin=dict(l=40,r=40,t=50,b=40))
        st.plotly_chart(fig, use_container_width=True)

    with col_right:
        st.subheader("🎓 Evaluador Individual de Riesgo de Deserción")
        with st.form("dropout_form"):
            f1, f2 = st.columns(2)
            with f1:
                asistencia = st.slider("Asistencia (%)", 0, 100, 68)
                rendimiento = st.slider("Promedio Académico (0-100)", 0, 100, 52)
                distancia = st.number_input("Distancia al Colegio (km)", 0.0, 50.0, 8.5, 0.5)
                motivacion = st.slider("Motivación (0-100)", 0, 100, 45)
            with f2:
                apoyo = st.radio("Apoyo Familiar", [1.0, 0.0],
                                  format_func=lambda v: "Sí / Presente" if v==1.0 else "No / Ausente", index=1)
                internet = st.radio("Acceso a Internet", [1.0, 0.0],
                                     format_func=lambda v: "Sí" if v==1.0 else "No", index=0)
                edad = st.number_input("Edad del Estudiante", 10, 22, 16)
                ingreso_hogar = st.number_input("Ingreso Hogar ($/mes)", 0, 5000, 350)
            st.form_submit_button("🚨 Evaluar Riesgo")

    profile = {"rendimiento": float(rendimiento), "asistencia": float(asistencia),
                "distancia_km": float(distancia), "apoyo_familiar": float(apoyo),
                "edad": float(edad), "acceso_internet": float(internet),
                "motivacion": float(motivacion), "ingreso_hogar": float(ingreso_hogar)}

    with st.spinner("Calculando probabilidad de deserción..."):
        pred = api_client.predict_dropout(profile)

    st.markdown("---")
    st.subheader("📊 Diagnóstico y Factores de Riesgo")

    r1, r2 = st.columns([1.2, 2])
    with r1:
        risk = pred["riskLevel"]; prob = pred["probability"]
        if risk == "ALERTA_ROJA":
            st.error(f"### 🔴 ALERTA ROJA: {prob:.1f}% Riesgo")
        elif risk == "RIESGO_MODERADO":
            st.warning(f"### 🟡 RIESGO MODERADO: {prob:.1f}%")
        else:
            st.success(f"### 🟢 SIN ALERTA: {prob:.1f}%")
        st.info(f"**Ventana de Anticipación**: {pred['anticipationWindow']}")

    with r2:
        st.markdown("#### ⚖️ Contribución Marginal de Factores (SHAP-style)")
        df = pd.DataFrame(pred["factorContributions"])
        colors = ["#FF1744" if d=="increases_risk" else "#00E676" for d in df["direction"]]
        fig2 = go.Figure()
        fig2.add_trace(go.Bar(x=df["contribution"], y=df["label"], orientation="h",
                               marker=dict(color=colors),
                               text=[f"{v:+.1f}" for v in df["contribution"]], textposition="outside"))
        fig2.update_layout(title="Impacto en el Riesgo de Deserción",
                           xaxis_title="Puntos de Contribución al Riesgo",
                           template="plotly_dark", height=300, margin=dict(l=20,r=20,t=40,b=20))
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### 📋 Plan de Intervenciones Focalizadas")
    for rec in pred["recommendations"]:
        icon = "🔴" if rec["priority"]=="Alta" else ("🟡" if rec["priority"]=="Media" else "🟢")
        with st.expander(f"{icon} **[{rec['category']}] {rec['title']}** — {rec['priority']}", expanded=True):
            st.write(rec["description"])
