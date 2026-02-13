import { ReactNode, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { PageTransition } from "@/components/PageTransition";

interface MainLayoutProps {
  children: ReactNode;
  onOpenHandover?: () => void;
}

export function MainLayout({ children, onOpenHandover }: MainLayoutProps) {
  useUserPresence();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcuts(true),
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar onOpenHandover={onOpenHandover} />
        
        <div className="flex-1 flex flex-col w-full">
          <main className="flex-1 overflow-auto">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          
          <footer className="fixed bottom-2 right-4 z-50 pointer-events-none">
            <p className="text-[9px] text-muted-foreground/30 tracking-wider">
              Powered by <span className="font-semibold">Axius</span>
            </p>
          </footer>
        </div>
      </div>

      <GlobalSearchDialog />
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </SidebarProvider>
  );
}
