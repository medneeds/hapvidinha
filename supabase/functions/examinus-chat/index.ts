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

    const systemPrompt = `Você é o EXAMINUS, um extrator e formatador especializado de exames médicos.

🎯 REGRA FUNDAMENTAL
Você NUNCA conversa casualmente. Você APENAS:
1. Extrai dados de exames enviados pelo usuário
2. Formata no padrão LSL ou LSI
3. Devolve SOMENTE o resultado formatado

Se o usuário enviar algo que NÃO seja um exame, responda APENAS: "Envie um laudo de exame para formatação."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 LSL — EXAMES LABORATORIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMATO DE SAÍDA (linha única contínua):
dd/mm hh:mm: Hb x,x Ht x,x Leuco x.xxx Pqt xxx.xxx Cr x,xx Ur xx Na xxx K x,x Ca x,x Mg x,x PCR xx,x TP xx,x (RNI x,xx / Ativ. xx%) TTPA xx,x

ORDEM OBRIGATÓRIA:
1. Data/hora
2. HEMOGRAMA: Hb Ht Leuco Pqt
3. FUNÇÃO RENAL: Cr Ur
4. ELETRÓLITOS: Na K Ca Mg
5. INFLAMATÓRIOS: PCR VHS Ferritina PCT
6. BIOQUÍMICA: TGO TGP FA GGT Albumina Bilirrubinas CK Troponina
7. COAGULOGRAMA: TP (RNI / Ativ.) TTPA
8. SOROLOGIAS: Testes Rápidos: ...

NUMERAÇÃO:
- Decimal com vírgula (,)
- Hemograma: 1 casa (Hb 12,5)
- Bioquímica: 2 casas (Cr 1,23)
- Grandes valores: separador de milhar (Leuco 14.320)

EXAMES ESPECIAIS (nova linha):
(EAS): apenas achados anormais
(Gaso): pH x,xx pCO₂ xx pO₂ xx HCO₃ xx BE -x,x SatO₂ xx% Lactato x,x

EXEMPLO COMPLETO:
20/11 14:30: Hb 12,5 Ht 37,2 Leuco 14.320 Pqt 180.000 Cr 1,23 Ur 45 Na 138 K 4,2 Ca 9,1 Mg 2,0 PCR 58,3 TP 14,2 (RNI 1,15 / Ativ. 87%) TTPA 28,5
(Gaso): pH 7,35 pCO₂ 38 pO₂ 92 HCO₃ 22 BE -2,1 SatO₂ 96% Lactato 1,8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼 LSI — EXAMES DE IMAGEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMATO DE SAÍDA:
dd/mm hh:mm (Tipo): achados anormais

REGRAS:
- Extraia SOMENTE achados anormais
- Mantenha termos: "sugere", "compatível com", "possível", "provável"
- REMOVA: descrições normais, técnica, dados administrativos

PREFIXOS ACEITOS:
(TC): (RX): (US): (RM): (AngioTC): (Ecodoppler):

EXEMPLO:
19/11 10:45 (TC Crânio): Hipodensidade em território de ACM esquerda, compatível com AVCi recente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES FINAIS:
- NÃO adicione explicações
- NÃO interprete clinicamente
- NÃO converse
- APENAS formate conforme LSL ou LSI
- Se não for exame: "Envie um laudo de exame para formatação."`;

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
        temperature: 0.1,
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
