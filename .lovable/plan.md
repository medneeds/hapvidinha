# HapMap 3.0 — evolução visual profissional

## Objetivo
Modernizar a experiência visual do HapMap com uma interface mais limpa, elegante e clínica, preservando integralmente dados, permissões, fluxos e regras assistenciais existentes.

## Direção aprovada
- **Paleta:** grafite e azul institucional, com superfícies brancas e cinzas claros.
- **Tipografia:** Sora nos títulos e Manrope nos textos e dados.
- **Organização:** tabela clínica limpa, de alta densidade e leitura rápida.
- **Referência escolhida:** painel clínico com cabeçalhos de setor compactos, colunas alinhadas, leitos claramente identificados e alertas pontuais.
- As cores vermelho, amarelo e azul continuarão sendo usadas apenas como códigos clínicos de setor, prioridade e alerta.

## Etapa 1 — Fundação visual 3.0
- Criar tokens semânticos próprios para superfícies, texto, bordas, estados, setores e sombras discretas.
- Aplicar Sora e Manrope de forma consistente, mantendo boa leitura em telas menores e no modo escuro.
- Reduzir gradientes, brilhos, sombras fortes, excesso de arredondamento e ornamentos visuais.
- Padronizar botões, ícones, seletores, contadores, menus e estados de foco.

## Etapa 2 — Cabeçalho e navegação
- Refinar a barra superior em grafite e azul, organizando melhor setor, ações, notificações, total de pacientes e usuário.
- Harmonizar a sidebar expandida e retraída com a identidade HapMap 3.0.
- Manter ações secundárias agrupadas, deixando visíveis apenas comandos prioritários.
- Preservar a alternância livre entre UE Adulto, UE Pediátrica e UTI.

## Etapa 3 — Mapa clínico
- Transformar cada setor em uma tabela clínica contínua, com cabeçalho compacto e contador de ocupação.
- Alinhar as colunas de leito, paciente, diagnósticos, antecedentes, exames e pendências.
- Dar destaque principal ao nome completo do paciente, sem truncamento, seguido por idade e tempo de permanência.
- Diferenciar leitos ocupados, vagos e interditados com sinais discretos e inequívocos.
- Manter edição, impressão, alocação, movimentação, seleção e menus já existentes.
- Exibir ações da linha com menor ruído, sem esconder comandos essenciais em telas touch.

## Etapa 4 — UTI e detalhes clínicos
- Aplicar a mesma linguagem visual às UTI 1 e UTI 2, preservando suas identidades e campos específicos.
- Organizar expansões e edição clínica avançada com hierarquia clara, sem alterar o conteúdo ou a forma de salvamento.
- Preservar nomes completos, textos clínicos em maiúsculas, leitos fixos e todas as regras assistenciais atuais.

## Etapa 5 — Consistência da plataforma
- Levar a identidade 3.0 aos cabeçalhos e áreas estruturais das telas de Movimentações, Documentos e Administração.
- Não redesenhar formulários e fluxos especializados fora do necessário para consistência visual.
- Manter impressos e PDFs em fundo branco, com a identidade Hapvida vigente.

## Responsividade e acessibilidade
- No desktop, manter a visão tabular e a comparação horizontal rápida.
- Em telas menores, reorganizar colunas sem cortar nomes ou sobrepor ações.
- Garantir contraste, foco por teclado, áreas de toque adequadas e respeito à redução de movimento.

## Validação
- Conferir UE Adulto, UE Pediátrica, UTI 1 e UTI 2 com pacientes ocupados, leitos vagos e conteúdos extensos.
- Validar sidebar aberta/retraída e modos claro/escuro.
- Testar edição, alocação, movimentação, exclusão protegida, impressão e troca de setor.
- Comparar desktop e mobile, verificando nomes completos, ausência de sobreposição e estabilidade visual.
- Confirmar que nenhuma regra clínica, permissão ou sincronização foi alterada.

## Implantação segura
1. Aplicar a fundação visual e o mapa principal.
2. Validar o uso clínico e ajustar densidade, se necessário.
3. Padronizar as demais telas somente após a validação do mapa.
