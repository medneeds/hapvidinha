import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/app-client";

export type ExaminusMode = "sugerir" | "caso" | "contraindicacoes" | "entender";

export interface ExaminusHistoryEntry {
  id: string;
  mode: string;
  prompt: string;
  response: string;
  created_at: string;
  created_by_name: string | null;
  patient_bed: string | null;
}

interface AskParams {
  mode: ExaminusMode;
  prompt: string;
  clinicalContext?: string | null;
  patientId?: string | null;
  patientBed?: string | null;
  hospitalUnitId?: string | null;
  department?: string | null;
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/examinus-ai`;

export function useExaminusAi(patientId?: string | null) {
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExaminusHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      let query = supabase
        .from("examinus_ai_queries")
        .select("id, mode, prompt, response, created_at, created_by_name, patient_bed")
        .order("created_at", { ascending: false })
        .limit(25);

      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error: qError } = await query;
      if (qError) throw qError;
      setHistory((data as ExaminusHistoryEntry[]) || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [patientId]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const ask = useCallback(async (params: AskParams) => {
    setError(null);
    setAnswer("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const response = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          mode: params.mode,
          prompt: params.prompt,
          clinicalContext: params.clinicalContext ?? null,
          patientId: params.patientId ?? null,
          patientBed: params.patientBed ?? null,
          hospitalUnitId: params.hospitalUnitId ?? null,
          department: params.department ?? null,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = "Não foi possível consultar a IA. Tente novamente.";
        if (response.status === 429) {
          message = "Muitas solicitações agora. Aguarde alguns segundos e tente novamente.";
        } else if (response.status === 402) {
          message = "Créditos de IA esgotados. Recarregue para continuar usando o Examinus IA.";
        } else {
          try {
            const payload = await response.json();
            if (typeof payload?.error === "string") message = payload.error;
          } catch {
            /* mantém mensagem padrão */
          }
        }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAnswer(acc);
      }

      setIsStreaming(false);
      abortRef.current = null;
      void loadHistory();
      return acc;
    } catch (e) {
      abortRef.current = null;
      setIsStreaming(false);
      if (e instanceof DOMException && e.name === "AbortError") return "";
      setError(e instanceof Error ? e.message : "Erro inesperado ao consultar a IA.");
      return "";
    }
  }, [loadHistory]);

  const reset = useCallback(() => {
    setAnswer("");
    setError(null);
  }, []);

  return { answer, setAnswer, isStreaming, error, ask, stop, reset, history, loadHistory, loadingHistory };
}

/** Extrai os exames sugeridos das linhas no formato "- EXAME: NOME (SIGLA) — descrição". */
export function extractSuggestedExams(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(/^[-•*]?\s*EXAME:\s*(.+)$/i);
    if (!match) continue;

    const namePart = match[1].split(/—|–| - /)[0].trim().replace(/[.;]+$/, "");
    const normalized = namePart.toUpperCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push(normalized);
    }
  }

  return results;
}
