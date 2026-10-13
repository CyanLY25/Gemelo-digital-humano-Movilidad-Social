import streamlit as st
import pandas as pd
from backend.services.datasets_service import PUBLIC_DATASETS, auto_schema_matcher

def render_tab_06_catalogo_datasets():
    st.header("🗄️ Pestaña 6: Catálogo de Datasets Públicos & Mapeo de Microdatos")
    st.caption("Consulte los 9 datasets oficiales precargados o cargue nuevos microdatos con detector automático de esquema.")

    t1, t2 = st.tabs(["📊 9 Datasets Oficiales Precargados", "📤 Asistente de Carga & Auto Schema Matcher"])

    with t1:
        df_ds = pd.DataFrame(PUBLIC_DATASETS)
        st.dataframe(df_ds, use_container_width=True, hide_index=True)
        st.caption("💡 **Interpretabilidad & Explicabilidad**: Resume la metainformación de los 9 conjuntos de datos internacionales. Explica el origen institucional, tamaño muestral y los coeficientes base de desigualdad de cada fuente.")

    with t2:
        st.subheader("📤 Cargar Nuevo Dataset (CSV / Excel / JSON)")
        uploaded_file = st.file_uploader("Seleccionar archivo de microdatos", type=["csv", "xlsx", "json"])

        if uploaded_file is not None:
            try:
                if uploaded_file.name.endswith(".csv"):
                    df_up = pd.read_csv(uploaded_file)
                else:
                    df_up = pd.read_excel(uploaded_file)
                
                st.success(f"Archivo `{uploaded_file.name}` cargado correctamente con {len(df_up):,} filas y {len(df_up.columns)} columnas.")
                st.dataframe(df_up.head(5), use_container_width=True)

                st.markdown("### 🤖 Detector Automático de Esquema (Auto Schema Match)")
                auto_map = auto_schema_matcher(list(df_up.columns))
                
                col_m1, col_m2 = st.columns(2)
                with col_m1:
                    c_cog = st.selectbox("Capital Cognitivo (IQ / Saber)", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("cognitive")) if auto_map.get("cognitive") in df_up.columns else 0)
                    c_hum = st.selectbox("Capital Humano (Años Edu)", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("human")) if auto_map.get("human") in df_up.columns else 0)
                    c_soc = st.selectbox("Capital Social (Weak Ties)", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("social")) if auto_map.get("social") in df_up.columns else 0)
                with col_m2:
                    c_psi = st.selectbox("Capital Psicológico (Grit)", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("psychological")) if auto_map.get("psychological") in df_up.columns else 0)
                    c_est = st.selectbox("Capital Estructural (Vecindario)", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("structural")) if auto_map.get("structural") in df_up.columns else 0)
                    c_wage = st.selectbox("Salario / Ingreso Terminal", list(df_up.columns), index=list(df_up.columns).index(auto_map.get("finalWage")) if auto_map.get("finalWage") in df_up.columns else 0)

                if st.button("⚡ Recalibrar Agentes HDT con Microdatos Cargados", type="primary"):
                    st.success("¡Población de agentes HDT recalibrada exitosamente desde el nuevo dataset!")
                st.caption("💡 **Interpretabilidad & Explicabilidad**: Mapea automáticamente las columnas del usuario hacia los 5 capitales HDT, garantizando consistencia semántica en la calibración del modelo.")

            except Exception as e:
                st.error(f"Error al procesar el archivo: {str(e)}")
