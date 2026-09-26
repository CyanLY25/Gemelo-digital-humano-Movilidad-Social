# 🌐 Gemelo Digital Human Social — HDT Simulator v3.0

**Stack 100% Python:** FastAPI · Pydantic v2 · Streamlit · Plotly 3D/2D · LangGraph · LangChain · Langflow v1.x · NumPy · SciPy

---

## 📦 Estructura del Proyecto

```
.
├── backend/
│   ├── main.py                          # Servidor FastAPI (uvicorn)
│   ├── models/
│   │   └── schemas.py                   # Modelos Pydantic v2
│   ├── routers/
│   │   ├── simulation.py                # /api/simulation/*
│   │   ├── prediction.py                # /api/predict/*
│   │   └── orchestration.py             # /api/orchestration/*
│   └── services/
│       ├── econometric_engine.py        # Motor HDT-ABM-RL (Bellman, Mincer, Gini, Lorenz)
│       ├── early_warning.py             # Modelo logístico de deserción + SHAP
│       └── orchestration/
│           ├── state.py                 # Estado TypedDict para LangGraph
│           ├── tools.py                 # Herramientas LangChain @tool
│           ├── langflow_client.py       # Cliente httpx → Langflow v1.x
│           └── graph.py                 # StateGraph + MemorySaver Checkpointer
├── frontend/
│   ├── app.py                           # Punto de entrada Streamlit (6 pestañas)
│   ├── api_client.py                    # Cliente HTTP → FastAPI (con fallback directo)
│   └── tabs/
│       ├── tab_simulation.py            # Pestaña 1: Lorenz, Gini, Deciles Longitudinales
│       ├── tab_visualization_3d.py      # Pestaña 2: Scatter3D, Redes Sociales 3D
│       ├── tab_policy_studio.py         # Pestaña 3: A/B Testing, KDE, SROI, Gini Proyectado
│       ├── tab_early_warning.py         # Pestaña 4: Heatmap Transición + Riesgo Estudiantil
│       ├── tab_orchestration.py         # Pestaña 5: Monitor LangGraph + Consola IA
│       └── tab_datasets.py              # Pestaña 6: GEIH/Bogotá, Diccionario, Ecuaciones
├── requirements.txt
└── README.md
```

---

## ⚙️ Instalación de Dependencias

```bash
# Crear y activar entorno virtual (recomendado)
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

# Instalar todas las dependencias
pip install -r requirements.txt
```

---

## 🚀 Ejecución del Backend (FastAPI + Uvicorn)

Desde el directorio raíz del proyecto:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend estará disponible en:
- **Documentación interactiva (Swagger):** http://localhost:8000/docs
- **Esquema OpenAPI (ReDoc):** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/api/health

---

## 🎨 Ejecución del Frontend (Streamlit)

En otra terminal, desde el directorio raíz del proyecto:

```bash
streamlit run frontend/app.py
```

El frontend estará disponible en: **http://localhost:8501**

> **Nota:** El frontend funciona en **modo fallback directo** si el backend FastAPI no está corriendo. En ese caso, invoca los motores Python directamente sin pasar por HTTP.

---

## 🤖 Configuración de Langflow (Opcional)

Si deseas conectar con una instancia local de Langflow v1.x:

1. Instalar Langflow: `pip install langflow`
2. Ejecutar: `python -m langflow run --host 0.0.0.0 --port 7860`
3. Crear un flujo en la interfaz web de Langflow.
4. Copiar el `flow_id` generado.

Configurar variables de entorno (crear un archivo `.env` en la raíz):

```env
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_FLOW_ID=tu-flow-id-aqui
LANGFLOW_API_KEY=tu-api-key-opcional
```

Sin Langflow activo, el sistema usa automáticamente el **fallback local seguro**.

---

## 📊 Endpoints del Backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Chequeo de salud del servicio |
| `GET` | `/api/simulation/parameters` | Parámetros empíricos y matrices de calibración |
| `POST` | `/api/simulation/run` | Ejecuta el motor HDT-ABM-RL completo |
| `POST` | `/api/predict/dropout` | Predicción de riesgo de deserción escolar |
| `POST` | `/api/orchestration/run` | Ejecuta el StateGraph LangGraph asíncronamente |
| `GET` | `/api/orchestration/status` | Estado del orquestador y herramientas activas |
| `GET` | `/api/orchestration/flows` | Flujos disponibles en Langflow |

---

## 🔬 Motor Econométrico (HDT-ABM-RL)

### Función de Producción Salarial Minceriana Extendida

$$\ln(w_i) = \alpha_0 + \rho \cdot h_i + \gamma_1 \cdot \exp_i + \gamma_2 \cdot \exp_i^2 + \lambda \cdot \ln(1 + \text{WeakTies}_i) + \beta(c_i - 100) - \text{PenalidadEspacial}_i + \varepsilon_i$$

### Ecuación de Bellman para Decisiones Intertemporales

$$V(h, a, \varepsilon) = \max_{c,\, e} \left\{ u(c) - \psi(e) + \beta \mathbb{E}[V(h', a', \varepsilon')] \right\}$$

### Coeficiente de Gini (Integración de Lorenz)

$$Gini = \frac{2\sum_{i=1}^{N} i \cdot w_{(i)}}{N \sum_{i=1}^{N} w_{(i)}} - \frac{N+1}{N}$$

---

## 🧠 Motor de IA: LangGraph StateGraph

```
START → classify_intent → ┌── nodo_agent (Tools: econometric_calculator, dropout_risk_scorer, knowledge_lookup)
                           ├── nodo_langchain (RAG documental)
                           └── nodo_langflow (REST API → Langflow v1.x)
                                         ↓
                                  validate_output → END
```

- **MemorySaver Checkpointer**: Persistencia de estado por `thread_id` entre turnos de conversación.
- **Fallback seguro**: Si Langflow está offline, el sistema retorna un resultado local sin fallar.

---

## 🗺️ Calibraciones Empíricas Incluidas

| País / Región | Dataset | Gini Base | Elasticidad IGE |
|---------------|---------|-----------|-----------------|
| 🇿🇦 Sudáfrica | NIDS 2008-2024 (SALDRU/UCT) | 0.63 | 0.68 |
| 🇧🇷 Brasil | POF 2008-2018 (IBGE) | 0.53 | 0.58 |
| 🇮🇳 India | IHDS 2004-2012 (NCAER/UMD) | 0.49 | 0.64 |
| 🇨🇴 Colombia/Bogotá | GEIH-DANE 2019-2024 | 0.54 | 0.59 |
| 🌍 OCDE Nórdicos | World Bank GDIM | 0.29 | 0.24 |
