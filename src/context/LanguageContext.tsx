import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "es" | "en";

export interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  es: {
    // Header & HUD
    app_title: "Simulador de Movilidad Social",
    framework_badge: "HDT-ABM-RL v3.11",
    subtitle: "HDT-FRAMEWORK // MOTOR CENTRAL: ACTIVO // SISTEMA MULTI-CAPITAL",
    calibration_node: "Nodo de Calibración",
    estimated_ige: "IGE Estimado",
    q1_to_q5_ascent: "Tasa de Ascenso Q1➔Q5",
    toggle_theme_dark: "Modo Oscuro",
    toggle_theme_light: "Modo Claro",
    toggle_lang: "Idioma: Español",

    // Tabs
    tab_explorer: "Explorador 3D WebGL",
    tab_policy_studio: "Simulador & Políticas",
    tab_predictive: "Motor Predictivo IA",
    tab_datasets: "Catálogo de Datasets",
    tab_scrum: "Tablero SCRUM",
    tab_metrics: "Métricas & Gatsby",
    tab_ethics: "Auditoría Ética & XAI",
    tab_benchmarks: "Calibración Empírica",
    tab_codebase: "Código & Notebooks",
    tab_copilot: "Copiloto AI (Gemini)",
    tab_reports: "Reportes (PDF/Word/Excel)",

    // HDT Inspector
    hdt_profile: "Perfil de Gemelo Digital Humano (HDT)",
    probability_ascent: "PROBABILIDAD_ASCENSO",
    origin_label: "ORIGEN",
    destiny_label: "DESTINO",
    degree_label: "NIVEL EDUCATIVO",
    wage_label: "SALARIO FINAL",
    select_target_hdt: "Seleccionar HDT Objetivo:",
    cap_cognitive: "1. Cap. Cognitivo",
    cap_cognitive_sub: "Multiplicador Temprano de Heckman",
    cap_human: "2. Cap. Humano",
    cap_human_sub: "Años de Escolaridad / Calidad",
    cap_social: "3. Cap. Social",
    cap_social_sub: "Rango de Contactos Débiles Granovetter",
    cap_psychological: "4. Cap. Psicológico",
    cap_psychological_sub: "Grit y Baja Tasa de Descuento CRRA",
    cap_structural: "5. Cap. Estructural",
    cap_structural_sub: "Oportunidad Espacial y Barrio Chetty",

    // 3D Explorer Controls
    visualizer_mode: "Modo de Visualización 3D",
    mode_lifeline: "Líneas de Vida 3D",
    mode_hdt_space: "Hiper-Espacio HDT",
    mode_networks: "Redes & Homofilia",
    mode_gatsby: "Curva Gatsby 3D",
    legend_q1: "Q1 (Pobreza)",
    legend_q5: "Q5 (Riqueza)",
    legend_active_hdt: "HDT Activo",
    playback_control: "Controles de Simulación",
    play: "Reproducir",
    pause: "Pausar",
    reset: "Reiniciar",
    simulation_step: "Paso Temporal (Años)",
    orbit_hint: "Arrastra con el ratón para orbitar • Rueda para zoom",

    // Policy Studio
    country_context: "Contexto Empírico Nacional",
    select_country_survey: "Seleccionar País y Encuesta Base:",
    hist_gini: "Gini Histórico",
    hist_ige: "IGE Histórico",
    mobility_q1_q5: "Movilidad Q1 ➔ Q5",
    gender_gap: "Brecha Género",
    counterfactual_scenarios: "Escenarios de Política Contrafactual",
    structural_lab: "Laboratorio de Parámetros Estructurales",
    structural_lab_sub: "Ajusta las palancas de política pública en tiempo real para simular la respuesta de los agentes HDT.",
    run_sim_btn: "RUN_SIMULATION (40 YRS)",
    simulating: "SIMULANDO...",
    slider_edu: "Expansión Educación Superior",
    slider_edu_sub: "Aumenta cupos universitarios y subsidia matrículas para deciles 1-3.",
    slider_inst: "Calidad Institucional Pública",
    slider_inst_sub: "Equipamiento docente e infraestructura en colegios y universidades públicas.",
    slider_tax: "Impuesto a la Herencia (>P90)",
    slider_tax_sub: "Gravamen progresivo reasignado a fondos de becas y educación pública.",
    slider_child: "Intervención Primera Infancia (0-5)",
    slider_child_sub: "Nutrición materno-infantil, estimulación neurológica y guarderías de calidad.",
    slider_spatial: "Desegregación Residencial & Transporte",
    slider_spatial_sub: "Vouchers de vivienda mixta y reducción del tiempo de viaje a centros de empleo (Chetty Effect).",
    spatial_reduction: "Segregación",
    proj_ige: "IGE Proyectado",
    historical: "Histórico",
    gini_index: "Índice de Gini",

    // Metrics View
    ige_title: "Elasticidad Intergeneracional (IGE)",
    ige_desc_high: "Alta persistencia (baja movilidad intergeneracional).",
    ige_desc_low: "Elevada fluidez y movilidad social.",
    q1_q5_title: "Probabilidad Salto Q1 ➔ Q5",
    gini_title: "Coeficiente de Gini Proyectado",
    top_share_title: "Participación en Ingreso (Top 10%)",
    gatsby_title: "Curva de Great Gatsby (Gini vs. IGE)",
    matrix_title: "Matriz de Transición Intergeneracional (5x5)",
    oaxaca_title: "Descomposición de Canales de Movilidad (Oaxaca-Blinder / Shapley)",
    gatsby_curve_title: "Curva de Great Gatsby (Gini vs. IGE)",
    gatsby_curve_desc: "Relación entre desigualdad de ingresos (Gini) e inmovilidad intergeneracional (IGE).",
    transition_matrix_title: "Matriz de Transición Intergeneracional (5x5)",
    channel_decomposition_title: "Descomposición de Canales de Movilidad (Oaxaca-Blinder / Shapley)",

    // Ethics & Audit
    ethics_title: "Auditoría Ética & Evaluación de Impacto Algorítmico (EIA)",
    ethics_sub: "Certificación formal bajo el estándar IEEE 7000-2021 y directrices de IA explicable (XAI) de la OCDE.",
    fairness_parity: "Paridad de Género",
    fairness_impact: "Regla de los 4/5 (Impacto)",
    fairness_odds: "Igualdad de Oportunidades",
    fairness_audit_title: "Auditoría Ética & Evaluación de Impacto Algorítmico (EIA)",
    fairness_audit_sub: "Certificación formal bajo el estándar IEEE 7000-2021 y directrices de IA explicable (XAI) de la OCDE.",
    demographic_parity: "Ratio de Paridad Demográfica (Género)",
    equalized_odds: "Diferencia de Oportunidades Igualadas",
    disparate_impact: "Índice de Impacto Dispar (Minorías)",
    counterfactual_fairness: "Tasa de Violación de Equidad Contrafactual",
    shap_title: "Importancia Global de Características (Valores SHAP)",
    compliance_cert: "Certificación de Cumplimiento Algorítmico",

    // Benchmarks View
    benchmark_title: "Pipeline de Calibración Empírica",
    benchmark_sub: "Datos procesados mediante imputación múltiple por ecuaciones encadenadas (MICE) y Método de Momentos Simulados (MSM).",
    benchmarks_title: "Pipeline de Calibración Empírica",
    benchmarks_sub: "Datos procesados mediante imputación múltiple por ecuaciones encadenadas (MICE) y Método de Momentos Simulados (MSM).",
    dataset_source: "Fuente del Dataset",
    sample_size: "Tamaño Muestral de Agentes",
    stylized_facts_title: "Validación Científica de Hechos Estilizados (5/5 Superados)",
    stylized_facts_sub: "Verificación cuantitativa de leyes empíricas de movilidad social intergeneracional frente a la literatura académica.",

    // Reports View
    reports_title: "Generador de Reportes de Política & Evidencia",
    reports_sub: "Exporta dictámenes ejecutivos, matrices de transición y datos microeconómicos en múltiples formatos.",
    export_pdf: "Descargar Reporte PDF Ejecutivo",
    export_word: "Descargar Documento Word (.docx)",
    export_excel: "Descargar Microdatos Excel (.xlsx / CSV)",

    // Codebase Explorer
    code_repo_title: "Repositorio Python (HDT-RL)",
    codebase_title: "Repositorio Python (HDT-RL)",
    codebase_sub: "Módulos de simulación multi-agente, redes y calibración econométrica.",

    // Copilot
    copilot_title: "Copiloto Econométrico Gemini (Cualquier Consulta & Voz)",
    copilot_sub: "Asistente inteligente para cualquier pregunta, simulación, formulación de políticas y análisis econométrico por texto y voz.",
    copilot_listening: "Escuchando tu voz... Habla ahora",
    copilot_mic_start: "Hablar por micrófono (Voz a Texto)",
    copilot_mic_stop: "Detener grabación",
    copilot_mic_unsupported: "Reconocimiento de voz no soportado en este navegador.",
    copilot_auto_read: "Lectura de voz automática",
    copilot_speak_msg: "Leer mensaje en voz alta",
    copilot_stop_speech: "Detener audio",
    copilot_input_placeholder: "Haz cualquier pregunta o petición por texto o voz (ej. economía, simulación, código, explicación)...",
    copilot_send: "Enviar",
    copilot_querying: "PROCESANDO_PETICIÓN_CON_GEMINI...",
    copilot_welcome: "¡Hola! Soy tu **Copiloto Inteligente de Simulación y Políticas Públicas** potenciado por Gemini. Puedes hacerme **cualquier pregunta o petición** mediante texto o con tu micrófono por voz.",
    copilot_quick_1: "¿Por qué la inversión en primera infancia reduce más el IGE que subsidiar la universidad?",
    copilot_quick_2: "Simula el impacto de un impuesto a la herencia del 20% en Brasil.",
    copilot_quick_3: "¿Cómo influyen las redes de contactos débiles de Granovetter en la movilidad?",
    copilot_quick_4: "Explícame de forma sencilla qué es la Curva de Great Gatsby.",
    copilot_apply_policy: "Aplicar política sugerida en la simulación",
    clear_chat: "Limpiar Chat",

    // Footer
    system_ready: "SISTEMA_LISTO // LATENCIA: 14ms // CLUSTER_SIMULACIÓN: ACTIVO // MOTOR_VOZ: EN LÍNEA",
  },
  en: {
    // Header & HUD
    app_title: "Social Mobility Simulator",
    framework_badge: "HDT-ABM-RL v3.11",
    subtitle: "HDT-FRAMEWORK // CORE_ENGINE: ACTIVE // MULTI-CAPITAL SYSTEM",
    calibration_node: "Calibration Node",
    estimated_ige: "Estimated IGE",
    q1_to_q5_ascent: "Q1➔Q5 Ascent Rate",
    toggle_theme_dark: "Dark Mode",
    toggle_theme_light: "Light Mode",
    toggle_lang: "Language: English",

    // Tabs
    tab_explorer: "3D WebGL Explorer",
    tab_policy_studio: "Simulator & Policies",
    tab_predictive: "Predictive AI Engine",
    tab_datasets: "Datasets Catalog",
    tab_scrum: "SCRUM Board",
    tab_metrics: "Metrics & Gatsby",
    tab_ethics: "Ethics Audit & XAI",
    tab_benchmarks: "Empirical Calibration",
    tab_codebase: "Code & Notebooks",
    tab_copilot: "AI Copilot (Gemini)",
    tab_reports: "Reports (PDF/Word/Excel)",

    // HDT Inspector
    hdt_profile: "Human Digital Twin Profile (HDT)",
    probability_ascent: "ASCENT_PROBABILITY",
    origin_label: "ORIGIN",
    destiny_label: "DESTINY",
    degree_label: "EDUCATION DEGREE",
    wage_label: "FINAL WAGE",
    select_target_hdt: "Select Target HDT:",
    cap_cognitive: "1. Cognitive Capital",
    cap_cognitive_sub: "Heckman Early Skill Multiplier",
    cap_human: "2. Human Capital",
    cap_human_sub: "Years of Schooling / Quality",
    cap_social: "3. Social Capital",
    cap_social_sub: "Granovetter Weak Ties Percentile",
    cap_psychological: "4. Psychological Capital",
    cap_psychological_sub: "Grit & Low CRRA Time Discounting",
    cap_structural: "5. Structural Capital",
    cap_structural_sub: "Chetty Spatial & Neighborhood Quality",

    // 3D Explorer Controls
    visualizer_mode: "3D Visualizer Mode",
    mode_lifeline: "3D Lifelines",
    mode_hdt_space: "HDT Hyper-Space",
    mode_networks: "Networks & Homophily",
    mode_gatsby: "3D Gatsby Curve",
    legend_q1: "Q1 (Poverty)",
    legend_q5: "Q5 (Wealth)",
    legend_active_hdt: "Active HDT",
    playback_control: "Simulation Playback",
    play: "Play",
    pause: "Pause",
    reset: "Reset",
    simulation_step: "Time Step (Years)",
    orbit_hint: "Drag mouse to rotate • Scroll to zoom",

    // Policy Studio
    country_context: "National Empirical Context",
    select_country_survey: "Select Country & Baseline Survey:",
    hist_gini: "Historical Gini",
    hist_ige: "Historical IGE",
    mobility_q1_q5: "Q1 ➔ Q5 Mobility",
    gender_gap: "Gender Gap",
    counterfactual_scenarios: "Counterfactual Policy Scenarios",
    structural_lab: "Structural Parameters Laboratory",
    structural_lab_sub: "Adjust public policy levers in real time to simulate HDT agent responses.",
    run_sim_btn: "RUN_SIMULATION (40 YRS)",
    simulating: "SIMULATING...",
    slider_edu: "Higher Education Expansion",
    slider_edu_sub: "Increases university quotas and subsidizes tuition for deciles 1-3.",
    slider_inst: "Public Institutional Quality",
    slider_inst_sub: "Teacher equipment and infrastructure in public schools and universities.",
    slider_tax: "Inheritance Tax (>P90)",
    slider_tax_sub: "Progressive tax reallocated to scholarship funds and public education.",
    slider_child: "Early Childhood Intervention (0-5)",
    slider_child_sub: "Maternal-child nutrition, neurological stimulation, and quality nurseries.",
    slider_spatial: "Residential Desegregation & Transit",
    slider_spatial_sub: "Mixed housing vouchers and travel time reduction to job centers (Chetty Effect).",
    spatial_reduction: "Segregation",
    proj_ige: "Projected IGE",
    historical: "Historical",
    gini_index: "Gini Index",

    // Metrics View
    ige_title: "Intergenerational Elasticity (IGE)",
    ige_desc_high: "High persistence (low intergenerational mobility).",
    ige_desc_low: "High social fluidity and upward mobility.",
    q1_q5_title: "Q1 ➔ Q5 Upward Jump Probability",
    gini_title: "Projected Gini Coefficient",
    top_share_title: "Top 10% Income Share",
    gatsby_title: "Great Gatsby Curve (Gini vs. IGE)",
    matrix_title: "Intergenerational Transition Matrix (5x5)",
    oaxaca_title: "Mobility Channel Decomposition (Oaxaca-Blinder / Shapley)",
    gatsby_curve_title: "Great Gatsby Curve (Gini vs. IGE)",
    gatsby_curve_desc: "Relationship between income inequality (Gini) and intergenerational immobility (IGE).",
    transition_matrix_title: "Intergenerational Transition Matrix (5x5)",
    channel_decomposition_title: "Mobility Channel Decomposition (Oaxaca-Blinder / Shapley)",

    // Ethics & Audit
    ethics_title: "Ethics Audit & Algorithmic Impact Assessment (EIA)",
    ethics_sub: "Formal certification under IEEE 7000-2021 standard and OECD explainable AI (XAI) guidelines.",
    fairness_parity: "Gender Parity",
    fairness_impact: "4/5 Rule (Impact)",
    fairness_odds: "Equal Opportunity",
    fairness_audit_title: "Ethics Audit & Algorithmic Impact Assessment (EIA)",
    fairness_audit_sub: "Formal certification under IEEE 7000-2021 standard and OECD explainable AI (XAI) guidelines.",
    demographic_parity: "Demographic Parity Ratio (Gender)",
    equalized_odds: "Equalized Odds Difference",
    disparate_impact: "Disparate Impact Ratio (Minorities)",
    counterfactual_fairness: "Counterfactual Fairness Violation Rate",
    shap_title: "Global Feature Importance (SHAP Values)",
    compliance_cert: "Algorithmic Compliance Certification",

    // Benchmarks View
    benchmark_title: "Empirical Calibration Pipeline",
    benchmark_sub: "Data processed using multiple imputation by chained equations (MICE) and Simulated Method of Moments (MSM).",
    benchmarks_title: "Empirical Calibration Pipeline",
    benchmarks_sub: "Data processed using multiple imputation by chained equations (MICE) and Simulated Method of Moments (MSM).",
    dataset_source: "Dataset Source",
    sample_size: "Agent Sample Size",
    stylized_facts_title: "Scientific Validation of Stylized Facts (5/5 Passed)",
    stylized_facts_sub: "Quantitative verification of empirical intergenerational social mobility laws against academic literature.",

    // Reports View
    reports_title: "Policy & Evidence Report Generator",
    reports_sub: "Export executive briefings, transition matrices, and microdata in multiple formats.",
    export_pdf: "Download Executive PDF Report",
    export_word: "Download Word Briefing (.docx)",
    export_excel: "Download Excel Microdata (.xlsx / CSV)",

    // Codebase Explorer
    code_repo_title: "Python Repository (HDT-RL)",
    codebase_title: "Python Repository (HDT-RL)",
    codebase_sub: "Multi-agent simulation modules, graph networks, and econometric calibration.",

    // Copilot
    copilot_title: "Gemini AI Copilot (Any Query & Full Voice)",
    copilot_sub: "Intelligent assistant for any request, simulation adjustments, policy design, and econometric Q&A via text and voice.",
    copilot_listening: "Listening to your voice... Speak now",
    copilot_mic_start: "Voice Input (Speech-to-Text)",
    copilot_mic_stop: "Stop voice recording",
    copilot_mic_unsupported: "Speech recognition not supported in this browser.",
    copilot_auto_read: "Auto voice read aloud",
    copilot_speak_msg: "Read message aloud",
    copilot_stop_speech: "Stop audio speech",
    copilot_input_placeholder: "Ask any request or question by text or voice (e.g. economics, simulation, code, explanation)...",
    copilot_send: "Send",
    copilot_querying: "PROCESSING_REQUEST_WITH_GEMINI...",
    copilot_welcome: "Hello! I am your **AI Simulation & Public Policy Copilot** powered by Gemini. You can ask me **any request or question** through text or voice with your microphone.",
    copilot_quick_1: "Why does early childhood investment reduce IGE more than university subsidies?",
    copilot_quick_2: "Simulate the impact of a 20% inheritance tax in Brazil.",
    copilot_quick_3: "How do Granovetter's weak ties affect intergenerational mobility?",
    copilot_quick_4: "Explain what the Great Gatsby Curve is in simple terms.",
    copilot_apply_policy: "Apply suggested policy to simulation",
    clear_chat: "Clear Chat",

    // Footer
    system_ready: "SYSTEM_READY // LATENCY: 14ms // SIMULATION_CLUSTER: ACTIVE // VOICE_ENGINE: ONLINE",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hdt_language") as Language | null;
      if (saved === "es" || saved === "en") return saved;
      const navLang = navigator.language?.toLowerCase();
      if (navLang.startsWith("en")) return "en";
      return "es";
    }
    return "es";
  });

  useEffect(() => {
    localStorage.setItem("hdt_language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "es" ? "en" : "es"));
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.es;
    if (dict[key]) return dict[key];
    if (translations.es[key]) return translations.es[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
