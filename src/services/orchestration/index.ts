/**
 * Orchestration Public Interface
 * Entry point unifying LangChain, LangGraph, and Langflow into a single decoupled module.
 */

import { GraphOrchestrator } from "./graphOrchestrator";
import { LangflowClient } from "./langflowClient";
import {
  WorkflowInput,
  WorkflowOutput,
  OrchestrationConfig,
  IntentCategory,
} from "./types";

let defaultOrchestrator: GraphOrchestrator | null = null;

/**
 * Singleton getter for GraphOrchestrator
 */
export function getOrchestratorInstance(config?: Partial<OrchestrationConfig>): GraphOrchestrator {
  if (!defaultOrchestrator || config) {
    defaultOrchestrator = new GraphOrchestrator(config);
  }
  return defaultOrchestrator;
}

/**
 * Main Public API: Executes an orchestrated workflow
 * Uses LangGraph StateGraph with conditional routing between Langflow, LangChain, and Tools.
 */
export async function executeOrchestratedWorkflow(
  input: WorkflowInput,
  config?: Partial<OrchestrationConfig>
): Promise<WorkflowOutput> {
  const orchestrator = getOrchestratorInstance(config);
  return orchestrator.execute(input);
}

/**
 * Direct Langflow runner helper
 */
export async function runLangflowDirect(
  flowId: string,
  inputValue: string,
  config?: Partial<OrchestrationConfig>
) {
  const client = new LangflowClient(config);
  return client.runFlow(flowId, inputValue);
}

// Re-export core classes & tools
export { GraphOrchestrator } from "./graphOrchestrator";
export { LangflowClient } from "./langflowClient";
export {
  ORCHESTRATION_TOOLS,
  econometricCalculatorTool,
  dropoutRiskScorerTool,
  knowledgeLookupTool,
  LangChainKnowledgeChain,
} from "./langchainComponents";
export * from "./types";
