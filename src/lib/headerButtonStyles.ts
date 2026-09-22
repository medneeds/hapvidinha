/**
 * Padrão visual único para os botões de ícone do cabeçalho.
 * Todos os botões de ação do header devem usar estas classes
 * para manter tamanho, formato e cores uniformes.
 */
export const HEADER_ICON_BUTTON =
  "h-9 w-9 rounded-lg bg-sidebar-accent/50 border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-foreground/30 transition-all duration-200";

export const HEADER_ICON_BUTTON_ACTIVE =
  "h-9 w-9 rounded-lg bg-primary text-primary-foreground border border-primary shadow-md transition-all duration-200";

export const HEADER_ICON_BUTTON_DANGER =
  "h-9 w-9 rounded-lg bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-all duration-200";

export const HEADER_ICON = "h-4 w-4";

/**
 * Padrão visual único para os ícones da sidebar.
 * Mesma escala e cor de acento usadas no cabeçalho.
 */
export const SIDEBAR_ICON = "h-4 w-4 text-sidebar-foreground/70 shrink-0 transition-all duration-200";
export const SIDEBAR_ICON_MUTED = "h-4 w-4 text-muted-foreground shrink-0 transition-all duration-200";

/**
 * Padrão visual único para os botões de ícone dentro do mapa
 * (cabeçalhos de ala, leitos vagos e ações das telas).
 * Mesma escala, formato e traço do cabeçalho.
 */
export const SECTION_ICON_BUTTON =
  "h-9 w-9 rounded-lg bg-card/80 border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground hover:border-foreground/20 transition-all duration-200";

export const SECTION_ICON_BUTTON_PRIMARY =
  "h-9 w-9 rounded-lg bg-primary text-primary-foreground border border-primary shadow-sm hover:bg-primary/90 transition-all duration-200";

export const SECTION_ICON = "h-4 w-4";
