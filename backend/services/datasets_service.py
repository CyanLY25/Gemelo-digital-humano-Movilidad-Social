from typing import Dict, List, Any

PUBLIC_DATASETS: List[Dict[str, Any]] = [
    {
        "id": "south_africa_nids",
        "name": "Sudáfrica NIDS",
        "institution": "DataFirst / Univ. of Cape Town",
        "records": 28000,
        "baselineGini": 0.63,
        "baselineIGE": 0.68,
        "coverage": "Nacional (5 Olas Longitudinales)",
        "primaryUse": "Trampas de pobreza dinásticas y segregación territorial",
    },
    {
        "id": "india_ihds",
        "name": "India IHDS",
        "institution": "NCAER / Univ. of Maryland",
        "records": 41554,
        "baselineGini": 0.49,
        "baselineIGE": 0.61,
        "coverage": "Nacional (Panel de Hogares)",
        "primaryUse": "Inmovilidad por estratificación de castas y fricción rural",
    },
    {
        "id": "brazil_pof",
        "name": "Brasil POF",
        "institution": "IBGE",
        "records": 42000,
        "baselineGini": 0.53,
        "baselineIGE": 0.58,
        "coverage": "Nacional Urbano/Rural",
        "primaryUse": "Segregación en favelas y retornos raciales a la educación",
    },
    {
        "id": "worldbank_gdim",
        "name": "Banco Mundial GDIM",
        "institution": "World Bank Development Economics Group",
        "records": 148000,
        "baselineGini": 0.45,
        "baselineIGE": 0.52,
        "coverage": "148 Países (Benchmark Global)",
        "primaryUse": "Comparativa internacional de elasticidad del ingreso",
    },
    {
        "id": "oecd_mobility",
        "name": "OCDE Social Mobility Database",
        "institution": "OECD Directorate for Employment & Social Affairs",
        "records": 150000,
        "baselineGini": 0.31,
        "baselineIGE": 0.38,
        "coverage": "38 Países Miembros OCDE",
        "primaryUse": "Patrón de alta movilidad nórdica y protección social",
    },
    {
        "id": "peru_enaho",
        "name": "Perú ENAHO",
        "institution": "INEI Perú",
        "records": 34200,
        "baselineGini": 0.44,
        "baselineIGE": 0.57,
        "coverage": "Nacional Desagregado por Departamentos",
        "primaryUse": "Movilidad social andina e informalidad laboral",
    },
    {
        "id": "cepal_panorama",
        "name": "CEPAL Panorama Social",
        "institution": "Comisión Económica para América Latina",
        "records": 95000,
        "baselineGini": 0.46,
        "baselineIGE": 0.54,
        "coverage": "18 Países de América Latina y Caribe",
        "primaryUse": "Gasto social en primera infancia y brechas de género",
    },
    {
        "id": "latinobarometro",
        "name": "Latinobarómetro",
        "institution": "Corporación Latinobarómetro",
        "records": 20000,
        "baselineGini": 0.47,
        "baselineIGE": 0.56,
        "coverage": "18 Países de la Región",
        "primaryUse": "Percepción subjetiva de movilidad y capital psicológico",
    },
    {
        "id": "unu_wider_wiid",
        "name": "UNU-WIDER WIID",
        "institution": "United Nations University WIDER",
        "records": 210000,
        "baselineGini": 0.42,
        "baselineIGE": 0.49,
        "coverage": "Mundial Histórico (1950-2024)",
        "primaryUse": "Evolución de largo plazo de la desigualdad global",
    },
]

def auto_schema_matcher(columns: List[str]) -> Dict[str, str]:
    """Auto-detects column mapping for the 5 HDT capitals from an uploaded CSV schema."""
    mapping = {}
    cols_lower = [c.lower() for c in columns]
    
    for idx, c in enumerate(cols_lower):
        if any(k in c for k in ["iq", "cog", "test", "simce", "saber", "icfes", "eval"]):
            mapping["cognitive"] = columns[idx]
        elif any(k in c for k in ["edu", "school", "escuela", "grado", "human", "ano"]):
            mapping["human"] = columns[idx]
        elif any(k in c for k in ["red", "social", "contact", "tie", "amigo"]):
            mapping["social"] = columns[idx]
        elif any(k in c for k in ["grit", "psi", "resili", "auto", "motiv"]):
            mapping["psychological"] = columns[idx]
        elif any(k in c for k in ["barrio", "estruc", "trans", "viaje", "segreg", "dist"]):
            mapping["structural"] = columns[idx]
        elif any(k in c for k in ["wage", "ingreso", "salario", "income", "sueldo"]):
            mapping["finalWage"] = columns[idx]

    return mapping
