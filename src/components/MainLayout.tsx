import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MainLayoutProps {
  children: ReactNode;
  onOpenHandover?: () => void;
}

export function MainLayout({ children, onOpenHandover }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <ThemeToggle />
        </header>

        {/* Sidebar + Main Content */}
        <div className="flex flex-1 w-full">
          <AppSidebar onOpenHandover={onOpenHandover} />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
