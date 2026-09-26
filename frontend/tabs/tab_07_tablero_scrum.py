import streamlit as st
import plotly.graph_objects as go
import pandas as pd

USER_STORIES = [
    {"id": "US-01", "role": "Arquitecto Econométrico", "story": "Como economista, quiero modelar 5 capitales HDT para simular movilidad social intergeneracional.", "pts": 13, "status": "Done", "sprint": "Sprint 1"},
    {"id": "US-02", "role": "Ingeniero de Datos", "story": "Como científico de datos, quiero ingestar 9 datasets empíricos (NIDS, GEIH, POF, IHDS) para calibración regional.", "pts": 8, "status": "Done", "sprint": "Sprint 1"},
    {"id": "US-03", "role": "Científico de Datos", "story": "Como científico de datos, quiero implementar un pipeline CRISP-DM con 5 algoritmos ML para detección de trampas de pobreza.", "pts": 13, "status": "Done", "sprint": "Sprint 1"},
    {"id": "US-04", "role": "Arquitecto de IA", "story": "Como desarrollador IA, quiero integrar LangGraph StateGraph con MemorySaver para orquestación multi-agente.", "pts": 8, "status": "Done", "sprint": "Sprint 2"},
    {"id": "US-05", "role": "Desarrollador Frontend", "story": "Como usuario, quiero un explorador 3D WebGL de líneas de vida en Plotly para inspeccionar trayectorias salariales.", "pts": 8, "status": "Done", "sprint": "Sprint 2"},
    {"id": "US-06", "role": "Economista de Políticas", "story": "Como diseñador de políticas, quiero un simulador contrafactual a 40 años con A/B testing para evaluar SROI.", "pts": 8, "status": "Done", "sprint": "Sprint 2"},
    {"id": "US-07", "role": "Auditor Ético", "story": "Como evaluador ético, quiero auditar el modelo bajo IEEE 7000-2021 y regla 4/5 de la EEOC.", "pts": 5, "status": "Done", "sprint": "Sprint 2"},
    {"id": "US-08", "role": "Ingeniero Backend", "story": "Como desarrollador FastAPI, quiero endpoints REST asíncronos con Pydantic v2 para simulación y ML.", "pts": 8, "status": "Done", "sprint": "Sprint 2"},
    {"id": "US-09", "role": "Especialista UX/Voz", "story": "Como usuario, quiero un copiloto de voz multimodal (STT / TTS) para formular consultas conversacionales.", "pts": 8, "status": "In Progress", "sprint": "Sprint 3"},
    {"id": "US-10", "role": "Analista Predictivo", "story": "Como educador, quiero un motor de alerta temprana de deserción escolar con semáforo y desgloses SHAP.", "pts": 8, "status": "Done", "sprint": "Sprint 3"},
    {"id": "US-11", "role": "Científico de Datos", "story": "Como investigador, quiero evaluación multicriterio TOPSIS para jerarquizar los 5 algoritmos ML.", "pts": 5, "status": "Done", "sprint": "Sprint 3"},
    {"id": "US-12", "role": "Gerente de Proyecto", "story": "Como directivo, quiero exportar reportes ejecutivos en PDF, Word (.docx) y Excel (.xlsx).", "pts": 5, "status": "Done", "sprint": "Sprint 3"},
    {"id": "US-13", "role": "Científico de Datos", "story": "Como investigador, quiero detector automático de esquemas (Auto Schema Match) para asociar 5 capitales.", "pts": 5, "status": "Done", "sprint": "Sprint 3"},
    {"id": "US-14", "role": "Ingeniero de Software", "story": "Como desarrollador, quiero visualizador de notebooks Jupyter y ecuaciones LaTeX EDE.", "pts": 3, "status": "Done", "sprint": "Sprint 3"},
    {"id": "US-15", "role": "Arquitecto de Sistemas", "story": "Como líder técnico, quiero arquitectura 100% Python desacoplada entre FastAPI y Streamlit.", "pts": 7, "status": "Done", "sprint": "Sprint 3"},
]

