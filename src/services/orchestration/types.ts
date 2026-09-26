/**
 * Orchestration Types & Interfaces
 * Unifies LangChain, LangGraph, and Langflow contracts.
 */

import { BaseMessage } from "@langchain/core/messages";

export type IntentCategory = "langflow" | "langchain" | "agent" | "fallback";

export interface OrchestrationConfig {
  langflowBaseUrl: string;
  langflowApiKey?: string;
  langflowFlowId?: string;
  langflowTimeoutMs: number;
  langflowMode: "selfhosted" | "cloud";
}

export interface WorkflowInput {
  query: string;
  sessionId?: string;
  flowId?: string;
  metadata?: Record<string, unknown>;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface WorkflowOutput {
  sessionId: string;
  query: string;
  intent: IntentCategory;
  routeExecuted: string;
  response: string;
  executionSteps: Array<{
    node: string;
    timestamp: number;
    details?: Record<string, unknown>;
  }>;
  stateCheckpointed: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * State representation for LangGraph StateGraph
 */
export interface OrchestratorState {
  messages: BaseMessage[];
  query: string;
  sessionId: string;
  intent: IntentCategory;
  targetFlowId?: string;
  routeResult?: string;
  toolOutputs?: Record<string, unknown>[];
  validatedOutput?: string;
  executionLog: Array<{
    node: string;
    timestamp: number;
    details?: Record<string, unknown>;
  }>;
  error?: string;
}

export interface LangflowRunResponse {
  sessionId?: string;
  outputs?: Array<{
    inputs?: Record<string, unknown>;
    outputs?: Array<{
      results?: {
        message?: {
          text?: string;
          data?: unknown;
        };
        [key: string]: unknown;
      };
      artifacts?: Record<string, unknown>;
    }>;
  }>;
  result?: string;
  raw?: unknown;
  status: "success" | "fallback" | "error";
  error?: string;
}

export interface LangflowFlowSummary {
  id: string;
  name: string;
  description?: string;
  updated_at?: string;
  data?: unknown;
}
