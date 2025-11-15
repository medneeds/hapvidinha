import {
  FileSearch,
  Users,
  BookOpen,
  LogOut,
  ClipboardCheck,
  LayoutDashboard,
  LayoutGrid,
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
  useSidebar,
} from "@/components/ui/sidebar";
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

const menuItems = [
  {
    title: "MAPA",
    icon: LayoutDashboard,
    link: "/",
  },
  {
    title: "PASSAGENS",
    icon: ClipboardCheck,
    link: "/handovers",
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

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (item: string | { name: string; link: string | null }) => {
    if (typeof item === 'object' && item.link) {
      navigate(item.link);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <Sidebar 
      ref={sidebarRef}
      collapsible="icon" 
      className="border-r border-border bg-card transition-all duration-300 data-[state=collapsed]:w-[72px]"
      onClick={() => {
        if (!open) setOpen(true);
      }}
    >
      <SidebarHeader className="border-b border-border/30 px-3 py-3 bg-white">
        <div className="flex items-center justify-center">
          {open ? (
            <img 
              src={hapvidaLogo} 
              alt="Hapvida NotreDame Intermédica" 
              className="w-full h-auto max-h-14 object-contain animate-fade-in"
            />
          ) : (
            <img 
              src={hapvidaLogo} 
              alt="Hapvida" 
              className="w-12 h-12 object-contain object-left"
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`gap-0 transition-all duration-300 ${open ? 'py-2' : 'py-3'}`}>
        {menuItems.map((section, index) => (
          <div key={section.title}>
            {/* Direct link item (without subitems) */}
            {section.link && (
              <SidebarGroup className="py-0 my-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(section.link)}
                      className={cn(
                        "transition-all duration-200 hover:bg-accent/80 hover:scale-105",
                        open ? "justify-start px-4 py-3 h-auto" : "justify-center py-3 px-0 h-14 w-full",
                        "border-b border-border/50"
                      )}
                      title={!open ? section.title : undefined}
                    >
                      {!open ? (
                        <section.icon className="h-6 w-6 text-foreground transition-all duration-200" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <section.icon className="h-5 w-5 text-foreground transition-all duration-200" />
                          <span className="text-xs font-medium uppercase tracking-wide text-foreground">
                            {section.title}
                          </span>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Collapsible section (with subitems) */}
            {section.items && (
            <Collapsible
              defaultOpen={false}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0 my-0">
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className={cn(
                    "transition-all duration-200 hover:bg-accent/80 hover:scale-105 cursor-pointer",
                    open ? "justify-between px-4 py-3 h-auto" : "justify-center py-3 px-0 h-14 w-full flex-col gap-0",
                    "border-b border-border/50"
                  )}
                  title={!open ? section.title : undefined}
                  >
                    {!open ? (
                      <section.icon className="h-6 w-6 text-foreground transition-all duration-200" />
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <section.icon className="h-5 w-5 text-foreground transition-all duration-200" />
                        <span className="text-xs font-medium uppercase tracking-wide text-foreground flex-1 text-left">
                          {section.title}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </div>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                {open && (
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
                )}
              </SidebarGroup>
            </Collapsible>
            )}
            {index < menuItems.length - 1 && (
              <div className={`h-px bg-gradient-to-r from-transparent via-border to-transparent transition-all duration-300 ${open ? 'my-3 mx-4' : 'my-4 mx-2'}`} />
            )}
          </div>
        ))}
      </SidebarContent>

      {/* Logout Button */}
      <div className={`border-t border-border/50 transition-all duration-300 ${open ? 'p-2' : 'p-3 py-4'}`}>
        <Button
          variant="ghost"
          onClick={signOut}
          className={`w-full transition-all duration-300 hover:bg-destructive/10 hover:text-destructive rounded-xl ${open ? 'justify-start gap-3 h-12' : 'justify-center h-14'}`}
          title={!open ? 'Sair' : undefined}
        >
          {!open ? (
            <div className="bg-destructive/10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 h-12 w-12">
              <LogOut className="text-destructive h-6 w-6" />
            </div>
          ) : (
            <>
              <div className="bg-destructive/10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 h-9 w-9 flex-shrink-0">
                <LogOut className="text-destructive h-4 w-4" />
              </div>
              <div className="flex-1 text-left animate-fade-in">
                <span className="text-xs font-bold uppercase tracking-tight block">
                  Sair
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {user?.user_metadata?.username || user?.email?.split('@')[0]}
                </span>
              </div>
            </>
          )}
        </Button>
      </div>
    </Sidebar>
  );
}
