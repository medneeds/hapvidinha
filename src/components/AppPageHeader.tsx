import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface AppPageHeaderProps {
  title: string;
  icon?: LucideIcon;
  right?: ReactNode;
}

/**
 * Barra superior padronizada com o cabeçalho da tela de início (MAPA).
 * No celular fica presa no topo (52px) e reserva espaço para os botões de
 * navegação (menu à esquerda, conta à direita).
 */
export function AppPageHeader({ title, icon: Icon, right }: AppPageHeaderProps) {
  return (
    <>
      <header
        className="app-glass-header border-b border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl fixed top-0 right-0 z-50 shadow-sm print:bg-white print:text-black transition-[left] duration-200 ease-linear"
        style={{
          left: 0,
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 min-h-9">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 pl-11 pr-11 sm:pr-[86px] md:pr-0 md:pl-[15.5rem]">
              {Icon && (
                <div className="rounded-lg bg-sidebar-accent p-1.5 md:p-2 backdrop-blur-sm flex-shrink-0">
                  <Icon className="h-4 w-4 text-sidebar-accent-foreground" />
                </div>
              )}
              <h1 className="text-sm md:text-lg font-bold tracking-tight uppercase text-sidebar-foreground truncate">
                {title}
              </h1>
            </div>
            {right && <div className="flex items-center gap-2 flex-shrink-0 pr-[52px] sm:pr-[94px]">{right}</div>}
          </div>
        </div>
      </header>
      {/* Espaçador para compensar a barra fixa (no celular a barra já ocupa seu espaço) */}
      <div className="hidden md:block h-14 sm:h-16 print:hidden" aria-hidden />
    </>
  );
}
