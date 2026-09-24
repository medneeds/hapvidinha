# Reorganizar a distribuição do cabeçalho: MINHA CONTA para a direita

## Problema atual
- O `AppTopNav` é uma barra fixa no canto **esquerdo** com todos os grupos em sequência: `hm` logo → Assistência → Documentos → Recursos Rápidos → Painel Admin → **MINHA CONTA**.
- O ícone MINHA CONTA fica "perdido" no fim do grupo da esquerda, sem pertencer de fato à direita.
- Na tela MAPA, o cabeçalho da própria página já mostra à direita: nome/role do usuário + botão **Sair** + **ThemeToggle**. Resultado: dois controles de conta redundantes.
- Em telas como Documentos/Admin não há controle de conta nenhum à direita.

## Solução escolhida — consolidação global
Um único controle de **MINHA CONTA** fixo no canto direito do cabeçalho, presente em todas as telas; o bloco duplicado (nome + Sair) sai do cabeçalho da tela MAPA.

### Mudanças
1. **`src/components/AppTopNav.tsx`**
   - Transformar o `<nav>` em barra de largura total: `fixed top-[14px] sm:top-[18px] inset-x-0`, `flex justify-between`, `pointer-events-none` (deixa o centro clicável); clusters com `pointer-events-auto`.
   - **Cluster esquerdo**: `hm` logo + divisor + grupos funcionais (Assistência, Documentos, Recursos Rápidos, Painel Admin). **Sem** MINHA CONTA.
   - **Cluster direito**: botão de **MINHA CONTA** com avatar circular mostrando as iniciais do usuário (ex.: "AB"). Tooltip + dropdown com `align="end"` contendo "ALTERAR MINHA SENHA" e "SAIR".
   - Mobile: continua um único menu hambúrguer à esquerda (já inclui conta).

2. **`src/pages/Index.tsx` (cabeçalho MAPA)**
   - Remover o bloco redundante de nome/role + botão "Sair" (linhas ~1349‑1367).
   - Manter **ThemeToggle**, mas movê‑lo para o cluster direito do `AppTopNav` (passo 3) para evitar sobreposição com o botão de conta. Removê‑lo do cabeçalho da MAPA.
   - As ações específicas da página (Desfazer/Refazer, seleção, impressão, notificações, total de pacientes) permanecem no cabeçalho, apenas recuadas para não colidir com o canto direito.

3. **ThemeToggle global**
   - Mover o `ThemeToggle` para dentro do `AppTopNav` (cluster direito, imediatamente à esquerda de MINHA CONTA). Assim tema + conta ficam consistentes em todas as telas.
   - Remover o `ThemeToggle` duplicado do cabeçalho da MAPA (`Index.tsx`, instâncias mobile e desktop).

4. **Reserva de espaço à direita**
   - `AppPageHeader.tsx` e cabeçalho da MAPA: adicionar `pr-[52px] sm:pr-[60px]` na região de ações à direita para que nenhum botão da página fique sob o botão de conta/tema flutuante (z‑60).

## Resultado
- Distribuição equilibrada: navegação funcional agrupada à esquerda; identidade/conta/tema à direita.
- Conta única e consistente em todas as telas.
- Sem sobreposição entre o nav flutuante (z‑60) e as ações dos cabeçalhos de página (z‑50).

## Fora do escopo
- Não alterar tamanhos de ícones/botões, paleta ou comportamentos existentes.
- Não tocar na lógica de autenticação/permissões.
