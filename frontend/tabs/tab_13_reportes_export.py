import streamlit as st
from frontend.components.export_modal import render_export_buttons

def render_tab_13_reportes_export(api_client, country_id: str):
    st.header("📄 Pestaña 13: Generador de Reportes Ejecutivos (PDF, Word, Excel)")
    st.caption("Genere y descargue reportes consolidados directamente desde el backend en formatos estándar de la industria.")

    render_export_buttons(api_client, country_id=country_id)
