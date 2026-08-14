import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { streamText } from "npm:ai@5";
import { z } from "npm:zod@3";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const MODEL = "google/gemini-2.5-flash";

const BodySchema = z.object({
  mode: z.enum(["sugerir", "caso", "contraindicacoes", "entender"]),
  prompt: z.string().min(2).max(6000),
  clinicalContext: z.string().max(8000).nullable().optional(),
  patientId: z.string().uuid().nullable().optional(),
  patientBed: z.string().max(20).nullable().optional(),
  hospitalUnitId: z.string().uuid().nullable().optional(),
  department: z.string().max(120).nullable().optional(),
});

const MODE_INSTRUCTIONS: Record<string, string> = {
  sugerir: `MODO: SUGESTÃO DE EXAMES.
O usuário informa um tema curto (ex.: "marcadores cancerígenos", "painel de tireoide").
Liste os exames pertinentes ao tema. Para cada exame use exatamente o formato:
- EXAME: <NOME DO EXAME EM MAIÚSCULAS> (<SIGLA, se houver>) — <o que avalia, em 1 linha objetiva>
Ao final, um bloco curto "OBSERVAÇÕES" com ressalvas de indicação/rastreio quando aplicável.`,

  caso: `MODO: CASO CLÍNICO → EXAMES COMPLEMENTARES.
Analise o caso clínico e organize a resposta em três blocos, nesta ordem:
"OBRIGATÓRIOS", "RECOMENDADOS", "COMPLEMENTARES".
Em cada bloco, use exatamente o formato:
- EXAME: <NOME DO EXAME EM MAIÚSCULAS> (<SIGLA, se houver>) — <justificativa clínica em 1 linha>
Feche com "RACIOCÍNIO CLÍNICO" em até 4 linhas (principais hipóteses e o que os exames descartam/confirmam).`,

  contraindicacoes: `MODO: CONTRAINDICAÇÕES.
O usuário informa um exame ou procedimento. Responda em blocos:
"CONTRAINDICAÇÕES ABSOLUTAS", "CONTRAINDICAÇÕES RELATIVAS", "PREPARO E CUIDADOS", "ALERTAS"
(função renal, gestação/lactação, alergia a contraste, marca-passo/implantes metálicos, anticoagulação, claustrofobia, jejum, sedação).
Use itens curtos com hífen. Considere o contexto clínico do paciente quando fornecido.`,

  entender: `MODO: ENTENDER EXAME/PROCEDIMENTO.
Explique de forma objetiva, em blocos:
"O QUE É", "INDICAÇÕES", "PREPARO", "COMO É REALIZADO E DURAÇÃO", "RISCOS", "INTERPRETAÇÃO BÁSICA"
(valores de referência habituais e o que altera para mais/menos, quando aplicável).`,
};

const SYSTEM_PROMPT = `Você é o EXAMINUS IA, assistente clínico de apoio à decisão sobre exames complementares e procedimentos, integrado ao HapMap, usado por médicos em ambiente hospitalar de urgência/emergência e terapia intensiva no Brasil.

REGRAS:
- Responda SEMPRE em português do Brasil, texto direto, sem introduções nem despedidas.
- Seja objetivo, técnico e prático para uso à beira do leito. Nada de floreios.
- Nomes de exames SEMPRE em MAIÚSCULAS.
- Use apenas texto simples com títulos em MAIÚSCULAS e itens iniciados por "- ". NÃO use markdown (nada de #, *, **, tabelas).
- Baseie-se em diretrizes e prática consolidada; quando houver controvérsia, sinalize brevemente.
- Nunca invente dados do paciente. Se faltar informação essencial, diga o que falta em uma linha.
- Você apoia a decisão, nunca a substitui. Não prescreva condutas definitivas.
- Nunca cite o nome do paciente (ele não é enviado a você).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ error: "Método não permitido" }, 405);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Serviço de IA não configurado." }, 500);

    // --- Autenticação (verify_jwt = false: validamos em código) ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }
    const user = userData.user;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = roleRow?.role as string | undefined;
    if (role !== "medico" && role !== "admin") {
      return json({ error: "Acesso restrito a médicos e administradores." }, 403);
    }

    // --- Validação de entrada ---
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;

    const contextBlock = body.clinicalContext?.trim()
      ? `\n\nCONTEXTO CLÍNICO DO PACIENTE (sem identificação):\n${body.clinicalContext.trim()}`
      : "";

    const gateway = createLovableAiGatewayProvider(apiKey);

    const result = streamText({
      model: gateway(MODEL),
      system: `${SYSTEM_PROMPT}\n\n${MODE_INSTRUCTIONS[body.mode]}`,
      prompt: `SOLICITAÇÃO DO MÉDICO:\n${body.prompt.trim()}${contextBlock}`,
      temperature: 0.2,
      onError: ({ error }) => console.error("examinus-ai stream error", error),
      onFinish: async ({ text }) => {
        try {
          if (!text?.trim()) return;
          await supabase.from("examinus_ai_queries").insert({
            hospital_unit_id: body.hospitalUnitId ?? null,
            department: body.department ?? null,
            patient_id: body.patientId ?? null,
            patient_bed: body.patientBed ?? null,
            mode: body.mode,
            prompt: body.prompt,
            clinical_context: body.clinicalContext ?? null,
            response: text,
            created_by: user.id,
            created_by_name:
              (user.user_metadata?.full_name as string | undefined) ?? null,
          });
        } catch (e) {
          console.error("Falha ao salvar histórico examinus-ai", e);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("examinus-ai error", message);

    if (/429|rate limit/i.test(message)) {
      return json(
        { error: "Muitas solicitações à IA agora. Aguarde alguns segundos e tente novamente." },
        429,
      );
    }
    if (/402|credit/i.test(message)) {
      return json(
        { error: "Créditos de IA esgotados. Recarregue para continuar usando o Examinus IA." },
        402,
      );
    }
    return json({ error: "Não foi possível consultar a IA. Tente novamente." }, 500);
  }
});
