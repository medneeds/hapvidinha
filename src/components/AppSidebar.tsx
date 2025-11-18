import {
  FileSearch,
  Users,
  BookOpen,
  LogOut,
  ClipboardCheck,
  LayoutDashboard,
  LayoutGrid,
  User,
  FolderOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import hapvidaLogo from "@/assets/hapvida-notredame-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  {
    title: "MAPA",
    icon: LayoutDashboard,
    link: "/",
  },
  {
    title: "VERSÕES",
    icon: LayoutGrid,
    link: "/versions",
  },
  {
    title: "DOCUMENTOS",
    icon: FolderOpen,
    items: [
      { name: "PROTOCOLO SEPSE", link: null },
      { name: "TOMOGRAFIAS", link: null },
      { name: "LISTAS OPME", link: null },
      { name: "HEMODERIVADOS", link: null },
      { name: "REGULAÇÕES SUS", link: null },
      { name: "ALTO CUSTO", link: null },
    ],
  },
  {
    title: "PASSAGENS",
    icon: ClipboardCheck,
    items: [
      { name: "INICIAR NOVA PASSAGEM", link: null, action: "openHandover" },
      { name: "HISTÓRICO DE PASSAGENS", link: "/handovers" },
    ],
  },
  {
    title: "CÓDIGOS",
    icon: FileSearch,
    items: [
      { name: "EXAMES", link: "/codigos?category=exames" },
      { name: "PROCEDIMENTOS", link: "/codigos?category=procedimentos" },
      { name: "MATERIAIS", link: "/codigos?category=materiais" },
      { name: "MEDICAÇÕES", link: "/codigos?category=medicacoes" },
    ],
  },
  {
    title: "PROTOCOLOS",
    icon: BookOpen,
    items: [
      "SEPSE",
      "IAM",
      "AVC",
      "TRAUMA",
      "INTOXICAÇÕES",
    ],
  },
  {
    title: "PACIENTES",
    icon: Users,
    items: [
      { name: "BLOCO DE NOTAS", link: "/resources" },
      { name: "BANCO DE SOLICITAÇÕES", link: "/resources" },
      { name: "PADRÃO DE INTERNAÇÃO", link: null },
      { name: "HISTÓRIA CLÍNICA", link: null },
      { name: "REVISÃO DE SISTEMAS", link: null },
      "PADRÕES DE EXAME FÍSICO",
    ],
  },
];

export function AppSidebar({ onOpenHandover }: { onOpenHandover?: () => void }) {
  const { open, setOpen, state } = useSidebar();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  const handleItemClick = (item: string | { name: string; link: string | null; action?: string }) => {
    // Handle direct string links (like from section.link)
    if (typeof item === 'string') {
      navigate(item);
      if (isMobile) {
        setOpen(false);
      }
      return;
    }
    
    // Handle object items
    if (typeof item === 'object') {
      if (item.action === 'openHandover' && onOpenHandover) {
        onOpenHandover();
        if (isMobile) {
          setOpen(false);
        }
      } else if (item.link) {
        navigate(item.link);
        if (isMobile) {
          setOpen(false);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (!isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen, isMobile]);

  const sidebarContent = (
    <>
      <SidebarHeader className="border-b border-border/30 px-3 py-3 bg-white">
        <div className="flex items-center justify-center">
          <img 
            src={hapvidaLogo} 
            alt="Hapvida NotreDame Intermédica" 
            className="w-full h-auto max-h-14 object-contain animate-fade-in"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {menuItems.map((section, index) => (
          <div key={section.title}>
            {/* Direct link item (without subitems) */}
            {section.link && !section.items && (
              <SidebarGroup className="py-0 my-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(section.link)}
                      className={cn(
                        "transition-all duration-200 hover:bg-accent/80 hover:scale-105",
                        "justify-start px-4 py-3 h-auto",
                        "border-b border-border/50"
                      )}
                    >
                      <section.icon className="h-5 w-5 text-primary transition-all duration-200" />
                      <span className="text-xs font-medium uppercase tracking-wide text-foreground">
                        {section.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Collapsible section (with subitems) */}
            {section.items && (
            <Collapsible
              defaultOpen={section.title === "MAPA"}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0 my-0">
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className={cn(
                    "transition-all duration-200 hover:bg-accent/80 cursor-pointer !opacity-100 !mt-0",
                    isCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3 hover:scale-105",
                    "h-auto border-b border-border/50"
                  )}
                  >
                    <div className={cn(
                      "flex items-center w-full",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}>
                      <section.icon className={cn(
                        "text-primary transition-all duration-200",
                        isCollapsed ? "h-5 w-5" : "h-5 w-5"
                      )} />
                      {!isCollapsed && (
                        <>
                          <span className="text-xs font-medium uppercase tracking-wide text-foreground flex-1 text-left">
                            {section.title}
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <SidebarGroupContent className="px-2">
                    <SidebarMenu>
                      {section.items.map((item, itemIndex) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemKey = typeof item === 'string' ? item : item.name;
                        
                        return (
                          <SidebarMenuItem key={itemKey}>
                            <SidebarMenuButton
                              className="group/item hover:bg-accent/80 hover:border-l-2 hover:border-l-primary/50 transition-all duration-200 uppercase text-[11px] rounded-lg hover:shadow-sm cursor-pointer gap-3 hover:translate-x-1 mb-1"
                              tooltip={itemName}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="rounded-full bg-primary/20 transition-all duration-200 group-hover/item:scale-150 flex-shrink-0 h-2 w-2 ml-1" />
                              <span className="flex-1 text-left font-medium ml-1 animate-fade-in">
                                {itemName}
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            )}
            {index < menuItems.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3 mx-4" />
            )}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3 bg-muted/30">
        <div className={cn(
          "flex items-center gap-3 rounded-xl p-2 transition-all duration-200",
          isCollapsed ? "justify-center" : "bg-card/50"
        )}>
          {!isCollapsed && (
            <>
              <div className="bg-primary/10 rounded-full flex items-center justify-center h-9 w-9 flex-shrink-0">
                <User className="text-primary h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {user?.user_metadata?.username || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 flex-shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          {sidebarContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sidebar 
      ref={sidebarRef}
      collapsible="icon" 
      className="border-r border-border bg-card transition-all duration-300 data-[state=collapsed]:w-[72px]"
      onClick={() => {
        if (!open) setOpen(true);
      }}
    >
      {sidebarContent}
    </Sidebar>
  );
}
