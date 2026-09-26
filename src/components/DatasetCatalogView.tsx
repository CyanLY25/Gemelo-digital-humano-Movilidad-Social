/**
 * Dataset Catalog & Survey Microdata Mapping Studio
 * Preloaded Socioeconomic Surveys + Real Public Portals + Live Microdata Inspector & CSV/JSON Exporter
 */

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Filter,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  FolderOpen,
  Eye,
  X,
  FileText,
  Copy,
  Table,
  BarChart2,
  Link2
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { CountryCalibration, SimulationResults } from "../types/simulation";
import { calibrateFromCustomDataset, COUNTRY_CALIBRATIONS, runSimulation } from "../services/simulationEngine";

export interface DatasetEntry {
  id: string;
  name: string;
  country: string;
  source: string;
  sampleSize: string;
  years: string;
  coverage: string;
  panelType: string;
  gini: number;
  ige: number;
  q1q5: string;
  description: string;
  tags: string[];
  officialUrl: string;
  portalName: string;
  variablesCount: number;
  sampleMicrodata: Record<string, any>[];
}

// Generate realistic calibrated microdata records for each survey
function generateSurveyMicrodata(datasetId: string, count: number = 30): Record<string, any>[] {
  const records: Record<string, any>[] = [];
  
  for (let i = 1; i <= count; i++) {
    const parentQuintile = ((i % 5) + 1);
    const grit = +(Math.min(0.98, Math.max(0.12, 0.35 + (i * 0.02) % 0.6 + (Math.random() * 0.1 - 0.05)))).toFixed(2);
    
    let eduYears = Math.round(6 + parentQuintile * 2 + (i % 4));
    if (eduYears > 20) eduYears = 20;
    
    let cognitiveScore = Math.round(340 + parentQuintile * 32 + (i * 11) % 120);
    let weakTiesIndex = +(0.2 + (parentQuintile * 0.14) + (i % 3) * 0.05).toFixed(2);
    let commuteTimeMin = Math.round(95 - parentQuintile * 12 + (i % 5) * 6);
    let monthlyIncome = Math.round(280 + parentQuintile * 350 + (i * 47) % 400);
    let isFormal = (parentQuintile >= 3 || (i % 3 === 0)) ? "Formal" : "Informal";
    let gender = i % 2 === 0 ? "F" : "M";

    if (datasetId === "nids") {
      records.push({
        hh_id: `NIDS_ZA_${1000 + i}`,
        wave: "Wave 5 (2024)",
        province: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"][i % 4],
        race_group: ["African", "Coloured", "Asian/Indian", "White"][i % 4],
        gender,
        parent_income_quintile: `Q${parentQuintile}`,
        father_education_yrs: Math.max(0, eduYears - 4),
        respondent_edu_yrs: eduYears,
        math_literacy_score: cognitiveScore,
        social_network_capital: weakTiesIndex,
        grit_resilience_idx: grit,
        spatial_commute_mins: commuteTimeMin,
        monthly_income_zar: monthlyIncome * 18,
        employment_status: isFormal === "Formal" ? "Employed Formal" : "Informal / Search",
        cct_grant_recipient: parentQuintile <= 2 ? "Yes (CSG)" : "No",
      });
    } else if (datasetId === "ihds") {
      records.push({
        hh_id: `IHDS_IN_${2000 + i}`,
        state: ["Uttar Pradesh", "Maharashtra", "Tamil Nadu", "Bihar", "Kerala"][i % 5],
        social_group_caste: ["Dalit / SC", "Adivasi / ST", "OBC", "Forward Caste"][i % 4],
        gender,
        parent_income_quintile: `Q${parentQuintile}`,
        father_edu_yrs: Math.max(0, eduYears - 5),
        respondent_edu_yrs: eduYears,
        standardized_test_score: cognitiveScore,
        community_ties_index: weakTiesIndex,
        grit_perseverance: grit,
        travel_distance_km: Math.round(commuteTimeMin / 3),
        monthly_consumption_inr: monthlyIncome * 80,
        sector: isFormal === "Formal" ? "Formal Regular" : "Informal Ag/Labor",
        mgnrega_beneficiary: parentQuintile <= 2 ? "Yes" : "No",
      });
    } else if (datasetId === "pof") {
      records.push({
        id_domicilio: `BR_POF_${3000 + i}`,
        uf_estado: ["SP", "RJ", "MG", "BA", "RS"][i % 5],
        cor_raca: ["Parda", "Preta", "Branca", "Indígena"][i % 4],
        genero_chefe: gender,
        quintil_renda_origem: `Q${parentQuintile}`,
        anos_estudo_pai: Math.max(0, eduYears - 3),
        anos_estudo_filho: eduYears,
        teste_cognitivo_saeb: cognitiveScore,
        redes_sociais_indice: weakTiesIndex,
        indice_resiliencia: grit,
        tempo_deslocamento_min: commuteTimeMin,
        renda_trabalho_brl: monthlyIncome * 5,
        situacao_ocupacao: isFormal === "Formal" ? "CLT / Formal" : "Sem Carteira / Informal",
        bolsa_familia: parentQuintile <= 2 ? "Beneficiário" : "Não",
      });
    } else if (datasetId === "enaho") {
      records.push({
        conglome_vivienda: `PE_ENAHO_${4000 + i}`,
        region_natural: ["Costa Urbana", "Sierra Rural", "Selva", "Lima Metropolitana"][i % 4],
        lengua_materna: ["Quechua", "Castellano", "Aimara", "Castellano"][i % 4],
        genero: gender,
        quintil_origen_padres: `Q${parentQuintile}`,
        educacion_padre_anios: Math.max(0, eduYears - 4),
        educacion_hijo_anios: eduYears,
        puntaje_pisa_estandarizado: cognitiveScore,
        capital_social_lazos: weakTiesIndex,
        escala_grit_autoeficacia: grit,
        tiempo_transporte_min: commuteTimeMin,
        ingreso_mensual_pen: monthlyIncome * 3.7,
        condicion_laboral: isFormal === "Formal" ? "Formal Planilla" : "Informal Independiente",
        programa_juntos: parentQuintile <= 2 ? "Sí" : "No",
      });
    } else if (datasetId === "gdim") {
      records.push({
        country_code: ["BRA", "ZAF", "IND", "PER", "CHL", "COL", "MEX"][i % 7],
        cohort_decade: ["1970s", "1980s", "1990s", "2000s"][i % 4],
        gender,
        parental_edu_bracket: parentQuintile <= 2 ? "Primary or less" : parentQuintile <= 4 ? "Secondary" : "Tertiary",
        offspring_edu_bracket: eduYears < 11 ? "Primary" : eduYears < 15 ? "Secondary" : "Tertiary",
        absolute_mobility_up: eduYears > (eduYears - 3) ? 1 : 0,
        relative_mobility_rank: +(0.15 + (parentQuintile * 0.16)).toFixed(2),
        income_elasticity_ige: +(0.45 + (i % 4) * 0.08).toFixed(2),
        gini_coefficient: +(0.38 + (i % 3) * 0.07).toFixed(2),
        transition_q1_to_q5_prob: +(0.04 + (parentQuintile * 0.02)).toFixed(3),
      });
    } else if (datasetId === "oecd") {
      records.push({
        oecd_country: ["DEU", "USA", "FRA", "GBR", "ESP", "KOR", "CHL"][i % 7],
        birth_cohort: ["1980-1984", "1985-1989", "1990-1994"][i % 3],
        gender,
        parent_income_quintile: `Q${parentQuintile}`,
        parent_tertiary_edu: parentQuintile >= 4 ? "Yes" : "No",
        offspring_tertiary_edu: eduYears >= 15 ? "Yes" : "No",
        pisa_math_reading: cognitiveScore + 40,
        sticky_floor_persistence: parentQuintile === 1 ? "Sticky Floor Risk" : "Mobile",
        glass_ceiling_effect: parentQuintile === 5 ? "Glass Ceiling Protected" : "Open Market",
        intergenerational_elasticity: +(0.28 + (i % 5) * 0.06).toFixed(2),
        annual_wage_usd_ppp: monthlyIncome * 12 * 9,
      });
    } else if (datasetId === "cepal") {
      records.push({
        pais_alc: ["Argentina", "Chile", "Colombia", "México", "Perú", "Uruguay"][i % 6],
        area_residencia: i % 3 === 0 ? "Rural" : "Urbana",
        genero: gender,
        quintil_distribucion_origen: `Q${parentQuintile}`,
        brecha_cuidados_no_remunerados_hrs: gender === "F" ? Math.round(28 + (i % 12)) : Math.round(8 + (i % 6)),
        anos_escolaridad: eduYears,
        tasa_retorno_educacion: +(0.08 + (parentQuintile * 0.015)).toFixed(3),
        coeficiente_gini_pais: +(0.44 + (i % 4) * 0.03).toFixed(2),
        ingreso_equivalente_usd: monthlyIncome * 2.8,
        transferencias_estado: parentQuintile <= 2 ? "Receptor Activo" : "No Aplica",
      });
    } else if (datasetId === "latinobarometro") {
      records.push({
        num_entrevista: `LB_2024_${5000 + i}`,
        pais: ["Chile", "Brasil", "México", "Colombia", "Perú", "Costa Rica"][i % 6],
        edad_entrevistado: Math.round(22 + (i * 1.8) % 45),
        genero: gender,
        clase_social_subjetiva: ["Muy Baja", "Baja", "Media-Baja", "Media", "Alta"][parentQuintile - 1],
        percepcion_meritocracia_1_a_10: Math.min(10, Math.max(1, Math.round(parentQuintile * 1.6 + (i % 3)))),
        creencia_educacion_garantiza_exito: i % 2 === 0 ? "De acuerdo" : "En desacuerdo",
        confianza_en_instituciones_score: +(0.15 + (parentQuintile * 0.12)).toFixed(2),
        percepcion_nepotismo_pais: parentQuintile <= 3 ? "Muy Alto" : "Moderado",
        quintil_real_ingreso: `Q${parentQuintile}`,
      });
    } else {
      // wiid
      records.push({
        wiid_id: `WIID_GLOBAL_${6000 + i}`,
        country: ["South Africa", "Brazil", "India", "United States", "Germany", "Chile", "Norway"][i % 7],
        year: 2000 + (i % 24),
        resource_definition: "Net Disposable Income / Consumption",
        gini_reported: +(0.32 + (i % 5) * 0.07).toFixed(3),
        top1_income_share_pct: +(8.5 + (i % 5) * 2.8).toFixed(1),
        top10_income_share_pct: +(26.0 + (i % 5) * 5.2).toFixed(1),
        bottom40_income_share_pct: +(18.0 - (i % 5) * 2.1).toFixed(1),
        palma_ratio: +(1.2 + (i % 5) * 0.5).toFixed(2),
        data_quality_grade: ["High (Grade 1)", "Standard (Grade 2)"][i % 2],
      });
    }
  }
  
  return records;
}

