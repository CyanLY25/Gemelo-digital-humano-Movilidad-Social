import streamlit as st

def render_export_buttons(api_client, country_id: str = "bogota_colombia"):
    st.markdown("### 📄 Generador Ejecutivo de Documentos (PDF, DOCX, XLSX)")
    st.caption("Descargue reportes técnicos consolidados generados automáticamente en el backend.")

    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📄 Descargar PDF Ejecutivo", use_container_width=True):
            with st.spinner("Generando documento PDF estilizado con ReportLab..."):
                pdf_bytes = api_client.download_report(format_type="pdf", country_id=country_id)
                if pdf_bytes:
                    st.download_button(
                        label="💾 Guardar Reporte PDF",
                        data=pdf_bytes,
                        file_name=f"Reporte_Ejecutivo_{country_id}.pdf",
                        mime="application/pdf"
                    )

    with col2:
        if st.button("📝 Descargar Word (.DOCX)", use_container_width=True):
            with st.spinner("Generando documento Word editable con python-docx..."):
                docx_bytes = api_client.download_report(format_type="docx", country_id=country_id)
                if docx_bytes:
                    st.download_button(
                        label="💾 Guardar Documento Word",
                        data=docx_bytes,
                        file_name=f"Reporte_Ejecutivo_{country_id}.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )

    with col3:
        if st.button("📊 Descargar Excel (.XLSX)", use_container_width=True):
            with st.spinner("Generando libro de trabajo multitable con openpyxl..."):
                xlsx_bytes = api_client.download_report(format_type="xlsx", country_id=country_id)
                if xlsx_bytes:
                    st.download_button(
                        label="💾 Guardar Libro Excel",
                        data=xlsx_bytes,
                        file_name=f"Reporte_Ejecutivo_{country_id}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
