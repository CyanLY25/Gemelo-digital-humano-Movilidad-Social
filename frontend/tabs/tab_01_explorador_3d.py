import streamlit as st
import plotly.graph_objects as go
import numpy as np
from typing import Dict, Any

def render_tab_01_explorador_3d(api_client, country_id: str, active_policy: Dict[str, Any]):
    st.header("🌐 Pestaña 1: Explorador 3D WebGL & Líneas de Vida")
    st.caption("Visualice hiperespacios tridimensionales HDT, líneas de vida individuales, homofilia y la superficie de Gatsby 3D.")

    mode = st.radio(
        "Seleccionar Modo de Visualización 3D:",
        ["Líneas de Vida 3D", "Hiperespacio HDT (5 Capitales)", "Redes & Homofilia 3D", "Curva Gatsby 3D"],
        horizontal=True
    )

    with st.spinner("Simulando población de agentes HDT..."):
        sim = api_client.run_simulation(country_id=country_id, policy_dict=active_policy, num_agents=250)
    agents = sim["agents"]

    if mode == "Líneas de Vida 3D":
        fig = go.Figure()
        colors_q = {1: "#FF1744", 2: "#FF9100", 3: "#FFEA00", 4: "#29B6F6", 5: "#00E676"}
        for a in agents[:80]:
            ages = [p["age"] for p in a["trajectory"]]
            hum = [a["capital"]["human"] for _ in ages]
            wage = [p["wage"] for p in a["trajectory"]]
            fig.add_trace(go.Scatter3d(
                x=ages, y=hum, z=wage, mode="lines",
                line=dict(color=colors_q[a["originQuintile"]], width=2),
                name=f"Q{a['originQuintile']}", hovertext=f"ID: {a['id']} | Degree: {a['highestDegree']}"
            ))
        fig.update_layout(
            title="Líneas de Vida 3D (Eje X: Edad 18-65 | Eje Y: Capital Humano | Eje Z: Ingreso $)",
            scene=dict(xaxis_title="Edad (Años)", yaxis_title="Capital Humano (Años Edu)", zaxis_title="Salario ($)"),
            template="plotly_dark", height=650
        )
        st.plotly_chart(fig, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Muestra la trayectoria salarial individual de cada agente a lo largo de su vida. Permite explicar cómo el quintil de origen (color) condiciona la velocidad de acumulación salarial conforme aumenta la edad y el nivel educativo.")

    elif mode == "Hiperespacio HDT (5 Capitales)":
        fig = go.Figure()
        x_pts = [a["capital"]["cognitive"] for a in agents]
        y_pts = [a["capital"]["social"] * 100 for a in agents]
        z_pts = [a["finalWage"] for a in agents]
        colors = ["#FF1744" if a["originQuintile"]==1 else "#00E676" for a in agents]
        
        fig.add_trace(go.Scatter3d(
            x=x_pts, y=y_pts, z=z_pts, mode="markers",
            marker=dict(size=6, color=colors, opacity=0.85),
            text=[f"ID: {a['id']}<br>Grit: {a['capital']['psychological']:.2f}" for a in agents]
        ))
        fig.update_layout(
            title="Hiperespacio 3D de Capitales Vectoriales (Cognitivo × Social × Ingreso)",
            scene=dict(xaxis_title="Capital Cognitivo (IQ)", yaxis_title="Capital Social (%)", zaxis_title="Salario Terminal ($)"),
            template="plotly_dark", height=650
        )
        st.plotly_chart(fig, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Ilustra la distribución espacial de la población según su dotación de capitales. Explica por qué agentes con alto capital cognitivo y social logran mayores salarios finales independientemente del sesgo inicial.")

    elif mode == "Redes & Homofilia 3D":
        fig = go.Figure()
        x_pts = [a["capital"]["human"] for a in agents]
        y_pts = [a["capital"]["social"] for a in agents]
        z_pts = [a["finalWage"] for a in agents]
        
        ex, ey, ez = [], [], []
        for i in range(min(len(agents), 100)):
            for j in range(i+1, min(len(agents), 100)):
                if agents[i]["originQuintile"] == agents[j]["originQuintile"]:
                    if np.random.rand() < 0.05:
                        ex.extend([x_pts[i], x_pts[j], None])
                        ey.extend([y_pts[i], y_pts[j], None])
                        ez.extend([z_pts[i], z_pts[j], None])
        if ex:
            fig.add_trace(go.Scatter3d(x=ex, y=ey, z=ez, mode="lines", line=dict(color="rgba(100,181,246,0.3)", width=1.5)))
            
        fig.add_trace(go.Scatter3d(x=x_pts, y=y_pts, z=z_pts, mode="markers", marker=dict(size=5, color="#29B6F6")))
        fig.update_layout(title="Redes de Homofilia y Lazos Débiles de Granovetter 3D", template="plotly_dark", height=650)
        st.plotly_chart(fig, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Visualiza los vínculos de red entre agentes del mismo estrato socioeconómico (homofilia). Explica el fenómeno de formación de trampas de pobreza por aislamiento de redes informativas formales.")

    else:  # Curva Gatsby 3D
        ginis = np.linspace(0.2, 0.7, 20)
        segs = np.linspace(0.1, 0.9, 20)
        G, S = np.meshgrid(ginis, segs)
        IGE_surface = 0.1 + 0.8 * G + 0.3 * S
        
        fig = go.Figure(data=[go.Surface(z=IGE_surface, x=G, y=S, colorscale="Viridis")])
        fig.update_layout(
            title="Superficie Tridimensional de Great Gatsby (Gini × Segregación × IGE)",
            scene=dict(xaxis_title="Coeficiente de Gini", yaxis_title="Índice de Segregación", zaxis_title="Elasticidad IGE"),
            template="plotly_dark", height=650
        )
        st.plotly_chart(fig, use_container_width=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Mapea la interacción combinada entre desigualdad de ingresos (Gini) y segregación espacial sobre la inmovilidad intergeneracional (IGE). Explica cómo a mayor desigualdad urbana se amplifica la rigidez social.")

    # HDT Inspector Panel
    st.markdown("---")
    st.subheader("🔍 HDT Inspector Panel del Agente")
    sel_agent_id = st.selectbox("Seleccionar Agente HDT para Inspección Detallada", [a["id"] for a in agents])
    agent_info = next(a for a in agents if a["id"] == sel_agent_id)

    col1, col2 = st.columns([1, 2])
    with col1:
        st.markdown(f"**ID Agente**: `{agent_info['id']}`")
        st.markdown(f"**Género**: {agent_info['gender']}")
        st.markdown(f"**Quintil Origen**: Q{agent_info['originQuintile']} ➔ **Quintil Final**: Q{agent_info['finalQuintile']}")
        st.markdown(f"**Salario Terminal**: `${agent_info['finalWage']:,}`")
        st.markdown(f"**Grado Máximo**: {agent_info['highestDegree']}")

    with col2:
        st.markdown("**Vector de 5 Capitales HDT:**")
        caps = agent_info["capital"]
        st.progress(min(1.0, caps["cognitive"] / 140.0), text=f"Cognitivo (IQ): {caps['cognitive']:.1f}")
        st.progress(min(1.0, caps["human"] / 20.0), text=f"Humano (Escolaridad): {caps['human']:.1f} años")
        st.progress(min(1.0, caps["social"]), text=f"Social (Weak Ties): {caps['social']*100:.0f}%")
        st.progress(min(1.0, caps["psychological"]), text=f"Psicológico (Grit): {caps['psychological']:.2f}")
        st.progress(min(1.0, caps["structural"]), text=f"Estructural (Vecindario): {caps['structural']:.2f}")
    
    st.caption("💡 **Interpretabilidad & Explicabilidad**: Desglosa el perfil micro-económico y los 5 capitales constitutivos del agente seleccionado, explicando su movilidad relativa desde el quintil de origen hacia el quintil de destino.")
