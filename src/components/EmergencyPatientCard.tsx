import { isMobileViewport } from "@/hooks/use-mobile";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/patient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity, AlertCircle, ArrowLeftRight, ArrowRightLeft, BedDouble, ChevronDown, ChevronRight, ClipboardList,
  Edit, FileEdit, FileText, FlaskConical, FolderOpen, MoreVertical, Printer, Shuffle, Skull,
  Stethoscope, Trash2, TrendingUp, Utensils, X, Copy, Info, Zap, Clock, CircleCheck, AlertTriangle, ArrowUpCircle,
} from "lucide-react";
import { InlineEditableArray, InlineEditableField, InlineEditableTextarea, SECTOR_FIELD_HOVER, SmoothCollapse, COLLAPSIBLE_CONTENT_MOTION, COLUMN_CELL, COLUMN_HOVER, SECTOR_INPUT } from "@/components/patient-card/InlineEditors";
import { EditPatientDialog } from "./EditPatientDialog";
import { PatientMovementDialog } from "./PatientMovementDialog";
import { PatientReportDialog } from "./PatientReportDialog";
import { MedicalResponsibilityDialog } from "./MedicalResponsibilityDialog";
import { BedSelectionDialog } from "./BedSelectionDialog";
import { BedSwapDialog } from "./BedSwapDialog";
import { DietReleaseDialog } from "./DietReleaseDialog";
import { RequestBedAllocationDialog } from "./RequestBedAllocationDialog";
import { PasswordConfirmDialog } from "@/components/PasswordConfirmDialog";
import { TransferToUtiDialog } from "./TransferToUtiDialog";
import { QuickTemplatesDialog } from "./QuickTemplatesDialog";
import { ExamCurvesDialog } from "./ExamCurvesDialog";
import { PatientInfoDialog } from "./PatientInfoDialog";
import { AdminIdentifiers } from "./patient-card/AdminIdentifiers";
import { AllocationPendingBadge } from "./AllocationPendingBadge";
import { PalliativeButterflyIcon } from "./PalliativeButterflyIcon";
import { SepsisActiveBanner } from "./SepsisActiveBanner";
import { StrokeActiveBanner } from "./StrokeActiveBanner";
import { ChestPainActiveBanner } from "./ChestPainActiveBanner";
import { SepsisProtocolWizardDialog } from "./SepsisProtocolWizardDialog";
import { StrokeProtocolWizardDialog } from "./StrokeProtocolWizardDialog";
import { ChestPainProtocolWizardDialog } from "./ChestPainProtocolWizardDialog";
import { AllocationStatusBar, hasAllocationStatusBar } from "@/components/patient-card/AllocationStatusBar";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useConductHistory } from "@/hooks/useConductHistory";
import { describeListChange } from "@/utils/conductHistory";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivacy, maskName } from "@/contexts/PrivacyContext";
import { useToast } from "@/hooks/use-toast";
import { useSectorStayTimer } from "@/hooks/useSectorStayTimer";
import { useSepsisProtocol } from "@/hooks/useSepsisProtocol";
import { useStrokeProtocol } from "@/hooks/useStrokeProtocol";
import { useChestPainProtocol } from "@/hooks/useChestPainProtocol";
import { getPatientAgeDisplay } from "@/utils/ageDisplay";
import { formatTps } from "@/utils/stayTime";
import { getPatientPsmState, nextPatientPsm, PSM_CYCLE, cyclePsmText, getPsmCycleIndex, type PsmState } from "@/utils/psmCycle";
import { RELEASED_BED_FIELDS } from "@/utils/releaseBed";

type Sector = Patient["sector"];
type UeColumn = "diagnoses" | "antecedentes" | "exames" | "condutas" | "pendencias";
const COLUMN_ORDER: UeColumn[] = ["diagnoses", "antecedentes", "exames", "condutas", "pendencias"];

interface EmergencyPatientCardProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onDelete?: (patientId: string) => void | Promise<void>;
  onUndelete?: (patient: Patient) => void;
  onTransfer?: (patientId: string, newSector: Patient["sector"], targetBedNumber?: string, vacantPlaceholderId?: string) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
  /** Section-level "expand/collapse all": hides or shows the 5 columns of every card. */
  forceCollapsed?: boolean;
}

const SECTOR_LABELS: Record<Sector, string> = {
  red: "Cuidados Especiais",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
  outside: "Fora das Alas",
};

const SECTOR_HEX: Record<Sector, string> = {
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  outside: "#6b7280",
};

