import { Patient } from "@/types/patient";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Edit, ChevronDown, ChevronRight, MoreVertical, Check, X, Plus, GripVertical, Trash2, AlertTriangle, Stethoscope, ClipboardList, Clock, FileText, FolderOpen, Pill, Activity, Heart, User, Star, Printer, TrendingUp, Skull, ArrowRightLeft, ArrowLeftRight, BedDouble, DoorOpen, UserPlus, FileEdit, FlaskConical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Clinical status options with refined colors - only critical ones are vibrant
const CLINICAL_STATUS_OPTIONS = [
  { value: "gravissimo", label: "GRAVÍSSIMO", color: "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900", borderColor: "border-slate-800 dark:border-slate-200" },
  { value: "grave", label: "GRAVE", color: "bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900", borderColor: "border-slate-700 dark:border-slate-300" },
  { value: "grave_estavel", label: "GRAVE, PORÉM ESTÁVEL", color: "bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-900", borderColor: "border-slate-500 dark:border-slate-400" },
  { value: "potencialmente_grave", label: "POTENCIALMENTE GRAVE", color: "bg-slate-400 text-white dark:bg-slate-500 dark:text-slate-50", borderColor: "border-slate-400 dark:border-slate-500" },
  { value: "regular", label: "REGULAR", color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200", borderColor: "border-slate-300 dark:border-slate-600" },
  { value: "paliativado", label: "CUIDADOS PALIATIVOS", color: "bg-white text-slate-700 border border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600", borderColor: "border-slate-300 dark:border-slate-600" },
] as const;

// Helper to force uppercase on all text inputs
const toUpperCase = (value: string) => value.toUpperCase();
import { cn } from "@/lib/utils";
import { InlineEditableArray, InlineEditableField, InlineEditableTextarea, SmoothCollapse, COLLAPSIBLE_CONTENT_MOTION, COLUMN_CELL, COLUMN_HOVER } from "@/components/patient-card/InlineEditors";
import { releaseBedForFilling } from "@/utils/releaseBed";
import { calculateDetailedAge, formatDetailedAge } from "@/utils/calculateDetailedAge";
import { EditPatientDialog } from "./EditPatientDialog";
import { PatientReportDialog } from "./PatientReportDialog";
import { PatientMovementDialog } from "./PatientMovementDialog";
import { UtiReallocationDialog } from "./UtiReallocationDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePrivacy, maskName } from "@/contexts/PrivacyContext";
import { useAuth } from "@/contexts/AuthContext";

type ColorVariant = 'blue' | 'yellow';
type UtiColumn = 'diagnoses' | 'antecedentes' | 'exames' | 'condutas' | 'pendencias';

const updateClinicalGlassPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  if (event.pointerType === "touch") return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  event.currentTarget.style.setProperty("--clinical-glass-x", `${x}%`);
  event.currentTarget.style.setProperty("--clinical-glass-y", `${y}%`);
};

const resetClinicalGlassPointer = (event: React.PointerEvent<HTMLDivElement>) => {
  event.currentTarget.style.setProperty("--clinical-glass-x", "35%");
  event.currentTarget.style.setProperty("--clinical-glass-y", "20%");
};

interface UtiPatientCardProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
  colorVariant?: ColorVariant;
  forceCollapsed?: boolean;
  allPatients?: Patient[]; // All UTI patients for reallocation
  currentUtiUnit?: string; // "UTI 1" or "UTI 2"
}

// Parse date robustly: prefer DD/MM/YYYY (BR), fallback ISO YYYY-MM-DD. Uses UTC to evitar shift de fuso.
function parseAdmissionDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (dt.getUTCDate() !== day || dt.getUTCMonth() !== month - 1) return null;
    return dt;
  }
  // ISO YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const dt = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    if (dt.getUTCDate() !== +iso[3] || dt.getUTCMonth() !== +iso[2] - 1) return null;
    return dt;
  }
  return null;
}

