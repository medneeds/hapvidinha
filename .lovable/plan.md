# Enxugamento da Plataforma HapMap

Objetivo: reduzir a superfície da plataforma removendo módulos solicitados, sem afetar o MAPA, Movimentações, Documentos, Dashboard, Admin (estados/unidades/coordenadores/protocolos), Privacidade/Auditoria e o módulo HAPMAP GO.

## O que será REMOVIDO

### 1. Menus do sidebar (`src/components/AppSidebar.tsx`)
- Bloco **GERENCIAMENTO DE LEITOS** (MAPA DE LEITOS, PAINEL DE SOLICITAÇÕES, CADASTRO DE LEITOS).
- Em PACIENTES: subitens **SOLICITAÇÕES** (`/resources`) e **HISTÓRICO** (`/internment-history`). Mantém apenas **MOVIMENTAÇÕES**.
- Bloco **CÓDIGOS** inteiro (exames, procedimentos, materiais, medicações, cirúrgicos CBHPM).
- Bloco **REPOSITÓRIO**.
- Bloco **VERSÕES**.
- Limpeza dos ícones não usados (`BedDouble`, `FileSearch`, `FolderArchive`, `History`).

### 2. Rotas (`src/App.tsx`)
Remover rotas e imports correspondentes:
- `/leitos`, `/leitos/cadastro`, `/leitos/painel` → `BedManagementPage`, `BedManagementRegistrationPage`, `BedRequestsPanelPage`.
- `/resources` → `ResourcesPage`.
- `/internment-history` → `InternmentHistoryPage`.
- `/codigos`, `/codigos-cirurgicos` → `MedicalCodesPage`, `SurgicalCodesPage`.
- `/repositorio` → `RepositoryPage`.
- `/versions` → `VersionsPage`.

### 3. Processamento com IA
- Remover dialogs/painéis: `ClinikusAIDialog.tsx`, `ExaminusAIDialog.tsx`, `ClinicusAccessPanel.tsx`, `PatientInfoPasteDialog.tsx`, `VoiceRecorder.tsx`.
- Remover página `src/pages/IAPage.tsx` (se houver rota, remover também).
- Remover hook `src/hooks/useAgeCalculator.ts` (chama edge function de IA) — substituir uso em `PatientCard.tsx` por cálculo determinístico local já existente em `src/utils/calculateDetailedAge.ts` / `ageDisplay.ts`.
- Remover referências no `MainLayout.tsx`, `PatientCard.tsx` e `RegisterHandoverDialog.tsx` (botão de voz some; transcrição manual permanece via texto).
- Excluir edge functions de IA: `clinicus-ai`, `examinus-chat`, `extract-patient-info`, `transcribe-audio`, `calculate-age`, `format-pediatric-age`, `get-cid-code` (via tool de delete de edge functions).

### 4. Central de Treinamentos
- Remover `TrainingCenterDialog.tsx`, `TrainingTourDialog.tsx`, `TrainingScheduler.tsx`, `useTrainingScheduler.ts`, `src/data/trainingTours.ts`.
- Remover gatilhos/uso em `MainLayout.tsx` (botão flutuante / dialog).

### 5. Arquivos órfãos relacionados
Após as remoções acima, apagar componentes que ficam sem consumidores:
- Diálogos exclusivos de gerenciamento de leitos: `BedSelectionDialog`, `BedSwapDialog`, `RequestBedAllocationDialog`, `RequestNewAllocationDialog`, `RequestUtiAllocationDialog`, `UtiReallocationDialog`, `ReallocateFromHistoryDialog`, `bed-panel/*`, hooks `useBedAllocationRequests`, `useBedRequests`, `useBedRequestsPanel`, `useBedSlaConfigs`, `useManagedBeds`, `useBedLifecycle`, `BedAllocationNotifications`, `AllocationPendingBadge` — **apenas** se nenhum import remanescente for detectado (verificação com `rg` antes da exclusão).
- `usePatientVersions.ts` (suporte à página Versões).
- `src/components/resources/*` (tabs de Solicitações/Internação).

> Componentes que continuam em uso pelo MAPA (ex.: `PatientCard`, `SectorSection`, `PatientMovementDialog`) **NÃO** serão removidos.

## O que será PRESERVADO
- MAPA principal e fluxo clínico (evoluções, condutas, óbito, paliativos, sepse/AVC/dor torácica).
- Movimentações de pacientes (apenas a página, não o módulo de Solicitações).
- Documentos, Templates Terapêuticos, Relatórios Emitidos.
- Painel Admin (Dashboard, Usuários, Auditoria, LGPD, Estados, Unidades, Coordenadores, Protocolos Sepse/AVC/Dor Torácica).
- Módulo HAPMAP GO.
- Tabelas no banco serão **mantidas intactas** (sem migrations destrutivas) para preservar histórico — apenas o acesso pela UI será removido. Posso remover as tabelas em uma segunda etapa, se você confirmar.

## Verificação pós-execução
1. Build/typecheck automático.
2. `rg` confirmando ausência de imports quebrados para arquivos deletados.
3. Sidebar exibindo apenas: MAPA · PACIENTES (Movimentações) · DOCUMENTOS · PAINEL ADMIN.
4. MainLayout sem botões de IA / Central de Treinamentos.

## Pontos para confirmar antes de implementar
1. **Banco de dados**: manter tabelas (`managed_beds`, `bed_allocation_requests`, `bed_requests`, `bed_sla_configs`, `bed_lifecycle_events`, `medical_codes`, `patient_versions`, `internment_requests`) ou também derrubar via migration? Recomendo **manter** por enquanto.
2. **`VoiceRecorder` em handover**: remover totalmente o botão de gravação por voz dos handovers (consequência da remoção de IA). Confirma?
3. **Cálculo de idade pediátrica**: hoje usa edge function de IA; passarei a calcular localmente com `calculateDetailedAge`. OK?
4. **Página `/ia`**: confirmar que pode ser removida do menu/rotas (não vi referência ativa no sidebar, mas o arquivo existe).
