# Examinus IA — Sugestão e Análise de Exames

Nova aba de inteligência artificial dentro do Examinus (diálogo aberto pelo ícone de tendência no card do paciente), voltada a apoiar a decisão sobre exames complementares.

## O que o médico poderá fazer

Um campo único de comando, com 4 modos rápidos:

1. **Sugerir exames** — comando curto ("marcadores cancerígenos", "painel de tireoide") e a IA devolve a lista de exames com descrição do que cada um avalia.
2. **Caso clínico → exames** — cola-se ou usa-se o caso do paciente; a IA separa exames **obrigatórios**, **recomendados** e **complementares**, com justificativa curta.
3. **Contraindicações** — informa-se um exame ou procedimento; a IA retorna contraindicações absolutas/relativas, cuidados de preparo e alertas (função renal, gestação, alergia a contraste, marca-passo etc.).
4. **Entender exame/procedimento** — explicação objetiva do exame: o que é, indicação, preparo, tempo, riscos e interpretação básica.

## Contexto automático do paciente

Ao abrir pelo card, a consulta já leva idade, sexo, setor, diagnósticos/hipóteses, antecedentes e exames já lançados. O **nome do paciente não é enviado** ao modelo (LGPD) — o restante do quadro clínico vai automaticamente e fica visível na tela antes do envio, com opção de desligar o contexto em um clique.

## O que fazer com a resposta

- **Copiar** o texto.
- **Inserir nos exames do paciente**: cada exame sugerido vem com uma caixa de seleção; os marcados entram direto na lista de exames do card (em MAIÚSCULAS, conforme o padrão do sistema).
- **Exportar PDF** no layout de impressão do HapMap (tema claro, margens padrão, cabeçalho institucional).
- **Histórico**: cada consulta fica salva por paciente/unidade, com data e autor, consultável na própria aba.

## Aviso clínico

Rodapé fixo e no PDF: conteúdo de apoio à decisão, não substitui o julgamento médico. Somente médicos e administradores veem a aba.

## Detalhes técnicos

- **Backend**: nova edge function `examinus-ai` (a entrada `examinus-chat` do config está órfã e será substituída). Usa AI SDK + Lovable AI Gateway com modelo Gemini, resposta **em streaming** para o texto aparecer progressivamente. Valida JWT em código, exige papel `medico`/`admin`, valida entrada com Zod e trata 429/402 com mensagem clara na interface.
- **Prompt**: system prompt clínico em português, orientado a medicina de emergência/hospitalar, com formato de saída padronizado por modo (lista de exames com nome, sigla e justificativa) para permitir a seleção e inserção no card.
- **Banco**: nova tabela `examinus_ai_queries` (unidade, departamento, paciente opcional, modo, comando, resposta, autor, data) com GRANTs e RLS — leitura para equipe clínica da mesma unidade, escrita pelo próprio autor, sem exclusão.
- **Front**: `ExamCurvesDialog` passa a ter abas (`Curvas` / `IA`); novo componente `ExaminusAiPanel.tsx` com o composer, modos, streaming, seleção de exames e histórico; novo `PrintExaminusAiDialog.tsx` reaproveitando os padrões de impressão existentes.
- **Flag**: adiciona-se `EXAMINUS_AI_ASSIST_ENABLED: true` mantendo `EXAMINUS_AI_ENABLED` (curvas) desligada; o ícone no card passa a aparecer quando qualquer uma das duas estiver ativa, abrindo direto na aba IA.
