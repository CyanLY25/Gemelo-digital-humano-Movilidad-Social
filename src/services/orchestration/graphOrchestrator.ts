/**
 * LangGraph StateGraph Orchestrator
 * Implements the confirmed multi-branch workflow:
 *
 *   input → classify(intent) → route
 *     ├─ nodo_langflow(flowId)      // executes a flow via Langflow REST API
 *     ├─ nodo_langchain(chainId)    // executes local LangChain chain/RAG
 *     └─ nodo_agent(tools)          // LangChain agent with tools
 *   → validate → output
 *
 * Employs MemorySaver checkpointer for state persistence across turns.
 */

import { StateGraph, Annotation, MemorySaver, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { LangflowClient } from "./langflowClient";
import {
  ORCHESTRATION_TOOLS,
  LangChainKnowledgeChain,
  econometricCalculatorTool,
  dropoutRiskScorerTool,
  knowledgeLookupTool,
} from "./langchainComponents";
import {
  IntentCategory,
  WorkflowInput,
  WorkflowOutput,
  OrchestrationConfig,
} from "./types";

/**
 * State Definition using LangGraph Annotation.Root
 */
export const WorkflowStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  query: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  sessionId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "default-session",
  }),
  intent: Annotation<IntentCategory>({
    reducer: (_, update) => update,
    default: () => "agent",
  }),
  targetFlowId: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  routeResult: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  toolOutputs: Annotation<Record<string, unknown>[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  validatedOutput: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),
  executionLog: Annotation<
    Array<{ node: string; timestamp: number; details?: Record<string, unknown> }>
  >({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
});

export type GraphStateType = typeof WorkflowStateAnnotation.State;

export class GraphOrchestrator {
  private langflowClient: LangflowClient;
  private knowledgeChain: LangChainKnowledgeChain;
  private checkpointer: MemorySaver;
  private compiledGraph: any;

  constructor(config?: Partial<OrchestrationConfig>) {
    this.langflowClient = new LangflowClient(config);
    this.knowledgeChain = new LangChainKnowledgeChain();
    this.checkpointer = new MemorySaver();
    this.initGraph();
  }

