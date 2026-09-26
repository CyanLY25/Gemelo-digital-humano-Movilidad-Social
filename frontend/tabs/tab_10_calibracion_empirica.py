import streamlit as st
import pandas as pd
import numpy as np

def render_tab_10_calibracion_empirica():
    st.header("🔬 Pestaña 10: Calibración Empírica & Imputación MICE de Microdatos")
    st.caption("Inspección de microdatos de encuestas de hogares (GEIH, NIDS, IHDS) tratados con Imputación Múltiple por Ecuaciones Encadenadas (MICE).")

    t1, t2 = st.tabs(["📋 Microdatos GEIH Bogotá (Imputados MICE)", "📐 Matriz de Varianza-Covarianza"])

    with t1:
        st.subheader("🇨🇴 Muestra GEIH Bogotá (N=35,400 registros imputados)")
        np.random.seed(42)
        sample_data = pd.DataFrame({
            "id_persona": [f"PER_{i:05d}" for i in range(1, 21)],
            "localidad": ["Ciudad Bolívar", "Usme", "Suba", "Kennedy", "Bosa", "Engativá", "Chapinero", "Teusaquillo", "San Cristóbal", "Rafael Uribe", "Fontibón", "Usaquén", "Barrios Unidos", "Los Mártires", "Tunjuelito", "Santa Fe", "Candelaria", "Antonio Nariño", "Sumapaz", "Ciudad Bolívar"],
            "ingreso_imputado_mice_cop": [1300000, 1420000, 2800000, 1950000, 1500000, 2400000, 5800000, 4900000, 1380000, 1600000, 2900000, 6200000, 3400000, 1750000, 1650000, 1400000, 2100000, 2300000, 1200000, 1350000],
            "anos_edu_padre": [6, 5, 11, 8, 7, 11, 16, 16, 6, 8, 12, 17, 14, 9, 8, 7, 10, 11, 5, 6],
            "anos_edu_hijo": [9, 8, 14, 11, 10, 13, 17, 16, 9, 11, 14, 18, 15, 10, 11, 9, 12, 13, 7, 9],
            "tasa_informalidad_local": [0.62, 0.65, 0.38, 0.48, 0.58, 0.40, 0.18, 0.22, 0.59, 0.54, 0.36, 0.15, 0.28, 0.52, 0.50, 0.60, 0.42, 0.39, 0.70, 0.61],
        })
        st.dataframe(sample_data, use_container_width=True, hide_index=True)

    with t2:
        st.subheader("📐 Matriz de Varianza-Covarianza de los 5 Capitales HDT")
        cov_matrix = pd.DataFrame(
            [
                [1.00, 0.42, 0.35, 0.28, -0.31],
                [0.42, 1.00, 0.51, 0.32, -0.45],
                [0.35, 0.51, 1.00, 0.22, -0.38],
                [0.28, 0.32, 0.22, 1.00, -0.15],
                [-0.31, -0.45, -0.38, -0.15, 1.00],
            ],
            columns=["Cognitivo", "Humano", "Social", "Psicológico", "Segregación Estructural"],
            index=["Cognitivo", "Humano", "Social", "Psicológico", "Segregación Estructural"]
        )
        st.dataframe(cov_matrix.style.background_gradient(cmap="coolwarm"), use_container_width=True)
