import streamlit as st
import pandas as pd
from frontend.api_client import COUNTRY_CALIBRATIONS

def render_tab_datasets():
    st.header("🗄️ Catálogo de Datasets, Calibración Empírica y Ecuaciones Técnicas")
    st.caption("Consulte los microdatos calibrados (GEIH/Bogotá/DANE/NIDS/POF/IHDS) y el marco matemático estocástico del modelo.")

    t1, t2, t3 = st.tabs(["📋 Matriz de Calibración", "📖 Diccionario de Variables", "📐 Ecuaciones EDE"])

    with t1:
        st.subheader("Matriz Comparativa de Calibración Empírica por País / Región")
        rows = []
        for c in COUNTRY_CALIBRATIONS.values():
            rows.append({"ID": c["id"], "Nombre": c["name"],
                          "Dataset": c["datasetName"], "Muestra": f"{c['sampleSize']:,}",
                          "Gini Base": c["baselineGini"], "IGE": c["baselineIGE"],
                          "Q1→Q5 Movilidad": f"{c['q1ToQ5Mobility']*100:.1f}%",
                          "Brecha Género": f"{c['genderWageGap']*100:.0f}%",
                          "Penalidad Espacial": f"{c['neighborhoodPenalty']*100:.0f}%",
                          "Segregación": c["segregationIndex"],
                          "Informalidad": f"{c['informalRate']*100:.0f}%"})
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        st.markdown("---")
        st.subheader("🇨🇴 Muestra de Microdatos Calibrados: GEIH Bogotá / DANE 2024")
        sample = pd.DataFrame({
            "id_hogar": [f"BOG_{1000+i}" for i in range(15)],
            "localidad": ["Ciudad Bolívar","Usme","Suba","Kennedy","Bosa","Engativá","Chapinero",
                           "Teusaquillo","San Cristóbal","Rafael Uribe","Fontibón","Usaquén",
                           "Barrios Unidos","Los Mártires","Tunjuelito"],
            "ingreso_laboral_cop": [1300000,1420000,2800000,1950000,1500000,2400000,5800000,
                                     4900000,1380000,1600000,2900000,6200000,3400000,1750000,1650000],
            "anos_edu_padre": [6,5,11,8,7,11,16,16,6,8,12,17,14,9,8],
            "anos_edu_hijo": [9,8,14,11,10,13,17,16,9,11,14,18,15,10,11],
            "tiempo_traslado_min": [75,80,40,55,65,45,20,25,60,50,40,30,30,35,50],
            "tasa_informalidad": [0.62,0.65,0.38,0.48,0.58,0.40,0.18,0.22,0.59,0.54,0.36,0.15,0.28,0.52,0.50],
        })
        st.dataframe(sample, use_container_width=True, hide_index=True)

    with t2:
        st.subheader("Diccionario de Variables de Estado del Agente HDT")
        dic = [
            {"Variable":"h_t (Capital Humano)","Tipo":"Continua [0,22]","Descripción":"Años acumulados de escolaridad formal y nivel de titulación (Secundaria/Terciaria)."},
            {"Variable":"s_t (Capital Social)","Tipo":"Continua [0,1]","Descripción":"Centralidad de intermediación en la red laboral y densidad de contactos de enlaces débiles (Weak Ties)."},
            {"Variable":"c_t (Capital Cognitivo)","Tipo":"Continua [60,160]","Descripción":"Puntaje estandarizado de capacidad neurocognitiva y nutrición en primera infancia (0-5 años)."},
            {"Variable":"p_t (Capital Psicológico)","Tipo":"Continua [0,1]","Descripción":"Índice de resiliencia, autoeficacia y perseverancia (Grit)."},
            {"Variable":"e_t (Capital Estructural)","Tipo":"Continua [0,1]","Descripción":"Calidad del vecindario, infraestructura de transporte y nivel de desegregación residencial."},
            {"Variable":"w_t (Salario Permanente)","Tipo":"Monetaria (Log)","Descripción":"Ingreso laboral ajustado por productividad, experiencia Minceriana y penalidades espaciales."},
            {"Variable":"a_t (Activos / Riqueza)","Tipo":"Monetaria","Descripción":"Acumulación patrimonial intertemporal sujeta a tasa de interés y transferencias dinásticas."},
        ]
        st.table(dic)

    with t3:
        st.subheader("Formulaciones Matemáticas del Motor HDT-ABM-RL")
        st.markdown(r"""
#### 1. Ecuación de Bellman para Decisiones Intertemporales
$$V(h, a, \epsilon) = \max_{c,\, e} \left\{ u(c) - \psi(e) + \beta \,\mathbb{E}[V(h', a', \epsilon')] \right\}$$

#### 2. Función de Producción Salarial Minceriana Extendida
$$\ln(w_i) = \alpha_0 + \rho \cdot h_i + \gamma_1 \cdot \text{exp}_i + \gamma_2 \cdot \text{exp}_i^2 + \lambda \cdot \ln(1 + \text{WeakTies}_i) + \beta(c_i - 100) - \delta_{\text{espacial}} - \delta_{\text{género}} + \varepsilon_i$$

#### 3. Proceso Estocástico de Acumulación de Capital Humano
$$dh_t = \left[ e_t^{\alpha} \cdot c_t^{1-\alpha} - \delta h_t \right] dt + \sigma_h \, h_t \, dW_t$$

#### 4. Coeficiente de Gini vía Integración Trapezoidal de Lorenz
$$Gini = \frac{2 \displaystyle\sum_{i=1}^{N} i \cdot w_{(i)}}{N \displaystyle\sum_{i=1}^{N} w_{(i)}} - \frac{N+1}{N}$$

#### 5. Modelo Logístico de Riesgo de Deserción (Alerta Temprana)
$$P(\text{deserción}) = \frac{1}{1 + e^{-z}} \quad \text{donde } z = \beta_0 - 0.058(\text{rendimiento}-50) - 0.082(\text{asistencia}-70) + 0.12\,d_{km} + \cdots$$
        """)
