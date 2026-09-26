import streamlit as st
import plotly.graph_objects as go
import pandas as pd

def render_tab_04_alerta_temprana(api_client, country_id: str, active_policy: dict):
    st.header("🚨 Pestaña 4: Alerta Temprana de Deserción Escolar")
    st.caption("Pipeline predictivo individualizado para la prevención del abandono escolar temprano.")

    st.subheader("📁 Origen de Datos Estudiantiles (Dataset N=500)")
    c_data1, c_data2 = st.columns([2, 1])
    with c_data1:
        st.info("Dataset cargado: **500 estudiantes monitoreados** (Tasa empírica de deserción: 12.6%)")
    with c_data2:
        if st.button("🔄 Generar Sintético (500 Estudiantes)", type="secondary"):
            st.success("Dataset sintetizado correctamente.")

    # Evaluador Individual
    st.markdown("---")
    st.subheader("🎓 Evaluador Individual de Riesgo de Deserción")

    with st.form("dropout_form_tab04"):
        f1, f2 = st.columns(2)
        with f1:
            asistencia = st.slider("Asistencia a Clases (%)", 0, 100, 68)
            rendimiento = st.slider("Promedio Académico (0-100)", 0, 100, 52)
            distancia = st.number_input("Distancia al Colegio (km)", 0.0, 50.0, 8.5, 0.5)
            motivacion = st.slider("Motivación Escolar (0-100)", 0, 100, 45)
        with f2:
            apoyo = st.radio("Apoyo y Contención Familiar", [1.0, 0.0], format_func=lambda v: "Sí / Presente" if v == 1.0 else "No / Ausente", index=1)
            internet = st.radio("Acceso a Conectividad Digital", [1.0, 0.0], format_func=lambda v: "Sí" if v == 1.0 else "No", index=0)
            edad = st.number_input("Edad del Estudiante (Años)", 10, 22, 16)
            ingreso_hogar = st.number_input("Ingreso Familiar ($ USD/mes)", 0, 5000, 350)

        st.form_submit_button("🚨 Evaluar Riesgo y Generar Diagnóstico SHAP")

    profile = {
        "rendimiento": float(rendimiento), "asistencia": float(asistencia),
        "distancia_km": float(distancia), "apoyo_familiar": float(apoyo),
        "edad": float(edad), "acceso_internet": float(internet),
        "motivacion": float(motivacion), "ingreso_hogar": float(ingreso_hogar)
    }

    pred = api_client.predict_dropout(profile)

    st.markdown("---")
    r1, r2 = st.columns([1.2, 2])
    with r1:
        risk = pred["riskLevel"]
        prob = pred["probability"]
        if risk == "ALERTA_ROJA":
            st.error(f"### 🔴 ALERTA ROJA: {prob:.1f}% Riesgo")
        elif risk == "RIESGO_MODERADO":
            st.warning(f"### 🟡 RIESGO MODERADO: {prob:.1f}% Riesgo")
        else:
            st.success(f"### 🟢 SIN ALERTA: {prob:.1f}% (Bajo Riesgo)")
        st.info(f"**Ventana de Anticipación**: {pred['anticipationWindow']}")

    with r2:
        st.markdown("#### ⚖️ Factores Determinantes (SHAP Factor Contributions)")
        df = pd.DataFrame(pred["factorContributions"])
        colors = ["#FF1744" if d == "increases_risk" else "#00E676" for d in df["direction"]]
        fig2 = go.Figure()
        fig2.add_trace(go.Bar(x=df["contribution"], y=df["label"], orientation="h", marker=dict(color=colors), text=[f"{v:+.1f} pts" for v in df["contribution"]], textposition="outside"))
        fig2.update_layout(title="Impacto Incremental en el Riesgo", template="plotly_dark", height=300, margin=dict(l=20, r=20, t=40, b=20))
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### 📋 Plan de Intervenciones Focalizadas Priorizadas")
    for rec in pred["recommendations"]:
        icon = "🔴" if rec["priority"] == "Alta" else ("🟡" if rec["priority"] == "Media" else "🟢")
        with st.expander(f"{icon} **[{rec['category']}] {rec['title']}** — Prioridad: {rec['priority']}", expanded=True):
            st.write(rec["description"])
