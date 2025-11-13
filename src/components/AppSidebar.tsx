import {
  FileText,
  Stethoscope,
  FileSearch,
  ClipboardList,
  BookOpen,
  Library,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const menuItems = [
  {
    title: "CÓDIGOS",
    icon: FileSearch,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
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
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
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
    icon: ClipboardList,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
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
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleItemClick = (item: string | { name: string; link: string | null }) => {
    if (typeof item === 'object' && item.link) {
      navigate(item.link);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/50 bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl transition-all duration-300"
    >
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className={`flex items-center transition-all duration-300 ${!open ? 'justify-center px-2 py-5' : 'gap-4 px-3 py-4'}`}>
          <div className={`bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-primary/50 ${open ? 'h-9 w-9' : 'h-11 w-11'}`}>
            <Library className={`text-primary-foreground transition-all duration-300 ${open ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </div>
          {open && (
            <div className="flex-1 animate-fade-in">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-tight">
                Recursos
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Médicos
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`gap-0 transition-all duration-300 ${open ? 'py-2' : 'py-3'}`}>
        {menuItems.map((section, index) => (
          <div key={section.title}>
            <Collapsible
              defaultOpen={false}
              className="group/collapsible"
            >
              <SidebarGroup className="p-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className={`group/label cursor-pointer transition-all duration-300 hover:${section.bgColor} hover:border-l-2 hover:border-l-primary/50 rounded-lg mb-1 ${open ? 'h-14 mx-2 gap-4' : 'h-14 mx-0 justify-center gap-0'}`}>
                    <div className={`${section.bgColor} rounded-lg flex items-center justify-center transition-all duration-300 group-hover/label:scale-110 flex-shrink-0 ${open ? 'h-9 w-9 group-hover/label:shadow-md' : 'h-11 w-11 group-hover/label:shadow-xl group-hover/label:shadow-primary/20'}`}>
                      <section.icon className={`${section.color} transition-all duration-300 ${open ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                    {open && (
                      <>
                        <div className="flex-1 ml-1 animate-fade-in">
                          <span className="text-xs font-bold text-foreground uppercase tracking-tight block">
                            {section.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {section.items.length} itens
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180 mr-1 flex-shrink-0" />
                      </>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <SidebarGroupContent className={open ? 'px-2' : 'px-0'}>
                    <SidebarMenu>
                      {section.items.map((item, itemIndex) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemKey = typeof item === 'string' ? item : item.name;
                        
                        return (
                          <SidebarMenuItem key={itemKey}>
                            <SidebarMenuButton
                              className={`group/item hover:bg-accent/80 hover:border-l-2 hover:border-l-primary/50 transition-all duration-200 uppercase text-[11px] rounded-lg mb-1 hover:shadow-sm cursor-pointer ${open ? 'gap-3 hover:translate-x-1' : 'justify-center gap-0 h-10'}`}
                              tooltip={itemName}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className={`rounded-full ${section.bgColor} ${section.color} transition-all duration-200 group-hover/item:scale-150 flex-shrink-0 ${open ? 'h-2 w-2 ml-1' : 'h-2.5 w-2.5'}`} />
                              {open && (
                                <span className="flex-1 text-left font-medium ml-1 animate-fade-in">
                                  {itemName}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            {index < menuItems.length - 1 && (
              <div className={`my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent transition-all duration-300 ${open ? 'mx-4' : 'mx-3'}`} />
            )}
          </div>
        ))}
      </SidebarContent>

      {/* Logout Button */}
      <div className={`border-t border-border/50 transition-all duration-300 ${open ? 'p-2' : 'p-3'}`}>
        <Button
          variant="ghost"
          onClick={signOut}
          className={`w-full transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-l-2 hover:border-l-destructive rounded-lg ${open ? 'justify-start gap-3 h-12' : 'justify-center h-12'}`}
        >
          <div className="bg-destructive/10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 flex-shrink-0 h-9 w-9">
            <LogOut className={`text-destructive transition-all duration-300 ${open ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          {open && (
            <div className="flex-1 text-left animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-tight block">
                Sair
              </span>
              <span className="text-[10px] text-muted-foreground">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </span>
            </div>
          )}
        </Button>
      </div>
    </Sidebar>
  );
}