const CARD_TONE: Record<Sector, { card: string; glass: string; bed: string; divider: string; chip: string }> = {
  red: {
    card: "bg-card border-border/70 border-l-2 border-l-critical/60",
    glass: "clinical-glass-card clinical-glass-critical",
    bed: "bg-critical/[0.07] border-critical/25 text-critical",
    divider: "border-l-critical/25",
    chip: "hover:bg-critical/[0.07] hover:border-critical/25",
  },
  yellow: {
    card: "bg-card border-border/70 border-l-2 border-l-warning/60",
    glass: "clinical-glass-card clinical-glass-warning",
    bed: "bg-warning/[0.07] border-warning/25 text-warning",
    divider: "border-l-warning/25",
    chip: "hover:bg-warning/[0.07] hover:border-warning/25",
  },
  blue: {
    card: "bg-card border-border/70 border-l-2 border-l-stable/60",
    glass: "clinical-glass-card clinical-glass-stable",
    bed: "bg-stable/[0.07] border-stable/25 text-stable",
    divider: "border-l-stable/25",
    chip: "hover:bg-stable/[0.07] hover:border-stable/25",
  },
  outside: {
    card: "bg-card border-border/70 border-l-2 border-l-muted-foreground/40",
    glass: "clinical-glass-card clinical-glass-neutral",
    bed: "bg-muted/60 border-border text-muted-foreground",
    divider: "border-l-muted-foreground/25",
    chip: "hover:bg-muted-foreground/[0.07] hover:border-muted-foreground/25",
  },
};

const SECTION_GLASS: Record<Sector, string> = {
  red: "clinical-glass-section clinical-glass-critical",
  yellow: "clinical-glass-section clinical-glass-warning",
  blue: "clinical-glass-section clinical-glass-stable",
  outside: "clinical-glass-section clinical-glass-neutral",
};

const PSM_PILL: Record<PsmState, string> = {
  aguardando: "bg-warning/10 border-warning/40 text-warning",
  favoravel: "bg-success/10 border-success/40 text-success",
  desfavoravel: "bg-critical/10 border-critical/40 text-critical",
  ir_para: "bg-stable/10 border-stable/40 text-stable",
};

const PSM_ITEM_ICON: Record<PsmState, { Icon: typeof Clock; className: string; title: string }> = {
  aguardando: { Icon: Clock, className: "text-warning", title: "Aguardando PSM" },
  favoravel: { Icon: CircleCheck, className: "text-success", title: "PSM favorável" },
  desfavoravel: { Icon: AlertTriangle, className: "text-critical", title: "PSM desfavorável" },
  ir_para: { Icon: ArrowUpCircle, className: "text-stable", title: "Ir para — auditoria aprovou" },
};

/** Fields whose changes are written to the conduct history (same set as before). */
const TRACKED_LIST_FIELDS = ["diagnoses", "medicalHistory", "relevantExams", "pendencies", "schedule"] as const;

const RESPONSIBILITY_LABEL: Record<string, string> = {
  porta: "PRT",
  lider: "LDR",
  conjunto: "CONJUNTO",
  obstetra: "OBS",
  cirurgiao_geral: "CIR",
  traumatologista: "ORTOP",
};

const updateClinicalGlassPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === "touch") return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--clinical-glass-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
  event.currentTarget.style.setProperty("--clinical-glass-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
};

const resetClinicalGlassPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty("--clinical-glass-x", "35%");
  event.currentTarget.style.setProperty("--clinical-glass-y", "20%");
};

/** ISO / "YYYY-MM-DD HH:mm" → Date, or null. */
function parseAdmission(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value.includes("T") || value.endsWith("Z") ? value : value.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const formatAdmission = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Bed square + doctor-responsible pill sharing the same width (pill without icon). */
function BedResponsibilityChip({ patient, onOpenResponsibility }: { patient: Patient; onOpenResponsibility: () => void }) {
  const tone = CARD_TONE[patient.sector] || CARD_TONE.blue;
  const color = SECTOR_HEX[patient.sector] || SECTOR_HEX.blue;
  const resp = patient.medicalResponsibility;
  const office = resp?.officeNumber ? `C${resp.officeNumber}` : "";
  const labels = resp?.type === "conjunto" && resp.conjuntoWith?.length
    ? resp.conjuntoWith.map((t) => RESPONSIBILITY_LABEL[t] || t.toUpperCase())
    : resp?.type ? [RESPONSIBILITY_LABEL[resp.type] || resp.type.toUpperCase()] : [];

  return (
    <div className="flex items-stretch gap-1 shrink-0">
      <div className={cn("flex items-center justify-center rounded border px-1.5 py-0.5 text-center", tone.bed)}>
        <span className="text-xs font-bold tabular-nums leading-none inline-block min-w-8">{patient.bedNumber}</span>
      </div>
      {labels.length === 0 ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenResponsibility(); }}
          className="min-w-[22px] inline-flex items-center justify-center rounded border border-dashed border-muted-foreground/25 px-1 py-0.5 text-[9px] font-medium leading-none text-muted-foreground/60 hover:border-muted-foreground/50 hover:text-muted-foreground transition-colors print:hidden"
          title="Definir responsabilidade médica"
        >
          +
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenResponsibility(); }}
          className="inline-flex flex-col items-center justify-center rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide leading-none transition-colors print:hidden"
          style={{ color, borderColor: `${color}40` }}
          title={`Responsabilidade: ${labels.join(" + ")}${office ? ` • ${office}` : ""} — clique para alterar`}
        >
          <span className="leading-none">{labels.join(" + ")}</span>
          {office && <span className="opacity-60 text-[8px] leading-none mt-0.5">{office}</span>}
        </button>
      )}
    </div>
  );
}

