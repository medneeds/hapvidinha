import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Único controle de retração/expansão da sidebar.
 * Sempre visível, posicionado FORA da sidebar, ancorado à sua borda direita
 * e acompanhando a largura conforme o estado (expandida/colapsada).
 */
export function FloatingSidebarTrigger() {
  const { state, setOpen, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  const isOpenNow = isMobile ? openMobile : !isCollapsed;

  const handleToggle = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(isCollapsed);
    }
  };

  // Ancoragem à borda externa da sidebar
  // Desktop: usa as CSS vars do shadcn (--sidebar-width / --sidebar-width-icon)
  // Mobile: quando o drawer está aberto, cola na borda direita dele
  const leftStyle = isMobile
    ? openMobile
      ? "calc(var(--sidebar-width-mobile, 18rem) + 8px)"
      : "12px"
    : isCollapsed
      ? "calc(var(--sidebar-width-icon) + 10px)"
      : "calc(var(--sidebar-width) + 10px)";


  return (
    <Button
      variant="default"
      size="icon"
      onClick={handleToggle}
      style={{ left: leftStyle }}
      className={cn(
        "fixed top-4 z-50 h-8 w-8 rounded-full shadow-lg print:hidden",
        "bg-primary/90 hover:bg-primary text-primary-foreground",
        "backdrop-blur-sm border border-primary/30",
        "transition-[left,transform,background-color] duration-200 ease-out",
        "hover:scale-105"
      )}
      title={isOpenNow ? "Retrair menu" : "Expandir menu"}
      aria-label={isOpenNow ? "Retrair menu lateral" : "Expandir menu lateral"}
    >
      {isOpenNow ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
