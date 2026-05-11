## Objetivo
Ocultar temporariamente Clínikus AI e Examinus AI da plataforma. Nada será removido — apenas escondido por flag, para reativação rápida após sua autorização.

## Estratégia
Criar uma constante única `FEATURE_FLAGS` em `src/config/featureFlags.ts` com:
- `CLINIKUS_AI_ENABLED = false`
- `EXAMINUS_AI_ENABLED = false`

Para reativar no futuro, basta trocar para `true` num único arquivo.

## Pontos que serão ocultados

### Examinus AI (`EXAMINUS_AI_ENABLED`)
1. `src/components/AppSidebar.tsx` (linhas 139-143 e 170): remover/filtrar o item "EXAMINUS AI" do menu lateral, inclusive do filtro do usuário porta.
2. `src/components/PatientCard.tsx` (≈3550-3556): esconder o botão "Examinus AI - Importar exames com IA" no card do paciente.
3. `src/hooks/useKeyboardShortcuts.ts` (linha 19): remover o atalho `Alt+I` da listagem visível.

### Clínikus AI (`CLINIKUS_AI_ENABLED`)
1. `src/components/EditPatientDialog.tsx` (≈220-228): esconder o botão que abre o `ClinikusAIDialog`.
2. `src/pages/UserManagementPage.tsx` (linha 541): esconder o `ClinicusAccessPanel` no painel admin (gestão de acessos do Clinikus).

## Fora de escopo (intencionalmente)
- `PresentationPage.tsx` (página de apresentação institucional/marketing): mantém as menções, pois não é fluxo operacional ativo. Confirmo se você preferir ocultar lá também.
- Componentes `ClinikusAIDialog.tsx`, `ExaminusAIDialog.tsx` e `ClinicusAccessPanel.tsx` permanecem no código (apenas não montados), prontos para reativação.
- Nenhuma rota é removida — `/ia` continua existindo mas fica inacessível pela navegação.

## Resultado
Usuários deixam de ver qualquer ponto de entrada para Clínikus e Examinus na sidebar, no card do paciente, no diálogo de edição e no painel admin. Quando você autorizar, eu inverto as duas flags e tudo volta no mesmo lugar.