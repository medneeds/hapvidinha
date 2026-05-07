import { Sparkles, Info, Copy, BedDouble, Move, Activity, Lock, ShieldCheck, Printer, Keyboard, Crown, Stethoscope } from "lucide-react";

export interface TourSlide {
  title: string;
  description: string;
  tip?: string;
  icon: any;
  accent: string; // tailwind gradient classes
}

export interface Tour {
  id: string;
  badge: string;
  hook: string; // curiosity hook for the teaser
  title: string;
  estimatedSeconds: number;
  slides: TourSlide[];
}

export const TRAINING_TOURS: Tour[] = [
  {
    id: "ai-paste-extraction",
    badge: "NOVIDADE • IA",
    hook: "Você sabia que pode cadastrar um paciente colando um texto?",
    title: "Reconhecimento de Dados por IA",
    estimatedSeconds: 45,
    slides: [
      {
        icon: Sparkles,
        accent: "from-violet-500 via-fuchsia-500 to-pink-500",
        title: "Cole. A IA faz o resto.",
        description:
          "No card do paciente, clique no ícone de brilho ✨ ao lado do tempo de permanência. Um popup abre pronto para receber o texto copiado do Samweb.",
        tip: "Atalho: já vem com auto-processamento — não precisa clicar em 'extrair'.",
      },
      {
        icon: Sparkles,
        accent: "from-fuchsia-500 to-violet-600",
        title: "Campos reconhecidos automaticamente",
        description:
          "CPF, nome da mãe, plano, carteira, prontuário, código de atendimento, tempo de plano. Tudo identificado em segundos.",
      },
      {
        icon: Info,
        accent: "from-sky-500 to-indigo-600",
        title: "Conferiu? Salve.",
        description:
          "Revise os dados extraídos e confirme. Para editar manualmente depois, use o ícone (i) no mesmo card.",
        tip: "Gemini 3 Flash garante leitura precisa mesmo com formatação suja.",
      },
    ],
  },
  {
    id: "patient-info-popup",
    badge: "ATALHO RÁPIDO",
    hook: "Existe um popup que mostra TODA a ficha administrativa em 1 clique.",
    title: "Popup de Informações do Paciente",
    estimatedSeconds: 30,
    slides: [
      {
        icon: Info,
        accent: "from-sky-500 to-cyan-500",
        title: "Ícone (i) — sua ficha completa",
        description:
          "Ao lado do tempo de permanência, o ícone de informação abre todos os dados administrativos em um popup discreto.",
      },
      {
        icon: Copy,
        accent: "from-cyan-500 to-teal-500",
        title: "Botão 'Editar' embutido",
        description:
          "Corrija qualquer campo manualmente sem sair do popup. CPF, plano, carteirinha, prontuário, atendimento.",
      },
    ],
  },
  {
    id: "fixed-beds",
    badge: "ESTABILIDADE",
    hook: "UTI e Urgência têm leitos FIXOS. Já sabe por quê?",
    title: "Leitos Fixos: U01–U10 e V/A/Z",
    estimatedSeconds: 35,
    slides: [
      {
        icon: BedDouble,
        accent: "from-blue-500 to-indigo-600",
        title: "Capacidade nunca muda",
        description:
          "UTI (U01–U10) e Urgência observação (V01–V07, A01–A06, Z01–Z06) são slots fixos. Nunca somem do mapa.",
      },
      {
        icon: Move,
        accent: "from-indigo-500 to-purple-600",
        title: "Alta = leito vago",
        description:
          "Quando o paciente recebe alta, transferência ou óbito, o leito é convertido para VAGO mantendo número e setor.",
        tip: "Não tente arrastar para reordenar — esses leitos têm posição fixa por desenho.",
      },
    ],
  },
  {
    id: "ldr-icon",
    badge: "REORGANIZAÇÃO",
    hook: "Quem é o líder do plantão? Procure a coroa 👑",
    title: "Identificação do LDR",
    estimatedSeconds: 20,
    slides: [
      {
        icon: Crown,
        accent: "from-amber-500 to-yellow-500",
        title: "LDR com ícone de coroa",
        description:
          "A atribuição 'Líder' agora aparece como LDR com uma coroa discreta — referência visual rápida ao chefe do plantão.",
      },
    ],
  },
  {
    id: "immutable-evolutions",
    badge: "SEGURANÇA CLÍNICA",
    hook: "Por que não dá para EDITAR uma evolução já salva?",
    title: "Evoluções Imutáveis",
    estimatedSeconds: 30,
    slides: [
      {
        icon: Lock,
        accent: "from-rose-500 to-red-600",
        title: "CFM exige imutabilidade",
        description:
          "Toda evolução clínica registrada não pode ser editada — apenas SUSPENSA com nova evolução de retificação.",
      },
      {
        icon: ShieldCheck,
        accent: "from-red-500 to-orange-500",
        title: "Auditoria de 20 anos",
        description:
          "Todo movimento fica registrado em log imutável por 20 anos, conforme LGPD e CFM. Você está protegido.",
      },
    ],
  },
  {
    id: "privacy-mode",
    badge: "LGPD",
    hook: "Tela em local público? Ative o modo privacidade.",
    title: "Modo Privacidade",
    estimatedSeconds: 25,
    slides: [
      {
        icon: ShieldCheck,
        accent: "from-emerald-500 to-green-600",
        title: "Mascaramento automático",
        description:
          "Ative na barra superior. Nomes ficam parcialmente ocultos com pontos (ex.: J••• S•••).",
        tip: "Ideal para passagem de plantão com terceiros próximos.",
      },
    ],
  },
  {
    id: "sepsis-protocol",
    badge: "PROTOCOLO",
    hook: "Sepse ativa BLOQUEIA movimentação do paciente. Você sabia?",
    title: "Protocolo de Sepse",
    estimatedSeconds: 30,
    slides: [
      {
        icon: Activity,
        accent: "from-red-600 to-rose-700",
        title: "Bundle controlado",
        description:
          "Enquanto o protocolo estiver ativo, o paciente não pode ser transferido — garantindo conclusão do bundle de 1ª e 6ª hora.",
      },
      {
        icon: Stethoscope,
        accent: "from-rose-600 to-pink-600",
        title: "Encerramento desbloqueia",
        description:
          "Conclua o protocolo (alta, óbito ou cura) para liberar movimentação novamente.",
      },
    ],
  },
  {
    id: "print-pdf",
    badge: "RELATÓRIOS",
    hook: "PDFs sempre em tema claro, mesmo se você usa modo escuro.",
    title: "Impressão e PDF",
    estimatedSeconds: 25,
    slides: [
      {
        icon: Printer,
        accent: "from-slate-600 to-zinc-700",
        title: "Mapa em paisagem, caso clínico em retrato",
        description:
          "Margens padronizadas (18mm topo / 15mm laterais). Fundo branco puro garantido.",
      },
    ],
  },
  {
    id: "shortcuts",
    badge: "PRODUTIVIDADE",
    hook: "Existem atalhos que aceleram em 3x sua rotina.",
    title: "Atalhos de Teclado",
    estimatedSeconds: 25,
    slides: [
      {
        icon: Keyboard,
        accent: "from-indigo-500 to-blue-600",
        title: "Pressione ?",
        description:
          "Em qualquer tela, pressione '?' para abrir o painel completo de atalhos. Comece pelo Ctrl+K — busca global.",
      },
    ],
  },
  {
    id: "patient-card-header",
    badge: "REVAMP",
    hook: "Nome, idade, prontuário e atendimento — tudo no topo do card.",
    title: "Novo Cabeçalho do Paciente",
    estimatedSeconds: 25,
    slides: [
      {
        icon: Copy,
        accent: "from-teal-500 to-emerald-600",
        title: "PRONT. e ATEND. clicáveis",
        description:
          "A linha discreta abaixo do nome agora é clicável — copia para a área de transferência com 1 toque.",
      },
    ],
  },
];