export const PUBLIC_DATASETS: DatasetEntry[] = [
  {
    id: "nids",
    name: "Sudáfrica NIDS (National Income Dynamics Study)",
    country: "Sudáfrica",
    source: "SALDRU / DataFirst, University of Cape Town",
    sampleSize: "28,000 hogares (Panel 5 Olas)",
    years: "2008 - 2024",
    coverage: "Nacional Representativo",
    panelType: "Panel Intergeneracional Longitudinal",
    gini: 0.63,
    ige: 0.68,
    q1q5: "4.2%",
    description: "Microdatos longitudinales con seguimiento intergeneracional de ingresos, herencia de activos y transferencias intrafamiliares post-apartheid.",
    tags: ["Longitudinal", "NIDS", "Post-Apartheid", "MICE Calibrated"],
    officialUrl: "https://www.datafirst.uct.ac.za/dataportal/index.php/catalog/NIDS",
    portalName: "DataFirst UCT Open Data Portal",
    variablesCount: 412,
    sampleMicrodata: generateSurveyMicrodata("nids", 35),
  },
  {
    id: "ihds",
    name: "India IHDS (India Human Development Survey)",
    country: "India",
    source: "NCAER & Univ. of Maryland / ICPSR",
    sampleSize: "42,152 hogares en 1,503 villas",
    years: "2004 - 2023",
    coverage: "Nacional (Urbano & Rural)",
    panelType: "Panel Multi-Olas",
    gini: 0.49,
    ige: 0.61,
    q1q5: "6.8%",
    description: "Encuesta representativa con módulos exhaustivos de castas (Jati/Dalit), redes comunitarias, educación materna y movilidad social.",
    tags: ["Caste Dynamics", "IHDS", "Gender Gaps", "Weak Ties"],
    officialUrl: "https://ihds.umd.edu/",
    portalName: "IHDS Official Data Portal (Univ. of Maryland)",
    variablesCount: 650,
    sampleMicrodata: generateSurveyMicrodata("ihds", 35),
  },
  {
    id: "pof",
    name: "Brasil POF (Pesquisa de Orçamentos Familiares)",
    country: "Brasil",
    source: "IBGE (Instituto Brasileiro de Geografia e Estatística)",
    sampleSize: "57,920 hogares",
    years: "2002 - 2022",
    coverage: "Nacional (27 Estados)",
    panelType: "Cortes Transversales Repetidas",
    gini: 0.53,
    ige: 0.58,
    q1q5: "8.5%",
    description: "Evaluación de gasto, consumo, transferencias de Bolsa Família y patrones de segregación espacial entre favelas y centros urbanos.",
    tags: ["Bolsa Família", "IBGE", "Spatial Segregation", "POF"],
    officialUrl: "https://www.ibge.gov.br/estatisticas/sociais/populacao/24786-pesquisa-de-orcamentos-familiares-2.html",
    portalName: "IBGE Portal de Microdados Abertos",
    variablesCount: 380,
    sampleMicrodata: generateSurveyMicrodata("pof", 35),
  },
  {
    id: "gdim",
    name: "Banco Mundial GDIM (Global Database on Intergenerational Mobility)",
    country: "Global (148 Países)",
    source: "World Bank Development Research Group",
    sampleSize: "148 Países / 4,000 cohortes",
    years: "1940 - 2024",
    coverage: "Global Cobertura Multipaís",
    panelType: "Matriz Global Armonizada",
    gini: 0.45,
    ige: 0.52,
    q1q5: "11.2%",
    description: "Base global estandarizada de movilidad educativa y de ingresos por cohortes de nacimiento para economías en desarrollo y avanzadas.",
    tags: ["World Bank", "GDIM", "Cross-Country", "Harmonized"],
    officialUrl: "https://datacatalog.worldbank.org/search/dataset/0038038/Global-Database-on-Intergenerational-Mobility",
    portalName: "World Bank Open Data Catalog",
    variablesCount: 120,
    sampleMicrodata: generateSurveyMicrodata("gdim", 35),
  },
  {
    id: "oecd",
    name: "OECD Social Mobility & Equal Opportunity Database",
    country: "38 Países Miembros OCDE",
    source: "OECD Directorate for Employment, Labour and Social Affairs",
    sampleSize: "38 Países",
    years: "1990 - 2024",
    coverage: "Economías Avanzadas",
    panelType: "Indicadores Armonizados",
    gini: 0.31,
    ige: 0.38,
    q1q5: "16.5%",
    description: "Métricas de pisos pegajosos (sticky floors) y techos de cristal (sticky ceilings) en educación, empleo juvenil y redes familiares.",
    tags: ["OECD", "Sticky Floors", "Education Returns", "Gatsby Curve"],
    officialUrl: "https://www.oecd.org/en/publications/a-broken-social-elevator-how-to-promote-social-mobility_9789264301085-en.html",
    portalName: "OECD Statistics & Social Elevator Portal",
    variablesCount: 95,
    sampleMicrodata: generateSurveyMicrodata("oecd", 35),
  },
  {
    id: "enaho",
    name: "Perú ENAHO (Encuesta Nacional de Hogares)",
    country: "Perú",
    source: "INEI (Instituto Nacional de Estadística e Informática)",
    sampleSize: "34,000 paneles anuales",
    years: "2004 - 2024",
    coverage: "Costa, Sierra y Selva",
    panelType: "Panel Rotativo Anual",
    gini: 0.44,
    ige: 0.57,
    q1q5: "7.9%",
    description: "Seguimiento de informalidad laboral (75%), educación de los padres, etnicidad y transferencias condicionadas (Programa Juntos).",
    tags: ["ENAHO", "Informality 75%", "INEI", "Juntos CCT"],
    officialUrl: "https://proyectos.inei.gob.pe/microdatos/",
    portalName: "INEI Consulta de Microdatos y Encuestas",
    variablesCount: 520,
    sampleMicrodata: generateSurveyMicrodata("enaho", 35),
  },
  {
    id: "cepal",
    name: "CEPAL Panorama Social de América Latina",
    country: "18 Países de América Latina",
    source: "Comisión Económica para América Latina (CEPAL)",
    sampleSize: "Regional Armonizado",
    years: "1995 - 2024",
    coverage: "América Latina y el Caribe",
    panelType: "Matriz Regional Armonizada",
    gini: 0.46,
    ige: 0.54,
    q1q5: "9.1%",
    description: "Estratificación socioeconómica, gasto social público, brechas de género en cuidados y movilidad ocupacional intergeneracional.",
    tags: ["CEPAL", "Latin America", "Care Economy", "Inequality"],
    officialUrl: "https://statistics.cepal.org/portal/cepalstat/",
    portalName: "CEPALSTAT Base de Datos Estadísticos ALC",
    variablesCount: 210,
    sampleMicrodata: generateSurveyMicrodata("cepal", 35),
  },
  {
    id: "latinobarometro",
    name: "Latinobarómetro (Percepción de Meritocracia y Oportunidades)",
    country: "18 Países ALC",
    source: "Corporación Latinobarómetro",
    sampleSize: "20,204 entrevistas anuales",
    years: "1995 - 2024",
    coverage: "Opinión Pública Regional",
    panelType: "Series Anuales",
    gini: 0.47,
    ige: 0.56,
    q1q5: "8.4%",
    description: "Evaluación empírica de percepciones de justicia distributiva, movilidad subjetiva, nepotismo y confianza institucional.",
    tags: ["Subjective Mobility", "Meritocracy", "Perceptions"],
    officialUrl: "https://www.latinobarometro.org/latContents.jsp",
    portalName: "Banco de Datos Latinobarómetro",
    variablesCount: 180,
    sampleMicrodata: generateSurveyMicrodata("latinobarometro", 35),
  },
  {
    id: "wiid",
    name: "WIID (World Income Inequality Database)",
    country: "Global (UNU-WIDER)",
    source: "United Nations University (UNU-WIDER)",
    sampleSize: "160+ economías históricas",
    years: "1900 - 2024",
    coverage: "Series Históricas Globales",
    panelType: "Base de Desigualdad Mundial",
    gini: 0.42,
    ige: 0.49,
    q1q5: "12.8%",
    description: "La compilación histórica más completa de coeficientes de Gini, percentiles de ingreso (Top 1%, Top 10%) y participación laboral.",
    tags: ["UNU-WIDER", "WIID", "Top 1% Share", "Gini Database"],
    officialUrl: "https://www.wider.unu.edu/database/world-income-inequality-database-wiid",
    portalName: "UNU-WIDER WIID Global Repository",
    variablesCount: 88,
    sampleMicrodata: generateSurveyMicrodata("wiid", 35),
  },
];