// Calculate days in UTI
function calculateDaysInUti(admissionDate: string[] | undefined): number {
  if (!admissionDate || admissionDate.length === 0) return 0;
  const dateStr = admissionDate[0];
  if (!dateStr) return 0;
  const parsed = parseAdmissionDate(dateStr);
  if (!parsed) return 0;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today - parsed.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function UtiPatientCard({ 
  patient, 
  onUpdate, 
  onDelete,
  onPrintPatient,
  onRefetch,
  colorVariant = 'blue',
  forceCollapsed,
  allPatients = [],
  currentUtiUnit
}: UtiPatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Movement dialog states
  const [movementType, setMovementType] = useState<"ALTA" | "ÓBITO" | "TRANSFERÊNCIA" | null>(null);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isReallocationDialogOpen, setIsReallocationDialogOpen] = useState(false);

  // Derive current UTI unit from colorVariant if not provided
  const derivedUtiUnit = currentUtiUnit || (colorVariant === 'blue' ? 'UTI 1' : 'UTI 2');
  const { namesHidden } = usePrivacy();
  const { role } = useAuth();
  const canMove = role === 'medico' || role === 'admin';
  const displayName = maskName(patient.name, namesHidden);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Sync with forceCollapsed prop when it changes
  useEffect(() => {
    if (forceCollapsed !== undefined) {
      setIsCollapsed(forceCollapsed);
    }
  }, [forceCollapsed]);
  const [activeColumn, setActiveColumn] = useState<UtiColumn | null>(null);

  // SAFEGUARD C: Stabilize patient identity for async handlers so concurrent
  // realtime updates can't make handleMovementSuccess target a different bed.
  const patientIdRef = useRef(patient.id);
  const patientBedRef = useRef({ bedNumber: patient.bedNumber, sector: patient.sector });
  useEffect(() => {
    patientIdRef.current = patient.id;
    patientBedRef.current = { bedNumber: patient.bedNumber, sector: patient.sector };
  }, [patient.id, patient.bedNumber, patient.sector]);

  // Movement handlers
  const handleMovement = (type: "ALTA" | "ÓBITO" | "TRANSFERÊNCIA") => {
    setMovementType(type);
    setIsMovementDialogOpen(true);
  };

  const handleMovementSuccess = async () => {
    // Clear patient data after discharge/death/transfer (but keep the bed slot)
    // Mark the bed as vacant after movement.
    // Use the stable refs to guarantee we vacate the bed the user acted on,
    // not whatever the latest realtime snapshot mutated `patient` into.
    const emptyPatient: Patient = {
      ...patient,
      id: patientIdRef.current,
      bedNumber: patientBedRef.current.bedNumber,
      sector: patientBedRef.current.sector,
      name: "",
      age: "",
      // Dados pessoais do paciente anterior não podem passar para o próximo ocupante do leito
      birthDate: "",
      medicalRecordNumber: null,
      attendanceNumber: null,
      cpf: null,
      motherName: null,
      insuranceCompany: null,
      insurancePlan: null,
      insurancePlanType: null,
      insuranceCardNumber: null,
      insuranceDuration: null,
      diagnoses: [],
      medicalHistory: [],
      pendencies: [],
      relevantExams: [],
      schedule: [],
      admissionHistory: "",
      admissionDate: "",
      internmentNotes: null,
      internmentStatus: null,
      utiOriginSector: [],
      utiAdmissionDate: [],
      utiAdmissionReason: [],
      utiAllergies: [],
      utiCurrentStatus: [],
      utiDevices: [],
      utiSpecialties: [],
      utiCulturesAntibiotics: [],
      utiDailyConducts: [],
      utiDischargePrediction: [],
      highlightedDiagnoses: [],
      highlightedMedicalHistory: [],
      highlightedPendencies: [],
      highlightedConducts: [],
      medicalResponsibility: undefined,
      clinicalStatus: null,
      psmStatus: null,
      isVacant: true,
    };

    await onUpdate(emptyPatient);

    setIsMovementDialogOpen(false);
    setMovementType(null);
  };

  const handleReallocationSuccess = () => {
    setIsReallocationDialogOpen(false);
    onRefetch?.();
  };

  // Color schemes — neutral & clean. Base branca/slate, acento fino azul (UTI 1) ou slate-grafite (UTI 2)
  const colorSchemes = {
    blue: {
      card: "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60 border-l border-l-blue-500/60",
      bedBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/40",
      bedText: "text-blue-700 dark:text-blue-300",
      col1: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col1Icon: "text-slate-500 dark:text-slate-400",
      col2: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col2Icon: "text-slate-500 dark:text-slate-400",
      col3: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col3Icon: "text-slate-500 dark:text-slate-400",
      col4: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col4Icon: "text-slate-500 dark:text-slate-400",
    },
    yellow: {
      card: "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60 border-l border-l-slate-500/60",
      bedBg: "bg-slate-100 dark:bg-slate-800/50 border-slate-300/60 dark:border-slate-600/50",
      bedText: "text-slate-700 dark:text-slate-200",
      col1: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col1Icon: "text-slate-500 dark:text-slate-400",
      col2: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col2Icon: "text-slate-500 dark:text-slate-400",
      col3: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col3Icon: "text-slate-500 dark:text-slate-400",
      col4: "bg-slate-50/80 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-700/40",
      col4Icon: "text-slate-500 dark:text-slate-400",
    }
  };

  const colors = colorSchemes[colorVariant];
  const patientDataHover = colorVariant === 'yellow'
    ? "hover:bg-warning/[0.07] hover:border-warning/25"
    : "hover:bg-stable/[0.07] hover:border-stable/25";
  const patientDataDivider = colorVariant === 'yellow'
    ? "border-l-warning/25"
    : "border-l-stable/25";
  const patientSectionHover = colorVariant === 'yellow'
    ? "clinical-glass-section clinical-glass-warning"
    : "clinical-glass-section clinical-glass-stable";
  const columnHover = COLUMN_HOVER[colorVariant];
  const patientCardGlass = colorVariant === 'yellow'
    ? "clinical-glass-card clinical-glass-warning"
    : "clinical-glass-card clinical-glass-stable";

  const daysInUti = useMemo(() => calculateDaysInUti(patient.utiAdmissionDate), [patient.utiAdmissionDate]);

  const getFieldArray = (key: keyof Patient): string[] => {
    const value = patient[key];
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
    if (typeof value === 'string' && value.includes('\n')) {
      return value.split('\n').filter(v => v.trim() !== '');
    }
    return value ? [value as string] : [];
  };

  const handleUpdateField = (key: keyof Patient, value: string | string[] | number[]) => {
    onUpdate({
      ...patient,
      [key]: value
    });
  };

  // Toggle bed vacancy status. Releasing a vacant bed always starts clean
  // (no birth date, admission dates or lists left from the previous patient).
  const handleToggleVacancy = (isVacant: boolean) => {
    if (!isVacant && patient.isVacant) {
      onUpdate(releaseBedForFilling(patient));
      return;
    }
    onUpdate({
      ...patient,
      isVacant
    });
  };

  // Combined update for items + highlights to prevent race conditions on delete/drag
  const handleUpdateBothFields = (
    itemsKey: keyof Patient, 
    items: string[], 
    highlightsKey: keyof Patient, 
    highlights: number[]
  ) => {
    onUpdate({
      ...patient,
      [itemsKey]: items,
      [highlightsKey]: highlights
    });
  };

  // Tab navigation between columns: diagnoses → antecedentes → condutas → pendencias
  const handleTabFromColumn = (column: UtiColumn) => {
    const columnOrder: UtiColumn[] = ['diagnoses', 'antecedentes', 'exames', 'condutas', 'pendencias'];
    const currentIndex = columnOrder.indexOf(column);
    const nextIndex = (currentIndex + 1) % columnOrder.length;
    setActiveColumn(columnOrder[nextIndex]);
  };

  // Field data
  const antecedentes = getFieldArray("medicalHistory");
  const pendencias = getFieldArray("pendencies");
  const previsaoAlta = getFieldArray("utiDischargePrediction");
  const condutasDia = getFieldArray("utiDailyConducts");
  const dispositivos = getFieldArray("utiDevices");
  const culturasAtb = getFieldArray("utiCulturesAntibiotics");
  const alergias = getFieldArray("utiAllergies");
  const diagnosticos = getFieldArray("diagnoses");
  const especialidades = getFieldArray("utiSpecialties");
  const exames = getFieldArray("relevantExams");
  const setorOrigem = getFieldArray("utiOriginSector");
  const motivoAdmissao = getFieldArray("utiAdmissionReason");

  // Count critical items for badge
  const criticalCount = dispositivos.length + culturasAtb.length + alergias.length;

  // Ações do paciente: renderizadas na coluna lateral (tablet/computador)
  // e no canto da linha do paciente (celular).
  const actionControls = (
    <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                title="Edição avançada"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50 w-48">
                  {/* Print option */}
                  {onPrintPatient && (
                    <DropdownMenuItem onClick={() => onPrintPatient(patient.id)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Caso
                    </DropdownMenuItem>
                  )}
                  {patient.name && (
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                      <FileEdit className="h-4 w-4 mr-2 text-primary" />
                      Emitir Relatório
                    </DropdownMenuItem>
                  )}

                  {/* Mark as vacant - always visible for occupied beds */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleToggleVacancy(true)}>
                    <DoorOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    Marcar como Vago
                  </DropdownMenuItem>
                  
                  {/* Only show movement options if patient has data */}
                  {patient.name && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Realocação</DropdownMenuLabel>
                      
                      <DropdownMenuItem onClick={() => setIsReallocationDialogOpen(true)}>
                        <BedDouble className="h-4 w-4 mr-2 text-blue-500" />
                        Realocar Leito/UTI
                      </DropdownMenuItem>
                      
                      {canMove && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Movimentações</DropdownMenuLabel>

                          <DropdownMenuItem onClick={() => handleMovement("ALTA")}>
                            <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                            Alta
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleMovement("TRANSFERÊNCIA")}>
                            <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
                            Transferência
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleMovement("ÓBITO")}>
                            <Skull className="h-4 w-4 mr-2 text-red-500" />
                            Óbito
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
    </>
  );

  return (
    <>
      <div 
        className={cn("border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200", colors.card, patientCardGlass)}
        data-patient-id={patient.id}
        onPointerMove={updateClinicalGlassPointer}
        onPointerLeave={resetClinicalGlassPointer}
      >
        {/* VACANT BED VIEW */}
        {patient.isVacant ? (
          <div className="flex items-center justify-between p-2 md:p-3">
            <div className="flex items-center gap-2">
              {/* Bed Number */}
              <div className={cn("shrink-0 px-1.5 py-0.5 rounded border", colors.bedBg)}>
                <span className={cn("text-xs font-bold", colors.bedText)}>{patient.bedNumber}</span>
              </div>
              {/* Vacant Message */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <DoorOpen className="h-4 w-4" />
                <span className="text-sm font-medium italic">Leito Vago</span>
              </div>
            </div>
            {/* Actions for vacant bed */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleVacancy(false)}
                className={cn(
                  "h-7 text-xs gap-1.5",
                  colorVariant === 'blue'
                    ? "border-blue-400/50 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    : "border-slate-400/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                )}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Liberar para Preenchimento
              </Button>
            </div>
          </div>
        ) : (
          /* OCCUPIED BED VIEW - Normal card */
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Header - Collapsed View - FULLY EDITABLE */}
          <div className="flex items-stretch">
            {/* Main Content - Collapsed View */}
            <div className="flex-1 p-1.5 md:p-1.5 space-y-1.5 md:space-y-1 min-w-0">
              {/* Row 1: Identification Header - Mobile optimized */}
              <div className={cn(
                "flex flex-wrap items-center gap-1 md:gap-1.5 border-l rounded-r pl-1.5",
                patientDataDivider
              )}>
                {/* Collapse/Expand Toggle Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="shrink-0 h-5 w-5 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  title={isCollapsed ? "Expandir subseções" : "Retrair subseções"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Bed Number - Compact */}
                <div className={cn("shrink-0 px-1.5 py-0.5 rounded border", colors.bedBg)}>
                  <span className={cn("text-xs font-bold w-8 md:w-10 text-center inline-block", colors.bedText)}>
                    {patient.bedNumber}
                  </span>
                </div>
                
                {/* Patient Name + Birth Date + Age - Flexible grow */}
                <div className="flex-1 flex items-baseline gap-2 md:gap-3 min-w-0 flex-wrap">
                  {namesHidden ? (
                    <span className="text-xs md:text-sm font-semibold truncate tracking-widest opacity-70">{displayName}</span>
                  ) : (
                    <InlineEditableField
                      value={patient.name}
                      onUpdate={(v) => handleUpdateField("name", v)}
                      placeholder="NOME DO PACIENTE"
                      className="text-xs md:text-sm font-semibold truncate"
                    colorVariant={colorVariant}
                    />
                  )}
                  {/* Birth date (DN) */}
                  <div className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    <span className="font-semibold opacity-70">DN:</span>
                    <InlineEditableField
                      value={patient.birthDate || ""}
                      onUpdate={(v) => handleUpdateField("birthDate", v)}
                      placeholder="DD/MM/AAAA"
                      className="w-[78px] text-center"
                    colorVariant={colorVariant}
                    />
                  </div>
                  {/* Age - auto-calculated when birthDate exists */}
                  <div className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    {patient.birthDate ? (
                      (() => {
                        const detailed = calculateDetailedAge(patient.birthDate);
                        const formatted = formatDetailedAge(detailed);
                        return formatted ? (
                          <span className="font-semibold tabular-nums">{formatted}</span>
                        ) : (
                          <span className="opacity-50">—</span>
                        );
                      })()
                    ) : (
                      <>
                        <InlineEditableField
                          value={String(patient.age || "").replace(/\s*anos?\s*$/i, "")}
                          onUpdate={(v) => handleUpdateField("age", v)}
                          placeholder="IDADE"
                          className="w-8 text-center"
                        colorVariant={colorVariant}
                        />
                        {patient.age && <span>anos</span>}
                      </>
                    )}
                  </div>
                </div>
                {/* Ações (celular): no canto da linha do paciente */}
                <div className="md:hidden ml-auto self-start flex items-center gap-0.5 shrink-0 print:hidden">
                  {actionControls}
                </div>

                {/* Mobile: Chips wrap to second line */}
                <div className="flex items-center gap-1 flex-wrap md:flex-nowrap w-full md:w-auto mt-1 md:mt-0">
                  {/* Clinical Status indicator removido a pedido do usuário */}


                  {/* Days in UTI - Fixed width for consistent alignment */}
                  <div className={cn(
                    "shrink-0 flex items-center justify-center gap-1 w-[70px] md:w-[80px] px-2 py-0.5 rounded-md border",
                    daysInUti > 4
                      ? "bg-red-50 dark:bg-red-950/30 border-red-300/60 dark:border-red-700/50"
                      : colorVariant === 'yellow'
                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-300/60 dark:border-slate-600/50"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-800/40"
                  )}>
                    <span className={cn(
                      "text-[9px] font-bold",
                      daysInUti > 4
                        ? "text-red-700 dark:text-red-300"
                        : colorVariant === 'yellow'
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-blue-700 dark:text-blue-300"
                    )}>
                      DIH:
                    </span>
                    <span className={cn(
                      "text-xs font-bold min-w-[20px] text-center",
                      daysInUti > 4
                        ? "text-red-700 dark:text-red-300"
                        : colorVariant === 'yellow'
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-blue-700 dark:text-blue-300"
                    )}>
                      {daysInUti}
                    </span>
                    {daysInUti > 4 ? (
                      <span title="Longa permanência">
                        <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </span>
                    ) : (
                      <span className="w-3" /> 
                    )}
                  </div>

                  {/* UTI Admission Date */}
                  <div className={cn("hidden md:flex shrink-0 items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-transparent transition-colors", patientDataHover)}>
                    <span className="text-[9px]">Admissão UTI:</span>
                    <InlineEditableField
                      value={patient.utiAdmissionDate?.[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiAdmissionDate", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-[10px] font-medium w-20"
                    colorVariant={colorVariant}
                    />
                  </div>

                  {/* Discharge Prediction */}
                  <div className={cn("hidden md:flex shrink-0 items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-transparent transition-colors", patientDataHover)}>
                    <span className="text-[9px]">Previsão de Alta:</span>
                    <InlineEditableField
                      value={previsaoAlta[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiDischargePrediction", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-[10px] font-medium w-20"
                    colorVariant={colorVariant}
                    />
                  </div>

                  {/* Critical badge - Only alert when needed */}
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="shrink-0 h-4 gap-0.5 text-[8px] md:text-[9px] px-1">
                      <AlertTriangle className="h-2 w-2" />
                      {criticalCount}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Row 2: 5 columns on desktop (Hipóteses · Antecedentes · Exames · Plano · Pendências), 2 per row on mobile */}
              <SmoothCollapse open={!isCollapsed} className="!mt-0">
                <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr_1.15fr_1.5fr] gap-y-0 pt-1">
                  <div className={cn(COLUMN_CELL, columnHover)}>
                    <InlineEditableArray
                      items={diagnosticos}
                      onUpdate={(items) => handleUpdateField("diagnoses", items)}
                      label="Hipóteses / Diagnósticos"
                      icon={<Stethoscope className={cn("h-2.5 w-2.5", colors.col1Icon)} />}
                      iconColorClass={colors.col1Icon}
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedDiagnoses || []}
                      onUpdateHighlights={(indices) => handleUpdateField("highlightedDiagnoses", indices)}
                      onUpdateBoth={(items, highlights) => handleUpdateBothFields("diagnoses", items, "highlightedDiagnoses", highlights)}
                      fieldId="diagnoses"
                      isActive={activeColumn === 'diagnoses'}
                      onTabPress={() => handleTabFromColumn('diagnoses')}
                      onEnterPress={() => setActiveColumn('diagnoses')}
                      highlightColorVariant={colorVariant}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, columnHover)}>
                    <InlineEditableArray
                      items={antecedentes}
                      onUpdate={(items) => handleUpdateField("medicalHistory", items)}
                      label="Antecedentes / Comorbidades"
                      icon={<Activity className={cn("h-2.5 w-2.5", colors.col2Icon)} />}
                      iconColorClass={colors.col2Icon}
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedMedicalHistory || []}
                      onUpdateHighlights={(indices) => handleUpdateField("highlightedMedicalHistory", indices)}
                      onUpdateBoth={(items, highlights) => handleUpdateBothFields("medicalHistory", items, "highlightedMedicalHistory", highlights)}
                      fieldId="antecedentes"
                      isActive={activeColumn === 'antecedentes'}
                      onTabPress={() => handleTabFromColumn('antecedentes')}
                      onEnterPress={() => setActiveColumn('antecedentes')}
                      highlightColorVariant={colorVariant}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, columnHover)}>
                    <InlineEditableArray
                      items={exames}
                      onUpdate={(items) => handleUpdateField("relevantExams", items)}
                      label="Exames"
                      icon={<FlaskConical className={cn("h-2.5 w-2.5", colors.col2Icon)} />}
                      iconColorClass={colors.col2Icon}
                      alwaysShowAll
                      compact
                      fieldId="exames"
                      isActive={activeColumn === 'exames'}
                      onTabPress={() => handleTabFromColumn('exames')}
                      onEnterPress={() => setActiveColumn('exames')}
                      highlightColorVariant={colorVariant}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, columnHover)}>
                    <InlineEditableArray
                      items={condutasDia}
                      onUpdate={(items) => handleUpdateField("utiDailyConducts", items)}
                      label="Plano Terapêutico"
                      icon={<FileText className={cn("h-2.5 w-2.5", colors.col3Icon)} />}
                      iconColorClass={colors.col3Icon}
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedConducts || []}
                      onUpdateHighlights={(indices) => handleUpdateField("highlightedConducts", indices)}
                      onUpdateBoth={(items, highlights) => handleUpdateBothFields("utiDailyConducts", items, "highlightedConducts", highlights)}
                      fieldId="condutas"
                      isActive={activeColumn === 'condutas'}
                      onTabPress={() => handleTabFromColumn('condutas')}
                      onEnterPress={() => setActiveColumn('condutas')}
                      highlightColorVariant={colorVariant}
                    />
                  </div>
                  <div className={cn(COLUMN_CELL, columnHover)}>
                    <InlineEditableArray
                      items={pendencias}
                      onUpdate={(items) => handleUpdateField("pendencies", items)}
                      label="Programações / Pendências"
                      icon={<ClipboardList className={cn("h-2.5 w-2.5", colors.col4Icon)} />}
                      iconColorClass={colors.col4Icon}
                      alwaysShowAll
                      compact
                      highlightedIndices={patient.highlightedPendencies || []}
                      onUpdateHighlights={(indices) => handleUpdateField("highlightedPendencies", indices)}
                      onUpdateBoth={(items, highlights) => handleUpdateBothFields("pendencies", items, "highlightedPendencies", highlights)}
                      fieldId="pendencias"
                      isActive={activeColumn === 'pendencias'}
                      onTabPress={() => handleTabFromColumn('pendencias')}
                      onEnterPress={() => setActiveColumn('pendencias')}
                      highlightColorVariant={colorVariant}
                    />
                  </div>
                </div>
              </SmoothCollapse>
            </div>

            {/* Ações (tablet/computador) */}
            <div className={cn(
              "hidden md:flex items-center justify-center gap-0.5 px-1 py-1 border-l border-border/30 bg-muted/20 transition-all",
              isCollapsed ? "flex-row" : "flex-col"
            )}>
              {actionControls}
            </div>
          </div>

          {/* Expanded Content - Complete UTI fields */}
          <CollapsibleContent className={COLLAPSIBLE_CONTENT_MOTION}>
            <div className="border-t border-border/30 p-3 space-y-3 bg-muted/5">
              
              {/* 🔴 CRÍTICO - Patient safety items */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">CRÍTICO</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <InlineEditableArray
                    items={dispositivos}
                    onUpdate={(items) => handleUpdateField("utiDevices", items)}
                    label="DISPOSITIVOS"
                    colorClass="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                  <InlineEditableArray
                    items={alergias}
                    onUpdate={(items) => handleUpdateField("utiAllergies", items)}
                    label="ALERGIAS"
                    colorClass="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                  <InlineEditableArray
                    items={culturasAtb}
                    onUpdate={(items) => handleUpdateField("utiCulturesAntibiotics", items)}
                    label="CULTURAS / ATB"
                    icon={<Pill className="h-3 w-3 text-red-400" />}
                    colorClass="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                </div>
              </div>

              {/* 🔵 CLÍNICO - Clinical evolution */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CLÍNICO</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <InlineEditableArray
                    items={especialidades}
                    onUpdate={(items) => handleUpdateField("utiSpecialties", items)}
                    label="ESPECIALIDADES"
                    colorClass="bg-muted/50 border border-border/50"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                  {/* EXAMES agora é a 3ª coluna do cartão (após Antecedentes) */}
                </div>
              </div>

              {/* 📝 HISTÓRIA - Admission history */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">HISTÓRIA ADMISSIONAL</span>
                </div>
                <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                  <InlineEditableTextarea
                    value={patient.admissionHistory || ""}
                    onUpdate={(v) => handleUpdateField("admissionHistory", v)}
                    placeholder="HISTÓRIA ADMISSIONAL / ANAMNESE..."
                    colorVariant={colorVariant}
                  />
                </div>
              </div>

              {/* 📁 ADMINISTRATIVO */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">ADMINISTRATIVO</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <InlineEditableArray
                    items={setorOrigem}
                    onUpdate={(items) => handleUpdateField("utiOriginSector", items)}
                    label="SETOR DE ORIGEM"
                    colorClass="bg-muted/30 border border-border/30"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                  <InlineEditableArray
                    items={motivoAdmissao}
                    onUpdate={(items) => handleUpdateField("utiAdmissionReason", items)}
                    label="MOTIVO DA ADMISSÃO"
                    colorClass="bg-muted/30 border border-border/30"
                    alwaysShowAll
                    highlightColorVariant={colorVariant}
                  />
                  <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">ADMISSÃO UTI</span>
                    <InlineEditableField
                      value={getFieldArray("utiAdmissionDate")[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiAdmissionDate", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-sm"
                      colorVariant={colorVariant}
                    />
                  </div>
                  <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">PREVISÃO DE ALTA</span>
                    <InlineEditableField
                      value={previsaoAlta[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiDischargePrediction", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-sm"
                      colorVariant={colorVariant}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        )}
      </div>

      <EditPatientDialog
        patient={patient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={(updatedPatient) => {
          onUpdate(updatedPatient);
          setIsEditDialogOpen(false);
        }}
      />

      {/* Movement Dialog */}
      <PatientMovementDialog
        patient={patient}
        movementType={movementType}
        isOpen={isMovementDialogOpen}
        onClose={() => {
          setIsMovementDialogOpen(false);
          setMovementType(null);
        }}
        onSuccess={handleMovementSuccess}
      />

      {/* Reallocation Dialog */}
      <UtiReallocationDialog
        patient={patient}
        isOpen={isReallocationDialogOpen}
        onClose={() => setIsReallocationDialogOpen(false)}
        onSuccess={handleReallocationSuccess}
        currentUtiUnit={derivedUtiUnit}
        allPatients={allPatients}
      />
      {patient.name && (
        <PatientReportDialog patient={patient} open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
      )}
    </>
  );
}
