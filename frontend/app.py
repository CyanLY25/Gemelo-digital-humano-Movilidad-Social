"""
╔══════════════════════════════════════════════════════════════════════╗
║   GEMELO DIGITAL HUMAN SOCIAL — HDT Simulator v3.11                 ║
║   Stack 100% Python: Streamlit + FastAPI + Plotly 3D + LangGraph     ║
╚══════════════════════════════════════════════════════════════════════╝
"""
import sys
import os

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

import streamlit as st

st.set_page_config(
    page_title="HDT Social Simulator v3.11 — Gemelo Digital",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Session State para Tema (Oscuro/Claro) e Idioma (Español/Inglés) ──────────
if "app_theme" not in st.session_state:
    st.session_state["app_theme"] = "dark"

if "app_lang" not in st.session_state:
    st.session_state["app_lang"] = "es"

# Dynamic CSS Theme Injection
if st.session_state["app_theme"] == "dark":
    st.markdown("""
    <style>
    [data-testid="stAppViewContainer"] { background-color: #0f1117; color: #e0e0e0; }
    [data-testid="stSidebar"] { background-color: #1a1d27; }
    .stTabs [data-baseweb="tab"] { font-size:0.88rem; font-weight:600; padding: 6px 12px; }
    h1,h2,h3 { color: #64b5f6; }
    </style>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <style>
    [data-testid="stAppViewContainer"] { background-color: #f8f9fa; color: #212529; }
    [data-testid="stSidebar"] { background-color: #ffffff; border-right: 1px solid #e9ecef; }
    .stTabs [data-baseweb="tab"] { font-size:0.88rem; font-weight:600; padding: 6px 12px; }
    h1,h2,h3 { color: #1565c0; }
    </style>
    """, unsafe_allow_html=True)

from frontend.api_client import APIClient, COUNTRY_CALIBRATIONS, PRESET_POLICIES

from frontend.tabs.tab_01_explorador_3d import render_tab_01_explorador_3d
from frontend.tabs.tab_02_simulador_politicas import render_tab_02_simulador_politicas
from frontend.tabs.tab_03_motor_predictivo_ml import render_tab_03_motor_predictivo_ml
from frontend.tabs.tab_04_alerta_temprana import render_tab_04_alerta_temprana
from frontend.tabs.tab_05_orquestacion_ia import render_tab_05_orquestacion_ia
from frontend.tabs.tab_06_catalogo_datasets import render_tab_06_catalogo_datasets
from frontend.tabs.tab_07_tablero_scrum import render_tab_07_tablero_scrum
from frontend.tabs.tab_08_metricas_gatsby import render_tab_08_metricas_gatsby
from frontend.tabs.tab_09_auditoria_etica import render_tab_09_auditoria_etica
from frontend.tabs.tab_10_calibracion_empirica import render_tab_10_calibracion_empirica
from frontend.tabs.tab_11_codigo_notebooks import render_tab_11_codigo_notebooks
from frontend.tabs.tab_12_copiloto_voz_chat import render_tab_12_copiloto_voz_chat
from frontend.tabs.tab_13_reportes_export import render_tab_13_reportes_export

api = APIClient(base_url="http://localhost:8000")

# ── SIDEBAR ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🌍 HDT Social Simulator")
    st.caption("Gemelo Digital Human Social | v3.11 Python Stack")
    st.markdown("---")

    # BOTONES DE TEMA E IDIOMA
    st.markdown("### ⚙️ Preferencias / Settings")
    col_t1, col_t2 = st.columns(2)
    with col_t1:
        theme_icon = "☀️ Claro" if st.session_state["app_theme"] == "dark" else "🌙 Oscuro"
        if st.button(theme_icon, key="btn_theme_toggle", use_container_width=True):
            st.session_state["app_theme"] = "light" if st.session_state["app_theme"] == "dark" else "dark"
            st.rerun()

    with col_t2:
        lang_icon = "🇺🇸 English" if st.session_state["app_lang"] == "es" else "🇪🇸 Español"
        if st.button(lang_icon, key="btn_lang_toggle", use_container_width=True):
            st.session_state["app_lang"] = "en" if st.session_state["app_lang"] == "es" else "es"
            st.rerun()

    st.markdown("---")

    health = api.get_health()
    if health.get("status") == "ok":
        st.success(f"✅ Backend FastAPI **EN LÍNEA** (v{health.get('version','3.11.0')})")
    else:
        st.warning("⚠️ Modo **Fallback Python Directo**")

    st.markdown("---")
    country_lbl = "🗺️ País / Región" if st.session_state["app_lang"] == "es" else "🗺️ Country / Region"
    sel_lbl = "Seleccionar calibración" if st.session_state["app_lang"] == "es" else "Select calibration"
    st.subheader(country_lbl)
    country_options = {cid: c["name"] for cid, c in COUNTRY_CALIBRATIONS.items()}
    sel_country_id = st.selectbox(
        sel_lbl,
        options=list(country_options.keys()),
        format_func=lambda k: country_options[k],
        index=list(country_options.keys()).index("bogota_colombia"),
    )
    sel_country = COUNTRY_CALIBRATIONS[sel_country_id]
    st.caption(f"Dataset: {sel_country['datasetName']}")
    st.caption(f"Muestra: {sel_country['sampleSize']:,} registros")

    st.markdown("---")
    pol_lbl = "🏛️ Política Activa" if st.session_state["app_lang"] == "es" else "🏛️ Active Policy"
    scen_lbl = "Escenario de Política" if st.session_state["app_lang"] == "es" else "Policy Scenario"
    st.subheader(pol_lbl)
    policy_options = {pid: p["name"] for pid, p in PRESET_POLICIES.items()}
    sel_policy_id = st.selectbox(
        scen_lbl,
        options=list(policy_options.keys()),
        format_func=lambda k: policy_options[k],
        index=0,
    )
    active_policy = PRESET_POLICIES[sel_policy_id]
    st.caption(active_policy["description"])

    st.markdown("---")
    st.caption("📦 FastAPI · Pydantic v2 · Streamlit · Plotly 3D · CRISP-DM · LangGraph · gTTS · ReportLab")

# ── HEADER ────────────────────────────────────────────────────────────────────
if st.session_state["app_lang"] == "es":
    st.title("🌐 Gemelo Digital Human Social — Simulador v3.11")
    st.markdown(
        f"**Marco**: HDT-ABM-RL · Curva Great Gatsby · Bellman · Mincer · CRISP-DM ML · IEEE 7000  "
        f"| **Calibración**: `{sel_country['name']}` | **Política**: `{active_policy['name']}`"
    )
else:
    st.title("🌐 Human Social Digital Twin — Simulator v3.11")
    st.markdown(
        f"**Framework**: HDT-ABM-RL · Great Gatsby Curve · Bellman · Mincer · CRISP-DM ML · IEEE 7000  "
        f"| **Calibration**: `{sel_country['name']}` | **Policy**: `{active_policy['name']}`"
    )
st.markdown("---")

# ── 13 TABS ───────────────────────────────────────────────────────────────────
if st.session_state["app_lang"] == "es":
    tab_names = [
        "01. Explorador 3D WebGL",
        "02. Simulador & Políticas",
        "03. Motor Predictivo ML",
        "04. Alerta Temprana",
        "05. Orquestación IA",
        "06. Catálogo Datasets",
        "07. Tablero SCRUM",
        "08. Métricas & Gatsby",
        "09. Auditoría Ética",
        "10. Calibración Empírica",
        "11. Código & Notebooks",
        "12. Copiloto Voz & Chat",
        "13. Reportes Ejecutivos",
    ]
else:
    tab_names = [
        "01. 3D WebGL Explorer",
        "02. Policy Simulator",
        "03. ML Predictive Engine",
        "04. Early Warning",
        "05. AI Orchestration",
        "06. Datasets Catalog",
        "07. SCRUM Board",
        "08. Metrics & Gatsby",
        "09. Ethics Audit",
        "10. Empirical Calibration",
        "11. Code & Notebooks",
        "12. Voice & Chat Copilot",
        "13. Executive Reports",
    ]

tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8, tab9, tab10, tab11, tab12, tab13 = st.tabs(tab_names)

with tab1: render_tab_01_explorador_3d(api, sel_country_id, active_policy)
with tab2: render_tab_02_simulador_politicas(api, sel_country_id, active_policy)
with tab3: render_tab_03_motor_predictivo_ml(api)
with tab4: render_tab_04_alerta_temprana(api, sel_country_id, active_policy)
with tab5: render_tab_05_orquestacion_ia(api)
with tab6: render_tab_06_catalogo_datasets()
with tab7: render_tab_07_tablero_scrum()
with tab8: render_tab_08_metricas_gatsby(api, sel_country_id, active_policy)
with tab9: render_tab_09_auditoria_etica(api, sel_country_id, active_policy)
with tab10: render_tab_10_calibracion_empirica()
with tab11: render_tab_11_codigo_notebooks()
with tab12: render_tab_12_copiloto_voz_chat(api, sel_country_id, active_policy)
with tab13: render_tab_13_reportes_export(api, sel_country_id)
