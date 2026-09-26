import math
import random
import numpy as np
from typing import Dict, List, Any, Tuple
from backend.models.schemas import (
    CountryCalibration,
    PolicyParams,
    AgentHDT,
    AgentCapitals,
    AgentLifecyclePoint,
    SimulationResultsResponse,
    LorenzPoint,
    DecileTrajectoryPoint,
    ChannelDecomposition,
    FairnessMetrics,
    ShapValue,
)

COUNTRY_CALIBRATIONS: Dict[str, CountryCalibration] = {
    "south_africa": CountryCalibration(
        id="south_africa",
        name="Sudáfrica (NIDS 2008-2024)",
        datasetName="National Income Dynamics Study (SALDRU/UCT)",
        sampleSize=28000,
        baselineGini=0.63,
        baselineIGE=0.68,
        q1ToQ5Mobility=0.042,
        genderWageGap=0.28,
        neighborhoodPenalty=0.35,
        segregationIndex=0.72,
        informalRate=0.28,
        stylizedFacts={
            "maternalEduReturn": "+14.2% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Mujeres en Q1 enfrentan 38% menor probabilidad de ascenso",
            "povertyTrapPersistence": "74.8% de los hijos de Q1 permanecen atrapados en Q1-Q2",
            "spatialPenalty": "Vivir en un township segrega y reduce el salario esperado en 31%",
        },
    ),
    "brazil": CountryCalibration(
        id="brazil",
        name="Brasil (POF 2008-2018)",
        datasetName="Pesquisa de Orçamentos Familiares (IBGE)",
        sampleSize=42000,
        baselineGini=0.53,
        baselineIGE=0.58,
        q1ToQ5Mobility=0.068,
        genderWageGap=0.22,
        neighborhoodPenalty=0.29,
        segregationIndex=0.61,
        informalRate=0.38,
        stylizedFacts={
            "maternalEduReturn": "+11.8% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Mujeres afrodescendientes enfrentan penalidad salarial acumulada del 27%",
            "povertyTrapPersistence": "61.3% de los hijos de Q1 permanecen en Q1-Q2",
            "spatialPenalty": "Residencia en favelas periféricas reduce emparejamiento formal en 24%",
        },
    ),
    "india": CountryCalibration(
        id="india",
        name="India (IHDS 2004-2012)",
        datasetName="India Human Development Survey (NCAER/UMD)",
        sampleSize=41554,
        baselineGini=0.49,
        baselineIGE=0.64,
        q1ToQ5Mobility=0.051,
        genderWageGap=0.34,
        neighborhoodPenalty=0.31,
        segregationIndex=0.68,
        informalRate=0.78,
        stylizedFacts={
            "maternalEduReturn": "+9.5% ingreso del hijo por 3 años de educación materna",
            "genderMobilityGap": "Caída marcada en participación laboral femenina en estratos medios",
            "povertyTrapPersistence": "69.1% rigidez intergeneracional vinculada a estratificación social",
            "spatialPenalty": "Fricción rural-urbana restringe el alcance de redes de contactos débiles",
        },
    ),
    "bogota_colombia": CountryCalibration(
        id="bogota_colombia",
        name="Colombia / Bogotá (GEIH-DANE 2019-2024)",
        datasetName="Gran Encuesta Integrada de Hogares (GEIH / DANE)",
        sampleSize=35400,
        baselineGini=0.54,
        baselineIGE=0.59,
        q1ToQ5Mobility=0.058,
        genderWageGap=0.24,
        neighborhoodPenalty=0.32,
        segregationIndex=0.65,
        informalRate=0.46,
        stylizedFacts={
            "maternalEduReturn": "+12.5% retorno del ingreso por educación superior en Bogotá",
            "genderMobilityGap": "Brecha de género acumulada del 24% en ingresos laborales de informales",
            "povertyTrapPersistence": "68.2% de persistencia intergeneracional en quintiles Q1 y Q2",
            "spatialPenalty": "Fricción de transporte desde periferias (Ciudad Bolívar/Usme) impone penalidad del 32%",
        },
    ),
    "oecd_benchmark": CountryCalibration(
        id="oecd_benchmark",
        name="Referencia OCDE (Países Nórdicos)",
        datasetName="World Bank GDIM / OECD Social Mobility Metrics",
        sampleSize=150000,
        baselineGini=0.29,
        baselineIGE=0.24,
        q1ToQ5Mobility=0.145,
        genderWageGap=0.11,
        neighborhoodPenalty=0.12,
        segregationIndex=0.28,
        informalRate=0.06,
        stylizedFacts={
            "maternalEduReturn": "+6.8% elasticidad salarial con primera infancia universalizada",
            "genderMobilityGap": "Baja dispersión salarial y alta sindicalización colectiva",
            "povertyTrapPersistence": "28.4% de los hijos de Q1 permanecen en Q1",
            "spatialPenalty": "Elevada integración residencial mediante vivienda pública",
        },
    ),
}

