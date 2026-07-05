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
        className="border-b border-white/10 bg-gradient-to-r from-[#011d54] via-[#013ba6] to-[#0256d4] backdrop-blur-xl fixed top-0 right-0 z-50 shadow-[0_4px_20px_-4px_rgba(1,59,166,0.5)] print:hidden transition-[left] duration-200 ease-linear"
        style={{
          left: isMobile
            ? 0
            : state === "collapsed"
              ? "var(--sidebar-width-icon)"
              : "var(--sidebar-width)",
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1 pl-10 sm:pl-12">
              {Icon && (
                <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              )}
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-white truncate">
                {title}
              </h1>
            </div>
            {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
          </div>
        </div>
      </header>
      {/* Espaçador para compensar a barra fixa */}
      <div className="h-14 sm:h-16 print:hidden" aria-hidden />
    </>
  );
}
