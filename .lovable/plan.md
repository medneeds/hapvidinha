# Prioridades UTI — UE Adulto

Feature que consolida em um único lugar os pacientes candidatos a leito de UTI, permitindo priorização por ordem (drag-and-drop), persistência até movimentação, e impressão de documento oficial para entrega ao setor de liberação de leito.

## 1. Modelo de dados (Lovable Cloud)

Nova tabela `uti_priorities` com escopo por hospital/estado (mesmo padrão das demais):

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| patient_id | uuid FK → patients | UNIQUE por hospital+estado (paciente não duplica na fila) |
| hospital_unit_id | uuid | escopo |
| state_id | uuid | escopo |
| position | integer | ordem de prioridade (1 = mais prioritário) |
| notes | text | observação opcional do médico |
| added_by | uuid | quem adicionou |
| added_by_email | text | snapshot para auditoria |
| created_at / updated_at | timestamptz | |

Regras automáticas:
- Trigger remove o paciente da fila quando ele é movimentado (discharge/óbito/transferência) ou quando o `patients.internmentStatus` deixa de ser um status UTI. Isso garante o "persiste até movimentação".
- RLS igual às tabelas de fluxo clínico: leitura/escrita por usuários do hospital/estado; admin e médicos com departamento URGÊNCIA E EMERGÊNCIA ADULTO podem gerenciar.

## 2. UI

**Ponto de entrada:** botão **"Prioridades UTI"** no header da página UE Adulto (`src/pages/Index.tsx`), ao lado das ações existentes, com badge mostrando quantos pacientes estão na fila.

**Dialog `UtiPrioritiesDialog`** com duas áreas:

```text
┌─────────────────────────────────────────────────┐
│  Prioridades UTI              [Imprimir] [X]    │
├──────────────────────┬──────────────────────────┤
│ Adicionar paciente   │  Fila priorizada         │
│                      │                          │
│ [busca...]           │  1. ≡ Paciente A · V01   │
│                      │  2. ≡ Paciente B · A03   │
│ Candidatos (IR_PARA  │  3. ≡ Paciente C · Z02   │
│ _UTI):               │       ...                │
│  □ Paciente X        │                          │
│  □ Paciente Y        │  (arraste para reordenar)│
│  [+ Adicionar]       │                          │
└──────────────────────┴──────────────────────────┘
```

- **Coluna esquerda:** lista de pacientes da UE Adulto com `internmentStatus` de UTI que ainda não estão na fila.
- **Coluna direita:** fila atual, drag-and-drop (usando `@dnd-kit/core` + `@dnd-kit/sortable`, já presente no projeto se houver — senão instalar). Cada linha mostra ordem, nome, leito/setor, botão remover.
- Ações: **Imprimir** gera o PDF consolidado.

## 3. PDF consolidado

Novo componente `PrintUtiPrioritiesLayout.tsx` + dialog de preview (mesmo padrão do `PrintPatientPreviewDialog`).

Estrutura A4 retrato:

```text
┌────────────────────────────────────────────────┐
│  [LOGO HAPVIDA]        PRIORIDADES UTI         │
│                        UE Adulto · Hospital X  │
│                        09/07/2026 14:32        │
├────────────────────────────────────────────────┤
│  #  PACIENTE            IDADE  LEITO  DIAGNÓSTICOS
│  1  MARIA DA SILVA      67a    V01    ICC descompensada; IRA
│  2  JOÃO PEREIRA        54a    A03    Sepse pulmonar
│  3  ...                                          
├────────────────────────────────────────────────┤
│  Médico responsável: _______________________   │
│  CRM: __________  Assinatura: _____________    │
│                                                │
│  Documento gerado em 09/07/2026 · Confidencial │
└────────────────────────────────────────────────┘
```

- Tema claro forçado, fundo branco puro (regra de impressão do projeto).
- Ordem = posição na fila.
- Assinatura manual do médico responsável (linha para preencher à caneta) — como pedido.

## 4. Arquivos previstos

**Novos**
- `supabase/migrations/<timestamp>_uti_priorities.sql` — tabela, GRANTs, RLS, trigger de limpeza.
- `src/hooks/useUtiPriorities.ts` — query, add, remove, reorder (mutations com invalidação).
- `src/components/UtiPrioritiesDialog.tsx` — dialog principal.
- `src/components/PrintUtiPrioritiesLayout.tsx` — layout do PDF.
- `src/components/PrintUtiPrioritiesPreviewDialog.tsx` — preview + trigger de impressão.

**Editados**
- `src/pages/Index.tsx` — botão no header + montagem do dialog.
- `src/integrations/supabase/types.ts` — regenerado automaticamente após a migração.

## 5. Permissões

Mantém as regras atuais (memória `access-control-architecture`):
- Recepção/Enfermagem: leitura apenas.
- Médico/Porta/Líder/Admin com acesso à UE Adulto: podem adicionar, remover, reordenar e imprimir.

## 6. Ordem de execução

1. Migração da tabela + trigger (aguarda aprovação).
2. Hook `useUtiPriorities`.
3. Dialog + drag-and-drop.
4. Layout de impressão + preview.
5. Botão no header do Index.
6. Verificação visual via Playwright (adicionar 2 pacientes fake, reordenar, abrir preview).

Confirma esse desenho para eu iniciar pela migração?
