# Otimização da diagramação no celular

Vale só para telas de celular (até ~767 px). Tablet e computador ficam exatamente como estão.

## O que vi no celular hoje

- O menu (☰) e o botão da conta (AB) ficam soltos e passam por cima dos cartões quando você rola a tela.
- As barras dos setores ("CUIDADOS ESPECIAIS", "UNIDADE DE TERAPIA INTENSIVA 2") quebram o título em duas linhas grandes e ocupam muita altura.
- No cartão da UE, o nome fica centralizado e solto, e a idade ("51 anos") fica numa linha sozinha. Uma faixa à direita (lápis, ⋮, seta) ocupa largura o tempo todo.
- As colunas ficam duas por linha, então o texto quebra a cada 2 ou 3 palavras. As Programações ocupam meia largura e deixam a outra metade vazia.
- Na UTI, os nomes longos aparecem cortados com "…", o que vai contra a regra de nunca cortar nomes.
- O "Desenvolvido por Artur Batista" fica por cima do conteúdo no rodapé.
- Documentos: os cartões espremem o título ("Modelo / de / Admissão…") palavra por palavra.
- Movimentações: "Limpar filtro" e as abas (Todas, Altas, Óbitos, Transferências) passam da borda da tela.
- Repositório: o título fica por baixo do botão ☰.

## O que vou fazer (com suas escolhas)

1. **Topo fixo e compacto:** uma barra única, mais baixa e sempre visível, com ☰, setor, ações e conta. Nada fica solto por cima dos cartões. Nas outras telas (Documentos, Movimentações, Repositório, Admin), o título vai para dentro dessa barra, sem sobreposição.
2. **Barras de setor em uma linha:** título menor numa linha só (por exemplo, "UTI 2" no lugar de "UNIDADE DE TERAPIA INTENSIVA 2"; nos setores da UE, fonte menor) e botões menores à direita.
3. **Cartões fechados ao abrir:** no celular, cada paciente aparece só com a linha principal. Um toque abre o cartão. O botão "expandir/retrair todos" do setor continua funcionando.
4. **Linha do paciente reorganizada:**
   - linha 1: leito + pílula do médico + nome completo (quebra linha se precisar, nunca corta);
   - linha 2: DN e idade lado a lado;
   - linha 3: TPS/DIH, ADM emergência e PSM numa faixa que se ajusta.
   O lápis, o ⋮ e a seta passam para o canto da linha do paciente, liberando a faixa da direita.
5. **Uma coluna por linha:** Hipóteses, Antecedentes, Exames, Plano e Programações ocupam a largura toda, com um título fino e espaço vertical menor. O texto praticamente deixa de quebrar.
6. **Rodapé:** a assinatura fica no fim da página, sem ficar por cima de nada.
7. **Documentos, Movimentações e Repositório:** cartões de documento com o ícone em cima e o texto em largura total; filtros e abas de Movimentações cabendo na tela (as abas rolam para o lado se precisar); título do Repositório sem ficar por baixo do ☰.

## Fora do escopo

- Nenhuma mudança no computador ou no tablet.
- Nenhum botão some nem muda de função. A UTI não ganha nada que não tenha hoje.
- Impressão e PDF não mudam.

## Detalhes técnicos

- Breakpoint `md` (768 px): todas as mudanças usam classes base (mobile) com `md:` restaurando o layout atual.
- `AppTopNav` + cabeçalhos (`Index.tsx`, `AppPageHeader.tsx`): no mobile, viram uma barra `sticky top-0` única (h ~52px) com clusters dentro do fluxo, em vez de botões `fixed` flutuantes. O padding reservado (`pl-12`, `pr-[52px]`) só se aplica a partir de `md`.
- `SectorSection.tsx` / `UtiSectorSection.tsx`: título `text-sm md:text-…`, `truncate`-free com `whitespace-nowrap` + rótulo curto no mobile; botões `h-8 w-8` no mobile.
- `EmergencyPatientCard.tsx` / `UtiPatientCard.tsx`: estado inicial `isCollapsed` = `true` quando `useIsMobile()` (respeitando `forceCollapsed`); grid de colunas `grid-cols-1 md:grid-cols-[...]`; ações laterais em `hidden md:flex` com cópia inline no mobile; nome `break-words` sem `truncate` no mobile.
- Rodapé de assinatura: `fixed` só a partir de `md`; no mobile, estático no fim.
- `DocumentsPage.tsx`, `MovementsPage` e `RepositoryPage.tsx`: ajustes de `flex-col md:flex-row`, `flex-wrap` e `overflow-x-auto` nas abas.
- Validação: capturas Playwright em 390×844 (claro e escuro) da UE Adulto, UTI 2, Documentos, Movimentações e Repositório, mais 1280 px para confirmar que o desktop não mudou. Todas as gravações ficam bloqueadas durante o teste.
