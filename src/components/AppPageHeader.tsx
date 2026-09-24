import { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LucideIcon } from "lucide-react";

interface AppPageHeaderProps {
  title: string;
  icon?: LucideIcon;
  right?: ReactNode;
}

/**
 * Barra superior azul fina, padronizada com o cabeçalho da tela de início (MAPA).
 * Fixa no topo, acompanha a largura da sidebar.
 */
export function AppPageHeader({ title, icon: Icon, right }: AppPageHeaderProps) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <>
      <header
        className="app-glass-header border-b border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl fixed top-0 right-0 z-50 shadow-sm print:bg-white print:text-black transition-[left] duration-200 ease-linear"
        style={{
          left: 0,
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1 pl-12 md:pl-[21rem]">
              {Icon && (
                <div className="rounded-lg bg-sidebar-accent p-2 backdrop-blur-sm flex-shrink-0">
                  <Icon className="h-4 w-4 text-sidebar-accent-foreground" />
                </div>
              )}
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-sidebar-foreground truncate">
                {title}
              </h1>
            </div>
            {right && <div className="flex items-center gap-2 flex-shrink-0 pr-[52px] sm:pr-[104px]">{right}</div>}
          </div>
        </div>
      </header>
      {/* Espaçador para compensar a barra fixa */}
      <div className="h-14 sm:h-16 print:hidden" aria-hidden />
    </>
  );
}
