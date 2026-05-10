
# Gerenciamento de Leitos — Plano da v1

Módulo novo, isolado, em rota dedicada `/leitos`. Não altera o MAPA, evoluções, UTI, protocolos ou qualquer fluxo já em produção. Aproveita o `bed_lifecycle_events` que já existe e amplia.

## 1. Pesquisa de mercado (referências aplicadas)

Boas práticas de bed management hospitalar (TeleTracking, Epic Grand Central, Qventus, MV Soul Leitos):
- Cada leito possui **estado canônico**: ocupado → alta médica → alta administrativa → vago sujo → em higienização → vago limpo → reservado → ocupado.
- Cada transição registra **timestamp + responsável**, gerando KPIs (turnaround time, tempo médio de higienização, tempo de leito ocioso).
- Solicitações têm **ciclo próprio**: criada → aceita → em transporte → concluída → cancelada, com SLA por etapa.
- Painéis em "tiles" coloridos por estado, atualizados em tempo real.

Vamos seguir esse padrão.

## 2. Escopo da v1 (confirmado)

- Dashboard com ciclo de vida do leito + cronômetros e SLA visual.
- Cadastro individual de leitos por setor (próprios do módulo, sem mexer nos U01-U10/V/A/Z do MAPA).
- Solicitações unificadas: **UTI**, **enfermaria**, **transporte/condutor**.
- Novas categorias de usuário: **Hotelaria** e **Condutor**.
- Disparo manual em tela separada (MAPA segue intocado nesta v1).

## 3. Estados do leito

```text
OCCUPIED → MEDICAL_DISCHARGE → ADMIN_DISCHARGE → VACATED_DIRTY
        → CLEANING_IN_PROGRESS → CLEANING_DONE → AVAILABLE
        → RESERVED → OCCUPIED
                  ↘ MAINTENANCE / BLOCKED (paralelo)
```

Cada transição grava em `bed_lifecycle_events` (já existente) com `cycle_id` agrupando o ciclo completo daquele leito até nova ocupação.

## 4. SLA por setor

Tabela `bed_sla_configs` com tempos-alvo (em minutos) por setor para cada etapa:
- alta médica → alta administrativa
- alta administrativa → desocupação
- desocupação → início higienização
- duração da higienização
- liberação → ocupação
- aceite do condutor após solicitação
- duração do transporte

Cards mostram cronômetro **verde / âmbar / vermelho** conforme SLA.

## 5. Banco de dados (novas tabelas)

- **`managed_beds`** — leitos cadastrados no módulo
  - sector, bed_number, bed_type (enfermaria/UTI/observação), current_status, current_patient_name, current_cycle_id, is_blocked, hospital_unit_id, state_id
- **`bed_sla_configs`** — SLA por setor + etapa (minutos)
- **`bed_requests`** — solicitações unificadas
  - request_type (uti | enfermaria | transporte), origin_sector, destination_sector, target_bed_id, patient_name, patient_age, clinical_summary, priority, status (pending | accepted | in_progress | completed | cancelled), requested_by, accepted_by, accepted_at, completed_at, sla_minutes, notes
- **`transport_assignments`** — vínculo condutor ↔ solicitação
  - request_id, conductor_user_id, acknowledged_at, started_at, finished_at, status

`bed_lifecycle_events` continua igual (já tem todos os event_type necessários — adicionar apenas `bed_blocked` / `bed_unblocked` se preciso).

RLS:
- `managed_beds` / `bed_sla_configs`: leitura para autenticados; escrita só admin/gestão.
- `bed_requests`: criação por enfermagem/médico/recepção; update por hotelaria (cleaning) e condutor (transporte); admin total.
- `transport_assignments`: condutor lê/atualiza apenas as próprias; gestão lê todas.

## 6. Categorias de usuário (novas)

Adicionar à enum `app_role`: **`hotelaria`**, **`condutor`**.
- `hotelaria`: opera apenas eventos de higienização e visualiza fila de leitos sujos.
- `condutor`: tela própria simplificada, lista solicitações de transporte atribuídas, botões "DAR CIÊNCIA → INICIAR → FINALIZAR".

