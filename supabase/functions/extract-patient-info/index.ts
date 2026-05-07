// Edge function: extract structured patient info from pasted Samweb text
// Uses Lovable AI Gateway (gemini-3-flash-preview) with tool calling.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Texto inválido ou muito curto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY não configurada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const tools = [
      {
        type: 'function',
        function: {
          name: 'extract_patient_info',
          description:
            'Extrai dados administrativos do paciente a partir de texto colado de outro sistema (Samweb).',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nome completo do paciente em maiúsculas' },
              age: { type: 'string', description: 'Idade formatada (ex: "51 ANOS E 8 MESES")' },
              birthDate: { type: 'string', description: 'Data de nascimento DD/MM/YYYY' },
              cpf: { type: 'string', description: 'Apenas dígitos do CPF' },
              motherName: { type: 'string', description: 'Nome completo da mãe em maiúsculas' },
              insuranceCompany: { type: 'string', description: 'Nome do convênio' },
              insurancePlan: { type: 'string', description: 'Plano do convênio' },
              insurancePlanType: { type: 'string', description: 'Tipo do plano (ex: Ambulatorial/Hospitalar + Enfermaria)' },
              insuranceCardNumber: { type: 'string', description: 'Número da carteira do convênio' },
              insuranceDuration: { type: 'string', description: 'Tempo de plano (ex: "5 Anos 5 Meses")' },
              medicalRecordNumber: { type: 'string', description: 'Número do prontuário (apenas dígitos)' },
              attendanceNumber: { type: 'string', description: 'Código/número do atendimento (apenas dígitos)' },
            },
            additionalProperties: false,
          },
        },
      },
    ];

    const body = {
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content:
            'Você extrai dados de pacientes a partir de texto colado do sistema hospitalar Samweb. Retorne SOMENTE os campos identificáveis com confiança no texto. Omita campos ausentes. Para nomes, retorne em MAIÚSCULAS. Para CPF, prontuário e atendimento, retorne apenas dígitos.',
        },
        { role: 'user', content: text },
      ],
      tools,
      tool_choice: { type: 'function', function: { name: 'extract_patient_info' } },
    };

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos ao workspace Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const t = await resp.text();
      console.error('AI gateway error:', resp.status, t);
      return new Response(JSON.stringify({ error: 'Falha na IA.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let extracted: Record<string, string> = {};
    if (args) {
      try {
        extracted = JSON.parse(args);
      } catch (e) {
        console.error('Erro parseando JSON da IA:', e, args);
      }
    }

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('extract-patient-info error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
