/**
 * Test Suite for LangChain + LangGraph + Langflow Module
 * Verifies routing, tool executions, Langflow client fallback, and LangGraph checkpointer.
 */

import {
  executeOrchestratedWorkflow,
  LangflowClient,
  econometricCalculatorTool,
  dropoutRiskScorerTool,
  knowledgeLookupTool,
  GraphOrchestrator,
} from "./index";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 INICIANDO TEST SUITE: LangChain + LangGraph + Langflow");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // --- TEST 1: LangChain Tools Execution ---
  console.log("\n--- 1. Pruebas de Herramientas LangChain ---");
  try {
    const ecoResRaw = await econometricCalculatorTool.invoke({
      metric: "Coeficiente de Gini",
      baselineValue: 0.65,
      targetValue: 0.55,
    });
    const ecoRes = JSON.parse(ecoResRaw);
    assert(ecoRes.status === "success", "econometricCalculatorTool retorna status success");
    assert(ecoRes.percentageChange === "-15.38", "econometricCalculatorTool calcula cambio porcentual exacto");

    const dropResRaw = await dropoutRiskScorerTool.invoke({
      attendance: 40,
      gpa: 35,
      distanceKm: 15,
    });
    const dropRes = JSON.parse(dropResRaw);
    assert(dropRes.riskLevel === "ALERTA_ROJA", "dropoutRiskScorerTool clasifica riesgo alto como ALERTA_ROJA");

    const ragResRaw = await knowledgeLookupTool.invoke({ query: "deserción escolar" });
    const ragRes = JSON.parse(ragResRaw);
    assert(ragRes.relevanceScore > 0.9, "knowledgeLookupTool retorna score documental alto");
  } catch (err: any) {
    console.error("Fallo en test de herramientas LangChain:", err);
    failed++;
  }

  // --- TEST 2: Langflow HTTP Client ---
  console.log("\n--- 2. Pruebas del Cliente HTTP Langflow v1.x ---");
  try {
    const client = new LangflowClient({
      langflowBaseUrl: "http://localhost:7860",
      langflowTimeoutMs: 2000,
    });
    const config = client.getConfig();
    assert(config.langflowBaseUrl === "http://localhost:7860", "LangflowClient normaliza baseUrl");

    // Test runFlow fallback when offline
    const flowRes = await client.runFlow("test-dropout-flow", "Evaluar estudiante ID-42");
    assert(flowRes.status === "fallback", "LangflowClient maneja caída/offline con modo fallback seguro");
    assert(typeof flowRes.result === "string", "LangflowClient retorna texto estructurado de resultado");

    // Test listFlows fallback
    const listRes = await client.listFlows();
    assert(Array.isArray(listRes.flows), "listFlows retorna arreglo de flujos");
  } catch (err: any) {
    console.error("Fallo en test de LangflowClient:", err);
    failed++;
  }

  // --- TEST 3: LangGraph StateGraph Routing & Checkpointer ---
  console.log("\n--- 3. Pruebas de Orquestación LangGraph ---");
  try {
    const orchestrator = new GraphOrchestrator();

    // 3.1 Test Agent route
    const outAgent = await orchestrator.execute({
      query: "Calcula el riesgo de deserción para asistencia 60%",
      sessionId: "session-test-1",
    });
    assert(outAgent.intent === "agent", "LangGraph clasifica y enruta intención 'agent' correctamente");
    assert(outAgent.routeExecuted === "nodo_agent", "LangGraph ejecuta nodo_agent");
    assert(outAgent.executionSteps.length >= 3, "LangGraph registra traza de pasos en log");

    // 3.2 Test LangChain route
    const outLangChain = await orchestrator.execute({
      query: "Consulta documental sobre teoría de capital humano",
      sessionId: "session-test-2",
    });
    assert(outLangChain.intent === "langchain", "LangGraph clasifica y enruta intención 'langchain'");
    assert(outLangChain.routeExecuted === "nodo_langchain", "LangGraph ejecuta nodo_langchain");

    // 3.3 Test Langflow route
    const outLangflow = await orchestrator.execute({
      query: "Ejecuta el flujo de Langflow dropout-flow",
      sessionId: "session-test-3",
    });
    assert(outLangflow.intent === "langflow", "LangGraph clasifica y enruta intención 'langflow'");
    assert(outLangflow.routeExecuted === "nodo_langflow", "LangGraph ejecuta nodo_langflow");

    // 3.4 Test Checkpointer (Session Persistence)
    const turn1 = await orchestrator.execute({
      query: "Primer turno: asistencia 50%",
      sessionId: "persistent-thread-99",
    });
    const turn2 = await orchestrator.execute({
      query: "Segundo turno: calcular Gini",
      sessionId: "persistent-thread-99",
    });
    assert(turn2.stateCheckpointed === true, "LangGraph checkpointer preserva el hilo entre turnos");
    assert(turn2.metadata?.messagesCount === 4, "Historial de mensajes acumulado correctamente en el estado");
  } catch (err: any) {
    console.error("Fallo en test de LangGraph:", err);
    failed++;
  }

  // --- TEST 4: Public API Interface ---
  console.log("\n--- 4. Prueba de Interfaz Pública Unificada ---");
  try {
    const publicOut = await executeOrchestratedWorkflow({
      query: "Calcula el impacto en el Gini para valor base 0.60 y proyectado 0.50",
    });
    assert(publicOut.response.length > 0, "executeOrchestratedWorkflow responde satisfactoriamente");
    assert(publicOut.stateCheckpointed === true, "Interfaz pública reporta estado checkpointeado");
  } catch (err: any) {
    console.error("Fallo en test de interfaz pública:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`📊 RESULTADOS: ${passed} PASADOS | ${failed} FALLADOS`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-execute if run directly
runTests().catch((err) => {
  console.error("Error fatal en test runner:", err);
  process.exit(1);
});