Login (`AuthPage`): adicionar as duas opções no Select de categoria, com Setor oculto para `hotelaria` (visão ampla) e para `condutor` (recebe por escala).

## 7. Telas

### `/leitos` — Dashboard principal (gestão/admin/enfermagem)
- Header com filtros (setor, status, SLA estourado).
- Grid de tiles (um por leito) coloridos por status, com cronômetro do estado atual e nome do paciente.
- Click no tile abre **drawer** com timeline do ciclo, botões de avanço de estado conforme permissão e histórico de ciclos anteriores.
- Aba "Solicitações" lista pedidos pendentes com badges de SLA.
- Aba "Indicadores" com KPIs: tempo médio por etapa, leitos ociosos, taxa de giro.

### `/leitos/cadastro` — admin
CRUD de `managed_beds` e `bed_sla_configs`.

### `/leitos/hotelaria` — hotelaria
Fila de leitos aguardando higienização + em higienização. Botões "INICIAR" / "FINALIZAR".

### `/condutor` — condutor (layout próprio enxuto, mobile-first)
Lista de transportes atribuídos com 3 botões grandes: CIÊNCIA, INICIAR, FINALIZAR. Toast de confirmação a cada passo.

## 8. Fluxo de solicitação (exemplo enfermaria)

1. Enfermagem clica "+ Nova solicitação" → escolhe tipo (UTI/Enfermaria/Transporte).
2. Preenche paciente + setor destino (ou leito específico se for transporte).
3. Solicitação entra em `pending` com SLA iniciado.
4. Gestão/Hotelaria/Condutor visualiza e aceita → SLA da etapa seguinte começa.
5. Conclusão registra evento no `bed_lifecycle_events` e atualiza `managed_beds.current_status`.

## 9. Substituição do RequestUtiAllocationDialog

Manter o componente atual funcionando (não quebrar MAPA), mas adicionar **flag** `useUnifiedBedRequests` (default OFF). Quando ON, o botão atual passa a abrir o novo formulário do módulo. Migração suave; ligamos depois que o módulo estiver estável.

## 10. Realtime

Habilitar realtime em `managed_beds`, `bed_requests`, `transport_assignments` e `bed_lifecycle_events` para que dashboard e tela do condutor atualizem ao vivo.

## 11. Sidebar / navegação

- Adicionar item "Gerenciamento de Leitos" (icone `BedDouble`) visível para `admin`, `gestao`, `administrativo`, `enfermagem`, `hotelaria`.
- `condutor` faz login e cai direto em `/condutor` (rota protegida própria, sem sidebar).

## 12. Garantias de não-regressão

- Nenhuma alteração em `patients`, `patient_movements`, `useBedLifecycle`, MAPA, UTI, protocolos.
- Novas tabelas isoladas; nada lê/escreve nas existentes exceto `bed_lifecycle_events` (apenas INSERT, que já é permitido).
- Categorias novas não afetam roteamento das antigas.

## 13. Entregáveis da v1 (ordem sugerida de execução depois)

1. Migração: enum (`hotelaria`, `condutor`), tabelas `managed_beds`, `bed_sla_configs`, `bed_requests`, `transport_assignments`, RLS + realtime.
2. AuthPage: novas categorias.
3. Sidebar + rotas + ProtectedRoute para `condutor`.
4. CRUD `/leitos/cadastro` e seed inicial de SLAs padrão.
5. Dashboard `/leitos` com tiles + drawer + cronômetros.
6. Solicitações unificadas (UI + hooks).
7. `/leitos/hotelaria`.
8. `/condutor`.
9. Aba Indicadores.

## 14. Itens deixados para v2 (fora do escopo agora)

- Substituição definitiva do RequestUtiAllocationDialog.
- Integração automática com altas do MAPA.
- Mapa de calor de ocupação histórica.
- Notificações push/SMS para condutor.
- Integração com Samweb/Siga para censo externo.