  private initGraph() {
    const builder = new StateGraph(WorkflowStateAnnotation)
      // 1. Classification Node
      .addNode("classify_intent", async (state: GraphStateType) => {
        const q = state.query.toLowerCase();
        let determinedIntent: IntentCategory = "agent";

        if (q.includes("langflow") || q.includes("flujo") || q.includes("flow")) {
          determinedIntent = "langflow";
        } else if (q.includes("documental") || q.includes("rag") || q.includes("corpus") || q.includes("teoría")) {
          determinedIntent = "langchain";
        } else if (
          q.includes("calcula") ||
          q.includes("gini") ||
          q.includes("riesgo") ||
          q.includes("asistencia") ||
          q.includes("herramienta") ||
          q.includes("tool")
        ) {
          determinedIntent = "agent";
        } else {
          determinedIntent = "agent";
        }

        return {
          intent: determinedIntent,
          executionLog: [
            {
              node: "classify_intent",
              timestamp: Date.now(),
              details: { detectedIntent: determinedIntent, query: state.query },
            },
          ],
        };
      })
      // 2A. Node Langflow
      .addNode("nodo_langflow", async (state: GraphStateType) => {
        const flowId = state.targetFlowId || "dropout-early-warning-flow";
        const runResult = await this.langflowClient.runFlow(flowId, state.query);

        return {
          routeResult: runResult.result || "Flujo Langflow completado.",
          executionLog: [
            {
              node: "nodo_langflow",
              timestamp: Date.now(),
              details: {
                flowId,
                status: runResult.status,
                error: runResult.error,
              },
            },
          ],
        };
      })
      // 2B. Node LangChain (Local Document/RAG Chain)
      .addNode("nodo_langchain", async (state: GraphStateType) => {
        const chainOutput = await this.knowledgeChain.execute(state.query);

        return {
          routeResult: chainOutput,
          executionLog: [
            {
              node: "nodo_langchain",
              timestamp: Date.now(),
              details: { chain: "LangChainKnowledgeChain", status: "success" },
            },
          ],
        };
      })
      // 2C. Node Agent (Tools Execution)
      .addNode("nodo_agent", async (state: GraphStateType) => {
        const q = state.query.toLowerCase();
        const toolOutputs: Record<string, unknown>[] = [];
        let summaryText = "";

        if (q.includes("gini") || q.includes("desigualdad")) {
          const rawRes = await econometricCalculatorTool.invoke({
            metric: "Gini Intergeneracional",
            baselineValue: 0.62,
            targetValue: 0.54,
          });
          const parsed = JSON.parse(rawRes);
          toolOutputs.push(parsed);
          summaryText = `[Agente con Herramientas]: Herramienta 'econometric_calculator' ejecutada con éxito. Variación: ${parsed.percentageChange}%. ${parsed.interpretation}`;
        } else if (q.includes("riesgo") || q.includes("deserción") || q.includes("asistencia")) {
          const rawRes = await dropoutRiskScorerTool.invoke({
            attendance: 64,
            gpa: 52,
            distanceKm: 8.5,
          });
          const parsed = JSON.parse(rawRes);
          toolOutputs.push(parsed);
          summaryText = `[Agente con Herramientas]: Herramienta 'dropout_risk_scorer' ejecutada. Probabilidad de Deserción: ${parsed.dropoutProbability} (${parsed.riskLevel}). Recomendación: ${parsed.recommendation}`;
        } else {
          const rawRes = await knowledgeLookupTool.invoke({ query: state.query });
          const parsed = JSON.parse(rawRes);
          toolOutputs.push(parsed);
          summaryText = `[Agente con Herramientas]: Herramienta 'knowledge_lookup' invocada. ${parsed.foundDocumentSnippet}`;
        }

        return {
          routeResult: summaryText,
          toolOutputs,
          executionLog: [
            {
              node: "nodo_agent",
              timestamp: Date.now(),
              details: { toolsInvokedCount: toolOutputs.length },
            },
          ],
        };
      })
      // 3. Validation & Synthesis Node
      .addNode("validate_output", async (state: GraphStateType) => {
        const candidate = state.routeResult || "Sin respuesta generada.";
        const validated = candidate.trim().length > 0 ? candidate : "[Validación]: Respuesta vacía corregida con fallback.";

        return {
          validatedOutput: validated,
          messages: [
            new HumanMessage(state.query),
            new AIMessage(validated),
          ],
          executionLog: [
            {
              node: "validate_output",
              timestamp: Date.now(),
              details: { outputLength: validated.length, status: "validated" },
            },
          ],
        };
      });

    // Edges & Routing logic
    builder.addEdge(START, "classify_intent" as any);

    builder.addConditionalEdges(
      "classify_intent" as any,
      (state: GraphStateType) => {
        switch (state.intent) {
          case "langflow":
            return "nodo_langflow";
          case "langchain":
            return "nodo_langchain";
          case "agent":
          default:
            return "nodo_agent";
        }
      },
      {
        nodo_langflow: "nodo_langflow",
        nodo_langchain: "nodo_langchain",
        nodo_agent: "nodo_agent",
      } as any
    );

    builder.addEdge("nodo_langflow" as any, "validate_output" as any);
    builder.addEdge("nodo_langchain" as any, "validate_output" as any);
    builder.addEdge("nodo_agent" as any, "validate_output" as any);
    builder.addEdge("validate_output" as any, END);

    // Compile with checkpointer for multi-turn state preservation
    this.compiledGraph = builder.compile({ checkpointer: this.checkpointer });
  }

  /**
   * Execute the full orchestrated workflow
   */
  async execute(input: WorkflowInput): Promise<WorkflowOutput> {
    const sessionId = input.sessionId || `session-${Date.now()}`;
    const threadConfig = {
      configurable: {
        thread_id: sessionId,
      },
    };

    const initialInput = {
      query: input.query,
      sessionId,
      targetFlowId: input.flowId,
      messages: input.history
        ? input.history.map((h) =>
            h.role === "user" ? new HumanMessage(h.content) : new AIMessage(h.content)
          )
        : [],
    };

    const finalState = await this.compiledGraph.invoke(initialInput, threadConfig);

    return {
      sessionId,
      query: input.query,
      intent: finalState.intent,
      routeExecuted: `nodo_${finalState.intent}`,
      response: finalState.validatedOutput,
      executionSteps: finalState.executionLog,
      stateCheckpointed: true,
      metadata: {
        totalSteps: finalState.executionLog.length,
        messagesCount: finalState.messages.length,
        toolsUsed: finalState.toolOutputs?.length || 0,
      },
    };
  }

  getLangflowClient(): LangflowClient {
    return this.langflowClient;
  }
}
