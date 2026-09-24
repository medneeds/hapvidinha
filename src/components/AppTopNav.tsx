import {
  LayoutDashboard,
  ArrowRightLeft,
  FolderOpen,
  FolderArchive,
  ListChecks,
  ClipboardCheck,
  StickyNote,
  BookOpen,
  BarChart3,
  User,
  KeyRound,
  LogOut,
  Menu,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { whitelabel } from "@/config/whitelabel";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnitChecklist } from "@/hooks/useUnitChecklist";
import { usePendingPasswordResets } from "@/hooks/usePendingPasswordResets";
import { QuickChecklistDialog } from "@/components/QuickChecklistDialog";
import { QuickNotesDialog } from "@/components/QuickNotesDialog";
import { MedicalCodesDialog } from "@/components/MedicalCodesDialog";
import { ChangeOwnPasswordDialog } from "@/components/ChangeOwnPasswordDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { HEADER_ICON_BUTTON } from "@/lib/headerButtonStyles";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  description: string;
  icon: LucideIcon;
  link?: string;
  action?: "checklist" | "notes" | "codes" | "password" | "signout";
  badge?: number;
  danger?: boolean;
};

type NavGroup = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  items: NavItem[];
  requiresPassword?: boolean;
};

const REPOSITORY_USER_IDS = [
  "a84c5c12-9c26-4075-b6c9-8172ab40cd7f", // Pedro Rebouças
  "0a793d7d-7f5d-402b-8f69-ad33edf6d5d4", // Marcio Serra
  "988e9a9a-a04e-406a-93ea-5dc579ed34f8", // Artur Batista
  "a81bfb8e-0740-4dff-a4a7-eb47edc4b34b", // Leandro de Araujo Albuquerque
  "7bd2b654-d680-4b85-a9b8-40597a7ee584", // Luciara Cunha Duarte
];

/**
 * Navegação principal no cabeçalho (substitui a sidebar).
 * Ícones agrupados por tipo: dica ao passar o mouse + menu descritivo ao clicar.
 * No celular, um único botão abre todas as opções.
 */
