import {
  Users,
  BookOpen,
  LogOut,
  ClipboardCheck,
  LayoutDashboard,
  User,
  FolderOpen,
  BarChart3,
  LockKeyhole,
  Shield,
  Bell,
  PanelLeftClose,
  PanelLeft,
  KeyRound,
  ArrowRightLeft,
  ListChecks,
  StickyNote,
  BookMarked,
} from "lucide-react";
import { QuickChecklistDialog } from "@/components/QuickChecklistDialog";
import { QuickNotesDialog } from "@/components/QuickNotesDialog";
import { MedicalCodesDialog } from "@/components/MedicalCodesDialog";
import { useUnitChecklist } from "@/hooks/useUnitChecklist";
import { useNavigate } from "react-router-dom";
import { whitelabel } from "@/config/whitelabel";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
import { usePendingPasswordResets } from "@/hooks/usePendingPasswordResets";
import { ChangeOwnPasswordDialog } from "@/components/ChangeOwnPasswordDialog";

export function AppSidebar({ 
  onOpenHandover
}: { 
  onOpenHandover?: () => void;
}) {
  const { open, setOpen, openMobile, setOpenMobile, state } = useSidebar();
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showChangeOwnPassword, setShowChangeOwnPassword] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const { items: checklistItems } = useUnitChecklist();
  const pendingChecklist = checklistItems.filter((i) => !i.completed).length;
  const [password, setPassword] = useState("");
  
  // Hook for pending password reset requests
  const { pendingCount: pendingResets } = usePendingPasswordResets();
  
  // Privileged access is determined by server-enforced role only
  const isCoordinator = role === "admin";

  // Gestor Master = admin role (full access without password gates)
  const isGestorMaster = role === "admin";

  // Check if user is BIGDOOR (porta role)
  const isDoorUser = role === "porta";

  // Coordenador Médico tier removed in favor of single admin role
  const isCoordenadorMedico = false;

  // Check if user is Recepção or Enfermagem (view-only roles)
  const isRecepcao = role === "recepcao";
  const isEnfermagem = role === "enfermagem";
  const isViewOnlyRole = isRecepcao || isEnfermagem;

  const allMenuItems = [
    {
      title: "MAPA",
      icon: LayoutDashboard,
      link: "/",
    },
    {
      title: "MOVIMENTAÇÕES",
      icon: ArrowRightLeft,
      link: "/movements",
    },
    {
      title: "DOCUMENTOS",
      icon: FolderOpen,
      link: "/documents",
    },
    {
      title: "PAINEL ADMIN",
      icon: BarChart3,
      requiresPassword: true,
      items: [
        { name: "DASHBOARD DE GESTÃO", link: "/dashboard" },
        { name: "GESTÃO DE USUÁRIOS", link: "/user-management", badge: pendingResets > 0 ? pendingResets : undefined },
        { name: "TRILHA DE AUDITORIA", link: "/audit-logs" },
        { name: "PRIVACIDADE LGPD", link: "/privacy" },
        { name: "CADASTRAR ESTADOS", link: "/admin/states" },
        { name: "CADASTRAR UNIDADES", link: "/admin/units" },
        { name: "GERENCIAR COORDENADORES", link: "/admin/coordinators" },
        { name: "PROTOCOLOS SEPSE", link: "/admin/sepsis-protocols" },
        { name: "PROTOCOLOS AVC", link: "/admin/stroke-protocols" },
        { name: "PROTOCOLOS DOR TORÁCICA", link: "/admin/chest-pain-protocols" },
      ],
    },
  ];

  // Filtra itens de menu baseado no papel do usuário
  const baseMenuItems = isDoorUser 
    ? allMenuItems.filter(item => item.title === "MAPA")
    : isRecepcao
    ? allMenuItems.filter(item => item.title === "MAPA")
    : isEnfermagem
    ? allMenuItems.filter(item => item.title === "MAPA" || item.title === "MOVIMENTAÇÕES" || item.title === "DOCUMENTOS")
    : isCoordenadorMedico
    ? allMenuItems.map(item => {
        if (item.title === "PAINEL ADMIN") {
          return {
            ...item,
            items: item.items?.filter(sub => sub.name === "DASHBOARD DE GESTÃO"),
          };
        }
        return item;
      })
    : allMenuItems;

  const menuItems = baseMenuItems;

  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [unlockedSections, setUnlockedSections] = useState<string[]>([]);
  const [adminSectionOpen, setAdminSectionOpen] = useState<Record<string, boolean>>({});

  const handleAdminSectionClick = (sectionTitle: string) => {
    // Gestor Master has instant access without password
    if (isGestorMaster) {
      if (!unlockedSections.includes(sectionTitle)) {
        setUnlockedSections(prev => [...prev, sectionTitle]);
      }
      return;
    }
    setSelectedSection(sectionTitle);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = () => {
    if (password === whitelabel.admin.panelPassword) {
      // Unlock the section
      if (selectedSection && !unlockedSections.includes(selectedSection)) {
        setUnlockedSections(prev => [...prev, selectedSection]);
      }
      
      setShowPasswordDialog(false);
      setPassword("");
      setSelectedSection(null);
      
      // If there was a pending navigation (from clicking a subitem), navigate to it
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
      
      if (isMobile) {
        setOpenMobile(false);
      }
      
      toast.success("Acesso ao Painel Admin liberado");
    } else {
      toast.error("Senha incorreta");
      setPassword("");
    }
  };

  const handleItemClick = (item: string | { name: string; link?: string | null; action?: string; subsections?: any[] }, parentSection?: any) => {
    // Check if parent section requires password (Gestor Master bypasses)
    if (parentSection?.requiresPassword && !isGestorMaster) {
      setPendingNavigation(typeof item === 'string' ? item : (item.link || null));
      setSelectedSection(parentSection.title);
      setShowPasswordDialog(true);
      return;
    }
    // Handle direct string links (like from section.link)
    if (typeof item === 'string') {
      navigate(item);
      if (isMobile) {
        setOpenMobile(false);
      }
      return;
    }
    
    // Handle object items
    if (typeof item === 'object') {
      // Skip if item has subsections (it's a collapsible parent)
      if (item.subsections) {
        return;
      }
      
      if (item.action === 'openHandover' && onOpenHandover) {
        onOpenHandover();
        if (isMobile) {
          setOpenMobile(false);
        }
      } else if (item.action === 'openSepsisProtocol') {
        navigate('/sepsis-protocol');
        if (isMobile) {
          setOpenMobile(false);
        }
      } else if (item.link) {
        navigate(item.link);
        if (isMobile) {
          setOpenMobile(false);
        }
      }
    }
  };

  const sidebarContent = (
    <>
       <SidebarHeader className={cn(
         "border-b border-border/20 py-5 bg-background relative overflow-hidden",
         isCollapsed ? "px-0" : "px-3"
       )}>
        {/* Subtle gradient accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        
        <div className="flex items-center justify-center relative w-full">
          <div className="flex items-center justify-center">

            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 animate-fade-in">
                {/* Símbolo hm — mesmo formato da tela de login */}
                <div
                  aria-label="HapMap"
                  className="h-10 w-10 bg-background flex items-center justify-center rounded-[28%] shrink-0 border border-border/40"
                  style={{
                    transform: "rotate(42deg)",
                    boxShadow:
                      "0 8px 16px -8px rgba(1,59,166,0.35), inset 0 1px 4px rgba(1,59,166,0.08)",
                  }}
                >
                  <div
                    className="w-[80%] h-[80%] bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]"
                    style={{
                      transform: "rotate(-42deg)",
                      WebkitMaskImage: "url(/logo-hm.png)",
                      maskImage: "url(/logo-hm.png)",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                </div>
                {/* Wordmark hap/map empilhado */}
                <div className="flex flex-col leading-[0.85]">
                  <span className="font-brand text-2xl lowercase text-foreground font-bold">hap</span>
                  <span className="font-brand text-2xl lowercase text-foreground/90 tracking-[0.06em]" style={{ fontWeight: 300 }}>map</span>
                </div>
              </div>
            ) : (
              <div
                aria-label="HapMap"
                className="h-7 w-7 bg-background flex items-center justify-center rounded-[28%] shrink-0 mx-auto border border-border/40"
                style={{
                  transform: "rotate(42deg)",
                  boxShadow:
                    "0 6px 12px -6px rgba(1,59,166,0.35), inset 0 1px 3px rgba(1,59,166,0.08)",
                }}
              >
                <div
                  className="w-[80%] h-[80%] bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]"
                  style={{
                    transform: "rotate(-42deg)",
                    WebkitMaskImage: "url(/logo-hm.png)",
                    maskImage: "url(/logo-hm.png)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </div>
            )}


          </div>
          {/* Botão de retração movido para fora da sidebar (FloatingSidebarTrigger) */}

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
              open={section.requiresPassword 
                ? (isGestorMaster || unlockedSections.includes(section.title)) 
                  ? (adminSectionOpen[section.title] ?? false)
                  : false
                : undefined}
              onOpenChange={(isOpen) => {
                if (section.requiresPassword) {
                  if (!isGestorMaster && !unlockedSections.includes(section.title) && isOpen) {
                    handleAdminSectionClick(section.title);
                  } else {
                    setAdminSectionOpen(prev => ({ ...prev, [section.title]: isOpen }));
                  }
                }
              }}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0 my-0">
                {section.requiresPassword && !isGestorMaster && !unlockedSections.includes(section.title) ? (
                  // Locked: show button that triggers password dialog
                  <SidebarGroupLabel 
                    className={cn(
                      "transition-all duration-200 hover:bg-accent/80 cursor-pointer !opacity-100 !mt-0",
                      isCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3 hover:scale-105",
                      "h-auto border-b border-border/50"
                    )}
                    onClick={() => handleAdminSectionClick(section.title)}
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
                          <LockKeyhole className="h-3 w-3 opacity-60" />
                        </>
                      )}
                    </div>
                  </SidebarGroupLabel>
                ) : (
                  // Unlocked or not password-protected: normal collapsible trigger
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel 
                      className={cn(
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
                )}
                <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <SidebarGroupContent className="px-2">
                    <SidebarMenu>
                      {section.items.map((item, itemIndex) => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        const itemKey = typeof item === 'string' ? item : item.name;
                        const hasSubsections = typeof item === 'object' && 'subsections' in item && item.subsections;
                        
                        // If item has subsections, render as nested collapsible
                        if (hasSubsections) {
                          return (
                            <Collapsible key={itemKey} className="group/nested">
                              <CollapsibleTrigger className="w-full">
                                <SidebarMenuItem>
                                  <SidebarMenuButton
                                    className="group/item hover:bg-accent/80 hover:border-l-2 hover:border-l-primary/50 transition-all duration-200 uppercase text-[11px] rounded-lg hover:shadow-sm cursor-pointer gap-3 mb-1 justify-between"
                                    tooltip={itemName}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="rounded-full bg-primary/20 transition-all duration-200 group-hover/item:scale-150 flex-shrink-0 h-2 w-2 ml-1" />
                                      <span className="flex-1 text-left font-medium ml-1 animate-fade-in">
                                        {itemName}
                                      </span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/nested:rotate-180 mr-2" />
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                <SidebarMenu className="ml-4 border-l border-border/30 pl-2">
                                  {item.subsections && Array.isArray(item.subsections) && item.subsections.map((subitem: any) => (
                                    <SidebarMenuItem key={subitem.name}>
                                      <SidebarMenuButton
                                        className="group/subitem hover:bg-accent/60 transition-all duration-200 uppercase text-[10px] rounded-lg cursor-pointer gap-2 hover:translate-x-1 mb-1"
                                        tooltip={subitem.name}
                                        onClick={() => handleItemClick(subitem)}
                                      >
                                        <div className="rounded-full bg-primary/10 transition-all duration-200 group-hover/subitem:scale-150 flex-shrink-0 h-1.5 w-1.5" />
                                        <span className="flex-1 text-left font-normal animate-fade-in">
                                          {subitem.name}
                                        </span>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  ))}
                                </SidebarMenu>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        }
                        
                        // Regular item without subsections
                        const itemBadge = typeof item === 'object' && 'badge' in item ? (item as any).badge : undefined;
                        
                        return (
                          <SidebarMenuItem key={itemKey}>
                                     <SidebarMenuButton
                                        className="group/item hover:bg-accent/80 hover:border-l-2 hover:border-l-primary/50 transition-all duration-200 uppercase text-[11px] rounded-lg hover:shadow-sm cursor-pointer gap-3 hover:translate-x-1 mb-1"
                                        tooltip={itemName}
                                        onClick={() => handleItemClick(item, section)}
                                      >
                              <div className="rounded-full bg-primary/20 transition-all duration-200 group-hover/item:scale-150 flex-shrink-0 h-2 w-2 ml-1" />
                              <span className="flex-1 text-left font-medium ml-1 animate-fade-in">
                                {itemName}
                              </span>
                              {itemBadge !== undefined && (
                                <Badge 
                                  variant="destructive" 
                                  className="h-5 min-w-5 px-1.5 text-[10px] font-bold animate-pulse"
                                >
                                  {itemBadge}
                                </Badge>
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
            )}
            {index < menuItems.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3 mx-4" />
            )}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2 bg-muted/30">
        <div className={cn(
          "rounded-xl transition-all duration-200",
          isCollapsed
            ? "flex flex-col items-center gap-1 p-1"
            : "flex items-center gap-3 p-2 bg-card/50"
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
          <div className={cn(
            "flex items-center",
            isCollapsed ? "flex-col gap-1 w-full" : "gap-1"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChangeOwnPassword(true)}
              className={cn(
                "hover:bg-primary/10 hover:text-primary transition-all duration-200 flex-shrink-0",
                isCollapsed ? "h-8 w-8" : "h-9 w-9"
              )}
              title="Alterar minha senha"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className={cn(
                "hover:bg-destructive/10 hover:text-destructive transition-all duration-200 flex-shrink-0",
                isCollapsed ? "h-8 w-8" : "h-9 w-9"
              )}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChangeOwnPasswordDialog
          open={showChangeOwnPassword}
          onOpenChange={setShowChangeOwnPassword}
        />
      </SidebarFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={openMobile} onOpenChange={setOpenMobile} modal={true}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-3 pt-2">
            <DrawerTitle className="text-center text-sm font-semibold uppercase tracking-wide">Menu de Navegação</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 px-2">
            {sidebarContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-border bg-card transition-all duration-300 data-[state=collapsed]:w-[72px]"
      >
        {sidebarContent}
      </Sidebar>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Restrito - Painel Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Digite a senha de coordenador para acessar {selectedSection || "o Painel Admin"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Senha de coordenador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePasswordSubmit();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Acessar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
