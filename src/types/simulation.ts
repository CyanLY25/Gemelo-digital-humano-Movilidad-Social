/**
 * Core Types for Social Mobility Simulator (HDT-ABM-RL)
 */

export interface CapitalLayerData {
  cognitive: number; // 40 to 160
  human: number;     // 0 to 22 years
  social: number;    // 0 to 1 (network prestige & weak ties)
  psychological: number; // 0 to 1 (resilience & grit)
  structural: number;    // 0 to 1 (neighborhood & origin advantages)
}

export interface AgentLifecyclePoint {
  age: number;
  wage: number;
  wealth: number;
  socialStatus: number;
  degree: string;
  employment: "Unemployed" | "Informal" | "FormalLow" | "FormalHigh" | "EliteManagement" | "Inactive";
  actionTaken: string;
  weakTiesCount: number;
}

export interface AgentHDT {
  id: string;
  gender: "Female" | "Male";
  originQuintile: number; // 1 to 5
  isMinority: boolean;
  capital: CapitalLayerData;
  finalWage: number;
  finalWealth: number;
  finalSocialStatus: number;
  finalQuintile: number;
  highestDegree: string;
  trajectory: AgentLifecyclePoint[];
}

export interface PolicyParams {
  id: string;
  name: string;
  description: string;
  educationAccess: number;      // 0.0 to 0.60
  institutionalQuality: number;  // 0.0 to 0.50
  inheritanceTaxRate: number;    // 0.0 to 0.50
  earlyChildhoodEffect: number;  // 0.0 to 0.60
  segregationReduction: number;  // 0.0 to 0.80
  affirmativeActionQuota: number;// 0.0 to 0.40
  conditionalCashTransfers: boolean;
}

export interface CountryCalibration {
  id: string;
  name: string;
  datasetName: string;
  sampleSize: number;
  baselineGini: number;
  baselineIGE: number;
  q1ToQ5Mobility: number;
  genderWageGap: number;
  neighborhoodPenalty: number;
  segregationIndex: number;
  informalRate: number;
  stylizedFacts: {
    maternalEduReturn: string;
    genderMobilityGap: string;
    povertyTrapPersistence: string;
    spatialPenalty: string;
  };
}

export interface SimulationResults {
  country: CountryCalibration;
  activePolicy: PolicyParams;
  numAgents: number;
  totalYears: number;
  estimatedIGE: number;
  estimatedGini: number;
  q1ToQ5MobilityRate: number;
  transitionMatrix: number[][]; // 5x5
  averageWageByQuintile: number[];
  channelDecomposition: {
    channel: string;
    percentage: number;
    description: string;
  }[];
  agents: AgentHDT[];
  fairnessMetrics: {
    demographicParityGender: number;
    disparateImpactMinority: number;
    equalizedOddsDifference: number;
  };
  shapValues: {
    feature: string;
    importance: number;
    impact: string;
  }[];
}
