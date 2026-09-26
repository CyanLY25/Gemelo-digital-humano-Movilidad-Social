import streamlit as st
import plotly.graph_objects as go
import numpy as np
from typing import Dict, Any

def render_tab_visualization_3d(api_client, country_id: str, active_policy: Dict[str, Any]):
    st.header("🌐 Visualización 3D de Agentes y Redes Sociales")
    st.caption("Explore la topología 3D de la población HDT: Capital Humano × Capital Social × Ingreso.")

    c1, c2, c3 = st.columns([3,1,1])
    with c1: sel_age = st.slider("Época / Edad del Ciclo de Vida", 18, 45, 35, 1)
    with c2: show_links = st.checkbox("Mostrar Red 3D (Weak Ties)", value=True)
    with c3: n_vis = st.selectbox("Agentes Visibles", [100, 250, 500], index=1)

    with st.spinner("Generando espacio tridimensional de agentes..."):
        sim = api_client.run_simulation(country_id=country_id, policy_dict=active_policy, num_agents=n_vis)

    agents = sim["agents"]
    x_vals, y_vals, z_vals, colors, hover = [], [], [], [], []

    for agent in agents:
        traj = next((p for p in agent["trajectory"] if p["age"] == sel_age), agent["trajectory"][-1])
        h = agent["capital"]["human"]
        s = traj["weakTiesCount"] / 20.0
        w = traj["wage"]

        if w < 15000 or (agent["originQuintile"] == 1 and traj["employment"] == "Informal"):
            col = "#FF1744"
        elif w < 30000:
            col = "#FFC400"
        else:
            col = "#00E676"

        x_vals.append(h); y_vals.append(s); z_vals.append(w)
        colors.append(col)
        hover.append(f"ID: {agent['id']}<br>Género: {agent['gender']}<br>"
                     f"Q-Origen: Q{agent['originQuintile']}<br>Edu: {h:.1f} años<br>"
                     f"Weak Ties: {traj['weakTiesCount']}<br>Salario: ${w:,}<br>"
                     f"Empleo: {traj['employment']}")

    fig = go.Figure()

    if show_links and len(agents) > 1:
        rng_local = np.random.RandomState(42)
        ex, ey, ez = [], [], []
        max_check = min(len(agents), 150)
        for i in range(max_check):
            for j in range(i+1, max_check):
                if agents[i]["originQuintile"] == agents[j]["originQuintile"] and abs(x_vals[i]-x_vals[j]) < 1.5:
                    if rng_local.rand() < 0.07:
                        ex.extend([x_vals[i], x_vals[j], None])
                        ey.extend([y_vals[i], y_vals[j], None])
                        ez.extend([z_vals[i], z_vals[j], None])
        if ex:
            fig.add_trace(go.Scatter3d(x=ex, y=ey, z=ez, mode="lines",
                                        line=dict(color="rgba(150,150,150,0.25)", width=1.5),
                                        hoverinfo="none", name="Red Laboral (Weak Ties 3D)"))

    fig.add_trace(go.Scatter3d(
        x=x_vals, y=y_vals, z=z_vals, mode="markers",
        marker=dict(size=6, color=colors, opacity=0.88, line=dict(width=0.5, color="white")),
        text=hover, hoverinfo="text", name="Agentes HDT"))

    fig.update_layout(
        title=f"Espacio 3D: Capital Humano × Capital Social × Salario (Edad {sel_age})",
        scene=dict(xaxis_title="Eje X: Capital Humano (Años Edu)",
                   yaxis_title="Eje Y: Capital Social (Weak Ties)",
                   zaxis_title="Eje Z: Salario Permanente ($)",
                   camera=dict(eye=dict(x=1.4,y=1.4,z=1.2))),
        template="plotly_dark", height=680, margin=dict(l=20,r=20,t=50,b=20))
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("### 🔍 Análisis de Clústeres de Vulnerabilidad Socioeconómica")
    c1, c2, c3 = st.columns(3)
    with c1: st.info("**🟢 Alta Movilidad**: Capital humano > 14 años, alta densidad de weak ties. Acceso prioritario a empleos formales.")
    with c2: st.warning("**🟡 Zona Intermedia**: Educación secundaria completa, restricción de capital social barrial. Vulnerables a shocks.")
    with c3: st.error("**🔴 Trampa de Pobreza**: Informalidad por segregación espacial y baja acumulación inicial de capital cognitivo.")
