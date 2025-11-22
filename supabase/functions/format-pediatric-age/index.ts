import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: "Input is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Você é um assistente especializado em formatar idades pediátricas seguindo padrões clínicos hospitalares brasileiros.

TABELA DE FORMATAÇÃO:
- 0-28 dias: "DOL X" (dias de vida)
- 29 dias - 3 meses: "X SEMANA(S) + Y DIA(S)"
- 3-12 meses: "X MES(ES) E Y DIA(S)"
- 12-24 meses: "X MESES" (total de meses)
- 2-12 anos: "X ANO(S) E Y MES(ES)"
- ≥12 anos: "X ANOS"

REGRAS:
1. Se receber data de nascimento (DD/MM/YYYY ou YYYY-MM-DD), calcule a idade exata a partir de hoje
2. Se receber idade em texto livre, interprete e converta para o formato correto
3. Use MAIÚSCULAS no formato final
4. Use plural apropriado: ANO/ANOS, MES/MESES, DIA/DIAS, SEMANA/SEMANAS
5. Seja preciso nos cálculos de idade

Data de hoje: ${new Date().toISOString().split('T')[0]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Formate a seguinte entrada de idade pediátrica: "${input}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "format_pediatric_age",
              description: "Retorna a idade formatada seguindo padrões clínicos pediátricos",
              parameters: {
                type: "object",
                properties: {
                  formatted_age: {
                    type: "string",
                    description: "Idade formatada em MAIÚSCULAS seguindo padrões clínicos (ex: 'DOL 14', '2 ANOS E 3 MESES', '5 MESES E 18 DIAS')"
                  },
                  age_category: {
                    type: "string",
                    enum: ["neonatal", "weeks", "months", "months_only", "years_months", "years_only"],
                    description: "Categoria da idade para validação"
                  },
                  explanation: {
                    type: "string",
                    description: "Breve explicação do cálculo/conversão realizado"
                  }
                },
                required: ["formatted_age", "age_category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "format_pediatric_age" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione fundos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        formatted_age: result.formatted_age,
        age_category: result.age_category,
        explanation: result.explanation
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in format-pediatric-age:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
