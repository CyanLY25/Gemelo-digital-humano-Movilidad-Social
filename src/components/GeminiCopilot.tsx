import React, { useState, useEffect, useRef } from "react";
import { SimulationResults, PolicyParams } from "../types/simulation";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Markdown from "react-markdown";

interface GeminiCopilotProps {
  simulationResults: SimulationResults;
  onApplyPolicy?: (policyId: string) => void;
  onSelectCountry?: (countryId: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isSpeaking?: boolean;
}

export const GeminiCopilot: React.FC<GeminiCopilotProps> = ({
  simulationResults,
  onApplyPolicy,
  onSelectCountry,
}) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content: language === "en"
        ? `Hello! I am your **AI Simulation & Public Policy Copilot** powered by Gemini. I have loaded the active simulation state for **${simulationResults.country.name}** under **"${simulationResults.activePolicy.name}"** (Estimated IGE: **${simulationResults.estimatedIGE}**, Gini: **${simulationResults.estimatedGini}**, Q1➔Q5 Ascent: **${(simulationResults.q1ToQ5MobilityRate * 100).toFixed(1)}%**).\n\nYou can ask me **any request or question** via **text or your microphone (voice)**:`
        : `¡Hola! Soy tu **Copiloto Econométrico y de Políticas Públicas** potenciado por Gemini. He cargado el estado activo de la simulación para **${simulationResults.country.name}** con el escenario **"${simulationResults.activePolicy.name}"** (IGE estimado: **${simulationResults.estimatedIGE}**, Gini: **${simulationResults.estimatedGini}**, Tasa de ascenso Q1➔Q5: **${(simulationResults.q1ToQ5MobilityRate * 100).toFixed(1)}%**).\n\nPuedes hacerme **cualquier pregunta o petición** mediante **texto o voz con tu micrófono**:`
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [autoRead, setAutoRead] = useState(false);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [speechPermissionError, setSpeechPermissionError] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        synthVoicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (SpeechRecognitionClass) {
      setVoiceSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = language === "en" ? "en-US" : "es-ES";

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechPermissionError(false);
          setStatusNote(language === "en" ? "Listening to your voice... Speak clearly" : "Escuchando tu voz... Habla con claridad");
        };

