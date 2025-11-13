import {
  FileText,
  Stethoscope,
  FileSearch,
  ClipboardList,
  BookOpen,
  Library,
} from "lucide-react";
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

const menuItems = [
  {
    title: "CÓDIGOS",
    icon: FileSearch,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    items: [
      "EXAMES",
      "PROCEDIMENTOS",
      "MATERIAIS",
      "MEDICAÇÕES",
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
    title: "ANAMNESE",
    icon: ClipboardList,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    items: [
      "PADRÃO DE INTERNAÇÃO",
      "HISTÓRIA CLÍNICA",
      "REVISÃO DE SISTEMAS",
    ],
  },
  {
    title: "EXAME FÍSICO",
    icon: Stethoscope,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    items: [
      "PADRÃO CARDIOVASCULAR",
      "PADRÃO RESPIRATÓRIO",
      "PADRÃO NEUROLÓGICO",
      "PADRÃO ABDOMINAL",
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/50 bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl"
    >
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-4 px-3 py-4">
          <div className="h-9 w-9 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transition-transform hover:scale-105">
            <Library className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex-1">
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

      <SidebarContent className="gap-0 py-2">
        {menuItems.map((section, index) => (
          <div key={section.title}>
            <Collapsible
              defaultOpen={false}
              className="group/collapsible"
            >
              <SidebarGroup className="p-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className={`group/label h-14 cursor-pointer transition-all duration-300 hover:${section.bgColor} hover:border-l-2 hover:border-l-primary/50 mx-2 rounded-lg mb-1 gap-4`}>
                    <div className={`h-9 w-9 ${section.bgColor} rounded-lg flex items-center justify-center transition-all duration-300 group-hover/label:scale-110 group-hover/label:shadow-md flex-shrink-0`}>
                      <section.icon className={`h-4 w-4 ${section.color}`} />
                    </div>
                    {open && (
                      <>
                        <div className="flex-1 ml-1">
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
                  <SidebarGroupContent className="px-2">
                    <SidebarMenu>
                      {section.items.map((item, itemIndex) => (
                        <SidebarMenuItem key={item}>
                          <SidebarMenuButton
                            className="group/item hover:bg-accent/80 hover:border-l-2 hover:border-l-primary/50 transition-all duration-200 uppercase text-[11px] rounded-lg mb-1 hover:shadow-sm hover:translate-x-1 gap-3"
                            tooltip={item}
                          >
                            <div className={`h-2 w-2 rounded-full ${section.bgColor} ${section.color} transition-all duration-200 group-hover/item:scale-150 ml-1`} />
                            {open && (
                              <span className="flex-1 text-left font-medium ml-1">
                                {item}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            {index < menuItems.length - 1 && open && (
              <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
