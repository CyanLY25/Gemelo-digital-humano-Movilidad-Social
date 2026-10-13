import streamlit as st
import plotly.graph_objects as go
import time

def render_tab_05_orquestacion_ia(api_client):
    st.header("🤖 Pestaña 5: Orquestación IA: LangGraph + LangChain + Langflow v1.x")
    st.caption("Consola del Grafo de Estados con MemorySaver Checkpointer y clientes REST para agentes econométricos.")

    status = api_client.get_orchestration_status()
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("Estado del Grafo", status.get("status", "ready").upper(), "MemorySaver Active")
    with c2: st.metric("Herramientas Registradas", len(status.get("availableTools", [])), "LangChain @tool")
    with c3: st.metric("Nodos del Grafo", len(status.get("nodes", [])), "StateGraph Nodes")
    with c4: st.metric("Langflow URL", status.get("config", {}).get("langflowBaseUrl", "http://localhost:7860"))

    st.markdown("---")
    st.subheader("🕸️ Diagrama del Grafo de Estados (StateGraph)")

    nodes_pos = {
        "START": (0, 1),
        "classify_intent": (1, 1),
        "nodo_agent": (2, 1.8),
        "nodo_langchain": (2, 1.0),
        "nodo_langflow": (2, 0.2),
        "validate_output": (3, 1),
        "MemorySaver END": (4, 1),
    }

    edges = [
        ("START", "classify_intent"),
        ("classify_intent", "nodo_agent"),
        ("classify_intent", "nodo_langchain"),
        ("classify_intent", "nodo_langflow"),
        ("nodo_agent", "validate_output"),
        ("nodo_langchain", "validate_output"),
        ("nodo_langflow", "validate_output"),
        ("validate_output", "MemorySaver END"),
    ]

    fig_g = go.Figure()
    for u, v in edges:
        x0, y0 = nodes_pos[u]
        x1, y1 = nodes_pos[v]
        fig_g.add_trace(go.Scatter(x=[x0, x1, None], y=[y0, y1, None], mode="lines", line=dict(color="#64B5F6", width=2), hoverinfo="none", showlegend=False))

    xs = [p[0] for p in nodes_pos.values()]
    ys = [p[1] for p in nodes_pos.values()]
    labels = list(nodes_pos.keys())
    nc = ["#00E676" if n in ("START", "MemorySaver END") else ("#FFB300" if n == "classify_intent" else "#29B6F6") for n in labels]

    fig_g.add_trace(go.Scatter(x=xs, y=ys, mode="markers+text", marker=dict(size=38, color=nc, line=dict(color="white", width=2)), text=labels, textposition="top center", textfont=dict(color="white", size=11), showlegend=False))
    fig_g.update_layout(xaxis=dict(showgrid=False, zeroline=False, showticklabels=False), yaxis=dict(showgrid=False, zeroline=False, showticklabels=False), template="plotly_dark", height=260, margin=dict(l=20, r=20, t=20, b=20))
    st.plotly_chart(fig_g, use_container_width=True)
    st.caption("💡 **Interpretabilidad & Explicabilidad**: Representa la topología del flujo de control por nodos. Explica cómo la intención detectada en la entrada enruta la ejecución hacia herramientas econométricas, RAG o flujos de Langflow.")

    st.markdown("---")
    st.subheader("💬 Consola de Ejecución del Orquestador")

    ci, cs = st.columns([3, 1])
    with ci:
        query = st.text_input("Consulta para los Agentes IA:", value="Calcula la variación del Coeficiente de Gini de 0.62 a 0.54 con la política de primera infancia.")
    with cs:
        sess_id = st.text_input("Session ID (thread_id)", value="session-demo-311")

    st.markdown("**Ejemplos Rápidos:**")
    bc1, bc2, bc3, bc4 = st.columns(4)
    if bc1.button("🧮 Cálculo Gini"): query = "Calcula la variación del Gini de 0.62 a 0.54"
    if bc2.button("🚨 Evaluación Deserción"): query = "Evalúa el riesgo de deserción para asistencia 64% y notas 52"
    if bc3.button("📚 Consulta RAG"): query = "Consulta evidencia documental sobre transferencias condicionadas"
    if bc4.button("⚡ Flujo Langflow"): query = "Ejecuta el flujo langflow dropout-early-warning-flow"

    if st.button("🚀 Ejecutar Flujo LangGraph", type="primary"):
        with st.spinner("Ejecutando StateGraph con MemorySaver Checkpointer..."):
            res = api_client.run_orchestration(query=query, session_id=sess_id)

        st.markdown("### 🎯 Respuesta Validada")
        st.success(res["response"])

        st.markdown("### ⏱️ Traza de Nodos Ejecutados")
        steps = res.get("executionSteps", [])
        for idx, step in enumerate(steps):
            st.markdown(f"**Paso {idx+1} — Nodo `{step['node']}`**")
            if step.get("details"):
                st.json(step["details"])
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Muestra la secuencia auditables de nodos ejecutados en tiempo real con sus marcas temporales y datos de contexto transferidos.")