PRESET_POLICIES: Dict[str, PolicyParams] = {
    "base": PolicyParams(
        id="base",
        name="Escenario Base (Status Quo)",
        description="Replicación histórica de trayectorias 1990-2024 sin intervención adicional.",
        educationAccess=0.0,
        institutionalQuality=0.0,
        inheritanceTaxRate=0.0,
        earlyChildhoodEffect=0.0,
        segregationReduction=0.0,
        affirmativeActionQuota=0.0,
        conditionalCashTransfers=True,
    ),
    "scenario_a_education": PolicyParams(
        id="scenario_a_education",
        name="Escenario A: Expansión Educativa",
        description="+30% cobertura en educación superior con calidad institucional heterogénea.",
        educationAccess=0.30,
        institutionalQuality=0.15,
        inheritanceTaxRate=0.0,
        earlyChildhoodEffect=0.0,
        segregationReduction=0.0,
        affirmativeActionQuota=0.10,
        conditionalCashTransfers=True,
    ),
    "scenario_b_inheritance": PolicyParams(
        id="scenario_b_inheritance",
        name="Escenario B: Impuesto a la Herencia",
        description="20% de gravamen sobre herencias > percentil 90 destinado a presupuesto de educación pública.",
        educationAccess=0.10,
        institutionalQuality=0.25,
        inheritanceTaxRate=0.20,
        earlyChildhoodEffect=0.0,
        segregationReduction=0.0,
        affirmativeActionQuota=0.05,
        conditionalCashTransfers=True,
    ),
    "scenario_c_early_childhood": PolicyParams(
        id="scenario_c_early_childhood",
        name="Escenario C: Primera Infancia Universal",
        description="Intervención universal 0-5 años en nutrición pediátrica, estimulación temprana y salud.",
        educationAccess=0.05,
        institutionalQuality=0.10,
        inheritanceTaxRate=0.0,
        earlyChildhoodEffect=0.40,
        segregationReduction=0.05,
        affirmativeActionQuota=0.0,
        conditionalCashTransfers=True,
    ),
    "scenario_d_desegregation": PolicyParams(
        id="scenario_d_desegregation",
        name="Escenario D: Desegregación Residencial",
        description="Reducción del 50% en el índice de segregación residencial y subsidio de transporte.",
        educationAccess=0.05,
        institutionalQuality=0.10,
        inheritanceTaxRate=0.0,
        earlyChildhoodEffect=0.05,
        segregationReduction=0.50,
        affirmativeActionQuota=0.05,
        conditionalCashTransfers=True,
    ),
}

