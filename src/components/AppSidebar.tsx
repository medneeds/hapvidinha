import {
  FileText,
  Stethoscope,
  FileSearch,
  ClipboardList,
  BookOpen,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const menuItems = [
  {
    title: "EXAME FÍSICO",
    icon: Stethoscope,
    items: [
      "PADRÃO CARDIOVASCULAR",
      "PADRÃO RESPIRATÓRIO",
      "PADRÃO NEUROLÓGICO",
      "PADRÃO ABDOMINAL",
    ],
  },
  {
    title: "CÓDIGOS DE EXAMES",
    icon: FileSearch,
    items: [
      "EXAMES LABORATORIAIS",
      "EXAMES DE IMAGEM",
      "PROCEDIMENTOS",
    ],
  },
  {
    title: "ANAMNESE",
    icon: ClipboardList,
    items: [
      "PADRÃO DE INTERNAÇÃO",
      "HISTÓRIA CLÍNICA",
      "REVISÃO DE SISTEMAS",
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
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="gap-0">
        {menuItems.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarGroup className="p-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/label h-12 cursor-pointer hover:bg-accent/50 transition-colors">
                  <section.icon className="h-4 w-4" />
                  {open && (
                    <>
                      <span className="flex-1 text-left uppercase text-xs font-semibold">
                        {section.title}
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </>
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton
                          className="hover:bg-accent/50 uppercase text-xs"
                          tooltip={item}
                        >
                          <FileText className="h-3 w-3 opacity-50" />
                          {open && <span>{item}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
