## Análise da planilha Hospital Guarás

A planilha rastreia o ciclo SOLICITAÇÃO → LIBERAÇÃO → TRANSFERÊNCIA de leitos com estes marcadores:

**Bloco SOLICITAÇÃO** (origem/pedido)
- Nº sequencial · Data · Hora da solicitação
- Setor solicitante (POSTO 1, EMERG ADT, EMERG PED, C.C, UTI 1/2)
- Nome do solicitante (médico que pede)
- Nome do paciente · Diagnóstico · Isolamento (SIM/NÃO)

**Bloco LIBERAÇÃO HOTELARIA** (quando o leito é liberado para limpeza/preparo)
- Hora "o que" foi solicitado para hotelaria
- Hora da liberação da hotelaria
- Tempo de liberação da hotelaria (delta)
- Saveal/responsável pela liberação da hotelaria

**Bloco DESTINO**
- Unidade · Acomodação (ENFERM, APT, UTI 1/2, UTI PED) · Leito · Nº
- Responsável pela liberação do leito
- Hora da liberação do leito pela central
- Hora da transferência do paciente
- Tempo médio de transferência · Tempo final · Motivo do não cumprimento

Cores: vermelho = pendente/atrasado, verde = dentro do prazo, amarelo = em andamento.

## Entrega

### 1. Sincronização com `bed_allocation_requests`
Adicionar colunas faltantes para espelhar a planilha:
- `requesting_sector`, `diagnosis`, `is_isolation`
- `hotelaria_requested_at`, `hotelaria_released_at`, `hotelaria_released_by`
- `bed_released_at`, `bed_released_by`, `accommodation_type` (ENFERM/APT/UTI)
- `transfer_started_at`, `transfer_completed_at`, `non_compliance_reason`

Triggers automáticos calculam deltas (tempo hotelaria, tempo transferência) no front.

### 2. Nova página `/leitos/painel-solicitacoes` (Painel Guarás)
Dashboard inspirado na planilha mas redesenhado:

```text
┌─ KPIs do dia ────────────────────────────────────────┐
│ Total: 22  Pendentes: 5  Liberados: 12  No prazo:18 │
│ Tempo médio hotelaria: 0:34  Tempo médio transf:1:09│
└──────────────────────────────────────────────────────┘
┌─ Filtros: Setor | Acomodação | Status | Data ───────┐

┌─ Tabela cronológica (cards expansíveis) ────────────┐
│ #1  POSTO 1 → UTI 2  |  EDINETE  |  NEUROCIRURGIA  │
│ Solicit 17:46 → Hotel 18:09 (0:23) → Leito 18:14   │
│ Status: ✓ Concluído em 0:28  [Responsável: ERICA]  │
└──────────────────────────────────────────────────────┘
```

Visual: cards com timeline horizontal colorida (verde/amarelo/vermelho) por SLA, badges de isolamento, agrupamento por setor solicitante.

### 3. Exportação
- **PDF** (paisagem A4, light theme, margens padrão do projeto): replica layout da planilha com zebra, cores SLA, cabeçalho HAPVIDA + unidade + período.
- **Excel** (.xlsx via SheetJS já no projeto ou novo): mesmas colunas da planilha original, fórmulas para deltas de tempo, formatação condicional verde/vermelho.

Botões "Exportar PDF" e "Exportar Excel" no topo do painel.

### 4. Sincronização bidirecional
- Quando alguém cria uma `bed_allocation_request` via "Solicitar Leito" no PatientCard, ela aparece automaticamente no painel.
- Quando o leito em `managed_beds` muda para `available` (limpeza concluída), o painel registra `hotelaria_released_at`.
- Quando o paciente é alocado (PatientMovement de transferência), registra `transfer_completed_at`.

### 5. Acompanhamento de condução
Aba secundária no mesmo painel: lista `bed_requests` (transportes/conduções internas) com a mesma timeline visual — Solicitado → Aceito → Iniciado → Concluído, mostrando responsável e SLA por estágio (usa `bed_sla_configs` existente).

### 6. Otimizações sugeridas (já implementadas)
- Auto-cálculo dos deltas (não digitar manualmente)
- Cores SLA configuráveis por setor
- Notificação realtime quando solicitação fica vermelha (>SLA)
- Filtro "minhas solicitações" para o solicitante
- Histórico exportável por período (dia/semana/mês)
- Agrupamento por acomodação para visão de ocupação

## Detalhes técnicos

- Migração: `ALTER TABLE bed_allocation_requests ADD COLUMN ...` (campos acima)
- Nova rota em `App.tsx` + item na sidebar dentro de "Gerenciamento de Leitos"
- Componentes novos:
  - `src/pages/BedRequestsPanelPage.tsx`
  - `src/components/bed-panel/RequestTimelineCard.tsx`
  - `src/components/bed-panel/BedPanelKPIs.tsx`
  - `src/components/bed-panel/BedPanelFilters.tsx`
  - `src/utils/bedPanelExport.ts` (PDF via jsPDF + autoTable, Excel via xlsx)
- Hook `useBedRequestsPanel` agregando solicitações + managed_beds + movements via realtime.
- Bibliotecas: `jspdf`, `jspdf-autotable`, `xlsx` (adicionar se ausentes).
- Tudo em UPPERCASE conforme regra de projeto. Light theme nos PDFs.

## O que NÃO faço
- Não removo a tela atual de Gerenciamento de Leitos — adiciono o painel como visão complementar.
- Não altero o fluxo de UTI nem regras de leitos fixos (U01-U10, V/A/Z).