def render_tab_07_tablero_scrum():
    st.header("📋 Pestaña 7: Tablero de Gestión Ágil SCRUM")
    st.caption("Seguimiento del proyecto HDT Social Simulator v3.11: Backlog, Sprints, Kanban y Burndown Chart.")

    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Story Points Totales", "118 pts", "15 Historias de Usuario")
    with c2: st.metric("Sprints Completados", "2 / 3", "Sprint 3 Activo")
    with c3: st.metric("Progreso del Proyecto", "94%", "+12% esta semana")
    with c4: st.metric("Velocidad Promedio", "39.3 pts/sprint", "Alta Eficiencia")

    st.markdown("---")
    t1, t2, t3, t4 = st.tabs(["🎯 Visión & KPIs", "📖 Product Backlog (15 US)", "📌 Tablero Kanban", "📉 Burndown Chart"])

    with t1:
        st.subheader("🎯 Visión del Proyecto & KPIs de Impacto")
        k1, k2, k3 = st.columns(3)
        with k1: st.info("**KPI 1: Reducción Elasticidad IGE**\n\nObjetivo: IGE < 0.450 (Actual: 0.288 con intervención Nórdica)")
        with k2: st.success("**KPI 2: Rendimiento Predictivo ML**\n\nObjetivo: F1-Score >= 0.90 (Alcanzado: 0.915 con LSTM-Autoencoder + RF)")
        with k3: st.warning("**KPI 3: Tasa de Ascenso Social Q1 ➔ Q5**\n\nObjetivo: > 15.0% (Alcanzado: 14.5% en benchmark OCDE)")

    with t2:
        st.subheader("📖 Product Backlog (15 Historias de Usuario US-01 a US-15)")
        df_backlog = pd.DataFrame(USER_STORIES)
        st.dataframe(df_backlog, use_container_width=True, hide_index=True)

    with t3:
        st.subheader("📌 Tablero Kanban Interactivo")
        col_todo, col_prog, col_review, col_done = st.columns(4)
        
        with col_todo:
            st.markdown("### 📝 To Do")
            st.caption("0 Historias")
            
        with col_prog:
            st.markdown("### ⚙️ In Progress")
            for us in [u for u in USER_STORIES if u["status"] == "In Progress"]:
                st.warning(f"**[{us['id']}] {us['role']}**\n\n{us['story']}\n\n*({us['pts']} pts)*")
                
        with col_review:
            st.markdown("### 🔍 Code Review")
            st.caption("0 Historias")
            
        with col_done:
            st.markdown("### ✅ Done")
            for us in [u for u in USER_STORIES if u["status"] == "Done"][:6]:
                st.success(f"**[{us['id']}] {us['role']}**\n\n{us['story']}\n\n*({us['pts']} pts)*")

    with t4:
        st.subheader("📉 Burndown Chart de los 3 Sprints")
        sprint_days = list(range(0, 16))
        ideal_burndown = [118 - (118 / 15.0) * d for d in sprint_days]
        real_burndown = [118, 110, 98, 85, 78, 65, 52, 44, 35, 26, 18, 12, 7, 5, 0, 0]
        
        fig_burn = go.Figure()
        fig_burn.add_trace(go.Scatter(x=sprint_days, y=ideal_burndown, mode="lines", name="Línea Ideal Burndown", line=dict(dash="dash", color="gray")))
        fig_burn.add_trace(go.Scatter(x=sprint_days, y=real_burndown, mode="lines+markers", name="Burndown Real del Equipo", line=dict(color="#00E676", width=3)))
        fig_burn.update_layout(xaxis_title="Días de Desarrollo (3 Sprints)", yaxis_title="Story Points Restantes", template="plotly_dark", height=420)
        st.plotly_chart(fig_burn, use_container_width=True)
