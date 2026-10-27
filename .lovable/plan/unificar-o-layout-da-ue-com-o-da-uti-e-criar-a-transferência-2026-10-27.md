# Unificar o layout da UE com o da UTI e criar a transferência UE → UTI

## Objetivo
Os cartões de paciente da UE Adulto, da UE Pediátrica e da UTI passam a ter o mesmo formato. Assim, um paciente da emergência pode ir para um leito da UTI levando todos os dados, sem precisar digitar de novo.

## 1. Novo cartão da UE (Adulto e Pediátrica) no estilo da UTI

Linha de identificação (sempre visível), na ordem:

```text
[>] [LEITO] NOME DO PACIENTE   DN: DD/MM/AAAA  IDADE AUTOMÁTICA   [TPS 3h 25min] [ADM emergência: 27/10 14:05] [PSM: AGUARDANDO]   [editar] [⋮] [v]
```

- **Leito + nome:** iguais à UTI. A pílula do médico responsável (LDR, PRT, CIRG…) continua embaixo do leito.
- **DN + idade automática:** mesma regra de hoje. Na Pediátrica a idade aparece em dias e meses.
- **TPS (no lugar do DIH):** tempo desde a entrada na emergência, em minutos e horas (ex.: "45min", "3h 25min", "1d 4h"). Atualiza a cada minuto e **não recomeça** quando o paciente troca de ala. As cores de alerta seguem as faixas que já existem hoje.
- **ADM na emergência (no lugar de "Admissão UTI"):** data e hora de entrada na emergência. Pode ser editada.
- **Status do PSM (no lugar de "Previsão de alta"):** pílula clicável com o ciclo de 4 estados que já existe, incluindo o reconhecimento de AGUARDANDO PSM, EM AUDITORIA etc.

Botão [>] para expandir ou retrair (igual à UTI), com 5 colunas:

```text
Hipóteses/Diagnósticos | Antecedentes/Comorbidades | Exames | Plano Terapêutico | Programações/Pendências
```

- Funcionam como na UTI: adicionar com Enter, Tab para a próxima coluna, destaque com estrela, arrastar para reordenar.
- **Plano Terapêutico é novo na UE.** Ele usa o mesmo campo da UTI, por isso passa direto na transferência.

Área expandida (seta [v]): História admissional e dados administrativos (prontuário, atendimento, convênio).

O menu de ações (⋮) continua com as opções de hoje: Realocação entre alas, Movimentações, Emitir Relatório etc.

## 2. Cartão da UTI: nova coluna Exames

```text
Hipóteses | Antecedentes | EXAMES | Plano Terapêutico | Pendências
```

- Exames sai da área expandida "Clínico" e vira coluna. A área expandida fica só com Especialidades.
- O Tab passa a seguir as 5 colunas na ordem acima.

## 3. Transferência UE → UTI com dados

No menu ⋮ → Movimentações → **"Transferir para UTI"** (só médico ou admin):

1. Escolher UTI 1 ou UTI 2. Aparecem os leitos vagos (U01 a U10) daquela UTI.
2. Escolher o leito e confirmar, com um resumo do que vai ser levado.
3. O que acontece:
   - **O leito da UTI recebe:** nome, DN, idade, hipóteses, antecedentes, exames, plano terapêutico, pendências (com os destaques), história admissional e dados administrativos.
   - **É preenchido automaticamente:** Admissão UTI = hoje (o DIH começa em 0) e Setor de origem = "UE ADULTO – SALA VERMELHA" (ou a ala de onde veio).
   - **O leito da UE fica vago e limpo:** os leitos fixos continuam existindo.
   - **Movimentações:** fica registrada uma TRANSFERÊNCIA com destino "UTI 1 – U03", guardando o retrato clínico do paciente, como já acontece na alta e no óbito.
4. **Bloqueios:** a transferência não acontece com protocolo ativo (sepse etc.) nem quando não há leito vago. Nesse caso aparece um aviso dizendo que não há leito disponível.

Nesta etapa a transferência sai só da UE Adulto. A UE Pediátrica ganha o novo layout, mas não transfere para esta UTI.

## Fora do escopo
- Cores, tamanhos de fonte e a identidade de cada setor continuam como estão.
- Impressão e PDF do mapa da UE: ajustados depois, numa etapa separada.
- Transferência UTI → UE (volta).

## Detalhes técnicos
- Não há mudança no banco para o layout: o Plano Terapêutico da UE usa a coluna `uti_daily_conducts`, e o TPS usa `admission_date`.
- A transferência roda numa única função do banco (security definer, que confere se o usuário é médico ou admin). Ela faz três coisas de uma vez: copia para o leito da UTI com `releaseBedForFilling`, deixa o leito da UE vago com `vacantPatientSlotPayload` e cria o registro em `patient_movements`. Assim, se uma parte falhar, nada fica pela metade.
- O cartão novo da UE é um componente próprio, baseado nas peças da UTI (colunas editáveis, campos inline). Por isso as colunas passam para um módulo compartilhado entre os dois cartões. O `PatientCard.tsx` atual é mantido até a troca ser validada.
- O TPS reaproveita `useSectorStayTimer` (minutos, horas e dias).
- Testes: TPS (formato em minutos e horas), dados levados na transferência e leito da UE vago depois dela.