export function EmergencyPatientCard({
  patient,
  onUpdate,
  onDelete,
  onUndelete,
  onTransfer,
  onPrintPatient,
  onRefetch,
  forceCollapsed,
}: EmergencyPatientCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentDepartment } = useDepartment();
  const { role, user } = useAuth();
  const { namesHidden } = usePrivacy();
  const isPediatric = currentDepartment === "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA";
  const isAdultUe = currentDepartment === "URGÊNCIA E EMERGÊNCIA ADULTO";
  const sector: Sector = patient.sector || "blue";
  const tone = CARD_TONE[sector] || CARD_TONE.blue;

  const [isCollapsed, setIsCollapsed] = useState(() => forceCollapsed ?? isMobileViewport());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeColumn, setActiveColumn] = useState<UeColumn | null>(null);
  const [editingAdmission, setEditingAdmission] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [movementType, setMovementType] = useState<"ALTA" | "ÓBITO" | "TRANSFERÊNCIA" | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [responsibilityOpen, setResponsibilityOpen] = useState(false);
  const [bedPickerSector, setBedPickerSector] = useState<Sector | null>(null);
  const [bedSwapOpen, setBedSwapOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [bedRequestOpen, setBedRequestOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [utiTransferOpen, setUtiTransferOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [examCurvesOpen, setExamCurvesOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sepsisWizardOpen, setSepsisWizardOpen] = useState(false);
  const [strokeWizardOpen, setStrokeWizardOpen] = useState(false);
  const [chestPainWizardOpen, setChestPainWizardOpen] = useState(false);

  const { activeProtocol: sepsisProtocol, isProtocolActive: hasSepsis, refetch: refetchSepsis } = useSepsisProtocol(patient.id);
  const { activeProtocol: strokeProtocol, isProtocolActive: hasStroke, refetch: refetchStroke } = useStrokeProtocol(patient.id);
  const { activeProtocol: chestPainProtocol, isProtocolActive: hasChestPain, refetch: refetchChestPain } = useChestPainProtocol(patient.id);
  const { recordChange } = useConductHistory(patient.id);
  const activeProtocol = hasSepsis ? "Sepse" : hasStroke ? "AVC" : hasChestPain ? "Dor Torácica" : null;

  const stayTimer = useSectorStayTimer(patient.admissionDate);
  const admission = useMemo(() => parseAdmission(patient.admissionDate), [patient.admissionDate]);
  const psmState = getPatientPsmState(patient);
  const psmConfig = psmState ? PSM_CYCLE.find((s) => s.status === psmState) : null;

  // Visitante, Recepção e Enfermagem: somente leitura. Porta: só os pacientes que criou.
  const canEdit = useMemo(() => {
    if (role === "visitante" || role === "recepcao" || role === "enfermagem") return false;
    if (role === "porta") return patient.createdBy === user?.id;
    return true;
  }, [role, user?.id, patient.createdBy]);
  const canMove = role === "medico" || role === "admin";

  useEffect(() => {
    if (forceCollapsed !== undefined) setIsCollapsed(forceCollapsed);
  }, [forceCollapsed]);

  useEffect(() => {
    if (!isExpanded) setEditingAdmission(false);
  }, [isExpanded]);

  const update = (changes: Partial<Patient>) => {
    // Histórico de condutas: registra inclusões, remoções e edições nos campos clínicos
    for (const field of TRACKED_LIST_FIELDS) {
      const next = changes[field] as string[] | undefined;
      if (next === undefined) continue;
      describeListChange((patient[field] as string[]) || [], next).forEach((c) => recordChange({ fieldName: field, ...c }));
    }
    if (changes.admissionHistory !== undefined && (changes.admissionHistory || "") !== (patient.admissionHistory || "")) {
      recordChange({ fieldName: "admissionHistory", oldValue: patient.admissionHistory || null, newValue: changes.admissionHistory || null });
    }
    onUpdate({ ...patient, ...changes });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, description: text });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const cyclePendencyPsm = (index: number) => {
    const pendencies = patient.pendencies || [];
    const cycled = cyclePsmText(pendencies[index] || "");
    if (!cycled) return;
    const updated = [...pendencies];
    updated[index] = cycled.text;
    update({ pendencies: updated, psmStatus: cycled.status as Patient["psmStatus"] });
  };

  const handleTab = (column: UeColumn) => {
    const idx = COLUMN_ORDER.indexOf(column);
    setActiveColumn(COLUMN_ORDER[(idx + 1) % COLUMN_ORDER.length]);
  };

  const guardMovement = (action: () => void) => {
    if (activeProtocol) {
      toast({
        title: `Protocolo ${activeProtocol} ativo`,
        description: `Finalize o protocolo de ${activeProtocol} antes de realizar movimentações.`,
        variant: "destructive",
      });
      return;
    }
    action();
  };

  const openMovement = (type: "ALTA" | "ÓBITO" | "TRANSFERÊNCIA") =>
    guardMovement(() => { setMovementType(type); setMovementOpen(true); });

  const handleSectorChange = (target: Sector) => {
    if (target === "outside") {
      onTransfer?.(patient.id, target);
      return;
    }
    setBedPickerSector(target);
  };

  const handleSaveAdmission = (value: string) => {
    setEditingAdmission(false);
    if (!value) return;
    const d = new Date(value);
    if (!isNaN(d.getTime())) update({ admissionDate: d.toISOString() });
  };

  const isFixedSlot = ["red", "yellow", "blue"].includes(sector) && /^[VAZ]\d{2}$/.test(patient.bedNumber);
  const displayName = maskName(patient.name, namesHidden);
  const showAllocationBar = hasAllocationStatusBar(patient);
  const showSepsisBanner = hasSepsis && sepsisProtocol?.outcome == null;
  const showStrokeBanner = hasStroke && strokeProtocol?.outcome == null;
  const showChestPainBanner = hasChestPain && chestPainProtocol?.outcome == null;
  const hasTopBar = showAllocationBar || showSepsisBanner || showStrokeBanner || showChestPainBanner;
  const isPalliative = (patient.pendencies || []).some((p) => p.toUpperCase().includes("CUIDADOS PALIATIVOS"));

  // Ações do paciente: renderizadas na coluna lateral (tablet/computador)
  // e no canto da linha do paciente (celular).
  const actionControls = (
    <>
              {canEdit && (
                <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} className="h-6 w-6 text-muted-foreground hover:text-primary" title="Edição avançada">
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Ações do paciente">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50 w-60">
                  {role === "porta" && sector === "outside" && (
                    <DropdownMenuItem onClick={() => setBedRequestOpen(true)}>
                      <BedDouble className="h-4 w-4 mr-2 text-primary" />
                      Solicitar Leito
                    </DropdownMenuItem>
                  )}

                  {role !== "porta" && (
                    <>
                      {onTransfer && canEdit && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Shuffle className="h-4 w-4 mr-2 text-muted-foreground" />
                            Realocação
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-56">
                            {(Object.keys(SECTOR_LABELS) as Sector[]).filter((s) => s !== sector).map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleSectorChange(s)}>
                                <ArrowRightLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                                {SECTOR_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                            {sector !== "outside" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setBedPickerSector(sector)}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                                  Trocar de leito (mesmo setor)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBedSwapOpen(true)}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2 rotate-90 text-muted-foreground" />
                                  Permutar com outro paciente
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      {canMove && patient.name && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Movimentações</DropdownMenuLabel>
                          {isAdultUe && (
                            <DropdownMenuItem onClick={() => guardMovement(() => setUtiTransferOpen(true))}>
                              <BedDouble className="h-4 w-4 mr-2 text-primary" />
                              Transferir para UTI
                              {activeProtocol && <AlertCircle className="h-3 w-3 ml-auto text-warning" />}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openMovement("TRANSFERÊNCIA")}>
                            <ArrowLeftRight className="h-4 w-4 mr-2 text-stable" />
                            Transferir (outro destino)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMovement("ALTA")}>
                            <TrendingUp className="h-4 w-4 mr-2 text-success" />
                            Alta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMovement("ÓBITO")}>
                            <Skull className="h-4 w-4 mr-2 text-muted-foreground" />
                            Óbito
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/resources?patientId=${patient.id}`)}>
                            <FileText className="h-4 w-4 mr-2 text-warning" />
                            Solicitar Internação
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />
                      {onPrintPatient && (
                        <DropdownMenuItem onClick={() => onPrintPatient(patient.id)}>
                          <Printer className="h-4 w-4 mr-2 text-muted-foreground" />
                          Imprimir Caso
                        </DropdownMenuItem>
                      )}
                      {patient.name && (
                        <DropdownMenuItem onClick={() => setReportOpen(true)}>
                          <FileEdit className="h-4 w-4 mr-2 text-primary" />
                          Emitir Relatório
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setDietOpen(true)}>
                        <Utensils className="h-4 w-4 mr-2 text-success" />
                        Liberar Dieta
                      </DropdownMenuItem>

                      {isFixedSlot && canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              onUpdate({ ...patient, ...RELEASED_BED_FIELDS, isVacant: true, bedStatus: "available" });
                              toast({ title: "Leito esvaziado", description: `${patient.bedNumber} voltou para o estado disponível.` });
                            }}
                          >
                            <BedDouble className="h-4 w-4 mr-2 text-warning" />
                            Esvaziar Leito
                          </DropdownMenuItem>
                        </>
                      )}

                      {onDelete && canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Paciente
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" title={isExpanded ? "Retrair detalhes" : "Expandir detalhes"}>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
    </>
  );

  return (
    <>
      <div className="relative">
      <AllocationStatusBar patient={patient} />
      {showSepsisBanner && sepsisProtocol && (
        <SepsisActiveBanner
          protocolCreatedAt={sepsisProtocol.created_at}
          openingDate={sepsisProtocol.opening_date}
          openingTime={sepsisProtocol.opening_time}
          outcome={sepsisProtocol.outcome}
          sector={sector as any}
          hasCultures={!!(sepsisProtocol.blood_culture_date && sepsisProtocol.blood_culture_time)}
          hasAntibiotic={!!(sepsisProtocol.antibiotic_administration_date && sepsisProtocol.antibiotic_administration_time)}
          antibioticDate={sepsisProtocol.antibiotic_administration_date}
          antibioticTime={sepsisProtocol.antibiotic_administration_time}
          bloodCultureTime={sepsisProtocol.blood_culture_time}
          onClick={() => setSepsisWizardOpen(true)}
        />
      )}
      {showStrokeBanner && strokeProtocol && (
        <StrokeActiveBanner
          protocolCreatedAt={strokeProtocol.created_at}
          openingDate={strokeProtocol.opening_date}
          openingTime={strokeProtocol.opening_time}
          outcome={strokeProtocol.outcome}
          sector={sector as any}
          hasCt={!!(strokeProtocol.ct_date && strokeProtocol.ct_time)}
          hasThrombolysis={!!(strokeProtocol.thrombolysis_date && strokeProtocol.thrombolysis_time)}
          ctTime={strokeProtocol.ct_time}
          thrombolysisTime={strokeProtocol.thrombolysis_time}
          nihssTotal={strokeProtocol.nihss_total}
          onClick={() => setStrokeWizardOpen(true)}
        />
      )}
      {showChestPainBanner && chestPainProtocol && (
        <ChestPainActiveBanner
          protocolCreatedAt={chestPainProtocol.created_at}
          openingDate={chestPainProtocol.opening_date}
          openingTime={chestPainProtocol.opening_time}
          outcome={chestPainProtocol.outcome}
          sector={sector as any}
          hasEcg={!!(chestPainProtocol.ecg_date && chestPainProtocol.ecg_time)}
          ecgTime={chestPainProtocol.ecg_time}
          isStemi={chestPainProtocol.is_stemi}
          heartScore={chestPainProtocol.heart_total}
          heartRiskLevel={chestPainProtocol.heart_risk_level}
          hasBalloon={!!(chestPainProtocol.balloon_date && chestPainProtocol.balloon_time)}
          balloonTime={chestPainProtocol.balloon_time}
          onClick={() => setChestPainWizardOpen(true)}
        />
      )}
      <div
        className={cn("border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200", tone.card, tone.glass, hasTopBar && "rounded-t-none")}
        data-patient-id={patient.id}
        onPointerMove={updateClinicalGlassPointer}
        onPointerLeave={resetClinicalGlassPointer}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-stretch">
            <div className={cn("flex-1 p-1.5 space-y-1.5 md:space-y-1 min-w-0", !canEdit && "[&_.cursor-pointer]:pointer-events-none")}>
              {/* Linha de identificação */}
              <div className={cn("flex flex-wrap items-center gap-1 md:gap-1.5 border-l rounded-r pl-1.5", tone.divider)}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="shrink-0 h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  title={isCollapsed ? "Expandir colunas" : "Retrair colunas"}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                <BedResponsibilityChip patient={patient} onOpenResponsibility={() => canEdit && setResponsibilityOpen(true)} />

                {/* Nome + DN + idade */}
                <div className="flex-1 max-md:basis-full max-md:order-1 flex items-center gap-x-2 gap-y-0.5 md:gap-3 min-w-0 flex-wrap">
                  {/* Celular: nome ocupa a linha inteira; no computador o wrapper some (md:contents) */}
                  <div className="flex w-full min-w-0 items-center gap-1 md:contents">
                  {isPalliative && <PalliativeButterflyIcon />}
                  {namesHidden ? (
                    <span className="text-xs md:text-sm font-semibold tracking-widest opacity-70">{displayName}</span>
                  ) : (
                    <InlineEditableField
                      value={patient.name}
                      onUpdate={(v) => update({
                        name: v,
                        // Primeira identificação do paciente marca a entrada na emergência
                        ...(!patient.admissionDate && v.trim() ? { admissionDate: new Date().toISOString() } : {}),
                      })}
                      placeholder="NOME DO PACIENTE"
                      className="text-xs md:text-sm font-semibold break-words"
                      colorVariant={sector}
                    />
                  )}
                  <div className="shrink-0 flex items-center gap-0.5 -ml-1 print:hidden">
                    {patient.name && !namesHidden && (
                      <button
                        type="button"
                        onClick={() => copyText(patient.name, "Nome")}
                        className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Copiar nome"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInfoOpen(true)}
                      className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Ver informações administrativas"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                    <div className={cn(showAllocationBar && "sr-only")}>
                      <AllocationPendingBadge patient={patient} onStatusChange={onRefetch} />
                    </div>
                  </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    <span className="font-semibold opacity-70">DN:</span>
                    <InlineEditableField
                      value={patient.birthDate || ""}
                      onUpdate={(v) => update({ birthDate: v })}
                      placeholder="DD/MM/AAAA"
                      className="w-[78px] text-center"
                      colorVariant={sector}
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    {patient.birthDate ? (
                      <span className="font-semibold tabular-nums">{getPatientAgeDisplay(patient)}</span>
                    ) : (
                      <>
                        <InlineEditableField
                          value={String(patient.age || "").replace(/\s*anos?\s*$/i, "")}
                          onUpdate={(v) => update({ age: v })}
                          placeholder="IDADE"
                          className="w-10 text-center"
                          colorVariant={sector}
                        />
                        {/^\d+$/.test(String(patient.age || "").replace(/\s*anos?\s*$/i, "").trim()) && <span>anos</span>}
                      </>
                    )}
                  </div>
                  {/* PRONT. / ATEND. — logo após a idade, clique para copiar */}
                  <AdminIdentifiers patient={patient} onCopy={copyText} />
                </div>
                {/* Ações (celular): no canto da linha do paciente */}
                <div className="md:hidden ml-auto flex items-center gap-0.5 shrink-0 print:hidden">
                  {actionControls}
                </div>

                {/* TPS · ADM emergência · PSM */}
                <div className="max-md:order-2 flex items-center gap-1 flex-wrap md:flex-nowrap w-full md:w-auto mt-0.5 md:mt-0">
                  <div
                    className={cn(
                      "shrink-0 flex items-center justify-center gap-1 min-w-[84px] px-2 py-0.5 rounded-md border",
                      stayTimer ? stayTimer.colorClasses : "text-muted-foreground bg-muted/50 border-transparent",
                      stayTimer?.level === "pulsing" && "animate-pulse"
                    )}
                    title="Tempo de permanência no setor (desde a entrada na emergência)"
                  >
                    <span className="text-[9px] font-bold">TPS:</span>
                    <span className="text-xs font-bold tabular-nums">{stayTimer ? formatTps(stayTimer.totalMinutes) : "—"}</span>
                  </div>

                  <div className={cn("shrink-0 flex items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-transparent transition-colors", tone.chip)}>
                    <span className="text-[9px]">ADM emergência:</span>
                    {editingAdmission && canEdit ? (
                      <input
                        type="datetime-local"
                        autoFocus
                        defaultValue={admission ? toLocalInput(admission) : toLocalInput(new Date())}
                        className={cn("bg-background text-foreground border rounded px-1 text-[10px] h-5 outline-none", SECTOR_INPUT[sector])}
                        onBlur={(e) => handleSaveAdmission(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveAdmission(e.currentTarget.value);
                          if (e.key === "Escape") setEditingAdmission(false);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => canEdit && setEditingAdmission(true)}
                        className={cn("text-[10px] font-medium tabular-nums rounded-sm px-0.5", SECTOR_FIELD_HOVER[sector])}
                        title="Data e hora de entrada na emergência"
                      >
                        {admission ? formatAdmission(admission) : "DD/MM HH:MM"}
                      </button>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => canEdit && update(nextPatientPsm(patient))}
                      className={cn(
                        "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                        psmState ? PSM_PILL[psmState] : "bg-muted/50 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60"
                      )}
                      title="Status do PSM — clique para avançar (Aguardando → Favorável → Desfavorável → Ir para)"
                    >
                      <span className="text-[9px] font-semibold opacity-80">PSM:</span>
                      <span>{psmConfig ? psmConfig.label : "—"}</span>
                    </button>
                    {psmState && canEdit && (
                      <button
                        type="button"
                        onClick={() => update({ psmStatus: null })}
                        className="ml-0.5 h-4 w-4 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                        title="Remover status do PSM"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5 colunas */}
              <SmoothCollapse open={!isCollapsed} className="!mt-0">
                <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr_1.15fr_1.5fr] gap-y-0 pt-1">
                  <div className={cn(COLUMN_CELL, COLUMN_HOVER[sector])}>
                    <InlineEditableArray
                      items={patient.diagnoses || []}
                      onUpdate={(items) => update({ diagnoses: items })}
                      label="Hipóteses / Diagnósticos"
                      icon={<Stethoscope className="h-2.5 w-2.5 text-muted-foreground" />}
                      iconColorClass="text-muted-foreground hover:text-foreground"
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedDiagnoses || []}
                      onUpdateHighlights={(indices) => update({ highlightedDiagnoses: indices })}
                      onUpdateBoth={(items, highlights) => update({ diagnoses: items, highlightedDiagnoses: highlights })}
                      fieldId="diagnoses"
                      isActive={activeColumn === "diagnoses"}
                      onTabPress={() => handleTab("diagnoses")}
                      onEnterPress={() => setActiveColumn("diagnoses")}
                      highlightColorVariant={sector}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, COLUMN_HOVER[sector])}>
                    <InlineEditableArray
                      items={patient.medicalHistory || []}
                      onUpdate={(items) => update({ medicalHistory: items })}
                      label="Antecedentes / Comorbidades"
                      icon={<Activity className="h-2.5 w-2.5 text-muted-foreground" />}
                      iconColorClass="text-muted-foreground hover:text-foreground"
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedMedicalHistory || []}
                      onUpdateHighlights={(indices) => update({ highlightedMedicalHistory: indices })}
                      onUpdateBoth={(items, highlights) => update({ medicalHistory: items, highlightedMedicalHistory: highlights })}
                      fieldId="antecedentes"
                      isActive={activeColumn === "antecedentes"}
                      onTabPress={() => handleTab("antecedentes")}
                      onEnterPress={() => setActiveColumn("antecedentes")}
                      highlightColorVariant={sector}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, COLUMN_HOVER[sector])}>
                    <InlineEditableArray
                      items={patient.relevantExams || []}
                      onUpdate={(items) => update({ relevantExams: items })}
                      label="Exames"
                      icon={<FlaskConical className="h-2.5 w-2.5 text-muted-foreground" />}
                      iconColorClass="text-muted-foreground hover:text-foreground"
                      headerActions={FEATURE_FLAGS.EXAMINUS_AI_ENABLED && canEdit ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setExamCurvesOpen(true); }}
                          title="Adicionar curva de exames"
                        >
                          <TrendingUp className="h-3 w-3" />
                        </Button>
                      ) : undefined}
                      alwaysShowAll
                      compact
                      fieldId="exames"
                      isActive={activeColumn === "exames"}
                      onTabPress={() => handleTab("exames")}
                      onEnterPress={() => setActiveColumn("exames")}
                      highlightColorVariant={sector}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, COLUMN_HOVER[sector])}>
                    <InlineEditableArray
                      items={patient.utiDailyConducts || []}
                      onUpdate={(items) => update({ utiDailyConducts: items })}
                      label="Plano Terapêutico"
                      icon={<FileText className="h-2.5 w-2.5 text-muted-foreground" />}
                      iconColorClass="text-muted-foreground hover:text-foreground"
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedConducts || []}
                      onUpdateHighlights={(indices) => update({ highlightedConducts: indices })}
                      onUpdateBoth={(items, highlights) => update({ utiDailyConducts: items, highlightedConducts: highlights })}
                      fieldId="condutas"
                      isActive={activeColumn === "condutas"}
                      onTabPress={() => handleTab("condutas")}
                      onEnterPress={() => setActiveColumn("condutas")}
                      highlightColorVariant={sector}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, COLUMN_HOVER[sector])}>
                    <InlineEditableArray
                      items={patient.pendencies || []}
                      onUpdate={(items) => update({ pendencies: items })}
                      label="Programações / Pendências"
                      icon={<ClipboardList className="h-2.5 w-2.5 text-muted-foreground" />}
                      iconColorClass="text-muted-foreground hover:text-foreground"
                      headerActions={canEdit ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setTemplatesOpen(true); }}
                          title="Templates rápidos"
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      ) : undefined}
                      renderItemActions={(item, index) => {
                        const idx = getPsmCycleIndex(item);
                        if (idx < 0) return null;
                        const cfg = PSM_ITEM_ICON[PSM_CYCLE[idx].status];
                        return (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (canEdit) cyclePendencyPsm(index); }}
                            className={cn("h-4 w-4 shrink-0 inline-flex items-center justify-center rounded-full transition-transform hover:scale-110", cfg.className)}
                            title={`${cfg.title} — clique para avançar o status do PSM`}
                          >
                            <cfg.Icon className="h-3.5 w-3.5" />
                          </button>
                        );
                      }}
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedPendencies || []}
                      onUpdateHighlights={(indices) => update({ highlightedPendencies: indices })}
                      onUpdateBoth={(items, highlights) => update({ pendencies: items, highlightedPendencies: highlights })}
                      fieldId="pendencias"
                      isActive={activeColumn === "pendencias"}
                      onTabPress={() => handleTab("pendencias")}
                      onEnterPress={() => setActiveColumn("pendencias")}
                      highlightColorVariant={sector}
                    />
                  </div>
                </div>
              </SmoothCollapse>
            </div>

            {/* Ações (tablet/computador) */}
            <div className={cn(
              "hidden md:flex items-center justify-center gap-0.5 px-1 py-1 border-l border-border/30 bg-muted/20",
              isCollapsed ? "flex-row" : "flex-col"
            )}>
              {actionControls}
            </div>
          </div>

          {/* Área expandida: história admissional + administrativo */}
          <CollapsibleContent className={COLLAPSIBLE_CONTENT_MOTION}>
            <div className={cn("border-t border-border/30 p-3 space-y-3 bg-muted/5", !canEdit && "[&_.cursor-pointer]:pointer-events-none")}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">História admissional</span>
                </div>
                <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                  <InlineEditableTextarea
                    value={patient.admissionHistory || ""}
                    onUpdate={(v) => update({ admissionHistory: v })}
                    placeholder="HISTÓRIA ADMISSIONAL / ANAMNESE..."
                    colorVariant={sector}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Administrativo</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    ["PRONTUÁRIO", "medicalRecordNumber"],
                    ["ATENDIMENTO", "attendanceNumber"],
                    ["CONVÊNIO", "insuranceCompany"],
                    ["PLANO", "insurancePlan"],
                  ] as const).map(([label, key]) => (
                    <div key={key} className="bg-muted/30 border border-border/30 rounded-md p-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{label}</span>
                      <InlineEditableField
                        value={(patient[key] as string) || ""}
                        onUpdate={(v) => update({ [key]: v || null } as Partial<Patient>)}
                        placeholder="—"
                        className="text-sm"
                        colorVariant={sector}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      </div>

      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} onSave={(p) => { onUpdate(p); setEditOpen(false); }} />

      <PatientInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        patient={patient}
        canEdit={canEdit}
        onApply={async (changes) => update(changes)}
      />

      <QuickTemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        patientName={patient.name}
        onAddTemplates={(templates) => {
          if (!templates?.length) return;
          update({ pendencies: [...(patient.pendencies || []), ...templates.map((t) => t.toUpperCase())] });
          toast({ title: `${templates.length} template(s) adicionado(s)` });
        }}
      />

      {FEATURE_FLAGS.EXAMINUS_AI_ENABLED && (
        <ExamCurvesDialog
          open={examCurvesOpen}
          onOpenChange={setExamCurvesOpen}
          patientName={patient.name}
          onAddCurves={async (curves: string[]) => {
            if (!curves?.length) return;
            update({ relevantExams: [...(patient.relevantExams || []), ...curves.map((c) => c.toUpperCase())] });
          }}
        />
      )}

      <SepsisProtocolWizardDialog
        patient={patient}
        isOpen={sepsisWizardOpen}
        onClose={() => setSepsisWizardOpen(false)}
        onSuccess={() => refetchSepsis()}
        existingProtocolId={sepsisProtocol?.id || null}
      />
      <StrokeProtocolWizardDialog
        patient={patient}
        isOpen={strokeWizardOpen}
        onClose={() => setStrokeWizardOpen(false)}
        onSuccess={() => refetchStroke()}
        existingProtocolId={strokeProtocol?.id || null}
      />
      <ChestPainProtocolWizardDialog
        patient={patient}
        isOpen={chestPainWizardOpen}
        onClose={() => setChestPainWizardOpen(false)}
        onSuccess={() => refetchChestPain()}
        existingProtocolId={chestPainProtocol?.id || null}
      />

      <PatientMovementDialog
        patient={patient}
        movementType={movementType}
        isOpen={movementOpen}
        onClose={() => { setMovementOpen(false); setMovementType(null); }}
        onSuccess={() => {
          if (onDelete) return onDelete(patient.id);
        }}
      />

      {patient.name && <PatientReportDialog patient={patient} open={reportOpen} onOpenChange={setReportOpen} />}

      <MedicalResponsibilityDialog
        open={responsibilityOpen}
        onOpenChange={setResponsibilityOpen}
        currentResponsibility={patient.medicalResponsibility}
        onSave={(responsibility, suggestedCategory) => {
          const changes: Partial<Patient> = { medicalResponsibility: responsibility };
          if (suggestedCategory && !patient.patientCategory) changes.patientCategory = suggestedCategory;
          update(changes);
        }}
        sectorColor={SECTOR_HEX[sector]}
      />

      {bedPickerSector && (
        <BedSelectionDialog
          open={!!bedPickerSector}
          onOpenChange={(o) => !o && setBedPickerSector(null)}
          sector={bedPickerSector}
          title="Realocar — Escolher Leito"
          description={`Selecione o leito de destino para ${patient.name}.`}
          patientName={patient.name}
          onSelect={(bedNumber, vacantPlaceholderId) => {
            onTransfer?.(patient.id, bedPickerSector, bedNumber, vacantPlaceholderId);
            setBedPickerSector(null);
          }}
        />
      )}

      <BedSwapDialog open={bedSwapOpen} onOpenChange={setBedSwapOpen} patient={patient} onSwapped={onRefetch} />
      <DietReleaseDialog isOpen={dietOpen} onClose={() => setDietOpen(false)} patient={patient} onBirthDateChange={canEdit ? (v) => update({ birthDate: v }) : undefined} />
      <RequestBedAllocationDialog open={bedRequestOpen} onOpenChange={setBedRequestOpen} patient={patient} />

      {isAdultUe && (
        <TransferToUtiDialog
          open={utiTransferOpen}
          onOpenChange={setUtiTransferOpen}
          patient={patient}
          department={currentDepartment}
          onTransferred={onRefetch}
        />
      )}

      <PasswordConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir paciente permanentemente"
        confirmLabel="Excluir definitivamente"
        description={
          <>
            Você está prestes a excluir o leito <strong className="font-bold">{patient.bedNumber}</strong> do paciente{" "}
            <strong className="font-bold">{patient.name}</strong>.
          </>
        }
        onConfirmed={async () => {
          if (!onDelete) return;
          const deleted = { ...patient };
          await onDelete(patient.id);
          toast({
            title: "Paciente excluído",
            description: `Leito ${patient.bedNumber} - ${patient.name} foi removido.`,
            action: onUndelete ? (
              <Button variant="outline" size="sm" onClick={() => onUndelete(deleted)} className="ml-auto">
                Desfazer
              </Button>
            ) : undefined,
          });
        }}
      />
    </>
  );
}
