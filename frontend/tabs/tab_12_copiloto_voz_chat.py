import streamlit as st
from frontend.components.voice_assistant import render_voice_assistant

def render_tab_12_copiloto_voz_chat(api_client, country_id: str, active_policy: dict):
    st.header("🎙️ Pestaña 12: Copiloto de IA Convertido a Texto y Voz (Multimodal)")
    st.caption("Chatbot econométrico interactivo con soporte para entrada de voz (STT) y respuesta leída (TTS).")

    simulation_context = {
        "country_id": country_id,
        "active_policy": active_policy.get("name", "Base"),
    }

    render_voice_assistant(api_client, simulation_context=simulation_context)
