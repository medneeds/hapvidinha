## Otimização do cabeçalho do card do paciente

### 1. Banco de dados (migration)
Adicionar colunas opcionais à tabela `patients` para guardar dados administrativos vindos do Samweb:
- `medical_record_number` (text) — Prontuário
- `attendance_number` (text) — Cód. Atendimento
- `cpf` (text)
- `mother_name` (text)
- `insurance_company` (text) — Convênio
- `insurance_plan` (text) — Plano Convênio
- `insurance_plan_type` (text) — Plano (Ambulatorial/Hospitalar...)
- `insurance_card_number` (text) — Carteira
- `insurance_duration` (text) — Tempo Plano

Todos nullable. Sem CHECK constraints.

### 2. Tipo `Patient` (`src/types/patient.ts`)
Adicionar os campos correspondentes em camelCase (`medicalRecordNumber`, `attendanceNumber`, `cpf`, `motherName`, `insuranceCompany`, `insurancePlan`, `insurancePlanType`, `insuranceCardNumber`, `insuranceDuration`).

### 3. Hook `usePatients.ts`
Mapear os novos campos no fetch e no `dbUpdatePatient` (camelCase ↔ snake_case).

### 4. Edge function `extract-patient-info`
Nova função que recebe um bloco de texto colado e retorna JSON estruturado via tool calling do Lovable AI Gateway (`google/gemini-3-flash-preview`).
- Extrai: name, age, birthDate, cpf, motherName, insuranceCompany, insurancePlan, insurancePlanType, insuranceCardNumber, insuranceDuration, medicalRecordNumber, attendanceNumber.
- Retorna apenas campos identificados; demais ficam ausentes para preservar dados existentes.
- `verify_jwt = true` (default).

### 5. Novo componente `PatientInfoPasteDialog.tsx`
- Trigger: ícone `Sparkles` (IA) posicionado **logo após o badge de tempo de permanência**, ao lado do nome.
- Dialog com `Textarea` que processa **automaticamente ao detectar paste (onPaste)** — sem botão extra.
- Mostra loading enquanto chama a edge function.
- Ao retornar, mostra preview dos campos extraídos com confirmar/cancelar; ao confirmar, faz merge no paciente via `onUpdate`.
- Toast de sucesso indicando quantos campos foram preenchidos.

### 6. Novo componente `PatientInfoDialog.tsx` (ícone "i")
- Trigger: ícone `Info` ao lado do `Sparkles`.
- Pop-up exibindo todos os campos administrativos preenchidos (CPF, Mãe, Convênio, Plano Convênio, Plano, Carteira, Tempo Plano, Prontuário, Atendimento).
- Cada linha com botão de copiar individual.
- Botão **"Editar"** que abre modo de edição inline (inputs) para corrigir/preencher manualmente qualquer campo, com Salvar/Cancelar.
- Campos vazios mostrados como "—" no modo visualização.

### 7. Refatorar cabeçalho em `PatientCard.tsx` (linhas ~1932-2008)
Layout novo:

```text
[badges PSM] NOME COMPLETO · 51 ANOS E 8 MESES   [⏱ tempo] [✨ IA] [ⓘ info] [📋 copiar]
            PRONT. 12890372 · ATEND. 178471602
```

Mudanças:
- **Linha 1**: nome (mantém edição inline ao clicar) + separador `·` + idade no mesmo `<p>`/flex (idade mantém edição inline ao clicar). Tamanhos: nome `text-base md:text-sm`, idade `text-sm md:text-xs text-muted-foreground font-normal`.
- Reposicionar o badge de tempo de permanência (já existente próximo ao nome) **antes** dos novos ícones.
- Adicionar ícones `Sparkles` (IA) e `Info` (info) — `h-3.5 w-3.5`, `opacity-60 hover:opacity-100`, sem fundo, discretos.
- Manter ícone `Copy` (já existente) ao final, com mesma discrição — sem mudar tamanho.
- **Linha 2** (substitui o antigo `<p>` da idade): mostrar somente se `medicalRecordNumber` ou `attendanceNumber` estiverem preenchidos. Estilo: `text-[10px] md:text-[11px] italic text-muted-foreground/80 mt-0.5`. Cada item clicável para copiar (toast "Copiado").
- Se nenhum dos dois estiver preenchido, **não renderiza** a linha 2 (espaço fica limpo); o usuário acessa via ícone IA ou Info.

### 8. Permissões e regras já existentes mantidas
- Edição inline de nome/idade respeita `canEdit`.
- Modo privacidade (`namesHidden`) continua mascarando o nome.
- Conversão automática para UPPERCASE preservada nos campos clínicos (PRONT./ATEND. ficam em maiúsculas como rótulo, mas valores numéricos preservados).

### Arquivos afetados
- `supabase/migrations/<novo>.sql` (novas colunas)
- `src/types/patient.ts`
- `src/hooks/usePatients.ts`
- `src/components/PatientCard.tsx`
- `src/components/PatientInfoPasteDialog.tsx` (novo)
- `src/components/PatientInfoDialog.tsx` (novo)
- `supabase/functions/extract-patient-info/index.ts` (novo)

### Notas
- IA usa Lovable AI (gemini-3-flash-preview) — sem custo de chave para o usuário.
- Tratamento de erros 429/402 com toasts amigáveis.
- Nenhum dado é salvo automaticamente sem confirmação do usuário no preview.
