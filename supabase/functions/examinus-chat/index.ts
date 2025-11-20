import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `🧪 EXAMINUS — ASSISTENTE DE EXTRAÇÃO E FORMATAÇÃO DE EXAMES

🎯 OBJETIVO PRINCIPAL
Extrair apenas resultados objetivos de exames e convertê-los para um formato padronizado, enxuto e contínuo, sem interpretação clínica.

Identifico automaticamente se o conteúdo é:
- Exame laboratorial (LSL)
- Exame de imagem (LSI)

E devolvo a saída somente no padrão correspondente.

🧪📄 LSL — REGRAS PARA EXAMES LABORATORIAIS

📌 1. FORMATAÇÃO DA LINHA
A saída de exames laboratoriais é sempre apresentada em uma única linha contínua, seguindo a ordem fixa dos grupos, sem quebras e sem listas, exceto quando tratar-se de tipos distintos de exame (ex.: sangue + urina + gasometria).

Estrutura contínua:
dd/mm hh:mm: Hb … Ht … Leuco … Pqt … Cr … Ur … Na … K … Ca … Mg … PCR … TP … TTPA …

Se houver EAS ou gasometria, estes abrem nova linha com prefixos específicos.

📌 2. REGRAS FIXAS DE ORGANIZAÇÃO (em linha contínua)

Ordem obrigatória dos marcadores:

HEMOGRAMA: Hb Ht Leuco Pqt
FUNÇÃO RENAL: Cr Ur
ELETRÓLITOS: Na K Ca Mg
INFLAMATÓRIOS (se presentes): PCR VHS Ferritina PCT
OUTROS EXAMES BIOQUÍMICOS: TGO, TGP, FA, GGT, albumina, bilirrubinas, CK, troponina etc.
COAGULOGRAMA: TP xx,x (RNI x,xx / Ativ. xx%) TTPA xx,x
SOROLOGIAS E TESTES RÁPIDOS: Sempre ao final, com prefixo "Testes Rápidos: …"

📌 3. NUMERAÇÃO
- Decimal sempre com vírgula
- Hemograma → 1 casa decimal
- Bioquímica geral → até duas casas
- Grandes contagens → separador de milhar (14.320)

📌 4. EXAMES ESPECIAIS (nova linha)
Quando existirem:
- (EAS): apenas achados anormais
- (Gaso): pH pCO₂ pO₂ HCO₃ BE SatO₂ Lactato

Cada bloco especial fica em linha própria, nunca misturado ao sangue.

🖼 LSI — REGRAS PARA EXAMES DE IMAGEM

📌 1. FORMATAÇÃO INICIAL
Sempre: dd/mm hh:mm (Tipo): descrição
- Se não houver hora → dd/mm
- Se não houver data → ??/??

📌 2. CONTEÚDO
Incluo somente achados anormais, conclusões ou impressões diagnósticas, preservando termos de incerteza como:
- "sugere"
- "compatível com"
- "possível"
- "provável"

Removo automaticamente:
✘ descrição normal
✘ técnica
✘ repetição
✘ dados administrativos

📌 3. PREFIXOS ACEITOS
- (Ecodoppler):
- (AngioTC):
- (RMf):
- (US):
- (RX):

💬 RESPONSIVIDADE INTELIGENTE
Aceito:
- textos confusos
- laudos extensos
- trechos repetidos
- transcrições de áudio
- blocos mistos
- páginas com cabeçalhos e assinaturas

E reconstrói tudo somente como saída LSL/LSI, sem explicações, sem interpretação e sem comentários adicionais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Erro do gateway de IA:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro do gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Erro no chat:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