        recognition.onresult = (event: any) => {
          let accumulatedTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            accumulatedTranscript += event.results[i][0].transcript;
          }
          if (accumulatedTranscript.trim()) {
            setInputQuery(accumulatedTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech Recognition Error:", event.error);
          if (event.error === "not-allowed" || event.error === "permission-denied") {
            setSpeechPermissionError(true);
            setIsListening(false);
            setStatusNote(
              language === "en"
                ? "Microphone access denied. Please click the lock icon in your browser URL bar and allow microphone permissions."
                : "Permiso de micrófono denegado. Por favor haz clic en el icono del candado en la barra de direcciones y permite el micrófono."
            );
          } else if (event.error === "no-speech") {
            // Soft notification, do not abort
            setStatusNote(
              language === "en" ? "No speech detected. Try speaking closer to the mic." : "No se detectó audio. Habla más cerca del micrófono."
            );
          } else if (event.error !== "aborted") {
            setIsListening(false);
            setStatusNote(
              language === "en" ? `Voice recognition note: ${event.error}` : `Aviso de reconocimiento de voz: ${event.error}`
            );
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("Could not instantiate SpeechRecognition:", e);
        setVoiceSupported(false);
      }
    } else {
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Update speech recognition language when app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "en" ? "en-US" : "es-ES";
    }
  }, [language]);

  const toggleListening = async () => {
    if (!voiceSupported) {
      setStatusNote(
        language === "en"
          ? "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
          : "El reconocimiento de voz no es compatible con este navegador. Usa Google Chrome, Microsoft Edge o Safari."
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
        }
      }
      setIsListening(false);
      setStatusNote(null);
      return;
    }

    // Stop any active speech synthesis before listening
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setActiveSpeakingIdx(null);
    }

    // Try requesting microphone access explicitly to trigger permission prompt if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close the probe stream immediately so recognition can use it
        stream.getTracks().forEach((track) => track.stop());
        setSpeechPermissionError(false);
      } catch (mediaErr: any) {
        console.warn("Microphone getUserMedia request error:", mediaErr);
        if (mediaErr.name === "NotAllowedError" || mediaErr.name === "PermissionDeniedError") {
          setSpeechPermissionError(true);
          setStatusNote(
            language === "en"
              ? "Microphone access blocked. Please enable microphone permissions in your browser."
              : "Acceso al micrófono denegado. Habilita el permiso del micrófono en tu navegador."
          );
          return;
        }
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setStatusNote(
          language === "en" ? "Listening to your voice... Speak now" : "Escuchando tu voz... Habla ahora"
        );
      } catch (err: any) {
        console.warn("Recognition start error:", err);
        if (err.name === "InvalidStateError") {
          // Restart cleanly if already running
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
            }, 100);
          } catch (restartErr) {
            console.warn("Restart recognition failed:", restartErr);
          }
        } else {
          setStatusNote(
            language === "en"
              ? `Could not start microphone: ${err.message || err}`
              : `No se pudo iniciar el micrófono: ${err.message || err}`
          );
        }
      }
    }
  };

  // Text-to-speech helper with robust multi-voice fallback
  const speakText = (text: string, msgIdx: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (activeSpeakingIdx === msgIdx) {
      window.speechSynthesis.cancel();
      setActiveSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean up markdown formatting, math LaTeX, URLs and emojis for smooth pronunciation
    const cleanText = text
      .replace(/[*#_`$\[\]\(\)]/g, "")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 sobre $2")
      .replace(/\\[a-zA-Z]+/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "en" ? "en-US" : "es-ES";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best natural voice matching current language
    const voices = synthVoicesRef.current.length > 0 ? synthVoicesRef.current : window.speechSynthesis.getVoices();
    const targetPrefix = language === "en" ? "en" : "es";

    const preferredVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix) && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) ||
      null;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setActiveSpeakingIdx(null);
    };
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setActiveSpeakingIdx(null);
    };

    setActiveSpeakingIdx(msgIdx);

    // Resume speech synthesis if suspended by browser
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  };

  const stopAllSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setActiveSpeakingIdx(null);
    }
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }

    stopAllSpeech();
    setStatusNote(null);

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          language,
          messages: updatedMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          simulationContext: {
            country: simulationResults.country.name,
            policy: simulationResults.activePolicy.name,
            estimatedIGE: simulationResults.estimatedIGE,
            estimatedGini: simulationResults.estimatedGini,
            q1ToQ5Mobility: simulationResults.q1ToQ5MobilityRate,
          }
        }),
      });

      const data = await response.json();
      const content = data.analysis || data.text || data.message || (language === "en" ? "Analysis completed successfully." : "Análisis completado exitosamente.");
      const newAssistantMsgIdx = updatedMessages.length;
      const assistantMessage: Message = {
        role: "assistant",
        content,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoRead) {
        setTimeout(() => {
          speakText(content, newAssistantMsgIdx);
        }, 150);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: language === "en"
            ? "Could not connect to the analytical engine. Please try again in a few moments."
            : "No se pudo conectar con el motor de análisis. Por favor intenta de nuevo en unos momentos.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    t("copilot_quick_1"),
    t("copilot_quick_2"),
    t("copilot_quick_3"),
    t("copilot_quick_4"),
  ];

  const isDark = theme === "dark";

  return (
    <div
      id="gemini-copilot-root"
      className={`rounded-xl p-5 shadow-2xl flex flex-col h-[680px] transition-colors ${
        isDark
          ? "bg-[#0D1016] border border-white/10 text-[#D1D5DB]"
          : "bg-white border border-slate-200 text-slate-800"
      }`}
    >
      {/* Copilot Header */}
      <div
        className={`flex flex-wrap items-center justify-between pb-3.5 mb-4 border-b gap-3 ${
          isDark ? "border-white/10" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-xs font-bold uppercase tracking-wider font-mono ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("copilot_title")}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
                GEMINI 3.7 FLASH // LIVE
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-white/50" : "text-slate-500"}`}>
              {t("copilot_sub")}
            </p>
          </div>
        </div>

        {/* Action controls & indicators */}
        <div className="flex items-center gap-2.5 font-mono text-xs">
          {/* Auto Read Toggle */}
          <button
            id="toggle-auto-read-btn"
            onClick={() => {
              setAutoRead(!autoRead);
              if (autoRead) stopAllSpeech();
            }}
            title={t("copilot_auto_read")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border transition ${
              autoRead
                ? "bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 border-cyan-500/40"
                : isDark
                ? "bg-white/5 text-white/50 border-white/10 hover:text-white"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900"
            }`}
          >
            {autoRead ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{autoRead ? "Voz Auto: ON" : "Voz Auto: OFF"}</span>
          </button>

          {/* Clear History */}
          <button
            id="clear-copilot-chat-btn"
            onClick={() => {
              stopAllSpeech();
              setMessages([]);
            }}
            title={t("clear_chat")}
            className={`p-1.5 rounded border transition ${
              isDark
                ? "bg-white/5 text-white/40 border-white/10 hover:text-rose-400 hover:border-rose-500/30"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:text-rose-600 hover:border-rose-300"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Context pill */}
          <span
            className={`text-[10px] px-2.5 py-1 rounded border ${
              isDark
                ? "bg-[#050608] text-cyan-400 border-white/10"
                : "bg-slate-100 text-cyan-700 border-slate-200 font-semibold"
            }`}
          >
            {simulationResults.country.name.split(" ")[0].toUpperCase()} • {simulationResults.activePolicy.id.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] relative group ${
                msg.role === "user"
                  ? isDark
                    ? "bg-cyan-950/40 text-white border border-cyan-500/30 rounded-br-none shadow-md font-mono"
                    : "bg-cyan-600 text-white rounded-br-none shadow-md font-mono"
                  : isDark
                  ? "bg-[#050608] border border-white/10 text-white/90 rounded-bl-none shadow-xl"
                  : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-2">
                  <div
                    className={`prose prose-xs max-w-none space-y-2 ${
                      isDark ? "prose-invert" : "text-slate-800"
                    }`}
                  >
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Speech button on assistant message */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 gap-2 font-mono text-[10px]">
                    <button
                      id={`speak-msg-${idx}`}
                      onClick={() => speakText(msg.content, idx)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                        activeSpeakingIdx === idx
                          ? "bg-cyan-500 text-black font-bold animate-pulse"
                          : isDark
                          ? "text-white/40 hover:text-cyan-400 hover:bg-white/5"
                          : "text-slate-400 hover:text-cyan-600 hover:bg-slate-200"
                      }`}
                    >
                      {activeSpeakingIdx === idx ? (
                        <>
                          <Volume2 className="w-3 h-3 text-black" />
                          <span>{t("copilot_stop_speech")}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>{t("copilot_speak_msg")}</span>
                        </>
                      )}
                    </button>

                    {/* Check if response suggests policies and offer quick actions */}
                    {onApplyPolicy && msg.content.toLowerCase().includes("infancia") && (
                      <button
                        onClick={() => onApplyPolicy("scenario_c_early_childhood")}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{t("copilot_apply_policy")}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>

            {msg.role === "user" && (
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isDark
                    ? "bg-white/10 text-white border-white/10"
                    : "bg-slate-200 text-slate-700 border-slate-300"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            className={`flex gap-3 items-center text-xs p-3 rounded-lg border w-fit font-mono ${
              isDark
                ? "text-cyan-400 bg-[#050608] border-cyan-500/30"
                : "text-cyan-700 bg-cyan-50 border-cyan-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>{t("copilot_querying")}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening Status Visualizer */}
      {isListening && (
        <div className="mb-2 p-3 rounded-lg bg-red-500/15 border border-red-500/40 flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2.5 text-red-500 dark:text-red-400 text-xs font-mono">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-bold">{language === "en" ? "LISTENING TO VOICE..." : "GRABANDO VOZ..."}</span>
            <span className="text-[11px] text-white/70 truncate max-w-[240px]">
              {inputQuery || (language === "en" ? "(Speak your question now)" : "(Habla tu consulta ahora)")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleListening()}
              className="px-2.5 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-mono font-bold transition flex items-center gap-1"
            >
              <MicOff className="w-3 h-3" />
              <span>{language === "en" ? "Done" : "Listo"}</span>
            </button>
            {inputQuery.trim() && (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-mono font-bold transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>{language === "en" ? "Send Voice Query" : "Enviar"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Permission or Status Banner */}
      {speechPermissionError && (
        <div className="mb-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {language === "en"
                ? "Microphone access blocked. Click the lock/permission icon in your browser URL bar to allow microphone access."
                : "Micrófono bloqueado. Haz clic en el icono del candado en la barra de URL para permitir el acceso al micrófono."}
            </span>
          </div>
          <button
            onClick={() => setSpeechPermissionError(false)}
            className="text-[10px] underline ml-2 hover:text-white"
          >
            OK
          </button>
        </div>
      )}

      {statusNote && !isListening && !speechPermissionError && (
        <div className="mb-2 text-[11px] text-cyan-400 font-mono flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{statusNote}</span>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 mb-3 font-mono">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className={`text-[10px] px-2.5 py-1 rounded border transition ${
              isDark
                ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200"
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form with Voice Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        {/* Voice Input Button */}
        <button
          type="button"
          id="mic-voice-toggle-btn"
          onClick={toggleListening}
          title={isListening ? t("copilot_mic_stop") : t("copilot_mic_start")}
          className={`p-2.5 rounded-lg border flex items-center justify-center transition-all ${
            isListening
              ? "bg-red-500 text-white border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.5)] animate-pulse"
              : isDark
              ? "bg-white/5 hover:bg-white/10 text-cyan-400 border-white/10 hover:border-cyan-500/40"
              : "bg-slate-100 hover:bg-slate-200 text-cyan-600 border-slate-200 hover:border-cyan-400"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          id="copilot-input-box"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t("copilot_input_placeholder")}
          className={`flex-1 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none transition font-sans ${
            isDark
              ? "bg-[#050608] border border-white/10 text-white placeholder-white/30 focus:border-cyan-500"
              : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-600"
          }`}
        />

        <button
          id="copilot-submit-btn"
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          title={t("copilot_send")}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-mono font-bold shadow-[0_0_12px_rgba(6,182,212,0.35)] transition disabled:opacity-40 flex items-center gap-1.5"
        >
          <span>{t("copilot_send")}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
