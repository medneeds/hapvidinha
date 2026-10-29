// Reconhece Nome, Data de Nascimento, Prontuário e Atendimento a partir de texto colado
// ou de um print (imagem) do sistema hospitalar, usando Lovable AI.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@4";
import { NoObjectGeneratedError, Output, streamText } from "npm:ai@7";
import { z } from "npm:zod@4";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "../_shared/run-id.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const MAX_TEXT = 20_000;
const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB em base64

const BodySchema = z.object({
  text: z.string().max(MAX_TEXT).optional().nullable(),
  image: z
    .string()
    .max(MAX_IMAGE_CHARS)
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/i, "Imagem inválida")
    .optional()
    .nullable(),
});

const ResultSchema = z.object({
  patientName: z.string().nullable(),
  birthDate: z.string().nullable(),
  medicalRecordNumber: z.string().nullable(),
  attendanceNumber: z.string().nullable(),
});

const INSTRUCTIONS = `Você extrai dados administrativos de pacientes de textos ou prints de sistemas hospitalares brasileiros (ex.: Samweb, Siga, MV, Tasy).
Retorne SOMENTE:
- patientName: nome completo do PACIENTE (rótulos comuns: "Paciente", "Nome", "Nome do Paciente", "Beneficiário"). Nunca use o nome da mãe, do pai, do responsável, do acompanhante ou do médico. Sem rótulos, sem números.
- birthDate: data de nascimento do paciente (rótulos comuns: "Data de Nascimento", "Dt. Nasc.", "DN", "Nascimento"). Formato DD/MM/AAAA.
- medicalRecordNumber: número do prontuário (rótulos comuns: "Prontuário", "Pront.", "Nº Prontuário", "Registro", "Cód. Paciente").
- attendanceNumber: número do atendimento (rótulos comuns: "Atendimento", "Atend.", "Nº Atendimento", "Senha de atendimento", "Conta", "Guia de atendimento").
Regras: copie os números exatamente como aparecem, sem rótulos. Não confunda data de admissão/internação/atendimento com data de nascimento. Não invente: se um dado não estiver claramente presente, retorne null.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  let m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) {
      const yy = Number(y);
      const current = new Date().getFullYear() % 100;
      y = String(yy > current ? 1900 + yy : 2000 + yy);
    }
    const day = Number(d), month = Number(mo), year = Number(y);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) return null;
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  }
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return normalizeDate(`${m[3]}/${m[2]}/${m[1]}`);
  return null;
}

function cleanName(value: string | null): string | null {
  if (!value) return null;
  const v = value
    .replace(/^(nome( do paciente)?|paciente|benefici[aá]rio)\s*[:#-]?\s*/i, "")
    .replace(/[^\p{L}\s'.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (v.length < 3 || v.length > 120) return null;
  return v.toUpperCase();
}

function cleanId(value: string | null): string | null {
  if (!value) return null;
  const v = value.replace(/^(pront[uú]?[aá]?rio|pront\.?|atendimento|atend\.?|n[ºo°]\.?)\s*[:#-]?\s*/i, "").trim();
  if (!v || v.length > 40) return null;
  return v.toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // Autenticação: somente usuários logados.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsError || !claims?.claims?.sub) return json({ error: "Não autorizado" }, 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Corpo inválido" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
  const text = parsed.data.text?.trim() || "";
  const image = parsed.data.image || "";
  if (!text && !image) return json({ error: "Cole um texto ou uma imagem." }, 400);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "IA não configurada" }, 500);

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [];
  content.push({ type: "text", text: text ? `Texto colado:\n${text}` : "Extraia os dados do print abaixo." });
  if (image) content.push({ type: "image", image: new URL(image) });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions: INSTRUCTIONS,
      messages: [{ role: "user", content }],
      output: Output.object({ schema: ResultSchema }),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    let output: z.infer<typeof ResultSchema> | null = null;
    try {
      output = (await result.output) as z.infer<typeof ResultSchema>;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err) && err.text) {
        try {
          output = ResultSchema.parse(JSON.parse(err.text));
        } catch {
          output = null;
        }
      } else {
        throw err;
      }
    }

    if (!output) return json({ error: "Não foi possível reconhecer os dados." }, 422);

    return json({
      patientName: cleanName(output.patientName),
      birthDate: normalizeDate(output.birthDate),
      medicalRecordNumber: cleanId(output.medicalRecordNumber),
      attendanceNumber: cleanId(output.attendanceNumber),
    });
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 429) return json({ error: "Muitas solicitações. Aguarde alguns segundos e tente novamente." }, 429);
    if (status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos em Configurações → Planos e créditos." }, 402);
    if (status === 403) return json({ error: "A IA está bloqueada para este espaço de trabalho." }, 403);
    if ((err as Error)?.name === "AbortError") return json({ error: "Cancelado" }, 499);
    console.error("extract-patient-admin-data error", (err as Error)?.message);
    return json({ error: "Falha ao reconhecer os dados. Tente novamente." }, 500);
  }
});