export function AppTopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { signOut, user, role } = useAuth();
  const { items: checklistItems } = useUnitChecklist();
  const pendingChecklist = checklistItems.filter((i) => !i.completed).length;
  const { pendingCount: pendingResets } = usePendingPasswordResets();

  const [showChecklist, setShowChecklist] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const isGestorMaster = role === "admin";
  const isDoorUser = role === "porta";
  const isRecepcao = role === "recepcao";
  const isEnfermagem = role === "enfermagem";
  const mapOnly = isDoorUser || isRecepcao;
  const canAccessRepository = !!user && REPOSITORY_USER_IDS.includes(user.id);

  const groups: NavGroup[] = [];

  groups.push({
    key: "assistencia",
    title: "ASSISTÊNCIA",
    description: "Mapa de leitos e movimentações",
    icon: Stethoscope,
    items: [
      { name: "MAPA", description: "Leitos e pacientes do setor", icon: LayoutDashboard, link: "/" },
      ...(!mapOnly
        ? [{ name: "MOVIMENTAÇÕES", description: "Altas, transferências e óbitos", icon: ArrowRightLeft, link: "/movements" }]
        : []),
    ],
  });

  if (!mapOnly) {
    groups.push({
      key: "documentos",
      title: "DOCUMENTOS",
      description: "Modelos e arquivos compartilhados",
      icon: FolderOpen,
      items: [
        { name: "DOCUMENTOS", description: "Modelos e formulários clínicos", icon: FolderOpen, link: "/documents" },
        ...(canAccessRepository
          ? [{ name: "REPOSITÓRIO", description: "Arquivos compartilhados do hospital", icon: FolderArchive, link: "/repositorio" }]
          : []),
      ],
    });
  }

  groups.push({
    key: "recursos",
    title: "RECURSOS RÁPIDOS",
    description: "Checklist, anotações e códigos",
    icon: ListChecks,
    items: [
      { name: "CHECKLIST", description: "Tarefas pendentes da unidade", icon: ClipboardCheck, action: "checklist", badge: pendingChecklist || undefined },
      { name: "ANOTAÇÕES", description: "Notas rápidas do plantão", icon: StickyNote, action: "notes" },
      { name: "CÓDIGOS & PROCEDIMENTOS", description: "Consulta de códigos médicos", icon: BookOpen, action: "codes" },
    ],
  });

  if (!mapOnly && !isEnfermagem) {
    groups.push({
      key: "admin",
      title: "PAINEL ADMIN",
      description: "Gestão, auditoria e cadastros",
      icon: BarChart3,
      requiresPassword: true,
      items: [
        { name: "DASHBOARD DE GESTÃO", description: "Indicadores do setor", icon: BarChart3, link: "/dashboard" },
        { name: "GESTÃO DE USUÁRIOS", description: "Contas e redefinições de senha", icon: User, link: "/user-management", badge: pendingResets || undefined },
        { name: "TRILHA DE AUDITORIA", description: "Registro de ações", icon: BarChart3, link: "/audit-logs" },
        { name: "PRIVACIDADE LGPD", description: "Anonimização e dados", icon: BarChart3, link: "/privacy" },
        { name: "CADASTRAR ESTADOS", description: "Estados da rede", icon: BarChart3, link: "/admin/states" },
        { name: "CADASTRAR UNIDADES", description: "Hospitais e unidades", icon: BarChart3, link: "/admin/units" },
        { name: "QUANTITATIVO DE LEITOS", description: "Leitos por setor", icon: BarChart3, link: "/admin/beds" },
        { name: "GERENCIAR COORDENADORES", description: "Coordenação por unidade", icon: BarChart3, link: "/admin/coordinators" },
        { name: "PROTOCOLOS SEPSE", description: "Registros de sepse", icon: BarChart3, link: "/admin/sepsis-protocols" },
        { name: "PROTOCOLOS AVC", description: "Registros de AVC", icon: BarChart3, link: "/admin/stroke-protocols" },
        { name: "PROTOCOLOS DOR TORÁCICA", description: "Registros de dor torácica", icon: BarChart3, link: "/admin/chest-pain-protocols" },
      ],
    });
  }

  const accountName = (user?.user_metadata?.username || user?.email?.split("@")[0] || "").toUpperCase();
  groups.push({
    key: "conta",
    title: "MINHA CONTA",
    description: accountName || "Senha e sessão",
    icon: User,
    items: [
      { name: "ALTERAR MINHA SENHA", description: "Defina uma nova senha", icon: KeyRound, action: "password" },
      { name: "SAIR", description: "Encerrar a sessão", icon: LogOut, action: "signout", danger: true },
    ],
  });

  const runItem = (item: NavItem, group: NavGroup) => {
    if (item.link) {
      if (group.requiresPassword && !isGestorMaster && !adminUnlocked) {
        setPendingNavigation(item.link);
        setShowAdminPassword(true);
        return;
      }
      navigate(item.link);
      return;
    }
    switch (item.action) {
      case "checklist": setShowChecklist(true); break;
      case "notes": setShowNotes(true); break;
      case "codes": setShowCodes(true); break;
      case "password": setShowChangePassword(true); break;
      case "signout": signOut(); break;
    }
  };

  const submitAdminPassword = () => {
    if (adminPassword === whitelabel.admin.panelPassword) {
      setAdminUnlocked(true);
      setShowAdminPassword(false);
      setAdminPassword("");
      if (pendingNavigation) navigate(pendingNavigation);
      setPendingNavigation(null);
      toast.success("Acesso ao Painel Admin liberado");
    } else {
      toast.error("Senha incorreta");
      setAdminPassword("");
    }
  };

  const isItemActive = (item: NavItem) => !!item.link && (item.link === "/" ? pathname === "/" : pathname.startsWith(item.link));
  const groupBadge = (g: NavGroup) => g.items.reduce((acc, i) => acc + (i.badge ?? 0), 0);

  const renderItems = (group: NavGroup) =>
    group.items.map((item) => {
      const Icon = item.icon;
      const active = isItemActive(item);
      return (
        <DropdownMenuItem
          key={item.name}
          onSelect={() => runItem(item, group)}
          className={cn(
            "flex items-start gap-3 py-2 cursor-pointer",
            active && "bg-accent",
            item.danger && "text-destructive focus:text-destructive",
          )}
        >
          <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", item.danger ? "text-destructive" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">{item.name}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.description}</p>
          </div>
          {!!item.badge && (
            <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {item.badge}
            </span>
          )}
        </DropdownMenuItem>
      );
    });

  const logo = (
    <div
      aria-label="HapMap"
      className="h-8 w-8 shrink-0 bg-gradient-to-br from-primary via-primary to-primary/80"
      style={{
        filter: "drop-shadow(0 2px 8px hsl(var(--primary) / 0.35))",
        WebkitMaskImage: "url(/logo-hm.png)", maskImage: "url(/logo-hm.png)",
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        WebkitMaskSize: "contain", maskSize: "contain",
      }}
    />
  );

  return (
    <TooltipProvider delayDuration={250}>
      <nav
        aria-label="Navegação principal"
        className="fixed top-[14px] sm:top-[18px] left-2 sm:left-4 z-[60] flex items-center gap-1.5 print:hidden"
      >
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(HEADER_ICON_BUTTON, "inline-flex items-center justify-center")} aria-label="Abrir menu">
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-[80vh] overflow-y-auto">
              {groups.map((g, i) => (
                <div key={g.key}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[10px] tracking-wider text-muted-foreground">{g.title}</DropdownMenuLabel>
                  {renderItems(g)}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            {logo}
            <div className="h-6 w-px bg-sidebar-border mx-1" />
            {groups.map((g) => {
              const Icon = g.icon;
              const active = g.items.some(isItemActive);
              const badge = groupBadge(g);
              return (
                <DropdownMenu key={g.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={g.title}
                          className={cn(
                            HEADER_ICON_BUTTON,
                            "relative inline-flex items-center justify-center",
                            active && "bg-sidebar-accent border-sidebar-foreground/30",
                          )}
                        >
                          <Icon className={cn("h-4 w-4", g.key === "conta" ? "" : "")} />
                          {active && <span className="absolute -bottom-[5px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-primary" />}
                          {badge > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-destructive-foreground">
                              {badge}
                            </span>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-left">
                      <p className="text-xs font-semibold">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground">{g.description}</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-72 max-h-[75vh] overflow-y-auto">
                    <DropdownMenuLabel className="text-[10px] tracking-wider text-muted-foreground">{g.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {renderItems(g)}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </>
        )}
      </nav>

      <QuickChecklistDialog open={showChecklist} onOpenChange={setShowChecklist} />
      <QuickNotesDialog open={showNotes} onOpenChange={setShowNotes} />
      <MedicalCodesDialog open={showCodes} onOpenChange={setShowCodes} />
      <ChangeOwnPasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />

      <AlertDialog open={showAdminPassword} onOpenChange={setShowAdminPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Restrito - Painel Admin</AlertDialogTitle>
            <AlertDialogDescription>Digite a senha de coordenador para acessar o Painel Admin.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Senha de coordenador"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdminPassword()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={submitAdminPassword}>Acessar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
