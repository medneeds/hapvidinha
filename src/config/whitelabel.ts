/**
 * Configuração White-Label Centralizada
 * 
 * Este arquivo centraliza TODAS as constantes de branding e identidade visual
 * do sistema. Para criar um white-label, basta alterar os valores aqui.
 * 
 * Nenhum componente deve ter referências hardcoded a nomes de hospitais,
 * logos ou textos institucionais.
 */

// ─── LOGOS ────────────────────────────────────────────────────────────────────
// Importe os assets de logo aqui. Para white-label, substitua os imports.
import networkFullLogo from "@/assets/hapvida-notredame-full-logo.png";
import networkCompactLogo from "@/assets/hapvida-notredame-logo.png";
import hospitalLogo from "@/assets/hospital-guaras-logo.png";

// ─── CONFIGURAÇÃO PRINCIPAL ──────────────────────────────────────────────────

export const whitelabel = {
  // ── Identidade da Plataforma ──
  platform: {
    /** Nome principal da plataforma (ex: "HapMap") */
    name: "HapMap",
    /** Versão exibida ao lado do nome */
    version: "2.0",
    /** Nome completo para documentos e títulos */
    fullName: "HapMap 2.0",
    /** Slogan principal exibido na tela de login e loading */
    slogan: "Tecnologia que valoriza seu tempo. Inteligência que salva vidas.",
    /** Texto de carregamento */
    loadingText: "Carregando",
  },

  // ── Identidade da Rede/Instituição ──
  institution: {
    /** Nome da rede hospitalar */
    networkName: "Hapvida NotreDame Intermédica",
    /** Nome abreviado da rede */
    networkShortName: "Hapvida",
    /** Nome do hospital padrão (usado como placeholder e em documentos) */
    hospitalName: "Hospital Guarás",
    /** Alt text para o logo da rede */
    networkLogoAlt: "Hapvida NotreDame Intermédica",
    /** Alt text para o logo do hospital */
    hospitalLogoAlt: "Hospital Guarás",
  },

  // ── Logos ──
  logos: {
    /** Logo completo da rede (usado em loading, login, impressão) */
    networkFull: networkFullLogo,
    /** Logo compacto da rede (usado na sidebar) */
    networkCompact: networkCompactLogo,
    /** Logo do hospital (usado em cabeçalhos de documentos) */
    hospital: hospitalLogo,
  },

  // ── Cores do Tema (gradiente principal) ──
  theme: {
    /** Cor primária do gradiente (from) */
    gradientFrom: "#013ba6",
    /** Cor intermediária do gradiente (via) */
    gradientVia: "#0146bd",
    /** Cor final do gradiente (to) */
    gradientTo: "#0152d4",
    /** Classe Tailwind do gradiente de fundo principal */
    bgGradient: "bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]",
  },

  // ── Créditos / Rodapé ──
  credits: {
    /** Nome do desenvolvedor/empresa */
    developerName: "Medneeds",
    /** Texto completo do rodapé de desenvolvimento */
    developerLabel: "Desenvolvido por",
    /** Assinatura do autor (usada em documentos impressos) */
    authorSignature: "Desenvolvido por Artur Batista",
    /** Texto curto para footer fixo */
    footerText: "Desenvolvido por Artur Batista",
  },

  // ── Conformidade / Legal ──
  compliance: {
    /** Referências legais exibidas na tela de login */
    legalReferences: "Lei 13.709/2018 (LGPD) • CFM 1.821/2007",
    /** Nome do sistema em termos de consentimento */
    systemNameInTerms: "HapMap",
    /** Texto do badge de conformidade */
    complianceBadgeTitle: "Em Conformidade",
  },

  // ── Funcionalidades da Tela de Login ──
  loginFeatures: [
    "Gestão inteligente de leitos em tempo real",
    "Visão completa do paciente em um clique",
    "IA integrada para suporte à decisão clínica",
    "Conformidade LGPD e CFM 1.821/2007",
  ],

  // ── Senha do Painel Admin ──
  admin: {
    /** Senha de acesso ao painel administrativo */
    panelPassword: "NOTREDAME",
  },

  // ── Documentos Impressos ──
  print: {
    /** Texto do rodapé de documentos */
    documentFooter: (date: string, time: string) =>
      `Documento gerado automaticamente • ${date} às ${time}`,
    /** Texto de confidencialidade */
    confidentialityText: "Documento Confidencial",
    /** Nome do sistema para geração de documentos */
    systemLabel: "HapMap - Sistema de Gestão Hospitalar",
  },
} as const;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Retorna o título da página principal com nome do hospital */
export function getMainPageTitle(hospitalName?: string): string {
  return `Mapa de Pacientes - ${hospitalName || whitelabel.institution.hospitalName}`;
}

/** Retorna o título de um documento impresso */
export function getPrintTitle(sectionName: string, hospitalName?: string): string {
  return `${sectionName} - ${hospitalName || whitelabel.institution.hospitalName}`;
}

/** Retorna o texto de confidencialidade com nome do hospital */
export function getConfidentialityFooter(hospitalName?: string): string {
  return `${hospitalName || whitelabel.institution.hospitalName} • ${whitelabel.print.confidentialityText}`;
}
