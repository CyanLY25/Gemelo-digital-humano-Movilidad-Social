import streamlit as st
import base64

def render_voice_assistant(api_client, simulation_context: dict = None):
    st.markdown("### 🎙️ Copiloto Multimodal de Voz e IA (Speech & Text)")
    st.caption("Interactúe con el asistente econométrico mediante texto o comandos de voz sintetizada.")

    user_text = st.text_input("Formula su pregunta por texto:", placeholder="ej. ¿Cuál es el impacto del escenario C en el Gini y la trampa de pobreza?")
    
    col_v1, col_v2 = st.columns([1, 1])
    with col_v1:
        if st.button("🎤 Grabar Audio / Enviar Comando", type="primary"):
            if not user_text:
                user_text = "¿Cuál es el impacto del escenario C en el Coeficiente de Gini y el IGE?"
            
            with st.spinner("Procesando audio y consultando copiloto IA..."):
                response = api_client.run_voice_chat(user_text=user_text, simulation_context=simulation_context)
            
            st.success(f"**Transcripción**: {response['transcription']}")
            st.info(f"**Respuesta Copiloto**: {response['response_text']}")
            
            if response.get("audio_response_base64"):
                audio_bytes = base64.b64decode(response["audio_response_base64"])
                st.audio(audio_bytes, format="audio/mp3")

    with col_v2:
        st.markdown("**Comandos de voz sugeridos:**")
        st.markdown("- *'Calcula la variación del Gini con primera infancia'*")
        st.markdown("- *'Evalúa el riesgo de deserción para asistencia 64%'*")
        st.markdown("- *'Exporta el reporte ejecutivo en PDF'*")

    st.caption("💡 **Interpretabilidad & Explicabilidad**: Ofrece explicaciones conversacionales en lenguaje natural procesadas por el sistema de agentes a partir del estado econométrico en tiempo real.")
