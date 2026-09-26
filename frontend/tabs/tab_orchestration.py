import streamlit as st
import plotly.graph_objects as go
import time
from typing import Dict, Any

def render_tab_orchestration(api_client):
    st.header("🤖 Orquestación IA: LangGraph + LangChain + Langflow v1.x")
    st.caption("Monitor del StateGraph, consola de ejecución con MemorySaver Checkpointer y traza de nodos.")

    status = api_client.get_orchestration_status()
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Motor", status.get("status","ready").upper())
    with c2: st.metric("Herramientas", len(status.get("availableTools",[])), "LangChain @tool")
    with c3: st.metric("Nodos del Grafo", len(status.get("nodes",[])))
    with c4:
        lf_url = status.get("config",{}).get("langflowBaseUrl","http://localhost:7860")
        st.metric("Langflow URL", lf_url.replace("http://",""))

    st.markdown("---")
    st.subheader("🕸️ Topología del Grafo de Estados (START → nodos → END)")

    nodes_pos = {"START":(0,1),"classify_intent":(1,1),"nodo_agent":(2,1.8),
                  "nodo_langchain":(2,1.0),"nodo_langflow":(2,0.2),"validate_output":(3,1),"END":(4,1)}
    edges = [("START","classify_intent"),("classify_intent","nodo_agent"),("classify_intent","nodo_langchain"),
             ("classify_intent","nodo_langflow"),("nodo_agent","validate_output"),
             ("nodo_langchain","validate_output"),("nodo_langflow","validate_output"),("validate_output","END")]

    fig_g = go.Figure()
    for u, v in edges:
        x0,y0 = nodes_pos[u]; x1,y1 = nodes_pos[v]
        fig_g.add_trace(go.Scatter(x=[x0,x1,None],y=[y0,y1,None],mode="lines",
                                    line=dict(color="#64B5F6",width=2),hoverinfo="none",showlegend=False))
    xs = [p[0] for p in nodes_pos.values()]; ys = [p[1] for p in nodes_pos.values()]
    labels = list(nodes_pos.keys())
    nc = ["#00E676" if n in ("START","END") else "#FFB300" if n=="classify_intent" else "#29B6F6" for n in labels]
    fig_g.add_trace(go.Scatter(x=xs, y=ys, mode="markers+text",
                                marker=dict(size=38,color=nc,line=dict(color="white",width=2)),
                                text=labels, textposition="top center",
                                textfont=dict(color="white",size=11), showlegend=False))
    fig_g.update_layout(xaxis=dict(showgrid=False,zeroline=False,showticklabels=False),
                         yaxis=dict(showgrid=False,zeroline=False,showticklabels=False),
                         template="plotly_dark", height=260, margin=dict(l=20,r=20,t=20,b=20))
    st.plotly_chart(fig_g, use_container_width=True)

    st.markdown("---")
    st.subheader("💬 Consola de Ejecución del Orquestador")

    ci, cs = st.columns([3,1])
    with ci:
        query = st.text_input("Consulta para el sistema de agentes:",
                               value="Calcula la variación del Coeficiente de Gini de 0.62 a 0.54 con la política de primera infancia.",
                               placeholder="ej. Calcula el riesgo de deserción o consulta sobre la evidencia empírica del Gini...")
    with cs:
        sess_id = st.text_input("Session ID (thread_id)", value="session-demo-101")

    st.markdown("**Ejemplos rápidos:**")
    bc1, bc2, bc3, bc4 = st.columns(4)
    if bc1.button("🧮 Cálculo Gini"):
        query = "Calcula la variación del Coeficiente de Gini de 0.62 a 0.54 con la política de primera infancia."
    if bc2.button("🚨 Riesgo Deserción"):
        query = "Evalúa el riesgo de deserción para un estudiante con asistencia 64%, notas 52 y distancia 8.5 km."
    if bc3.button("📚 Consulta RAG"):
        query = "Consulta documental sobre la evidencia empírica de transferencias monetarias condicionadas en el corpus."
    if bc4.button("⚡ Flujo Langflow"):
        query = "Ejecuta el flujo langflow dropout-early-warning-flow para predecir el impacto escolar."

    if st.button("🚀 Ejecutar Flujo LangGraph", type="primary"):
        with st.spinner("Ejecutando StateGraph con MemorySaver Checkpointer..."):
            res = api_client.run_orchestration(query=query, session_id=sess_id)

        st.markdown("### 🎯 Respuesta Validada")
        intent_badge = {"agent":"🧮 Agent (Tools)","langchain":"📚 LangChain RAG","langflow":"⚡ Langflow REST"}.get(res["intent"],"🤖")
        st.info(f"**Intención Detectada**: {intent_badge} | **Ruta**: `{res['routeExecuted']}` | **Checkpointed**: {'✅' if res['stateCheckpointed'] else '⚠️'}")
        st.success(res["response"])

        st.markdown("### ⏱️ Traza de Ejecución por Nodos")
        steps = res.get("executionSteps", [])
        for idx, step in enumerate(steps):
            ts = step.get("timestamp", 0)
            try: t_str = time.strftime("%H:%M:%S", time.localtime(float(ts)))
            except: t_str = "—"
            st.markdown(f"**Paso {idx+1} [{t_str}] — Nodo `{step['node']}`**")
            if step.get("details"):
                st.json(step["details"])

        st.markdown(f"**Total pasos**: {res['metadata'].get('totalSteps',0)} | **Herramientas usadas**: {res['metadata'].get('toolsUsed',0)}")
