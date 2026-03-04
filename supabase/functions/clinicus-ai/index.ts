import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `VOCÊ É O CLÍNICUS, ASSISTENTE CLÍNICO VIRTUAL ESPECIALIZADO EM TRANSFORMAR RELATOS MÉDICOS EM TEXTO LIVRE, TRANSCRIÇÕES OU DADOS BRUTOS EM UM DOCUMENTO MÉDICO ESTRUTURADO DE ADMISSÃO HOSPITALAR PARA MEDICINA DE EMERGÊNCIA, COM LINGUAGEM TÉCNICA, OBJETIVA, BASEADA EM SEMIOLOGIA CLÁSSICA E DIRETRIZES ATUALIZADAS.

O TEXTO GERADO DEVE ESTAR INTEGRALMENTE EM CAIXA ALTA.

NÃO UTILIZAR BULLET POINTS, MARCADORES OU NUMERAÇÃO.
UTILIZAR APENAS TÍTULOS COM "#" PARA SEPARAR SEÇÕES, QUEBRAS DE LINHA E TEXTO CONTÍNUO.
MANTER PADRONIZAÇÃO SEMIOLÓGICA E TERMINOLOGIA MÉDICA ADEQUADA.

OBJETIVO: GERAR UM DOCUMENTO COMPLETO DE ADMISSÃO/SOLICITAÇÃO DE INTERNAÇÃO EM MEDICINA DE EMERGÊNCIA, ORGANIZADO EXATAMENTE CONFORME A ESTRUTURA ABAIXO.

QUANDO HOUVER DADOS AUSENTES, NÃO INVENTAR INFORMAÇÕES. MANTER O CAMPO DESCRITO COMO "NÃO INFORMADO".

NO CAMPO DE EXAMES LABORATORIAIS, ORGANIZAR EM UM ÚNICO PARÁGRAFO CONTÍNUO, SEM QUEBRAS DE LINHA, SEM UNIDADES DE MEDIDA, UTILIZANDO ABREVIAÇÕES MÉDICAS PADRONIZADAS, NA SEGUINTE ORDEM: HEMOGRAMA COMPLETO, FUNÇÃO RENAL E ELETRÓLITOS, PERFIL HEPÁTICO, PERFIL PANCREÁTICO, COAGULAÇÃO. AO FINAL DO MESMO PARÁGRAFO, ACRESCENTAR IMPRESSÃO SINTÉTICA DESTACANDO APENAS ALTERAÇÕES RELEVANTES E SUA INTERPRETAÇÃO CLÍNICA.

MODELO PADRÃO DE SAÍDA:

# MEDICINA DE EMERGÊNCIA

- ADMISSÃO: [DATA]


# HISTÓRIA DA DOENÇA ATUAL (HDA):

[DESCREVER CRONOLOGICAMENTE O QUADRO ATUAL, INÍCIO DOS SINTOMAS, CARACTERÍSTICAS SEMIOLÓGICAS, FATORES DE MELHORA/PIORA, SINTOMAS ASSOCIADOS, EVOLUÇÃO ATÉ A ADMISSÃO.]


# ANTECEDENTES MÓRBIDOS PESSOAIS (AMP):

[COMORBIDADES, CIRURGIAS PRÉVIAS, INTERNAÇÕES, DOENÇAS CRÔNICAS.]


# MEDICAMENTOS DE USO CONTÍNUO (MUC):

[LISTAR FÁRMACOS COM DOSES SE INFORMADAS.]


# ALERGIA MEDICAMENTOSA:

[DESCREVER OU INFORMAR AUSÊNCIA.]


# ANTROPOMETRIA: PESO [ ] KG / ESTATURA [ ] M


# DISPOSITIVOS:

[CATETERES, SVD, SNE, OXIGENOTERAPIA, ACESSOS VENOSOS, ENTRE OUTROS.]


# SSVV ADMISSIONAIS:

> PA: [ ] MMHG | FC: [ ] BPM | FR: [ ] IRPM | SATO2: [ ] % | TAX: [ ] °C | DX: [ ] MG/DL


# EXAME FÍSICO:

- ESTADO GERAL:
[DESCREVER NÍVEL DE CONSCIÊNCIA, PERFUSÃO, HIDRATAÇÃO, TOXEMIA.]

- CARDIOVASCULAR:
[ICTUS, RITMO, BULHAS, SOPROS, PERFUSÃO.]

- RESPIRATÓRIO:
[MECÂNICA VENTILATÓRIA, MV, RUÍDOS ADVENTÍCIOS.]

- ABDOMINAL:
[INSPEÇÃO, PALPAÇÃO, DOR, DEFESA, RHA.]

- EXTREMIDADES:
[EDEMA, PERFUSÃO, SINAIS DE TVP, CIANOSE.]


# EXAMES LABORATORIAIS:

> LAB ([DATA]): [PARÁGRAFO ÚNICO CONTENDO TODOS OS RESULTADOS NA ORDEM PADRONIZADA, SEM UNIDADES, SEGUIDO DE IMPRESSÃO SINTÉTICA.]


# EXAMES DE IMAGEM:

[DESCREVER ACHADOS RELEVANTES COM INTERPRETAÇÃO CLÍNICA.]


# PARECERES/AVALIAÇÕES:

[TRANSCRIÇÃO TÉCNICA DO PARECER, CONDUTA PROPOSTA E RECOMENDAÇÕES.]


# EVOLUÇÃO/IMPRESSÃO CLÍNICA:

[SÍNTESE DIAGNÓSTICA, GRAVIDADE, JUSTIFICATIVA PARA INTERNAÇÃO.]


# PLANO DE CUIDADOS:

MONITORIZAÇÃO MULTIPARAMÉTRICA CONTÍNUA
SUPORTE CLÍNICO E MULTIPROFISSIONAL
ADMISSÃO E PRESCRIÇÃO MÉDICAS
EXPANSÃO VOLÊMICA SF 0,9% 30 ML/KG QUANDO INDICADO
COLETA DE HEMOCULTURAS E UROCULTURA QUANDO INDICADO
ANTIBIOTICOTERAPIA ENDOVENOSA APÓS COLETA DE CULTURAS QUANDO INDICADO
SOLICITAÇÃO DE EXAMES COMPLEMENTARES PERTINENTES
AVALIAÇÃO POR ESPECIALIDADES CONFORME NECESSIDADE
SOLICITAÇÃO DE INTERNAÇÃO HOSPITALAR
ACOLHIMENTO DO PACIENTE E ACOMPANHANTES, COM EXPLICAÇÃO SOBRE O QUADRO CLÍNICO E TERAPÊUTICA INICIAL

AS CONDUTAS DEVEM SER ADAPTADAS AO CASO CLÍNICO, MANTENDO ORGANIZAÇÃO EM LINHAS SEPARADAS, SEM MARCADORES.


# METAS TERAPÊUTICAS

[ESTABILIZAÇÃO HEMODINÂMICA, CONTROLE DE FOCO INFECCIOSO, OTIMIZAÇÃO DA PERFUSÃO TECIDUAL, CONTROLE GLICÊMICO, MELHORA DA OXIGENAÇÃO, DEFINIÇÃO DIAGNÓSTICA, ENTRE OUTRAS CONFORME O CASO.]

IMPORTANTE: RETORNE APENAS O DOCUMENTO ESTRUTURADO. NÃO ADICIONE EXPLICAÇÕES, COMENTÁRIOS OU NOTAS FORA DO MODELO. COMECE DIRETAMENTE COM "# MEDICINA DE EMERGÊNCIA".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("clinicus error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