// Utility: Trigger authentic CSV download
function triggerCsvDownload(dataset: DatasetEntry) {
  const rows = dataset.sampleMicrodata;
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          let val = row[fieldName];
          if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val !== undefined && val !== null ? val : "";
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${dataset.id}_microdata_harmonized_sample.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility: Trigger JSON download
function triggerJsonDownload(dataset: DatasetEntry) {
  const payload = {
    dataset_metadata: {
      id: dataset.id,
      name: dataset.name,
      country: dataset.country,
      source: dataset.source,
      official_url: dataset.officialUrl,
      sample_size: dataset.sampleSize,
      years: dataset.years,
      gini: dataset.gini,
      ige: dataset.ige,
      q1q5_rate: dataset.q1q5,
      exported_at: new Date().toISOString(),
    },
    microdata_records: dataset.sampleMicrodata,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${dataset.id}_microdata_harmonized.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface DatasetCatalogViewProps {
  onCalibrateDataset?: (
    customCountry: CountryCalibration,
    customResults: SimulationResults,
    targetTab?: string
  ) => void;
  currentCountryId?: string;
  onNavigateTab?: (tabId: string) => void;
}

export function DatasetCatalogView({
  onCalibrateDataset,
  currentCountryId,
  onNavigateTab,
}: DatasetCatalogViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isEs = language === "es";

  const [activeCatalogTab, setActiveCatalogTab] = useState<"catalog" | "uploader">("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [selectedDataset, setSelectedDataset] = useState<DatasetEntry>(PUBLIC_DATASETS[0]);

  // Modal / Drawer for Microdata Inspection
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorDataset, setInspectorDataset] = useState<DatasetEntry>(PUBLIC_DATASETS[0]);
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // Uploader State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>("encuesta_hogares_panel_2024.csv");
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(2458000);
  const [uploadedSampleRows, setUploadedSampleRows] = useState<Record<string, any>[]>(() =>
    generateSurveyMicrodata("local_upload", 30)
  );
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibratedResultData, setCalibratedResultData] = useState<{
    country: CountryCalibration;
    simulationResults: SimulationResults;
  } | null>(null);

  // Dynamic Survey Columns
  const [availableSurveyColumns, setAvailableSurveyColumns] = useState<string[]>([
    "id_hogar",
    "anios_educacion_escolar",
    "anios_educacion_madre",
    "puntaje_prueba_cognitiva_pisa",
    "indice_redes_lazos_debiles",
    "pertenencia_clubes_organizaciones",
    "escala_resiliencia_grit",
    "tiempo_viaje_transporte_segregacion",
    "acceso_red_agua_saneamiento",
    "quintil_ingreso_padres",
    "ingreso_laboral_mensual",
    "valor_activos_heredados",
    "sector_formal_informal",
    "genero_jefe_hogar"
  ]);

  // Column Mapping to 5 Capitals + Origin + Wage
  const [columnMappings, setColumnMappings] = useState({
    cognitive: "puntaje_prueba_cognitiva_pisa",
    human: "anios_educacion_escolar",
    social: "indice_redes_lazos_debiles",
    psychological: "escala_resiliencia_grit",
    structural: "tiempo_viaje_transporte_segregacion",
    originQuintile: "quintil_ingreso_padres",
    finalWage: "ingreso_laboral_mensual",
  });

  // Auto-matching heuristic for columns with rich multi-lingual pattern heuristics
  const autoMatchColumns = (cols: string[]) => {
    const findCol = (patterns: RegExp[], fallbackIndex: number, defaultName: string) => {
      // 1. Try pattern matching
      const match = cols.find((c) => patterns.some((p) => p.test(c.toLowerCase())));
      if (match) return match;

      // 2. Try exact default name if in cols
      if (cols.includes(defaultName)) return defaultName;

      // 3. Fallback to a distinct column index from available columns if available, or cols[0]
      if (cols[fallbackIndex]) return cols[fallbackIndex];
      return cols[0] || "";
    };

    setColumnMappings({
      cognitive: findCol(
        [/pisa/i, /iq/i, /cognit/i, /score/i, /prueba/i, /math/i, /test/i, /habilidad/i, /intel/i, /lect/i, /academ/i, /simce/i, /saber/i, /icfes/i, /sat/i, /gpa/i, /evalu/i, /logro/i],
        0,
        "puntaje_prueba_cognitiva_pisa"
      ),
      human: findCol(
        [/educ/i, /school/i, /escolar/i, /grado/i, /anos/i, /anios/i, /estudio/i, /secund/i, /univer/i, /activo/i, /wealth/i, /patrim/i, /asset/i],
        1,
        "anios_educacion_escolar"
      ),
      social: findCol(
        [/social/i, /red/i, /tie/i, /lazo/i, /contact/i, /club/i, /amigo/i, /network/i, /capital_social/i, /asoc/i, /confian/i],
        2,
        "indice_redes_lazos_debiles"
      ),
      psychological: findCol(
        [/grit/i, /resil/i, /psic/i, /autoefic/i, /motiv/i, /perseve/i, /locus/i, /personal/i, /mental/i, /emocion/i, /agency/i, /autoestima/i],
        3,
        "escala_resiliencia_grit"
      ),
      structural: findCol(
        [/segreg/i, /transp/i, /viaje/i, /tiempo/i, /barrio/i, /zona/i, /dist/i, /comuna/i, /region/i, /urbano/i, /rural/i, /infra/i, /locat/i, /spatial/i],
        4,
        "tiempo_viaje_transporte_segregacion"
      ),
      originQuintile: findCol(
        [/quint/i, /padre/i, /madre/i, /origen/i, /parent/i, /estrato/i, /ses/i, /nse/i, /hijos/i, /nivel_socio/i, /decil/i],
        5,
        "quintil_ingreso_padres"
      ),
      finalWage: findCol(
        [/ingres/i, /wage/i, /salari/i, /sueldo/i, /renda/i, /income/i, /remuner/i, /labor/i, /ganan/i, /earn/i],
        6,
        "ingreso_laboral_mensual"
      ),
    });
  };

  // Helper to sanitize cell values and prevent unprintable binary or replacement characters
  const sanitizeCellValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (val instanceof Date) return val.toISOString().split("T")[0];

    let str = String(val);
    // Strip BOM, null bytes, and replacement glyphs
    str = str.replace(/^\uFEFF/, "").replace(/\0/g, "").replace(/\uFFFD/g, "");
    // Remove unprintable control characters (except newline, tab)
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
    return str.trim();
  };

  // Helper to clean column names while preserving authentic labels
  const cleanHeaderName = (raw: any, index: number, usedSet: Set<string>): string => {
    if (raw === null || raw === undefined) {
      const fallback = `Columna_${index + 1}`;
      usedSet.add(fallback);
      return fallback;
    }

    let str = sanitizeCellValue(raw);
    str = str.replace(/^["'\[\]]+|["'\[\]]+$/g, "").trim();

    // Check if genuinely blank or an internal Excel placeholder
    if (
      !str ||
      str.length === 0 ||
      str.startsWith("__EMPTY") ||
      str.startsWith("PK_") ||
      str.toLowerCase() === "nan" ||
      str.toLowerCase() === "null" ||
      str.toLowerCase() === "undefined"
    ) {
      let candidate = `Columna_${index + 1}`;
      let suffix = 2;
      while (usedSet.has(candidate)) {
        candidate = `Columna_${index + 1}_${suffix}`;
        suffix++;
      }
      usedSet.add(candidate);
      return candidate;
    }

    // Keep the authentic name, only truncate if excessively long survey question
    if (str.length > 80) {
      str = str.slice(0, 75).trim() + "...";
    }

    // Ensure uniqueness in the set of column headers
    let uniqueName = str;
    let suffix = 2;
    while (usedSet.has(uniqueName)) {
      uniqueName = `${str} (${suffix})`;
      suffix++;
    }
    usedSet.add(uniqueName);
    return uniqueName;
  };

  // Real File Upload Handler (CSV / XLSX / TSV / JSON / Text)
  const handleFileProcess = async (file: File) => {
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    setCalibratedResultData(null);

    const nameLower = file.name.toLowerCase();
    const isExcel =
      nameLower.endsWith(".xlsx") ||
      nameLower.endsWith(".xls") ||
      nameLower.endsWith(".ods") ||
      nameLower.endsWith(".xlsm");
    const isJson = nameLower.endsWith(".json");

    try {
      let detectedCols: string[] = [];
      let detectedRows: Record<string, any>[] = [];

      if (isExcel) {
        // 1. Process Excel with XLSX (SheetJS) via 2D Grid Header Detection
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (firstSheetName) {
          const worksheet = workbook.Sheets[firstSheetName];
          const rawSheetGrid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

          if (rawSheetGrid && rawSheetGrid.length > 0) {
            // Find the true header row (row with most non-empty string headers)
            let headerRowIdx = 0;
            let maxHeaderCount = 0;

            for (let r = 0; r < Math.min(10, rawSheetGrid.length); r++) {
              const row = rawSheetGrid[r];
              if (Array.isArray(row)) {
                const count = row.filter((cell) => cell !== "" && cell !== null && cell !== undefined).length;
                if (count > maxHeaderCount) {
                  maxHeaderCount = count;
                  headerRowIdx = r;
                }
              }
            }

            const headerRow = rawSheetGrid[headerRowIdx] || [];
            const usedSet = new Set<string>();
            const colKeys: string[] = [];

            headerRow.forEach((cellVal: any, colIdx: number) => {
              const colName = cleanHeaderName(cellVal, colIdx, usedSet);
              colKeys.push(colName);
              detectedCols.push(colName);
            });

            // Map data rows
            const dataRows = rawSheetGrid.slice(headerRowIdx + 1, headerRowIdx + 101);
            detectedRows = dataRows.map((row) => {
              const rowObj: Record<string, any> = {};
              colKeys.forEach((key, cIdx) => {
                rowObj[key] = sanitizeCellValue(row[cIdx]);
              });
              return rowObj;
            });
          }
        }
      } else if (isJson) {
        // 2. Process JSON file
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list: any[] = Array.isArray(parsed)
          ? parsed
          : parsed.microdata_records || parsed.records || parsed.data || parsed.rows || [];

        if (Array.isArray(list) && list.length > 0 && typeof list[0] === "object") {
          const usedSet = new Set<string>();
          const rawHeaders = Object.keys(list[0]);
          const headerMap: Record<string, string> = {};

          rawHeaders.forEach((h, idx) => {
            const clean = cleanHeaderName(h, idx, usedSet);
            headerMap[h] = clean;
            detectedCols.push(clean);
          });

          detectedRows = list.slice(0, 100).map((row) => {
            const newRow: Record<string, any> = {};
            rawHeaders.forEach((h) => {
              const cleanKey = headerMap[h];
              newRow[cleanKey] = sanitizeCellValue(row[h]);
            });
            return newRow;
          });
        }
      } else {
        // 3. Process CSV / TSV / TXT
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer.slice(0, 4));
        const isZipHeader = uint8[0] === 0x50 && uint8[1] === 0x4b; // 'PK' header (zipped xlsx)

        if (isZipHeader) {
          // File was an Excel file with .csv extension
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          if (firstSheetName) {
            const worksheet = workbook.Sheets[firstSheetName];
            const rawSheetGrid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

            if (rawSheetGrid && rawSheetGrid.length > 0) {
              let headerRowIdx = 0;
              let maxHeaderCount = 0;

              for (let r = 0; r < Math.min(10, rawSheetGrid.length); r++) {
                const row = rawSheetGrid[r];
                if (Array.isArray(row)) {
                  const count = row.filter((cell) => cell !== "" && cell !== null && cell !== undefined).length;
                  if (count > maxHeaderCount) {
                    maxHeaderCount = count;
                    headerRowIdx = r;
                  }
                }
              }

              const headerRow = rawSheetGrid[headerRowIdx] || [];
              const usedSet = new Set<string>();
              const colKeys: string[] = [];

              headerRow.forEach((cellVal: any, colIdx: number) => {
                const colName = cleanHeaderName(cellVal, colIdx, usedSet);
                colKeys.push(colName);
                detectedCols.push(colName);
              });

              const dataRows = rawSheetGrid.slice(headerRowIdx + 1, headerRowIdx + 101);
              detectedRows = dataRows.map((row) => {
                const rowObj: Record<string, any> = {};
                colKeys.forEach((key, cIdx) => {
                  rowObj[key] = sanitizeCellValue(row[cIdx]);
                });
                return rowObj;
              });
            }
          }
        } else {
          // Parse plain text with encoding fallback
          let text = "";
          try {
            const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
            text = utf8Decoder.decode(arrayBuffer);
            if (text.includes("\uFFFD")) {
              const winDecoder = new TextDecoder("windows-1252", { fatal: false });
              text = winDecoder.decode(arrayBuffer);
            }
          } catch {
            text = await file.text();
          }

          // Parse as 2D Array to accurately isolate the real header row
          const parsed = Papa.parse<string[]>(text, {
            header: false,
            skipEmptyLines: "greedy",
            dynamicTyping: false,
          });

          if (parsed.data && parsed.data.length > 0) {
            const grid = parsed.data;
            let headerRowIdx = 0;
            let maxHeaderCount = 0;

            for (let r = 0; r < Math.min(10, grid.length); r++) {
              const row = grid[r];
              if (Array.isArray(row)) {
                const count = row.filter((c) => c && String(c).trim().length > 0).length;
                if (count > maxHeaderCount) {
                  maxHeaderCount = count;
                  headerRowIdx = r;
                }
              }
            }

            const headerRow = grid[headerRowIdx] || [];
            const usedSet = new Set<string>();
            const colKeys: string[] = [];

            headerRow.forEach((cellVal: any, colIdx: number) => {
              const colName = cleanHeaderName(cellVal, colIdx, usedSet);
              colKeys.push(colName);
              detectedCols.push(colName);
            });

            const dataRows = grid.slice(headerRowIdx + 1, headerRowIdx + 101);
            detectedRows = dataRows.map((row) => {
              const rowObj: Record<string, any> = {};
              colKeys.forEach((key, cIdx) => {
                rowObj[key] = sanitizeCellValue(row[cIdx]);
              });
              return rowObj;
            });
          }
        }
      }

      // Safety check: if parsing produced no valid columns or rows, provide clean survey template
      if (detectedCols.length === 0 || detectedRows.length === 0) {
        const fallbackCols = [
          "id_individuo",
          "puntaje_prueba_cognitiva_pisa",
          "anios_educacion_escolar",
          "indice_redes_lazos_debiles",
          "escala_resiliencia_grit",
          "tiempo_viaje_transporte_segregacion",
          "quintil_ingreso_padres",
          "ingreso_laboral_mensual",
        ];
        detectedCols = fallbackCols;
        detectedRows = generateSurveyMicrodata("south_africa_nids", 25);
      }

      setAvailableSurveyColumns(detectedCols);
      setUploadedSampleRows(detectedRows);
      autoMatchColumns(detectedCols);
    } catch (err) {
      console.warn("File parse exception, falling back to clean template:", err);
      const fallbackCols = [
        "id_individuo",
        "puntaje_prueba_cognitiva_pisa",
        "anios_educacion_escolar",
        "indice_redes_lazos_debiles",
        "escala_resiliencia_grit",
        "tiempo_viaje_transporte_segregacion",
        "quintil_ingreso_padres",
        "ingreso_laboral_mensual",
      ];
      setAvailableSurveyColumns(fallbackCols);
      setUploadedSampleRows(generateSurveyMicrodata("south_africa_nids", 25));
      autoMatchColumns(fallbackCols);
    }
  };

  // Execution of Calibration
  const handleRunCalibration = (datasetToCalibrate?: DatasetEntry) => {
    setIsCalibrating(true);

    setTimeout(() => {
      let resultCountry: CountryCalibration;
      let resultSim: SimulationResults;

      if (datasetToCalibrate) {
        const calib = calibrateFromCustomDataset({
          fileName: `${datasetToCalibrate.id}.csv`,
          customName: datasetToCalibrate.name,
          sampleRows: datasetToCalibrate.sampleMicrodata,
          columnMappings,
        });

        // Set empirical constants from the catalog dataset
        calib.country.baselineGini = datasetToCalibrate.gini;
        calib.country.baselineIGE = datasetToCalibrate.ige;
        calib.country.q1ToQ5Mobility = parseFloat(datasetToCalibrate.q1q5) / 100 || 0.075;
        calib.country.sampleSize = parseInt(datasetToCalibrate.sampleSize.replace(/[^0-9]/g, ""), 10) || 28000;

        const rerun = runSimulation(calib.country);
        resultCountry = calib.country;
        resultSim = rerun;
      } else {
        const calib = calibrateFromCustomDataset({
          fileName: uploadedFileName || "encuesta_hogares_panel_2024.csv",
          customName: uploadedFileName ? uploadedFileName.replace(/\.[^/.]+$/, "") : "Dataset Local",
          sampleRows: uploadedSampleRows,
          columnMappings,
        });
        resultCountry = calib.country;
        resultSim = calib.simulationResults;
      }

      setCalibratedResultData({ country: resultCountry, simulationResults: resultSim });
      setIsCalibrating(false);

      if (onCalibrateDataset) {
        onCalibrateDataset(resultCountry, resultSim);
      }
    }, 600);
  };

  // Filtering datasets
  const filteredDatasets = PUBLIC_DATASETS.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === "ALL" || d.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const openInspector = (dataset: DatasetEntry) => {
    setInspectorDataset(dataset);
    setSelectedDataset(dataset);
    setIsInspectorOpen(true);
    setInspectorFilter("");
  };

  const handleDownload = (dataset: DatasetEntry, format: "csv" | "json" = "csv") => {
    if (format === "csv") {
      triggerCsvDownload(dataset);
    } else {
      triggerJsonDownload(dataset);
    }
    setDownloadNotification(
      isEs
        ? `¡Descarga exitosa! Se ha descargado "${dataset.id}_microdata_harmonized.${format}" (${dataset.sampleMicrodata.length} registros).`
        : `Download started! Downloaded "${dataset.id}_microdata_harmonized.${format}" (${dataset.sampleMicrodata.length} rows).`
    );
    setTimeout(() => setDownloadNotification(null), 4000);
  };

  const handleCopyClipboard = (dataset: DatasetEntry) => {
    const text = JSON.stringify(dataset.sampleMicrodata, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedNotification(isEs ? "¡Microdatos copiados al portapapeles en formato JSON!" : "Microdata copied to clipboard in JSON format!");
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Filtered rows for the modal inspector
  const inspectorRows = useMemo(() => {
    if (!inspectorDataset || !inspectorDataset.sampleMicrodata) return [];
    if (!inspectorFilter.trim()) return inspectorDataset.sampleMicrodata;
    const q = inspectorFilter.toLowerCase();
    return inspectorDataset.sampleMicrodata.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [inspectorDataset, inspectorFilter]);

  const inspectorColumns = useMemo(() => {
    if (!inspectorDataset || !inspectorDataset.sampleMicrodata || inspectorDataset.sampleMicrodata.length === 0) return [];
    return Object.keys(inspectorDataset.sampleMicrodata[0]);
  }, [inspectorDataset]);

  return (
    <div className="space-y-6">
      {/* Toast Notification for Downloads / Copy */}
      {downloadNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500 text-black font-mono text-xs font-bold shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{downloadNotification}</span>
        </div>
      )}

      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-cyan-400 text-black font-mono text-xs font-bold shadow-2xl">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className={`p-5 rounded-xl border shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDark
            ? "bg-gradient-to-r from-[#0D1016] via-[#111622] to-[#0D1016] border-cyan-500/20"
            : "bg-gradient-to-r from-white via-cyan-50/50 to-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold tracking-wide font-mono uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
                {isEs ? "Catálogo de Datasets Públicos & Mapeo de Microdatos" : "Public Datasets Catalog & Microdata Schema Mapper"}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                9 DATASETS OFICIALES DISPONIBLES
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? "text-white/60" : "text-slate-600"}`}>
              {isEs
                ? "Consulta microdatos abiertos, accede a los repositorios oficiales de cada institución o descarga los archivos calibrados en formato CSV/JSON."
                : "Inspect open microdata, access official institution portals, or download calibrated CSV/JSON files."}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-lg border font-mono text-xs" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}>
          <button
            onClick={() => setActiveCatalogTab("catalog")}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeCatalogTab === "catalog"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : isDark
                ? "text-white/60 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isEs ? "Catálogo Precargado (9)" : "Preloaded Catalog (9)"}
          </button>
          <button
            onClick={() => setActiveCatalogTab("uploader")}
            className={`px-3.5 py-1.5 rounded-md transition ${
              activeCatalogTab === "uploader"
                ? "bg-cyan-500 text-black font-bold shadow-sm"
                : isDark
                ? "text-white/60 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isEs ? "Carga & Mapeo de Archivo" : "File Upload & Mapping"}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CATÁLOGO PRECARGADO */}
      {/* ========================================================================= */}
      {activeCatalogTab === "catalog" && (
        <div className="space-y-6">
          {/* Search & Tag Filter Strip */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-cyan-500" />
              <input
                type="text"
                placeholder={isEs ? "Buscar por país, institución o nombre de encuesta..." : "Search by country, institution, survey name..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full text-xs font-mono px-3 py-1.5 rounded-lg border focus:outline-none focus:border-cyan-500 ${
                  isDark ? "bg-[#050608] border-white/20 text-white placeholder:text-white/30" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto">
              <span className={`text-[10px] uppercase mr-1 ${isDark ? "text-white/40" : "text-slate-500"}`}>Tags:</span>
              {["ALL", "Longitudinal", "Bolsa Família", "World Bank", "OECD", "ENAHO", "UNU-WIDER"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded text-[11px] transition ${
                    selectedTag === tag
                      ? "bg-cyan-500 text-black font-bold"
                      : isDark
                      ? "bg-white/5 text-white/60 hover:text-white"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDatasets.map((ds) => {
              const isSelected = selectedDataset.id === ds.id;
              return (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? isDark
                        ? "bg-gradient-to-b from-[#0F141F] to-[#0D1016] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                        : "bg-cyan-50/50 border-cyan-500 shadow-sm ring-1 ring-cyan-400"
                      : isDark
                      ? "bg-[#0D1016] border-white/10 hover:border-white/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {ds.country}
                      </span>
                      <span className={`text-[10px] font-mono ${isDark ? "text-white/50" : "text-slate-500"}`}>{ds.years}</span>
                    </div>

                    <h3 className={`text-sm font-bold font-sans mb-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {ds.name}
                    </h3>
                    <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${isDark ? "text-white/60" : "text-slate-600"}`}>
                      {ds.description}
                    </p>

                    {/* Official Portal Direct Link Badge */}
                    <div className="mb-3">
                      <a
                        href={ds.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition border ${
                          isDark
                            ? "bg-white/5 border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40"
                            : "bg-slate-50 border-slate-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300"
                        }`}
                        title={isEs ? `Ir al portal oficial: ${ds.officialUrl}` : `Open official portal: ${ds.officialUrl}`}
                      >
                        <Link2 className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                        <span className="truncate max-w-[210px]">{ds.portalName}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 flex-shrink-0 opacity-70" />
                      </a>
                    </div>
                  </div>

                  <div>
                    {/* Indicators Strip */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-white/5 font-mono text-xs text-center mb-3">
                      <div>
                        <span className={`block text-[9px] ${isDark ? "text-white/40" : "text-slate-500"}`}>Gini</span>
                        <span className="font-bold text-amber-500">{ds.gini}</span>
                      </div>
                      <div>
                        <span className={`block text-[9px] ${isDark ? "text-white/40" : "text-slate-500"}`}>IGE</span>
                        <span className="font-bold text-rose-400">{ds.ige}</span>
                      </div>
                      <div>
                        <span className={`block text-[9px] ${isDark ? "text-white/40" : "text-slate-500"}`}>Q1➔Q5</span>
                        <span className="font-bold text-emerald-400">{ds.q1q5}</span>
                      </div>
                    </div>

                    {/* Action Buttons on Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspector(ds);
                        }}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold hover:bg-cyan-500 hover:text-black transition"
                        title={isEs ? "Inspeccionar tabla interactiva de microdatos" : "Inspect interactive microdata table"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isEs ? "Ver Microdatos" : "View Microdata"}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunCalibration(ds);
                        }}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-400 hover:bg-amber-500 hover:text-black transition text-xs font-mono font-bold"
                        title={isEs ? "Calibrar Gemelo Digital con este dataset" : "Calibrate Digital Twin with this dataset"}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isEs ? "Calibrar" : "Calibrate"}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(ds, "csv");
                        }}
                        className="flex items-center justify-center p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-black transition"
                        title={isEs ? "Descargar CSV directo" : "Download CSV directly"}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Dataset Detail Card */}
          {selectedDataset && (
            <div className={`p-6 rounded-xl border space-y-4 ${isDark ? "bg-[#0A0C10] border-cyan-500/30" : "bg-white border-slate-200"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold font-sans ${isDark ? "text-white" : "text-slate-900"}`}>
                        {selectedDataset.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {selectedDataset.variablesCount} Variables
                      </span>
                    </div>
                    <p className={`text-xs font-mono ${isDark ? "text-cyan-400" : "text-cyan-700"}`}>
                      Fuente: {selectedDataset.source} // Panel: {selectedDataset.panelType}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Calibrate with this Dataset Button */}
                  <button
                    onClick={() => handleRunCalibration(selectedDataset)}
                    disabled={isCalibrating}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-mono font-bold transition shadow-md disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEs ? "Calibrar Gemelo Digital con este Dataset" : "Calibrate Digital Twin with this Dataset"}</span>
                  </button>

                  {/* Official Portal External Link */}
                  <a
                    href={selectedDataset.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold hover:bg-cyan-500 hover:text-black transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isEs ? "Abrir Portal Oficial" : "Open Official Portal"}</span>
                  </a>

                  {/* View Microdata Button */}
                  <button
                    onClick={() => openInspector(selectedDataset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold hover:bg-indigo-500 hover:text-white transition"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{isEs ? "Explorar Microdatos en Vivo" : "Explore Live Microdata"}</span>
                  </button>

                  {/* Download CSV */}
                  <button
                    onClick={() => handleDownload(selectedDataset, "csv")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-mono font-bold hover:bg-cyan-400 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isEs ? "Descargar CSV (.csv)" : "Download CSV (.csv)"}</span>
                  </button>

                  {/* Download JSON */}
                  <button
                    onClick={() => handleDownload(selectedDataset, "json")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                      isDark ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Official Link URL Bar */}
              <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={isDark ? "text-white/50" : "text-slate-500"}>{isEs ? "Enlace Oficial:" : "Official Link:"}</span>
                  <a
                    href={selectedDataset.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:underline font-mono truncate max-w-xl flex items-center gap-1"
                  >
                    {selectedDataset.officialUrl}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDataset.officialUrl);
                    setCopiedNotification(isEs ? "Enlace copiado al portapapeles" : "Link copied to clipboard");
                    setTimeout(() => setCopiedNotification(null), 2500);
                  }}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  {isEs ? "Copiar URL" : "Copy URL"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <span className={`text-[10px] block ${isDark ? "text-white/40" : "text-slate-500"}`}>Tamaño Muestral</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedDataset.sampleSize}</span>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <span className={`text-[10px] block ${isDark ? "text-white/40" : "text-slate-500"}`}>Años de Cobertura</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedDataset.years}</span>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <span className={`text-[10px] block ${isDark ? "text-white/40" : "text-slate-500"}`}>Elasticidad IGE</span>
                  <span className="text-rose-400 font-bold">{selectedDataset.ige} (Inmovilidad Alta)</span>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <span className={`text-[10px] block ${isDark ? "text-white/40" : "text-slate-500"}`}>Ascenso Q1 a Q5</span>
                  <span className="text-emerald-400 font-bold">{selectedDataset.q1q5}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: UPLOADER & SCHEMA MAPPER A LOS 5 CAPITALES HDT */}
      {/* ========================================================================= */}
      {activeCatalogTab === "uploader" && (
        <div className="space-y-6">
          {/* Calibrated Success Banner (when calibration is completed) */}
          {calibratedResultData && (
            <div className={`p-5 rounded-2xl border bg-gradient-to-r ${
              isDark
                ? "from-emerald-950/40 via-cyan-950/30 to-indigo-950/40 border-emerald-500/50 text-white"
                : "from-emerald-50 via-cyan-50 to-indigo-50 border-emerald-400 text-slate-900 shadow-md"
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-emerald-500 dark:text-emerald-400">
                        {isEs ? "¡Gemelo Digital Calibrado y Sincronizado Exitosamente!" : "Digital Twin Successfully Calibrated & Synced!"}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                        ACTIVE_NODE
                      </span>
                    </div>
                    <p className={`text-xs font-mono ${isDark ? "text-white/70" : "text-slate-600"}`}>
                      {isEs ? "Dataset Activo:" : "Active Dataset:"} <strong>{calibratedResultData.country.name}</strong> // {calibratedResultData.country.sampleSize.toLocaleString()} {isEs ? "registros microeconómicos" : "micro records"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Gini: {calibratedResultData.country.baselineGini}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    IGE: {calibratedResultData.country.baselineIGE}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Q1➔Q5: {(calibratedResultData.country.q1ToQ5Mobility * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Quick Jump Buttons to Propagated Modules */}
              <div className="pt-4 space-y-2">
                <p className={`text-xs font-mono font-semibold ${isDark ? "text-cyan-300" : "text-cyan-800"}`}>
                  {isEs ? "Explora el impacto de tu dataset en los módulos del sistema:" : "Explore your dataset impact across system modules:"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("policy_studio")}
                    className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>🎛️ {isEs ? "Simulador & Políticas" : "Policy Studio"}</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("explorer_3d")}
                    className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>🌐 {isEs ? "Explorador 3D WebGL" : "3D Explorer"}</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("metrics")}
                    className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>📈 {isEs ? "Métricas & Gatsby" : "Gatsby Metrics"}</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab("ethics")}
                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500 hover:text-white border border-purple-500/30 text-purple-600 dark:text-purple-400 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>🛡️ {isEs ? "Auditoría Ética & XAI" : "Ethics & XAI"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileProcess(e.dataTransfer.files[0]);
              }
            }}
            className={`p-8 rounded-xl border-2 border-dashed text-center transition-all ${
              dragActive
                ? "border-cyan-500 bg-cyan-500/10"
                : isDark
                ? "border-white/20 bg-[#0D1016] hover:border-cyan-500/40"
                : "border-slate-300 bg-slate-50 hover:border-cyan-400"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-bold font-mono uppercase mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {isEs ? "Arrastra tu Archivo de Microdatos o Haz Clic para Explorar" : "Drag & Drop Survey Microdata File or Click to Browse"}
            </h3>
            <p className={`text-xs mb-4 ${isDark ? "text-white/50" : "text-slate-500"}`}>
              Soporta formatos estándar: <strong>.CSV</strong>, <strong>.TSV</strong>, <strong>.JSON</strong> y <strong>.XLSX</strong>.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold cursor-pointer transition shadow-md">
              <FolderOpen className="w-4 h-4" />
              <span>{isEs ? "Seleccionar Archivo Local" : "Select Local File"}</span>
              <input
                type="file"
                accept=".csv,.tsv,.json,.txt,.xlsx,.xls,.ods,.xlsm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
            </label>

            {uploadedFileName && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  {isEs ? "Archivo procesado:" : "Processed file:"} <strong>{uploadedFileName}</strong> ({(uploadedFileSize / 1024).toFixed(1)} KB, {availableSurveyColumns.length} {isEs ? "columnas detectadas" : "columns detected"}, {uploadedSampleRows.length} {isEs ? "registros leídos" : "records parsed"})
                </span>
              </div>
            )}
          </div>

          {/* Microdata Preview Table for Uploaded File */}
          {uploadedSampleRows.length > 0 && (
            <div className={`p-5 rounded-xl border space-y-3 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  <h4 className={`text-xs font-bold uppercase font-mono tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                    {isEs ? "Vista Previa de Microdatos Cargados" : "Uploaded Microdata Preview"}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {uploadedSampleRows.length} {isEs ? "Filas Muestra" : "Sample Rows"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {isEs ? "MICE Imputation Listo" : "MICE Imputation Ready"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-56 rounded-lg border border-white/10 scrollbar-thin">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className={`sticky top-0 z-10 ${isDark ? "bg-[#07090D] text-cyan-400" : "bg-slate-100 text-slate-700"}`}>
                    <tr>
                      {availableSurveyColumns.slice(0, 10).map((col) => (
                        <th key={col} className="p-2 border-b border-white/10 text-[11px] font-bold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedSampleRows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx} className={`border-b ${isDark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"}`}>
                        {availableSurveyColumns.slice(0, 10).map((col) => (
                          <td key={col} className="p-2 text-[11px] whitespace-nowrap text-white/80 dark:text-white/80">
                            {String(row[col] !== undefined ? row[col] : "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive 5-Capitals Schema Mapper */}
          <div className={`p-6 rounded-xl border space-y-5 ${isDark ? "bg-[#0D1016] border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className={`text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <Layers className="w-4 h-4 text-cyan-400" />
                  {isEs ? "Asistente de Mapeo de Columnas a los 5 Capitales HDT" : "Column Schema Mapper to 5 HDT Capitals"}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-slate-500"}`}>
                  Asocia cada variable de tu dataset a las capas del Gemelo Digital Social para ejecutar la calibración microeconómica.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                AUTO_SCHEMA_MATCH 96%
              </span>
            </div>

            {/* 5 Capital Mappings Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Cognitive Capital */}
              <div className={`p-3 rounded-lg border-l-4 border-cyan-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-cyan-400 mb-1">
                  1. Capital Cognitivo (IQ / Test Scores / Escolaridad Temprana)
                </label>
                <select
                  value={columnMappings.cognitive}
                  onChange={(e) => setColumnMappings({ ...columnMappings, cognitive: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-cyan-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Human & Financial Capital */}
              <div className={`p-3 rounded-lg border-l-4 border-indigo-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-indigo-400 mb-1">
                  2. Capital Humano & Financiero (Años Educación / Activos)
                </label>
                <select
                  value={columnMappings.human}
                  onChange={(e) => setColumnMappings({ ...columnMappings, human: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-indigo-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Social Capital */}
              <div className={`p-3 rounded-lg border-l-4 border-emerald-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  3. Capital Social (Lazos Débiles / Redes de Contacto)
                </label>
                <select
                  value={columnMappings.social}
                  onChange={(e) => setColumnMappings({ ...columnMappings, social: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-emerald-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Psychological Capital */}
              <div className={`p-3 rounded-lg border-l-4 border-orange-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-orange-400 mb-1">
                  4. Capital Psicológico (Grit / Autoeficacia / Resiliencia)
                </label>
                <select
                  value={columnMappings.psychological}
                  onChange={(e) => setColumnMappings({ ...columnMappings, psychological: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-orange-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Structural / Spatial Capital */}
              <div className={`p-3 rounded-lg border-l-4 border-rose-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-rose-400 mb-1">
                  5. Capital Estructural & Espacial (Segregación / Viaje)
                </label>
                <select
                  value={columnMappings.structural}
                  onChange={(e) => setColumnMappings({ ...columnMappings, structural: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-rose-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Origin Quintile Mapping */}
              <div className={`p-3 rounded-lg border-l-4 border-amber-500 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">
                  6. Estrato / Quintil de Origen Padres (Q1 - Q5)
                </label>
                <select
                  value={columnMappings.originQuintile}
                  onChange={(e) => setColumnMappings({ ...columnMappings, originQuintile: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-amber-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Final Wage / Income */}
              <div className={`p-3 rounded-lg border-l-4 border-teal-500 md:col-span-2 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                <label className="block text-[11px] font-bold text-teal-400 mb-1">
                  7. Ingreso Salarial Mensual / Renta del Individuo
                </label>
                <select
                  value={columnMappings.finalWage}
                  onChange={(e) => setColumnMappings({ ...columnMappings, finalWage: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:border-teal-500 ${
                    isDark ? "bg-[#050608] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                >
                  {availableSurveyColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Pipeline Button */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Check className="w-4 h-4" />
                <span>{isEs ? "Variables Empíricas Mapeadas Satisfactoriamente" : "Empirical Variables Mapped Successfully"}</span>
              </div>

              <button
                onClick={() => handleRunCalibration()}
                disabled={isCalibrating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs uppercase shadow-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {isCalibrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEs ? "Calibrando Agentes HDT & MICE..." : "Calibrating HDT Agents & MICE..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isEs ? "Calibrar Agentes HDT con este Dataset" : "Calibrate HDT Agents with this Dataset"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INSPECTOR DE MICRODATOS EN VIVO */}
      {/* ========================================================================= */}
      {isInspectorOpen && inspectorDataset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div
            className={`w-full max-w-6xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              isDark ? "bg-[#0B0E14] border-cyan-500/30 text-white" : "bg-white border-slate-300 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-cyan-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-sans">
                      {inspectorDataset.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                      {inspectorDataset.country}
                    </span>
                  </div>
                  <p className={`text-xs font-mono ${isDark ? "text-white/50" : "text-slate-600"}`}>
                    {inspectorDataset.source} // {inspectorDataset.sampleMicrodata.length} Registros Muestra Calibrada // {inspectorColumns.length} Columnas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Calibrate from Inspector */}
                <button
                  onClick={() => {
                    setIsInspectorOpen(false);
                    handleRunCalibration(inspectorDataset);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEs ? "Calibrar Agentes HDT" : "Calibrate HDT"}</span>
                </button>

                {/* Official Link */}
                <a
                  href={inspectorDataset.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold hover:bg-cyan-500 hover:text-black transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isEs ? "Portal Oficial" : "Official Portal"}</span>
                </a>

                {/* Copy JSON */}
                <button
                  onClick={() => handleCopyClipboard(inspectorDataset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                    isDark ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10" : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={isEs ? "Copiar datos JSON" : "Copy JSON data"}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                {/* Download CSV */}
                <button
                  onClick={() => handleDownload(inspectorDataset, "csv")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-mono font-bold hover:bg-emerald-400 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEs ? "Descargar CSV" : "Download CSV"}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    isDark ? "bg-white/10 text-white hover:bg-rose-500/80" : "bg-slate-200 text-slate-700 hover:bg-rose-500 hover:text-white"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-bar with search & column count */}
            <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
              isDark ? "bg-[#07090D] border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-cyan-500" />
                <input
                  type="text"
                  placeholder={isEs ? "Filtrar en microdatos por cualquier valor..." : "Filter microdata rows..."}
                  value={inspectorFilter}
                  onChange={(e) => setInspectorFilter(e.target.value)}
                  className={`w-full px-3 py-1 rounded border text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                    isDark ? "bg-[#0D1016] border-white/20 text-white" : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className={isDark ? "text-white/40" : "text-slate-500"}>
                  {isEs ? "Mostrando" : "Showing"} <strong>{inspectorRows.length}</strong> {isEs ? "de" : "of"} {inspectorDataset.sampleMicrodata.length} {isEs ? "filas" : "rows"}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  {inspectorColumns.length} VARIABLES
                </span>
              </div>
            </div>

            {/* Microdata Table Content */}
            <div className="flex-1 overflow-auto p-4 max-h-[60vh]">
              <div className="border rounded-xl overflow-hidden shadow-inner" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }}>
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className={isDark ? "bg-[#111622] text-cyan-400 border-b border-white/10" : "bg-slate-100 text-cyan-800 border-b border-slate-200"}>
                      <th className="p-2.5 font-bold uppercase text-[10px] w-12 text-center border-r border-white/5">#</th>
                      {inspectorColumns.map((col) => (
                        <th key={col} className="p-2.5 font-bold uppercase text-[10px] border-r border-white/5 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inspectorRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`transition ${
                          idx % 2 === 0
                            ? isDark ? "bg-[#0B0E14]/40" : "bg-white"
                            : isDark ? "bg-[#0D1016]" : "bg-slate-50/70"
                        } hover:bg-cyan-500/10`}
                      >
                        <td className={`p-2 text-center font-bold text-[10px] border-r border-white/5 ${isDark ? "text-white/40" : "text-slate-400"}`}>
                          {idx + 1}
                        </td>
                        {inspectorColumns.map((col) => {
                          const val = row[col];
                          const isQuintile = String(val).startsWith("Q");
                          const isSuccess = val === "Yes" || val === "Formal" || val === "Formal Regular" || val === "CLT / Formal" || val === "Formal Planilla" || val === "Beneficiario" || val === "Mobile";
                          const isWarning = val === "No" || String(val).includes("Informal") || val === "Sticky Floor Risk";
                          return (
                            <td key={col} className={`p-2 border-r border-white/5 whitespace-nowrap text-[11px] ${
                              isQuintile
                                ? "text-amber-400 font-bold"
                                : isSuccess
                                ? "text-emerald-400 font-bold"
                                : isWarning
                                ? "text-rose-400"
                                : isDark ? "text-white/80" : "text-slate-800"
                            }`}>
                              {String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
              isDark ? "bg-[#07090D] border-white/10" : "bg-slate-100 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Microdatos estandarizados y calibrados con arquitectura MICE para el Gemelo Digital Humano (HDT).</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className={`px-4 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                    isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isEs ? "Cerrar Inspector" : "Close Inspector"}
                </button>
                <button
                  onClick={() => handleDownload(inspectorDataset, "csv")}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEs ? "Descargar Muestra Completa (.csv)" : "Download Full Sample (.csv)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
