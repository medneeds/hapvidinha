import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Floating sidebar toggle that's ALWAYS visible — guarantees the user
 * can re-open the sidebar even when fully collapsed.
 */
export function FloatingSidebarTrigger() {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  if (!isCollapsed && !isMobile) return null;

  return (
    <Button
      variant="default"
      size="icon"
      onClick={() => (isMobile ? setOpenMobile(true) : setOpen(true))}
      className={cn(
        "fixed top-3 left-3 z-50 h-9 w-9 rounded-full shadow-lg",
        "bg-primary/90 hover:bg-primary text-primary-foreground",
        "backdrop-blur-sm border border-primary/30",
        "animate-fade-in"
      )}
      title="Expandir menu"
      aria-label="Expandir menu lateral"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
}
