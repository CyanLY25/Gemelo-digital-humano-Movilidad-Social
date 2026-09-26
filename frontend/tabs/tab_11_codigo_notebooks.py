import streamlit as st
import json

def render_tab_11_codigo_notebooks():
    st.header("📐 Pestaña 11: Código, Ecuaciones Técnicas & Notebooks")
    st.caption("Formulación matemática en LaTeX de las Ecuaciones Diferenciales Estocásticas (EDE) y visor de scripts.")

    t1, t2 = st.tabs(["📐 Ecuaciones EDE & LaTeX", "🐍 Visor de Scripts & Notebooks Jupyter (.ipynb)"])

    with t1:
        st.markdown(r"""
        ### 1. Ecuación de Euler-Bellman del Agente HDT
        $$\max_{c_t, e_t} \mathbb{E}_0 \sum_{t=0}^{T} \beta^t \left[ \frac{c_t^{1-\sigma}}{1-\sigma} - \psi \frac{e_t^{1+\theta}}{1+\theta} \right]$$
        $$\text{sujeto a: } a_{t+1} = (1+r)a_t + w_t(h_t) - c_t - p_e \cdot e_t$$

        ### 2. Función Minceriana Extendida de Salarios con Lazos Débiles
        $$\ln(w_i) = \alpha_0 + \rho \cdot h_i + \gamma_1 \cdot \text{exp}_i + \gamma_2 \cdot \text{exp}_i^2 + \lambda \cdot \ln(1 + \text{WeakTies}_i) + \beta (c_i - 100) - \delta_{\text{barrio}} + \varepsilon_i$$

        ### 3. Dinámica de Acumulación de Capital Cognitivo de Heckman
        $$d k_{cog, t} = \left[ \gamma_e e_t^{\alpha} \cdot k_{cog, t-1}^{1-\alpha} - \delta_k k_{cog, t} \right] dt + \sigma_c k_{cog, t} dW_t$$

        ### 4. Coeficiente de Gini por Integración Trapezoidal de Lorenz
        $$Gini = \frac{2 \sum_{i=1}^N i \cdot w_{(i)}}{N \sum_{i=1}^N w_{(i)}} - \frac{N+1}{N}$$
        """)

    with t2:
        st.subheader("🐍 Script de Python: Motor HDT-ABM-RL (Extracto Executable)")
        st.code("""
import numpy as np
import math

def compute_mincerian_log_wage(schooling, experience, weak_ties, cognitive_iq, spatial_penalty):
    log_w = (
        8.5 
        + 0.095 * schooling 
        + 0.04 * experience 
        - 0.0006 * (experience ** 2) 
        + 0.006 * (cognitive_iq - 100) 
        + math.log(1 + weak_ties) * 0.07 
        - spatial_penalty 
        + np.random.normal(0, 0.2)
    )
    return max(1500.0, math.exp(log_w))

print("Salario estimado:", compute_mincerian_log_wage(schooling=16, experience=10, weak_ties=8, cognitive_iq=115, spatial_penalty=0.15))
        """, language="python")

        # Jupyter notebook download
        notebook_content = {
            "cells": [
                {
                    "cell_type": "markdown",
                    "metadata": {},
                    "source": ["# HDT Social Simulator v3.11 — Jupyter Notebook\n", "Simulación econométrica multi-agente."]
                },
                {
                    "cell_type": "code",
                    "execution_count": None,
                    "metadata": {},
                    "outputs": [],
                    "source": ["import numpy as np\n", "print('HDT Engine Initialized')"]
                }
            ],
            "metadata": {"language_info": {"name": "python"}},
            "nbformat": 4,
            "nbformat_minor": 2
        }

        st.download_button(
            label="📥 Descargar Notebook Jupyter (.ipynb)",
            data=json.dumps(notebook_content, indent=2),
            file_name="HDT_Simulator_v311.ipynb",
            mime="application/x-ipynb+json"
        )
