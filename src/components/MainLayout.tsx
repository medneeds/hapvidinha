import { ReactNode, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserPresence } from "@/hooks/useUserPresence";

interface MainLayoutProps {
  children: ReactNode;
  onOpenHandover?: () => void;
}

export function MainLayout({ children, onOpenHandover }: MainLayoutProps) {
  // Initialize user presence tracking
  useUserPresence();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar onOpenHandover={onOpenHandover} />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="fixed bottom-2 right-4 z-50 pointer-events-none">
            <p className="text-[10px] text-muted-foreground/40 italic">
              Desenvolvido por Artur Batista
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
