import { ReactNode, useEffect, useRef, useState } from "react";
import { whitelabel } from "@/config/whitelabel";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { PageTransition } from "@/components/PageTransition";

import { FloatingSidebarTrigger } from "@/components/FloatingSidebarTrigger";

interface MainLayoutProps {
  children: ReactNode;
  onOpenHandover?: () => void;
}

export function MainLayout({ children, onOpenHandover }: MainLayoutProps) {
  useUserPresence();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const activeGlassSurface = useRef<HTMLElement | null>(null);

  const handleGlassPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const target = event.target instanceof Element ? event.target : null;
    const surface = target?.closest<HTMLElement>(
      ".app-glass-surface, .app-glass-header, .app-glass-scope .rounded-lg.border.bg-card, .app-glass-scope .rounded-xl.border.bg-card",
    );

    if (activeGlassSurface.current !== surface) {
      activeGlassSurface.current?.style.removeProperty("--app-glass-x");
      activeGlassSurface.current?.style.removeProperty("--app-glass-y");
      activeGlassSurface.current = surface ?? null;
    }
    if (!surface) return;

    const bounds = surface.getBoundingClientRect();
    surface.style.setProperty("--app-glass-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    surface.style.setProperty("--app-glass-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  };

  const resetGlassPointer = () => {
    activeGlassSurface.current?.style.removeProperty("--app-glass-x");
    activeGlassSurface.current?.style.removeProperty("--app-glass-y");
    activeGlassSurface.current = null;
  };

  // Reflexo suave dos botões acompanhando o cursor (global, herda a cor do setor)
  useEffect(() => {
    let active: HTMLElement | null = null;

    const clear = () => {
      active?.style.removeProperty("--btn-glass-x");
      active?.style.removeProperty("--btn-glass-y");
      active = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLElement>("button") ?? null;
      if (button !== active) clear();
      if (!button) return;
      active = button;
      const bounds = button.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      button.style.setProperty("--btn-glass-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      button.style.setProperty("--btn-glass-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      clear();
    };
  }, []);

  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcuts(true),
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar onOpenHandover={onOpenHandover} />
        <FloatingSidebarTrigger />
        
        <div className="flex-1 flex flex-col w-full">
          <main
            className="flex-1 overflow-auto"
            onPointerMove={handleGlassPointerMove}
            onPointerLeave={resetGlassPointer}
          >
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          
          <footer className="fixed bottom-2 right-4 z-50 pointer-events-none">
            <p className="text-[10px] text-muted-foreground/40 italic">
              {whitelabel.credits.footerText}
            </p>
          </footer>
        </div>
      </div>

      <GlobalSearchDialog />
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      
    </SidebarProvider>
  );
}