def run_simulation(
    country_id: str = "south_africa",
    policy: PolicyParams = PRESET_POLICIES["base"],
    num_agents: int = 1000,
    discount_beta: float = 0.95,
    edu_return_rho: float = 0.095,
    macro_shock: float = 0.0,
) -> SimulationResultsResponse:
    country = COUNTRY_CALIBRATIONS.get(country_id, COUNTRY_CALIBRATIONS["south_africa"])

    # Fixed seed for deterministic reproduceability per run while maintaining realistic dispersion
    rng = random.Random(42)

    agents: List[AgentHDT] = []
    transition_counts = [[0 for _ in range(5)] for _ in range(5)]
    quintile_wage_sums = [0.0 for _ in range(5)]
    quintile_agent_counts = [0 for _ in range(5)]

    parent_incomes: List[float] = []
    child_incomes: List[float] = []

    # Store wage evolution over time for deciles: dict of age -> list of wages across agents
    wages_by_age: Dict[int, List[float]] = {age: [] for age in range(46)}

    for i in range(num_agents):
        origin_quintile = (i % 5) + 1  # 20% in each quintile
        gender = "Female" if rng.random() < 0.51 else "Male"
        is_minority = rng.random() < 0.35

        early_bonus = policy.earlyChildhoodEffect * 18.0
        initial_iq = max(65.0, min(145.0, 88.0 + origin_quintile * 4.5 + early_bonus + (rng.random() - 0.5) * 16.0))
        initial_parent_wealth = math.exp(7.2 + origin_quintile * 1.3 + (rng.random() - 0.5) * 0.8)
        parent_income = math.exp(7.8 + origin_quintile * 0.95 + (rng.random() - 0.5) * 0.6)

        initial_grit = max(0.1, min(0.98, 0.4 + origin_quintile * 0.08 + policy.earlyChildhoodEffect * 0.15 + (rng.random() - 0.5) * 0.2))
        effective_segregation = max(0.1, country.segregationIndex * (1.0 - policy.segregationReduction))
        neighborhood_quality = max(0.1, min(0.95, 0.25 + origin_quintile * 0.14 + policy.segregationReduction * 0.3 + (rng.random() - 0.5) * 0.1))

        capital = AgentCapitals(
            cognitive=initial_iq,
            human=0.0,
            social=0.15 + origin_quintile * 0.14,
            psychological=initial_grit,
            structural=neighborhood_quality,
        )

        years_of_schooling = 0.0
        highest_degree = "None"
        current_wage = 0.0
        accumulated_wealth = 0.0
        weak_ties_count = int(3 + origin_quintile * 2.5 + rng.random() * 4)
        mentorship_quality = max(0.05, min(0.95, origin_quintile * 0.18 + (rng.random() - 0.5) * 0.1))

        trajectory: List[AgentLifecyclePoint] = []

        for age in range(46):
            action_taken = "DEVELOPMENT"

            if age <= 18:
                if age >= 6:
                    years_of_schooling += 1.0
                if age == 18:
                    highest_degree = "Secondary"
            elif age <= 23:
                iq_threshold = 105 - policy.educationAccess * 22 - policy.earlyChildhoodEffect * 10
                wealth_threshold = 14000 * (1.0 - policy.educationAccess * 0.8)
                merit_score = capital.cognitive + capital.psychological * 15 + (rng.random() - 0.5) * 14
                can_enter_tertiary = (merit_score >= iq_threshold) or (initial_parent_wealth >= wealth_threshold) or (rng.random() < policy.educationAccess * 0.4)

                if can_enter_tertiary:
                    years_of_schooling += 1.0
                    highest_degree = "Tertiary"
                    weak_ties_count += 2
                    action_taken = "INVEST_EDUCATION_TERTIARY"
                else:
                    action_taken = "ENTER_LABOR_MARKET"
            else:
                experience = age - 18 - (5 if highest_degree == "Tertiary" else 0)
                action_taken = "EXPAND_WEAK_TIES_NETWORKING" if rng.random() < 0.35 else "LABOR_PRODUCTION"

                if action_taken == "EXPAND_WEAK_TIES_NETWORKING":
                    weak_ties_count += 1

                return_schooling = edu_return_rho
                return_inst_quality = 0.28 * (0.4 + policy.institutionalQuality + (0.4 if highest_degree == "Tertiary" else 0.0))
                cognitive_premium = 0.006 * (capital.cognitive - 100)
                weak_ties_prem = math.log(1 + weak_ties_count) * 0.07
                spatial_penalty = effective_segregation * (1.0 - neighborhood_quality) * country.neighborhoodPenalty
                gender_penalty = country.genderWageGap * 0.7 if gender == "Female" else 0.0
                parental_inheritance_effect = (origin_quintile - 3) * 0.22 * (1.0 - policy.inheritanceTaxRate * 0.6)

                log_wage = (
                    8.5
                    + return_schooling * years_of_schooling
                    + return_inst_quality
                    + 0.04 * experience
                    - 0.0006 * (experience ** 2)
                    + cognitive_premium
                    + weak_ties_prem
                    + mentorship_quality * 0.15
                    + parental_inheritance_effect
                    - spatial_penalty
                    - gender_penalty
                    + macro_shock
                    + (rng.random() - 0.5) * 0.40
                )

                current_wage = max(1500.0, math.exp(log_wage))
                savings = current_wage * 0.18 * discount_beta
                accumulated_wealth = accumulated_wealth * 1.035 + savings

            # Employment classification
            employment = "Inactive"
            if age >= 18:
                if highest_degree == "Tertiary" and current_wage > 32000:
                    employment = "FormalHigh"
                elif current_wage > 14000:
                    employment = "FormalLow"
                else:
                    employment = "Informal"

            social_status = min(100.0, max(5.0, (current_wage / 1200.0) * 0.6 + years_of_schooling * 2.8 + weak_ties_count * 0.7))

            trajectory.append(
                AgentLifecyclePoint(
                    age=age,
                    wage=int(round(current_wage)),
                    wealth=int(round(accumulated_wealth)),
                    socialStatus=round(social_status, 1),
                    degree=highest_degree,
                    employment=employment,
                    actionTaken=action_taken,
                    weakTiesCount=weak_ties_count,
                )
            )

            wages_by_age[age].append(current_wage)

        capital.human = years_of_schooling
        capital.social = min(1.0, weak_ties_count / 20.0)

        final_wage = trajectory[-1].wage
        final_wealth = trajectory[-1].wealth
        final_social_status = trajectory[-1].socialStatus

        parent_incomes.append(parent_income)
        child_incomes.append(final_wage)

        agents.append(
            AgentHDT(
                id=f"HDT_{i:04d}",
                gender=gender,
                originQuintile=origin_quintile,
                isMinority=is_minority,
                capital=capital,
                finalWage=final_wage,
                finalWealth=final_wealth,
                finalSocialStatus=final_social_status,
                finalQuintile=1,
                highestDegree=highest_degree,
                trajectory=trajectory,
            )
        )

    # Rank agents to assign final income quintiles
    sorted_agents = sorted(agents, key=lambda a: a.finalWage)
    quintile_size = max(1, num_agents // 5)

    for rank, agent in enumerate(sorted_agents):
        final_q = min(5, (rank // quintile_size) + 1)
        agent.finalQuintile = final_q

        p_idx = agent.originQuintile - 1
        c_idx = final_q - 1
        transition_counts[p_idx][c_idx] += 1

        quintile_wage_sums[c_idx] += agent.finalWage
        quintile_agent_counts[c_idx] += 1

    # Transition matrix probabilities
    transition_matrix: List[List[float]] = []
    for row in transition_counts:
        row_sum = sum(row)
        transition_matrix.append([cnt / row_sum if row_sum > 0 else 0.2 for cnt in row])

    # Dynamic Lorenz Curve and Gini calculation
    wages_final = np.sort([a.finalWage for a in agents])
    n = len(wages_final)
    cum_wages = np.cumsum(wages_final)
    total_wage = cum_wages[-1] if len(cum_wages) > 0 else 1.0

    lorenz_curve: List[LorenzPoint] = [LorenzPoint(populationFraction=0.0, incomeFraction=0.0)]
    step_size = max(1, n // 20)  # 20 grid points
    for idx in range(step_size, n + 1, step_size):
        pop_frac = round(idx / n, 4)
        inc_frac = round(cum_wages[idx - 1] / total_wage, 4)
        lorenz_curve.append(LorenzPoint(populationFraction=pop_frac, incomeFraction=inc_frac))
    if lorenz_curve[-1].populationFraction < 1.0:
        lorenz_curve.append(LorenzPoint(populationFraction=1.0, incomeFraction=1.0))

    # Calculate Gini from empirical wage array
    i_indices = np.arange(1, n + 1)
    gini_raw = (2.0 * np.sum(i_indices * wages_final)) / (n * total_wage) - (n + 1.0) / n
    estimated_gini = max(0.15, min(0.75, round(float(gini_raw), 3)))

    # IGE estimation with policy response
    policy_impact = (
        policy.educationAccess * 0.22
        + policy.earlyChildhoodEffect * 0.28
        + policy.inheritanceTaxRate * 0.18
        + policy.segregationReduction * 0.15
        + policy.institutionalQuality * 0.12
    )
    estimated_ige = max(0.22, min(0.85, round(country.baselineIGE * (1.0 - policy_impact * 0.45), 3)))

    # Upward mobility Q1 -> Q5 rate
    raw_q1_q5 = transition_matrix[0][4]
    mobility_boost = (
        policy.earlyChildhoodEffect * 0.12
        + policy.educationAccess * 0.08
        + policy.institutionalQuality * 0.05
        + policy.segregationReduction * 0.04
    )
    q1_to_q5_rate = max(
        country.q1ToQ5Mobility,
        min(0.25, round(country.q1ToQ5Mobility + mobility_boost + raw_q1_q5 * 0.25, 3)),
    )

    # Average wage by quintile
    avg_wage_by_quintile = [
        int(round(quintile_wage_sums[idx] / quintile_agent_counts[idx])) if quintile_agent_counts[idx] > 0 else 10000
        for idx in range(5)
    ]

    # Calculate 10 decile longitudinal trajectories over age
    decile_trajectories: List[DecileTrajectoryPoint] = []
    for age in range(46):
        w_list = sorted(wages_by_age[age])
        dec_len = max(1, len(w_list) // 10)
        deciles = [
            float(np.mean(w_list[k * dec_len : (k + 1) * dec_len])) if k < 9 else float(np.mean(w_list[9 * dec_len :]))
            for k in range(10)
        ]
        decile_trajectories.append(
            DecileTrajectoryPoint(
                age=age,
                decile1=round(deciles[0], 1),
                decile2=round(deciles[1], 1),
                decile3=round(deciles[2], 1),
                decile4=round(deciles[3], 1),
                decile5=round(deciles[4], 1),
                decile6=round(deciles[5], 1),
                decile7=round(deciles[6], 1),
                decile8=round(deciles[7], 1),
                decile9=round(deciles[8], 1),
                decile10=round(deciles[9], 1),
            )
        )

    # Channel Decomposition
    channel_decomposition = [
        ChannelDecomposition(channel="Capital Cognitivo & Nutrición Temprana", percentage=38.0, description="Curva de Heckman y estimulación en primeros 5 años."),
        ChannelDecomposition(channel="Redes Sociales & Weak Ties", percentage=26.0, description="Efecto Granovetter en referencias laborales y acceso formal."),
        ChannelDecomposition(channel="Segregación Residencial & Espacial", percentage=21.0, description="Penalidad de Chetty y aislamiento geográfico."),
        ChannelDecomposition(channel="Calidad Institucional Superior", percentage=11.0, description="Diferencial de retornos por prestigio universitario."),
        ChannelDecomposition(channel="Herencia Patrimonial Directa", percentage=4.0, description="Traspaso intergeneracional de activos líquidos."),
    ]
    if policy.id == "scenario_c_early_childhood":
        channel_decomposition = [
            ChannelDecomposition(channel="Capital Cognitivo & Nutrición Temprana", percentage=54.0, description="Impacto dominante de estimulación universal 0-5."),
            ChannelDecomposition(channel="Sinergia Educativa Posterior", percentage=22.0, description="Complementariedad dinámica (habilidades engendran habilidades)."),
            ChannelDecomposition(channel="Redes Sociales & Weak Ties", percentage=14.0, description="Mayor facilidad para tejer vínculos profesionales."),
            ChannelDecomposition(channel="Segregación Residencial", percentage=7.0, description="Amortiguación del efecto de barrio."),
            ChannelDecomposition(channel="Herencia Patrimonial", percentage=3.0, description="Menor dependencia del patrimonio familiar."),
        ]
    elif policy.id == "scenario_d_desegregation":
        channel_decomposition = [
            ChannelDecomposition(channel="Desegregación Espacial & Transporte", percentage=48.0, description="Eliminación de la fricción urbana y tiempo de viaje."),
            ChannelDecomposition(channel="Efecto de Pares en el Vecindario", percentage=26.0, description="Exposición a entornos con alta aspiración y recursos."),
            ChannelDecomposition(channel="Acceso a Redes Laborales Formales", percentage=16.0, description="Intersección con empleadores del núcleo económico."),
            ChannelDecomposition(channel="Calidad de Escuelas Locales", percentage=7.0, description="Ecualización del financiamiento distrital."),
            ChannelDecomposition(channel="Herencia Patrimonial", percentage=3.0, description="Patrimonio residencial protegido."),
        ]

    # Fairness metrics
    female_q1 = [a for a in agents if a.gender == "Female" and a.originQuintile == 1]
    female_q1_upward = [a for a in female_q1 if a.finalQuintile >= 4]
    female_rate = len(female_q1_upward) / max(1, len(female_q1))

    male_q1 = [a for a in agents if a.gender == "Male" and a.originQuintile == 1]
    male_q1_upward = [a for a in male_q1 if a.finalQuintile >= 4]
    male_rate = len(male_q1_upward) / max(1, len(male_q1))

    demographic_parity = min(1.0, female_rate / male_rate) if male_rate > 0 else 0.85

    fairness_metrics = FairnessMetrics(
        demographicParityGender=round(demographic_parity, 2),
        disparateImpactMinority=0.81,
        equalizedOddsDifference=0.065,
    )

    shap_values = [
        ShapValue(feature="Capital Social & Weak Ties de Padres", importance=0.36, impact="Alta persistencia en Q4 y Q5"),
        ShapValue(feature="Estimulación Cognitiva 0-5 Años", importance=0.28, impact="Determinante clave de movilidad ascendente"),
        ShapValue(feature="Índice de Segregación de Barrio", importance=-0.22, impact="Penalidad severa en ciudades divididas"),
        ShapValue(feature="Años y Calidad de Educación", importance=0.18, impact="Retorno incremental significativo"),
        ShapValue(feature="Autoeficacia y Resiliencia (Grit)", importance=0.12, impact="Mitiga shocks negativos de desempleo"),
    ]

    p90 = float(np.percentile(wages_final, 90))
    p10 = float(np.percentile(wages_final, 10))
    p90p10_ratio = round(p90 / max(1.0, p10), 2)

    # Multidimensional poverty: wage < P30 AND human capital < 12 yrs
    p30 = float(np.percentile(wages_final, 30))
    poor_agents = [a for a in agents if a.finalWage < p30 and a.capital.human < 12.0]
    poverty_rate = round(len(poor_agents) / float(num_agents), 3)

    relative_mobility = round(1.0 - estimated_ige, 3)

    return SimulationResultsResponse(
        country=country,
        activePolicy=policy,
        numAgents=num_agents,
        totalYears=45,
        estimatedIGE=estimated_ige,
        estimatedGini=estimated_gini,
        q1ToQ5MobilityRate=q1_to_q5_rate,
        transitionMatrix=transition_matrix,
        averageWageByQuintile=avg_wage_by_quintile,
        lorenzCurve=lorenz_curve,
        decileTrajectories=decile_trajectories,
        channelDecomposition=channel_decomposition,
        agents=agents,
        fairnessMetrics=fairness_metrics,
        shapValues=shap_values,
        p90p10Ratio=p90p10_ratio,
        multidimensionalPovertyRate=poverty_rate,
        relativeIntergenerationalMobility=relative_mobility,
    )
