/**
 * Langflow HTTP Client (v1.x)
 * Self-contained REST adapter to execute flows, list flows, and inspect flow definitions.
 * Handles timeouts, authentication headers, and graceful offline fallback.
 */

import {
  LangflowFlowSummary,
  LangflowRunResponse,
  OrchestrationConfig,
} from "./types";

export class LangflowClient {
  private baseUrl: string;
  private apiKey?: string;
  private defaultFlowId?: string;
  private timeoutMs: number;
  private mode: "selfhosted" | "cloud";

  constructor(config?: Partial<OrchestrationConfig>) {
    // Read from environment if available (safe defaults)
    const env = typeof process !== "undefined" ? process.env : {};
    this.baseUrl = (
      config?.langflowBaseUrl ||
      env.LANGFLOW_BASE_URL ||
      "http://localhost:7860"
    ).replace(/\/+$/, "");

    this.apiKey = config?.langflowApiKey || env.LANGFLOW_API_KEY;
    this.defaultFlowId = config?.langflowFlowId || env.LANGFLOW_FLOW_ID;
    this.timeoutMs = Number(
      config?.langflowTimeoutMs || env.LANGFLOW_TIMEOUT_MS || 30000
    );
    this.mode = (config?.langflowMode || env.LANGFLOW_MODE || "selfhosted") as
      | "selfhosted"
      | "cloud";
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.apiKey) {
      // Langflow accepts both x-api-key and Bearer token depending on deployment
      headers["x-api-key"] = this.apiKey;
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Run a Langflow flow via POST /api/v1/run/{flow_id}
   */
  async runFlow(
    flowIdOrName?: string,
    inputValue: string = "",
    tweaks: Record<string, unknown> = {},
    stream = false
  ): Promise<LangflowRunResponse> {
    const targetFlowId = flowIdOrName || this.defaultFlowId || "default-flow";
    const endpoint = `${this.baseUrl}/api/v1/run/${encodeURIComponent(targetFlowId)}?stream=${stream}`;

    const payload = {
      input_value: inputValue,
      output_type: "chat",
      input_type: "chat",
      tweaks,
    };

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          status: "fallback",
          result: `[Langflow HTTP ${response.status}]: ${errorText.slice(0, 300)}`,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const json = await response.json();
      const extractedText = this.extractMessageText(json);

      return {
        status: "success",
        result: extractedText || JSON.stringify(json),
        raw: json,
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);

      // Handle offline or unreachable Langflow gracefully
      const isConnectionRefused =
        err?.code === "ECONNREFUSED" ||
        err?.message?.includes("fetch failed") ||
        err?.name === "AbortError";

      return {
        status: "fallback",
        result: isConnectionRefused
          ? `[Simulación Langflow]: Servidor Langflow en ${this.baseUrl} no responde (offline). Flujo '${targetFlowId}' ejecutado en modo fallback local para input: "${inputValue}".`
          : `[Langflow Error]: ${err?.message || "Error desconocido"}`,
        error: err?.message,
      };
    }
  }

  /**
   * List flows via GET /api/v1/flows
   */
  async listFlows(): Promise<{ success: boolean; flows: LangflowFlowSummary[]; error?: string }> {
    const endpoint = `${this.baseUrl}/api/v1/flows`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        return {
          success: false,
          flows: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const flows: LangflowFlowSummary[] = await response.json();
      return { success: true, flows };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      return {
        success: false,
        flows: [
          {
            id: "fallback-dropout-risk-flow",
            name: "Dropout Risk Assessment (Local Mock)",
            description: "Flujo simulado de evaluación de riesgo escolar.",
            updated_at: new Date().toISOString(),
          },
        ],
        error: err?.message || "Conexión rechazada a Langflow",
      };
    }
  }

  /**
   * Get specific flow definition via GET /api/v1/flows/{flow_id}
   */
  async getFlow(flowId: string): Promise<{ success: boolean; flow?: LangflowFlowSummary; error?: string }> {
    const endpoint = `${this.baseUrl}/api/v1/flows/${encodeURIComponent(flowId)}`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const flow = await response.json();
      return { success: true, flow };
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      return {
        success: false,
        error: err?.message,
      };
    }
  }

  /**
   * Helper to parse and extract the main response text from Langflow run JSON payload
   */
  private extractMessageText(data: any): string | null {
    try {
      if (!data) return null;
      if (typeof data.result === "string") return data.result;

      // Check outputs[0].outputs[0].results.message.text
      const firstOutput = data?.outputs?.[0]?.outputs?.[0];
      if (firstOutput?.results?.message?.text) {
        return firstOutput.results.message.text;
      }
      if (firstOutput?.artifacts?.text) {
        return firstOutput.artifacts.text;
      }
      if (firstOutput?.messages?.[0]?.message) {
        return firstOutput.messages[0].message;
      }
      if (data?.text) {
        return data.text;
      }
    } catch {
      // Fall through to JSON stringify
    }
    return null;
  }

  getConfig(): OrchestrationConfig {
    return {
      langflowBaseUrl: this.baseUrl,
      langflowApiKey: this.apiKey,
      langflowFlowId: this.defaultFlowId,
      langflowTimeoutMs: this.timeoutMs,
      langflowMode: this.mode,
    };
  }
}
