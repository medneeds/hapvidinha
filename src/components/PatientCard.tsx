import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit, Trash2, Copy, ArrowRightLeft, Printer, Check, X, GripVertical, MoreVertical, Maximize2, TrendingUp, Heart, Skull, Sparkles, Star, FileText, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import { PatientMovementDialog } from "./PatientMovementDialog";
import { MedicalResponsibilityDialog } from "./MedicalResponsibilityDialog";
import { MedicalResponsibilityIndicator } from "./MedicalResponsibilityIndicator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgeCalculator } from "@/hooks/useAgeCalculator";
import { useDepartment } from "@/contexts/DepartmentContext";
import { formatAgeDisplay } from "@/utils/ageDisplay";
import { differenceInDays, parseISO, isValid, parse } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to format date input as DD/MM/YYYY
const formatDateInput = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Format as DD/MM/YYYY
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

// Helper function to calculate days until discharge
const calculateDaysUntilDischarge = (dateString: string): string | null => {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    // Try parsing various date formats
    let targetDate: Date | null = null;
    
    // Try ISO format first (YYYY-MM-DD)
    targetDate = parseISO(dateString);
    
    // If invalid, try DD/MM/YYYY format
    if (!isValid(targetDate)) {
      targetDate = parse(dateString, 'dd/MM/yyyy', new Date());
    }
    
    // If still invalid, try DD-MM-YYYY format
    if (!isValid(targetDate)) {
      targetDate = parse(dateString, 'dd-MM-yyyy', new Date());
    }
    
    if (!isValid(targetDate)) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day calculation
    targetDate.setHours(0, 0, 0, 0);
    
    const days = differenceInDays(targetDate, today);
    
    if (days < 0) {
      return `(${Math.abs(days)} dias atrás)`;
    } else if (days === 0) {
      return '(hoje)';
    } else if (days === 1) {
      return '(amanhã)';
    } else {
      return `(em ${days} dias)`;
    }
  } catch (error) {
    return null;
  }
};

interface PatientCardProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onUndelete?: (patient: Patient) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
}

const sectorConfig = {
  red: {
    label: "Sala Vermelha",
    color: "bg-critical/10 border-critical/30 text-critical-foreground",
    badgeColor: "bg-critical text-critical-foreground hover:bg-critical/90"
  },
  yellow: {
    label: "Observação Amarela",
    color: "bg-warning/10 border-warning/30 text-warning-foreground",
    badgeColor: "bg-warning text-warning-foreground hover:bg-warning/90"
  },
  blue: {
    label: "Observação Azul",
    color: "bg-stable/10 border-stable/30 text-stable-foreground",
    badgeColor: "bg-stable text-stable-foreground hover:bg-stable/90"
  },
  outside: {
    label: "Fora das Alas",
    color: "bg-muted/50 border-muted-foreground/30 text-foreground",
    badgeColor: "bg-muted-foreground text-background hover:bg-muted-foreground/90"
  }
};

const sectorLabels = {
  red: "Cuidados Especiais",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
  outside: "Fora das Alas"
};

interface SortablePendencyItemProps {
  id: string;
  index: number;
  pendency: string;
  isHighlighted?: boolean;
  onToggleHighlight?: () => void;
  sector: Patient['sector'];
}

function SortablePendencyItem({ id, index, pendency, isHighlighted, onToggleHighlight, sector }: SortablePendencyItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const highlightColors = {
    red: "bg-critical/20 border-critical/50",
    yellow: "bg-warning/20 border-warning/50",
    blue: "bg-stable/20 border-stable/50",
    outside: "bg-muted-foreground/20 border-muted-foreground/50"
  };

  const starColors = {
    red: "fill-critical text-critical",
    yellow: "fill-warning text-warning",
    blue: "fill-stable text-stable",
    outside: "fill-muted-foreground text-muted-foreground"
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight flex items-center gap-2 rounded px-2 -mx-1 py-1.5 group",
        isDragging ? "bg-accent/50 z-50" : "hover:bg-accent/30",
        isHighlighted && `${highlightColors[sector]} border shadow-sm`
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing print:hidden"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </div>
      <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
      <span className={cn("flex-1", isHighlighted && "font-bold")}>{pendency}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleHighlight}
        className="h-5 w-5 p-0 print:hidden opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Star className={cn("h-3 w-3", isHighlighted ? starColors[sector] : "text-muted-foreground")} />
      </Button>
    </li>
  );
}

interface SortablePendencyItemCollapsedProps {
  id: string;
  index: number;
  pendency: string;
  onEdit: () => void;
  onRemove: () => void;
  isLast: boolean;
  onAddNew: () => void;
  editingField: string | null;
  isHighlighted?: boolean;
  onToggleHighlight?: () => void;
  sector: Patient['sector'];
}

function SortablePendencyItemCollapsed({ 
  id, 
  index, 
  pendency, 
  onEdit, 
  onRemove, 
  isLast, 
  onAddNew,
  editingField,
  isHighlighted,
  onToggleHighlight,
  sector
}: SortablePendencyItemCollapsedProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const highlightColors = {
    red: "bg-critical/20 border-critical/50",
    yellow: "bg-warning/20 border-warning/50",
    blue: "bg-stable/20 border-stable/50",
    outside: "bg-muted-foreground/20 border-muted-foreground/50"
  };

  const starColors = {
    red: "fill-critical text-critical",
    yellow: "fill-warning text-warning",
    blue: "fill-stable text-stable",
    outside: "fill-muted-foreground text-muted-foreground"
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-[10px] text-foreground leading-snug uppercase group/item rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5",
        isDragging ? "bg-accent/50 z-50" : "hover:bg-accent/50",
        isHighlighted && `${highlightColors[sector]} border shadow-sm`
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing print:hidden flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <span 
        className="break-words flex items-start gap-1 flex-1 cursor-pointer"
        onClick={onEdit}
      >
        <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
        <span className={cn("break-words", isHighlighted && "font-bold")}>{pendency}</span>
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleHighlight?.();
          }}
          className="opacity-0 group-hover/item:opacity-100 hover:text-primary print:hidden"
        >
          <Star className={cn("h-2.5 w-2.5", isHighlighted ? starColors[sector] : "text-muted-foreground")} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover/item:opacity-100 hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
        {isLast && editingField !== "pendencies" && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAddNew();
            }}
            className="h-4 w-4 text-muted-foreground hover:text-primary print:hidden p-0"
            title="Adicionar Programação/Pendência"
          >
            <span className="text-xs">+</span>
          </Button>
        )}
      </div>
    </div>
  );
}

interface SortableDiagnosisItemCollapsedProps {
  id: string;
  index: number;
  diagnosis: string;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onAddNew: () => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isLast: boolean;
  onGetCid?: (diagnosis: string, index: number) => void;
  loadingCid?: boolean;
  daysCalculation?: string | null;
}

function SortableDiagnosisItemCollapsed({ 
  id, 
  index, 
  diagnosis,
  isEditing,
  editValue,
  onEdit, 
  onSave,
  onCancel,
  onRemove, 
  isLast, 
  onAddNew,
  onEditValueChange,
  onKeyDown,
  inputRef,
  onGetCid,
  loadingCid,
  daysCalculation
}: SortableDiagnosisItemCollapsedProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        className="text-[10px] text-foreground leading-snug uppercase group/item rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary"
      >
        <div className="flex-shrink-0 w-3" />
        <div className="flex items-center gap-1 flex-1">
          <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {onGetCid && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onGetCid(editValue, index)}
              disabled={loadingCid}
              className="h-4 w-4 text-amber-500 hover:bg-amber-100 hover:text-amber-600 p-0 transition-colors"
              title="Buscar código CID"
            >
              <Sparkles className={`h-2.5 w-2.5 ${loadingCid ? 'animate-pulse' : ''}`} />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onSave}
            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
          >
            <Check className="h-2.5 w-2.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li 
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-[10px] text-foreground leading-snug uppercase group/item rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5",
        isDragging ? "bg-accent/50 z-50" : "hover:bg-accent/50"
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing print:hidden flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <span 
        className="break-words flex items-start gap-1 flex-1 cursor-pointer"
        onClick={onEdit}
      >
        <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
        <span className="break-words">{diagnosis}</span>
        {daysCalculation && (
          <span className="text-[9px] text-muted-foreground/70 ml-1 font-normal">{daysCalculation}</span>
        )}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover/item:opacity-100 hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
        {isLast && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAddNew();
            }}
            className="h-4 w-4 text-muted-foreground hover:text-primary print:hidden p-0"
            title="Adicionar Hipótese/Diagnóstico"
          >
            <span className="text-xs">+</span>
          </Button>
        )}
      </div>
    </li>
  );
}

export function PatientCard({ patient, onUpdate, onDelete, onUndelete, selectionMode = false, isSelected = false, onToggleSelection, onTransfer, onPrintPatient }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<"ALTA" | "ÓBITO" | "TRANSFERÊNCIA" | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingArrayIndex, setEditingArrayIndex] = useState<number>(-1);
  const [expandedSection, setExpandedSection] = useState<'diagnoses' | 'exams' | 'medicalHistory' | 'pendencies' | null>(null);
  const [loadingCid, setLoadingCid] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = sectorConfig[patient.sector];
  const { toast: toastHook } = useToast();
  const { currentDepartment } = useDepartment();
  const isPediatric = currentDepartment === "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA";
  const { calculateAge, isCalculating } = useAgeCalculator(isPediatric);
  const navigate = useNavigate();
  const [medicalResponsibilityDialogOpen, setMedicalResponsibilityDialogOpen] = useState(false);
  const [localMedicalResponsibility, setLocalMedicalResponsibility] = useState(patient.medicalResponsibility);
  
  const sectorColorMap = {
    red: "#ef4444",
    yellow: "#eab308",
    blue: "#3b82f6",
    outside: "#6b7280"
  };

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const handleCopyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(patient.name);
      toastHook({
        title: "Nome copiado",
        description: `"${patient.name}" foi copiado para a área de transferência.`,
      });
    } catch (err) {
      toastHook({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o nome.",
        variant: "destructive",
      });
    }
  };

  const getCidCode = async (diagnosis: string, index: number) => {
    if (!diagnosis.trim()) {
      toast.error("Digite um diagnóstico antes de buscar o CID");
      return;
    }

    setLoadingCid(index);
    try {
      const { data, error } = await supabase.functions.invoke('get-cid-code', {
        body: { diagnosis }
      });

      if (error) throw error;

      if (data?.cidCode) {
        const diagnosisWithCid = `${diagnosis} (${data.cidCode})`;
        
        // Se estiver em modo de edição, atualiza o valor de edição e salva automaticamente
        if (editingField === "diagnoses" && editingArrayIndex === index) {
          setEditValue(diagnosisWithCid);
          
          // Salva automaticamente
          const updatedPatient = { ...patient };
          updatedPatient.diagnoses = patient.diagnoses.map((d, i) => 
            i === index ? diagnosisWithCid : d
          );
          onUpdate(updatedPatient);
          
          // Cancela o modo de edição
          setEditingField(null);
          setEditValue("");
          setEditingArrayIndex(-1);
        } else {
          // Caso não esteja em edição, atualiza diretamente
          const updatedDiagnoses = patient.diagnoses.map((d, i) => 
            i === index ? diagnosisWithCid : d
          );
          onUpdate({ ...patient, diagnoses: updatedDiagnoses });
        }
        
        toast.success(`CID ${data.cidCode} adicionado`);
      }
    } catch (error) {
      console.error('Error getting CID code:', error);
      toast.error("Erro ao buscar código CID");
    } finally {
      setLoadingCid(null);
    }
  };

  const handleTransfer = (newSector: Patient['sector']) => {
    if (onTransfer && newSector !== patient.sector) {
      onTransfer(patient.id, newSector);
    }
  };

  const startEditing = (field: string, currentValue: string, index: number = -1) => {
    setEditingField(field);
    setEditValue(currentValue);
    setEditingArrayIndex(index);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
    setEditingArrayIndex(-1);
  };

  const saveInlineEdit = async () => {
    if (!editingField) return;

    const updatedPatient = { ...patient };
    
    if (editingField === "name") {
      updatedPatient.name = editValue.toUpperCase();
    } else if (editingField === "age") {
      // Tenta formatar idade usando IA (data de nascimento ou idade simples)
      const formattedAge = await calculateAge(editValue);
      updatedPatient.age = formattedAge ?? editValue.toUpperCase();
    } else if (editingField === "diagnoses") {
      if (editingArrayIndex === -2) {
        // Adding new
        if (editValue.trim()) {
          updatedPatient.diagnoses = [...patient.diagnoses, editValue.toUpperCase()];
        }
      } else {
        // Editing existing
        updatedPatient.diagnoses = patient.diagnoses.map((d, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : d
        );
      }
    } else if (editingField === "medicalHistory") {
      if (editingArrayIndex === -2) {
        // Adding new
        if (editValue.trim()) {
          updatedPatient.medicalHistory = [...patient.medicalHistory, editValue.toUpperCase()];
        }
      } else {
        // Editing existing
        updatedPatient.medicalHistory = patient.medicalHistory.map((h, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : h
        );
      }
    } else if (editingField === "relevantExams") {
      if (editingArrayIndex === -2) {
        // Adding new
        if (editValue.trim()) {
          updatedPatient.relevantExams = [...patient.relevantExams, editValue.toUpperCase()];
        }
      } else {
        // Editing existing
        updatedPatient.relevantExams = patient.relevantExams.map((e, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : e
        );
      }
    } else if (editingField === "pendencies") {
      if (editingArrayIndex === -2) {
        // Adding new
        if (editValue.trim()) {
          updatedPatient.pendencies = [...patient.pendencies, editValue.toUpperCase()];
        }
      } else {
        // Editing existing
        updatedPatient.pendencies = patient.pendencies.map((p, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : p
        );
      }
    } else if (editingField === "utiAdmissionDate") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiAdmissionDate = [...(patient.utiAdmissionDate || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiAdmissionDate = (patient.utiAdmissionDate || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiDischargePrediction") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiDischargePrediction = [...(patient.utiDischargePrediction || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiDischargePrediction = (patient.utiDischargePrediction || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiAllergies") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiAllergies = [...(patient.utiAllergies || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiAllergies = (patient.utiAllergies || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiAdmissionReason") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiAdmissionReason = [...(patient.utiAdmissionReason || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiAdmissionReason = (patient.utiAdmissionReason || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiCurrentStatus") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiCurrentStatus = [...(patient.utiCurrentStatus || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiCurrentStatus = (patient.utiCurrentStatus || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiDevices") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiDevices = [...(patient.utiDevices || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiDevices = (patient.utiDevices || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiSpecialties") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiSpecialties = [...(patient.utiSpecialties || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiSpecialties = (patient.utiSpecialties || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiCulturesAntibiotics") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiCulturesAntibiotics = [...(patient.utiCulturesAntibiotics || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiCulturesAntibiotics = (patient.utiCulturesAntibiotics || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiOriginSector") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiOriginSector = [...(patient.utiOriginSector || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiOriginSector = (patient.utiOriginSector || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiAdmissionReason") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiAdmissionReason = [...(patient.utiAdmissionReason || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiAdmissionReason = (patient.utiAdmissionReason || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiCurrentStatus") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiCurrentStatus = [...(patient.utiCurrentStatus || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiCurrentStatus = (patient.utiCurrentStatus || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    } else if (editingField === "utiDevices") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.utiDevices = [...(patient.utiDevices || []), editValue.toUpperCase()];
        }
      } else {
        updatedPatient.utiDevices = (patient.utiDevices || []).map((item, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : item
        );
      }
    }

    onUpdate(updatedPatient);
    setEditingField(null);
    setEditValue("");
    setEditingArrayIndex(-1);
    
    toastHook({
      title: "Campo atualizado",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const saveAndContinueAdding = () => {
    if (!editingField || !editValue.trim()) return;

    const updatedPatient = { ...patient };
    
    if (editingField === "diagnoses") {
      updatedPatient.diagnoses = [...patient.diagnoses, editValue.toUpperCase()];
    } else if (editingField === "medicalHistory") {
      updatedPatient.medicalHistory = [...patient.medicalHistory, editValue.toUpperCase()];
    } else if (editingField === "relevantExams") {
      updatedPatient.relevantExams = [...patient.relevantExams, editValue.toUpperCase()];
    } else if (editingField === "pendencies") {
      updatedPatient.pendencies = [...patient.pendencies, editValue.toUpperCase()];
    }

    onUpdate(updatedPatient);
    setEditValue("");
    // Incrementa o index para refletir o novo item adicionado
    setEditingArrayIndex(-2);
    
    toastHook({
      title: "Item adicionado",
      description: "Continue adicionando ou use Tab para próxima coluna.",
    });
  };

  const removeArrayItem = (field: "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "utiAdmissionDate" | "utiDischargePrediction" | "utiAllergies" | "utiAdmissionReason" | "utiCurrentStatus" | "utiDevices" | "utiSpecialties" | "utiCulturesAntibiotics" | "utiOriginSector", index: number) => {
    const updatedPatient = { ...patient };
    
    if (field === "diagnoses") {
      updatedPatient.diagnoses = patient.diagnoses.filter((_, i) => i !== index);
    } else if (field === "medicalHistory") {
      updatedPatient.medicalHistory = patient.medicalHistory.filter((_, i) => i !== index);
    } else if (field === "relevantExams") {
      updatedPatient.relevantExams = patient.relevantExams.filter((_, i) => i !== index);
    } else if (field === "pendencies") {
      updatedPatient.pendencies = patient.pendencies.filter((_, i) => i !== index);
    } else if (field === "utiAdmissionDate") {
      updatedPatient.utiAdmissionDate = (patient.utiAdmissionDate || []).filter((_, i) => i !== index);
    } else if (field === "utiDischargePrediction") {
      updatedPatient.utiDischargePrediction = (patient.utiDischargePrediction || []).filter((_, i) => i !== index);
    } else if (field === "utiAllergies") {
      updatedPatient.utiAllergies = (patient.utiAllergies || []).filter((_, i) => i !== index);
    } else if (field === "utiAdmissionReason") {
      updatedPatient.utiAdmissionReason = (patient.utiAdmissionReason || []).filter((_, i) => i !== index);
    } else if (field === "utiCurrentStatus") {
      updatedPatient.utiCurrentStatus = (patient.utiCurrentStatus || []).filter((_, i) => i !== index);
    } else if (field === "utiDevices") {
      updatedPatient.utiDevices = (patient.utiDevices || []).filter((_, i) => i !== index);
    } else if (field === "utiSpecialties") {
      updatedPatient.utiSpecialties = (patient.utiSpecialties || []).filter((_, i) => i !== index);
    } else if (field === "utiCulturesAntibiotics") {
      updatedPatient.utiCulturesAntibiotics = (patient.utiCulturesAntibiotics || []).filter((_, i) => i !== index);
    } else if (field === "utiOriginSector") {
      updatedPatient.utiOriginSector = (patient.utiOriginSector || []).filter((_, i) => i !== index);
    } else if (field === "utiAdmissionReason") {
      updatedPatient.utiAdmissionReason = (patient.utiAdmissionReason || []).filter((_, i) => i !== index);
    } else if (field === "utiCurrentStatus") {
      updatedPatient.utiCurrentStatus = (patient.utiCurrentStatus || []).filter((_, i) => i !== index);
    }

    onUpdate(updatedPatient);
    toastHook({
      title: "Item removido",
      description: "O item foi removido com sucesso.",
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = patient.pendencies.findIndex((_, i) => `pendency-${i}` === active.id);
      const newIndex = patient.pendencies.findIndex((_, i) => `pendency-${i}` === over.id);

      const updatedPatient = {
        ...patient,
        pendencies: arrayMove(patient.pendencies, oldIndex, newIndex),
      };

      onUpdate(updatedPatient);
      toastHook({
        title: "Ordem atualizada",
        description: "A ordem das programações foi reorganizada.",
      });
    }
  };

  const handleDragEndDiagnoses = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = patient.diagnoses.findIndex((_, i) => `diagnosis-${i}` === active.id);
      const newIndex = patient.diagnoses.findIndex((_, i) => `diagnosis-${i}` === over.id);

      const updatedPatient = {
        ...patient,
        diagnoses: arrayMove(patient.diagnoses, oldIndex, newIndex),
      };

      onUpdate(updatedPatient);
      toastHook({
        title: "Ordem atualizada",
        description: "A ordem das hipóteses foi reorganizada.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Enter: salva e continua na mesma coluna (próximo item do array ou apenas salva)
      if (editingArrayIndex === -2 && (editingField === "diagnoses" || editingField === "medicalHistory" || editingField === "relevantExams" || editingField === "pendencies")) {
        saveAndContinueAdding();
      } else {
        saveInlineEdit();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Tab: salva e move para a próxima coluna
      saveInlineEdit();
      
      // Determina qual é a próxima coluna
      setTimeout(() => {
        if (editingField === "name") {
          startEditing("age", patient.age.toString());
        } else if (editingField === "age") {
          if (patient.diagnoses.length > 0) {
            startEditing("diagnoses", patient.diagnoses[0], 0);
          } else {
            startEditing("diagnoses", "", -2);
          }
        } else if (editingField === "diagnoses") {
          if (patient.medicalHistory.length > 0) {
            startEditing("medicalHistory", patient.medicalHistory[0], 0);
          } else {
            startEditing("medicalHistory", "", -2);
          }
        } else if (editingField === "medicalHistory") {
          if (patient.relevantExams.length > 0) {
            startEditing("relevantExams", patient.relevantExams[0], 0);
          } else {
            startEditing("relevantExams", "", -2);
          }
        } else if (editingField === "relevantExams") {
          if (patient.pendencies.length > 0) {
            startEditing("pendencies", patient.pendencies[0], 0);
          } else {
            startEditing("pendencies", "", -2);
          }
        }
      }, 50);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const checkboxColor = {
    red: "border-critical data-[state=checked]:bg-critical data-[state=checked]:border-critical",
    yellow: "border-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning",
    blue: "border-stable data-[state=checked]:bg-stable data-[state=checked]:border-stable",
    outside: "border-muted-foreground data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
  }[patient.sector];

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg print:shadow-none print:break-inside-avoid print:mb-0 print:w-full", 
        config.color,
        isSelected && "ring-2 ring-primary",
        isDeleting && "animate-[slide-out-left_0.3s_ease-out_forwards]"
      )}>
        <div className="p-2 print:p-1.5">
          <div className="flex items-start justify-between gap-2 print:gap-1">
            {selectionMode && onToggleSelection && (
              <div className="flex items-center justify-center print:hidden flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(patient.id)}
                  className={cn("h-5 w-5", checkboxColor)}
                />
              </div>
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-18 gap-1.5 items-start">
              {/* Leito - ultra compacto */}
              <div className="flex flex-col md:col-span-1 gap-1">
                <span className="text-[9px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge className={cn("w-fit text-[10px] py-0 px-1 font-bold leading-tight", config.badgeColor)}>
                  {patient.bedNumber}
                </Badge>
                <div className="flex flex-col gap-0.5">
                  {localMedicalResponsibility?.type ? (
                    <MedicalResponsibilityIndicator
                      responsibility={localMedicalResponsibility}
                      sectorColor={sectorColorMap[patient.sector]}
                      onClick={() => setMedicalResponsibilityDialogOpen(true)}
                      compact
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMedicalResponsibilityDialogOpen(true)}
                      className="h-5 w-5 p-0 print:hidden rounded-full border border-dashed transition-all duration-300 flex items-center justify-center hover:scale-125 hover:rotate-90 dark:border-opacity-60"
                      style={{
                        color: sectorColorMap[patient.sector],
                        borderColor: sectorColorMap[patient.sector],
                        opacity: 0.5,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.backgroundColor = `${sectorColorMap[patient.sector]}30`;
                        e.currentTarget.style.borderStyle = 'solid';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderStyle = 'dashed';
                      }}
                      title="Adicionar responsável médico"
                    >
                      <span className="text-sm font-bold transition-transform duration-300">+</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Nome e Idade - mais espaço para nome completo */}
              <div className="flex flex-col md:col-span-4">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
                <div className="group/name relative">
                  <div className="flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      {editingField === "name" ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-6 text-sm font-semibold uppercase"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-6 w-6 text-green-600 hover:bg-green-100"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-6 w-6 text-red-600 hover:bg-red-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p 
                          className="font-semibold text-sm text-foreground leading-tight uppercase break-words cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                          onClick={() => startEditing("name", patient.name)}
                          title="Clique para editar"
                        >
                          {patient.name || <span className="text-muted-foreground italic">Clique para adicionar nome</span>}
                        </p>
                      )}
                      
                      {editingField === "age" ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[11px] w-32"
                            placeholder="Idade ou data nasc."
                            disabled={isCalculating}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-5 w-5 text-green-600 hover:bg-green-100"
                            disabled={isCalculating}
                          >
                            <Check className={cn("h-2.5 w-2.5", isCalculating && "animate-spin")} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-5 w-5 text-red-600 hover:bg-red-100"
                            disabled={isCalculating}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <p 
                          className="text-[11px] text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 whitespace-normal break-words"
                          onClick={() => startEditing("age", typeof patient.age === 'number' ? patient.age.toString() : patient.age)}
                          title="Clique para editar"
                        >
                          {patient.age ? formatAgeDisplay(patient.age) : <span className="italic">Clique para adicionar idade</span>}
                        </p>
                      )}
                    </div>
                    {!editingField && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyName}
                        className="h-5 w-5 opacity-60 group-hover/name:opacity-100 transition-opacity print:hidden hover:bg-primary/10 hover:text-primary flex-shrink-0 text-muted-foreground"
                        title="Copiar nome"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
              </div>
            </div>

            {/* UTI - Campos específicos logo após nome do paciente */}
            {currentDepartment === "UTI" && (
              <>
                {/* Bloco Administrativo - Linha 1 */}
                <div className="md:col-span-12 border-l-2 border-primary/20 pl-3 py-2 bg-muted/5 rounded-r">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Setor de Origem */}
                    <div className="flex flex-col md:col-span-2">
                  <span className="text-[9px] font-medium text-muted-foreground mb-0">Setor de Origem</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiOriginSector || []).findIndex((_, i) => `uti-origin-${i}` === active.id);
                        const newIndex = (patient.utiOriginSector || []).findIndex((_, i) => `uti-origin-${i}` === over.id);
                        const reordered = arrayMove(patient.utiOriginSector || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiOriginSector: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiOriginSector || []).map((_, i) => `uti-origin-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0 print:text-[7.5px] list-none pl-0">
                        {(patient.utiOriginSector || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-origin-${idx}`}
                            id={`uti-origin-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiOriginSector" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiOriginSector", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiOriginSector", idx)}
                            onAddNew={() => startEditing("utiOriginSector", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiOriginSector || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiOriginSector" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiOriginSector || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVO SETOR"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    {(patient.utiOriginSector || []).length === 0 && editingField !== "utiOriginSector" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("utiOriginSector", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Setor de Origem"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Admissão UTI */}
                  <div className="flex flex-col md:col-span-2">
                  <span className="text-[9px] font-medium text-muted-foreground mb-0">Admissão UTI</span>
                      <ol className="text-xs text-foreground space-y-0 print:text-[7.5px] list-none pl-0">
                        {(patient.utiAdmissionDate || []).map((item, idx) => (
                          <li key={`uti-admission-date-${idx}`} className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5">
                            {editingField === "utiAdmissionDate" && editingArrayIndex === idx ? (
                              <>
                                <div className="flex items-center gap-1 flex-1">
                                  <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                                  <Input
                                    ref={inputRef}
                                    value={editValue}
                                    onChange={(e) => setEditValue(formatDateInput(e.target.value))}
                                    onKeyDown={handleKeyDown}
                                    className="h-5 text-[10px] text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                                    placeholder="DD/MM/AAAA"
                                    maxLength={10}
                                  />
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                                    <Check className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                                    <X className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 flex-1">
                                  <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                                  <span className="break-words">{item}</span>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Button size="icon" variant="ghost" onClick={() => startEditing("utiAdmissionDate", item, idx)} className="h-4 w-4 text-primary hover:bg-primary/10 print:hidden p-0">
                                    <Pencil className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => removeArrayItem("utiAdmissionDate", idx)} className="h-4 w-4 text-destructive hover:bg-destructive/10 print:hidden p-0">
                                    <X className="h-2.5 w-2.5" />
                                  </Button>
                                  {idx === (patient.utiAdmissionDate || []).length - 1 && (
                                    <Button size="icon" variant="ghost" onClick={() => startEditing("utiAdmissionDate", "", -2)} className="h-4 w-4 text-primary hover:bg-primary/10 print:hidden p-0">
                                      <Plus className="h-2.5 w-2.5" />
                                    </Button>
                                  )}
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ol>
                    {editingField === "utiAdmissionDate" && editingArrayIndex === -2 && (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiAdmissionDate || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const formatted = formatDateInput(e.target.value);
                              setEditValue(formatted);
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    )}
                    {(patient.utiAdmissionDate || []).length === 0 && editingField !== "utiAdmissionDate" && (
                      <Button size="icon" variant="ghost" onClick={() => startEditing("utiAdmissionDate", "", -2)} className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden" title="Adicionar">
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                  </div>

                  {/* Previsão de Alta */}
                  <div className="flex flex-col md:col-span-3">
                  <span className="text-[9px] font-medium text-muted-foreground mb-0">Previsão de Alta</span>
                      <ol className="text-xs text-foreground space-y-0 print:text-[7.5px] list-none pl-0">
                        {(patient.utiDischargePrediction || []).map((item, idx) => {
                          const daysCalculation = calculateDaysUntilDischarge(item);
                          return (
                            <li key={`uti-discharge-${idx}`} className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5">
                              {editingField === "utiDischargePrediction" && editingArrayIndex === idx ? (
                                <>
                                  <div className="flex items-center gap-1 flex-1">
                                    <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                                    <Input
                                      ref={inputRef}
                                      value={editValue}
                                      onChange={(e) => setEditValue(formatDateInput(e.target.value))}
                                      onKeyDown={handleKeyDown}
                                      className="h-5 text-[10px] text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                                      placeholder="DD/MM/AAAA"
                                      maxLength={10}
                                    />
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                                      <Check className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                                      <X className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1 flex-1">
                                    <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                                    <span className="break-words">
                                      {item}
                                      {daysCalculation && (
                                        <span className="ml-1 text-muted-foreground">{daysCalculation}</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => startEditing("utiDischargePrediction", item, idx)} className="h-4 w-4 text-primary hover:bg-primary/10 print:hidden p-0">
                                      <Pencil className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => removeArrayItem("utiDischargePrediction", idx)} className="h-4 w-4 text-destructive hover:bg-destructive/10 print:hidden p-0">
                                      <X className="h-2.5 w-2.5" />
                                    </Button>
                                    {idx === (patient.utiDischargePrediction || []).length - 1 && (
                                      <Button size="icon" variant="ghost" onClick={() => startEditing("utiDischargePrediction", "", -2)} className="h-4 w-4 text-primary hover:bg-primary/10 print:hidden p-0">
                                        <Plus className="h-2.5 w-2.5" />
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    {editingField === "utiDischargePrediction" && editingArrayIndex === -2 && (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiDischargePrediction || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const formatted = formatDateInput(e.target.value);
                              setEditValue(formatted);
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    )}
                    {(patient.utiDischargePrediction || []).length === 0 && editingField !== "utiDischargePrediction" && (
                      <Button size="icon" variant="ghost" onClick={() => startEditing("utiDischargePrediction", "", -2)} className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden" title="Adicionar">
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                  </div>

                  {/* Alergias */}
                  <div className="flex flex-col md:col-span-5">
                  <span className="text-[9px] font-medium text-muted-foreground mb-0">Alergias</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiAllergies || []).findIndex((_, i) => `uti-allergies-${i}` === active.id);
                        const newIndex = (patient.utiAllergies || []).findIndex((_, i) => `uti-allergies-${i}` === over.id);
                        const reordered = arrayMove(patient.utiAllergies || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiAllergies: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiAllergies || []).map((_, i) => `uti-allergies-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0 print:text-[7.5px] list-none pl-0">
                        {(patient.utiAllergies || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-allergies-${idx}`}
                            id={`uti-allergies-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiAllergies" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiAllergies", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiAllergies", idx)}
                            onAddNew={() => startEditing("utiAllergies", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiAllergies || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiAllergies" && editingArrayIndex === -2 && (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiAllergies || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVA ALERGIA"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    )}
                    {(patient.utiAllergies || []).length === 0 && editingField !== "utiAllergies" && (
                      <Button size="icon" variant="ghost" onClick={() => startEditing("utiAllergies", "", -2)} className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden" title="Adicionar">
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>
                  </div>
                </div>

                {/* Bloco Investigação - Linha 2 */}
                <div className="md:col-span-12 border-l-2 border-muted-foreground/20 pl-3 py-2 bg-muted/10 rounded-r">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Motivo da Admissão */}
                    <div className="flex flex-col md:col-span-4">
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Motivo da Admissão</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiAdmissionReason || []).findIndex((_, i) => `uti-admission-${i}` === active.id);
                        const newIndex = (patient.utiAdmissionReason || []).findIndex((_, i) => `uti-admission-${i}` === over.id);
                        const reordered = arrayMove(patient.utiAdmissionReason || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiAdmissionReason: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiAdmissionReason || []).map((_, i) => `uti-admission-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {(patient.utiAdmissionReason || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-admission-${idx}`}
                            id={`uti-admission-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiAdmissionReason" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiAdmissionReason", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiAdmissionReason", idx)}
                            onAddNew={() => startEditing("utiAdmissionReason", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiAdmissionReason || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiAdmissionReason" && editingArrayIndex === -2 && (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiAdmissionReason || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVO MOTIVO"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    )}
                    {(patient.utiAdmissionReason || []).length === 0 && editingField !== "utiAdmissionReason" && (
                      <Button size="icon" variant="ghost" onClick={() => startEditing("utiAdmissionReason", "", -2)} className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden" title="Adicionar Motivo">
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Hipóteses / Diagnósticos */}
                  <div className="flex flex-col md:col-span-4 relative">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Hipóteses / Diagnósticos</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setExpandedSection('diagnoses')}
                      className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                      title="Visualizar expandido"
                    >
                      <Maximize2 className="h-[2.5px] w-[2.5px]" />
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndDiagnoses}
                  >
                    <SortableContext
                      items={patient.diagnoses.map((_, i) => `diagnosis-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {patient.diagnoses.map((diagnosis, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`diagnosis-${idx}`}
                            id={`diagnosis-${idx}`}
                            index={idx}
                            diagnosis={diagnosis}
                            isEditing={editingField === "diagnoses" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("diagnoses", diagnosis, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("diagnoses", idx)}
                            onAddNew={() => startEditing("diagnoses", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === patient.diagnoses.length - 1}
                            onGetCid={(diagnosis, index) => getCidCode(diagnosis, index)}
                            loadingCid={loadingCid === idx}
                          />
                        ))}
                      </ol>
                    </SortableContext>

                    {editingField === "diagnoses" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{patient.diagnoses.length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVA HIPÓTESE/DIAGNÓSTICO"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    
                    {patient.diagnoses.length === 0 && editingField !== "diagnoses" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("diagnoses", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Hipótese/Diagnóstico"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Quadro Atual */}
                  <div className="flex flex-col md:col-span-3">
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Quadro Atual</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiCurrentStatus || []).findIndex((_, i) => `uti-status-${i}` === active.id);
                        const newIndex = (patient.utiCurrentStatus || []).findIndex((_, i) => `uti-status-${i}` === over.id);
                        const reordered = arrayMove(patient.utiCurrentStatus || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiCurrentStatus: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiCurrentStatus || []).map((_, i) => `uti-status-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {(patient.utiCurrentStatus || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-status-${idx}`}
                            id={`uti-status-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiCurrentStatus" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiCurrentStatus", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiCurrentStatus", idx)}
                            onAddNew={() => startEditing("utiCurrentStatus", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiCurrentStatus || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiCurrentStatus" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiCurrentStatus || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVO STATUS"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    {(patient.utiCurrentStatus || []).length === 0 && editingField !== "utiCurrentStatus" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("utiCurrentStatus", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Quadro Atual"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Especialidades */}
                  <div className="flex flex-col md:col-span-2">
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Especialidades</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiSpecialties || []).findIndex((_, i) => `uti-specialties-${i}` === active.id);
                        const newIndex = (patient.utiSpecialties || []).findIndex((_, i) => `uti-specialties-${i}` === over.id);
                        const reordered = arrayMove(patient.utiSpecialties || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiSpecialties: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiSpecialties || []).map((_, i) => `uti-specialties-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {(patient.utiSpecialties || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-specialties-${idx}`}
                            id={`uti-specialties-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiSpecialties" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiSpecialties", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiSpecialties", idx)}
                            onAddNew={() => startEditing("utiSpecialties", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiSpecialties || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiSpecialties" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiSpecialties || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVA ESPECIALIDADE"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    {(patient.utiSpecialties || []).length === 0 && editingField !== "utiSpecialties" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("utiSpecialties", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Especialidade"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>
                  </div>
                </div>

                {/* Bloco Clínico - Linha 3 */}
                <div className="md:col-span-12 border-l-2 border-accent/30 pl-3 py-2 bg-accent/5 rounded-r">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Dispositivos */}
                    <div className="flex flex-col md:col-span-3">
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Dispositivos</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiDevices || []).findIndex((_, i) => `uti-device-${i}` === active.id);
                        const newIndex = (patient.utiDevices || []).findIndex((_, i) => `uti-device-${i}` === over.id);
                        const reordered = arrayMove(patient.utiDevices || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiDevices: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiDevices || []).map((_, i) => `uti-device-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {(patient.utiDevices || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-device-${idx}`}
                            id={`uti-device-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiDevices" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiDevices", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiDevices", idx)}
                            onAddNew={() => startEditing("utiDevices", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiDevices || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiDevices" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiDevices || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVO DISPOSITIVO"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    {(patient.utiDevices || []).length === 0 && editingField !== "utiDevices" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("utiDevices", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Dispositivo"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Exames */}
                  <div className="flex flex-col md:col-span-3 relative">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Exames</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setExpandedSection('exams')}
                      className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                      title="Visualizar expandido"
                    >
                      <Maximize2 className="h-[2.5px] w-[2.5px]" />
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = patient.relevantExams.findIndex((_, i) => `exam-${i}` === active.id);
                        const newIndex = patient.relevantExams.findIndex((_, i) => `exam-${i}` === over.id);
                        const reordered = arrayMove(patient.relevantExams, oldIndex, newIndex);
                        onUpdate({ ...patient, relevantExams: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={patient.relevantExams.map((_, i) => `exam-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {patient.relevantExams.map((exam, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`exam-${idx}`}
                            id={`exam-${idx}`}
                            index={idx}
                            diagnosis={exam}
                            isEditing={editingField === "relevantExams" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("relevantExams", exam, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("relevantExams", idx)}
                            onAddNew={() => startEditing("relevantExams", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === patient.relevantExams.length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>

                    {editingField === "relevantExams" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{patient.relevantExams.length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVO EXAME"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    
                    {patient.relevantExams.length === 0 && editingField !== "relevantExams" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("relevantExams", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Exame"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                    </DndContext>
                  </div>

                  {/* Culturas / ATB */}
                  <div className="flex flex-col md:col-span-3">
                  <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Culturas / ATB</span>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event;
                      if (over && active.id !== over.id) {
                        const oldIndex = (patient.utiCulturesAntibiotics || []).findIndex((_, i) => `uti-cultures-${i}` === active.id);
                        const newIndex = (patient.utiCulturesAntibiotics || []).findIndex((_, i) => `uti-cultures-${i}` === over.id);
                        const reordered = arrayMove(patient.utiCulturesAntibiotics || [], oldIndex, newIndex);
                        onUpdate({ ...patient, utiCulturesAntibiotics: reordered });
                      }
                    }}
                  >
                    <SortableContext
                      items={(patient.utiCulturesAntibiotics || []).map((_, i) => `uti-cultures-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                        {(patient.utiCulturesAntibiotics || []).map((item, idx) => (
                          <SortableDiagnosisItemCollapsed
                            key={`uti-cultures-${idx}`}
                            id={`uti-cultures-${idx}`}
                            index={idx}
                            diagnosis={item}
                            isEditing={editingField === "utiCulturesAntibiotics" && editingArrayIndex === idx}
                            editValue={editValue}
                            onEdit={() => startEditing("utiCulturesAntibiotics", item, idx)}
                            onSave={saveInlineEdit}
                            onCancel={cancelEditing}
                            onRemove={() => removeArrayItem("utiCulturesAntibiotics", idx)}
                            onAddNew={() => startEditing("utiCulturesAntibiotics", "", -2)}
                            onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            inputRef={inputRef}
                            isLast={idx === (patient.utiCulturesAntibiotics || []).length - 1}
                          />
                        ))}
                      </ol>
                    </SortableContext>
                    {editingField === "utiCulturesAntibiotics" && editingArrayIndex === -2 ? (
                      <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                        <div className="flex-shrink-0 w-3" />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="font-semibold text-muted-foreground flex-shrink-0">{(patient.utiCulturesAntibiotics || []).length + 1}.</span>
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                            placeholder="NOVA CULTURA/ATB"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </li>
                    ) : null}
                    {(patient.utiCulturesAntibiotics || []).length === 0 && editingField !== "utiCulturesAntibiotics" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing("utiCulturesAntibiotics", "", -2)}
                        className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Cultura/ATB"
                      >
                        <span className="text-xs">+</span>
                      </Button>
                    )}
                  </DndContext>
                </div>

                  {/* Programações / Pendências */}
                  <div className="flex flex-col md:col-span-3 relative">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Programações / Pendências</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setExpandedSection('pendencies')}
                      className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                      title="Visualizar expandido"
                    >
                      <Maximize2 className="h-[2.5px] w-[2.5px]" />
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      <SortableContext
                        items={patient.pendencies.map((_, i) => `pendency-${i}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        {patient.pendencies.map((pendency, idx) => (
                          editingField === "pendencies" && editingArrayIndex === idx ? (
                            <div key={idx} className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                              <div className="flex-shrink-0 w-3" />
                              <div className="flex items-start gap-1 flex-1">
                                <span className="font-semibold text-muted-foreground flex-shrink-0 mt-0.5">{idx + 1}.</span>
                                <textarea
                                  ref={inputRef as any}
                                  value={editValue}
                                  onChange={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    setEditValue(e.target.value.toUpperCase());
                                    requestAnimationFrame(() => {
                                      target.setSelectionRange(start, end);
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
                                      e.preventDefault();
                                      if (editingArrayIndex === -2) {
                                        saveAndContinueAdding();
                                      } else {
                                        saveInlineEdit();
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing();
                                    }
                                  }}
                                  className="min-h-[40px] text-[10px] flex-1 uppercase text-foreground resize-y border-0 bg-transparent p-0 focus-visible:ring-0"
                                  rows={2}
                                />
                              </div>
                              <div className="flex items-start gap-0.5 flex-shrink-0 mt-0.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={saveInlineEdit}
                                  className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={cancelEditing}
                                  className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <SortablePendencyItemCollapsed
                              key={`pendency-${idx}`}
                              id={`pendency-${idx}`}
                              index={idx}
                              pendency={pendency}
                              onEdit={() => startEditing("pendencies", pendency, idx)}
                              onRemove={() => removeArrayItem("pendencies", idx)}
                              isLast={idx === patient.pendencies.length - 1}
                              onAddNew={() => startEditing("pendencies", "", -2)}
                              editingField={editingField}
                              isHighlighted={patient.highlightedPendencies?.includes(idx)}
                              sector={patient.sector}
                              onToggleHighlight={() => {
                                const highlighted = patient.highlightedPendencies || [];
                                const updatedHighlighted = highlighted.includes(idx)
                                  ? highlighted.filter(i => i !== idx)
                                  : [...highlighted, idx];
                                onUpdate({ ...patient, highlightedPendencies: updatedHighlighted });
                              }}
                            />
                          )
                        ))}
                      </SortableContext>
                      
                      {editingField === "pendencies" && editingArrayIndex === -2 ? (
                        <div className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                          <div className="flex-shrink-0 w-3" />
                          <div className="flex items-start gap-1 flex-1">
                            <span className="font-semibold text-muted-foreground flex-shrink-0 mt-0.5">{patient.pendencies.length + 1}.</span>
                            <Input
                              ref={inputRef}
                              value={editValue}
                              onChange={(e) => {
                                const target = e.target as HTMLInputElement;
                                const start = target.selectionStart ?? 0;
                                const end = target.selectionEnd ?? 0;
                                setEditValue(e.target.value.toUpperCase());
                                requestAnimationFrame(() => {
                                  target.setSelectionRange(start, end);
                                });
                              }}
                              onKeyDown={handleKeyDown}
                              className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                              placeholder="NOVA PENDÊNCIA"
                            />
                          </div>
                          <div className="flex items-start gap-0.5 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={saveInlineEdit}
                              className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEditing}
                              className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      
                      {patient.pendencies.length === 0 && editingField !== "pendencies" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing("pendencies", "", -2)}
                          className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                          title="Adicionar Programação/Pendência"
                        >
                          <span className="text-xs">+</span>
                        </Button>
                      )}
                    </div>
                    </DndContext>
                  </div>
                  </div>
                </div>
              </>
            )}

            {/* Hipóteses / Diagnósticos - apenas para outros departamentos */}
            {currentDepartment !== "UTI" && (
              <div className="flex flex-col md:col-span-3 relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground">Hipóteses / Diagnósticos</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('diagnoses')}
                  className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-[2.5px] w-[2.5px]" />
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndDiagnoses}
              >
                <SortableContext
                  items={patient.diagnoses.map((_, i) => `diagnosis-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                    {patient.diagnoses.map((diagnosis, idx) => (
                      <SortableDiagnosisItemCollapsed
                        key={`diagnosis-${idx}`}
                        id={`diagnosis-${idx}`}
                        index={idx}
                        diagnosis={diagnosis}
                        isEditing={editingField === "diagnoses" && editingArrayIndex === idx}
                        editValue={editValue}
                        onEdit={() => startEditing("diagnoses", diagnosis, idx)}
                        onSave={saveInlineEdit}
                        onCancel={cancelEditing}
                        onRemove={() => removeArrayItem("diagnoses", idx)}
                        onAddNew={() => startEditing("diagnoses", "", -2)}
                        onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        inputRef={inputRef}
                        isLast={idx === patient.diagnoses.length - 1}
                        onGetCid={(diagnosis, index) => getCidCode(diagnosis, index)}
                        loadingCid={loadingCid === idx}
                      />
                    ))}
                  </ol>
                </SortableContext>

                {editingField === "diagnoses" && editingArrayIndex === -2 ? (
                  <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                    <div className="flex-shrink-0 w-3" />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="font-semibold text-muted-foreground flex-shrink-0">{patient.diagnoses.length + 1}.</span>
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          const start = target.selectionStart ?? 0;
                          const end = target.selectionEnd ?? 0;
                          setEditValue(e.target.value.toUpperCase());
                          requestAnimationFrame(() => {
                            target.setSelectionRange(start, end);
                          });
                        }}
                        onKeyDown={handleKeyDown}
                        className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                        placeholder="NOVA HIPÓTESE"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveInlineEdit}
                        className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </li>
                ) : null}
                
                {patient.diagnoses.length === 0 && editingField !== "diagnoses" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("diagnoses", "", -2)}
                    className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                    title="Adicionar Hipótese/Diagnóstico"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )}
              </DndContext>
              </div>
            )}

            {/* Antecedentes - apenas para outros departamentos */}
            {currentDepartment !== "UTI" && (
              <div className="flex flex-col md:col-span-3 relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground">Antecedentes</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('medicalHistory')}
                  className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-[2.5px] w-[2.5px]" />
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = patient.medicalHistory.findIndex((_, i) => `history-${i}` === active.id);
                    const newIndex = patient.medicalHistory.findIndex((_, i) => `history-${i}` === over.id);
                    const reordered = arrayMove(patient.medicalHistory, oldIndex, newIndex);
                    onUpdate({ ...patient, medicalHistory: reordered });
                  }
                }}
              >
                <SortableContext
                  items={patient.medicalHistory.map((_, i) => `history-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                    {patient.medicalHistory.map((history, idx) => (
                      <SortableDiagnosisItemCollapsed
                        key={`history-${idx}`}
                        id={`history-${idx}`}
                        index={idx}
                        diagnosis={history}
                        isEditing={editingField === "medicalHistory" && editingArrayIndex === idx}
                        editValue={editValue}
                        onEdit={() => startEditing("medicalHistory", history, idx)}
                        onSave={saveInlineEdit}
                        onCancel={cancelEditing}
                        onRemove={() => removeArrayItem("medicalHistory", idx)}
                        onAddNew={() => startEditing("medicalHistory", "", -2)}
                        onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        inputRef={inputRef}
                        isLast={idx === patient.medicalHistory.length - 1}
                      />
                    ))}
                  </ol>
                </SortableContext>

                {editingField === "medicalHistory" && editingArrayIndex === -2 ? (
                  <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                    <div className="flex-shrink-0 w-3" />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="font-semibold text-muted-foreground flex-shrink-0">{patient.medicalHistory.length + 1}.</span>
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          const start = target.selectionStart ?? 0;
                          const end = target.selectionEnd ?? 0;
                          setEditValue(e.target.value.toUpperCase());
                          requestAnimationFrame(() => {
                            target.setSelectionRange(start, end);
                          });
                        }}
                        onKeyDown={handleKeyDown}
                        className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                        placeholder="NOVO ANTECEDENTE"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveInlineEdit}
                        className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </li>
                ) : null}
                
                {patient.medicalHistory.length === 0 && editingField !== "medicalHistory" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("medicalHistory", "", -2)}
                    className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                    title="Adicionar Antecedente Mórbido"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )}
              </DndContext>
              </div>
            )}

            {/* Exames - apenas para outros departamentos */}
            {currentDepartment !== "UTI" && (
              <div className="flex flex-col md:col-span-3 relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground">Exames</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('exams')}
                  className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-[2.5px] w-[2.5px]" />
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = patient.relevantExams.findIndex((_, i) => `exam-${i}` === active.id);
                    const newIndex = patient.relevantExams.findIndex((_, i) => `exam-${i}` === over.id);
                    const reordered = arrayMove(patient.relevantExams, oldIndex, newIndex);
                    onUpdate({ ...patient, relevantExams: reordered });
                  }
                }}
              >
                <SortableContext
                  items={patient.relevantExams.map((_, i) => `exam-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="text-xs text-foreground space-y-0.5 print:text-[7.5px] list-none pl-0">
                    {patient.relevantExams.map((exam, idx) => (
                      <SortableDiagnosisItemCollapsed
                        key={`exam-${idx}`}
                        id={`exam-${idx}`}
                        index={idx}
                        diagnosis={exam}
                        isEditing={editingField === "relevantExams" && editingArrayIndex === idx}
                        editValue={editValue}
                        onEdit={() => startEditing("relevantExams", exam, idx)}
                        onSave={saveInlineEdit}
                        onCancel={cancelEditing}
                        onRemove={() => removeArrayItem("relevantExams", idx)}
                        onAddNew={() => startEditing("relevantExams", "", -2)}
                        onEditValueChange={(val) => setEditValue(val.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        inputRef={inputRef}
                        isLast={idx === patient.relevantExams.length - 1}
                      />
                    ))}
                  </ol>
                </SortableContext>

                {editingField === "relevantExams" && editingArrayIndex === -2 ? (
                  <li className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                    <div className="flex-shrink-0 w-3" />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="font-semibold text-muted-foreground flex-shrink-0">{patient.relevantExams.length + 1}.</span>
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement;
                          const start = target.selectionStart ?? 0;
                          const end = target.selectionEnd ?? 0;
                          setEditValue(e.target.value.toUpperCase());
                          requestAnimationFrame(() => {
                            target.setSelectionRange(start, end);
                          });
                        }}
                        onKeyDown={handleKeyDown}
                        className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                        placeholder="NOVO EXAME"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveInlineEdit}
                        className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </li>
                ) : null}
                
                {patient.relevantExams.length === 0 && editingField !== "relevantExams" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("relevantExams", "", -2)}
                    className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                    title="Adicionar Exame Complementar"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )}
              </DndContext>
              </div>
            )}

            {/* Programações / Pendências - apenas para outros departamentos */}
            {currentDepartment !== "UTI" && (
              <div className="flex flex-col md:col-span-5 relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground">Programações / Pendências</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('pendencies')}
                  className="h-2.5 w-2.5 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-[2.5px] w-[2.5px]" />
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  <SortableContext
                    items={patient.pendencies.map((_, i) => `pendency-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {patient.pendencies.map((pendency, idx) => (
                      editingField === "pendencies" && editingArrayIndex === idx ? (
                        <div key={idx} className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                          <div className="flex-shrink-0 w-3" />
                          <div className="flex items-start gap-1 flex-1">
                            <span className="font-semibold text-muted-foreground flex-shrink-0 mt-0.5">{idx + 1}.</span>
                            <textarea
                              ref={inputRef as any}
                              value={editValue}
                              onChange={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                const start = target.selectionStart;
                                const end = target.selectionEnd;
                                setEditValue(e.target.value.toUpperCase());
                                // Restaura a posição do cursor após a atualização
                                requestAnimationFrame(() => {
                                  target.setSelectionRange(start, end);
                                });
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
                                  e.preventDefault();
                                  if (editingArrayIndex === -2) {
                                    saveAndContinueAdding();
                                  } else {
                                    saveInlineEdit();
                                  }
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              className="min-h-[40px] text-[10px] flex-1 uppercase text-foreground resize-y border-0 bg-transparent p-0 focus-visible:ring-0"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-start gap-0.5 flex-shrink-0 mt-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={saveInlineEdit}
                              className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEditing}
                              className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <SortablePendencyItemCollapsed
                          key={`pendency-${idx}`}
                          id={`pendency-${idx}`}
                          index={idx}
                          pendency={pendency}
                          onEdit={() => startEditing("pendencies", pendency, idx)}
                          onRemove={() => removeArrayItem("pendencies", idx)}
                          isLast={idx === patient.pendencies.length - 1}
                          onAddNew={() => startEditing("pendencies", "", -2)}
                          editingField={editingField}
                          isHighlighted={patient.highlightedPendencies?.includes(idx)}
                          sector={patient.sector}
                          onToggleHighlight={() => {
                            const highlighted = patient.highlightedPendencies || [];
                            const updatedHighlighted = highlighted.includes(idx)
                              ? highlighted.filter(i => i !== idx)
                              : [...highlighted, idx];
                            onUpdate({ ...patient, highlightedPendencies: updatedHighlighted });
                          }}
                        />
                      )
                    ))}
                  </SortableContext>
                  
                  {editingField === "pendencies" && editingArrayIndex === -2 ? (
                    <div className="text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 bg-accent/30 border border-primary">
                      <div className="flex-shrink-0 w-3" />
                      <div className="flex items-start gap-1 flex-1">
                        <span className="font-semibold text-muted-foreground flex-shrink-0 mt-0.5">{patient.pendencies.length + 1}.</span>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => {
                            const target = e.target as HTMLInputElement;
                            const start = target.selectionStart ?? 0;
                            const end = target.selectionEnd ?? 0;
                            setEditValue(e.target.value.toUpperCase());
                            // Restaura a posição do cursor após a atualização
                            requestAnimationFrame(() => {
                              target.setSelectionRange(start, end);
                            });
                          }}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
                          placeholder="NOVA PENDÊNCIA"
                        />
                      </div>
                      <div className="flex items-start gap-0.5 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={saveInlineEdit}
                          className="h-4 w-4 text-green-600 hover:bg-green-100 p-0"
                        >
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-4 w-4 text-red-600 hover:bg-red-100 p-0"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  
                  {patient.pendencies.length === 0 && editingField !== "pendencies" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing("pendencies", "", -2)}
                      className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                      title="Adicionar Programação/Pendência"
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  )}
                </div>
              </DndContext>
              </div>
            )}
            </div>

          {/* Action Menu - Compact */}
          <div className="flex-shrink-0 flex gap-1 print:hidden items-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-foreground hover:bg-accent hover:text-accent-foreground"
                  title="Ações"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="bottom"
                alignOffset={-5}
                sideOffset={8}
                className="w-56 p-0 bg-background dark:bg-gray-900 border-2 dark:border-gray-700 shadow-xl"
              >
                <ScrollArea className="max-h-[min(65vh,450px)]">
                  <div className="p-1.5">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edição Avançada
                    </DropdownMenuItem>
                    {onTransfer && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Realocar para</DropdownMenuLabel>
                        {(Object.keys(sectorLabels) as Array<Patient['sector']>).map((sector) => (
                          sector !== patient.sector && (
                            <DropdownMenuItem
                              key={sector}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransfer(sector);
                              }}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                              {sectorLabels[sector]}
                            </DropdownMenuItem>
                          )
                        ))}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Movimentações</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovementType("TRANSFERÊNCIA");
                        setMovementDialogOpen(true);
                      }}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                      Transferir
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovementType("ALTA");
                        setMovementDialogOpen(true);
                      }}
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-2" />
                      Alta
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovementType("ÓBITO");
                        setMovementDialogOpen(true);
                      }}
                    >
                      <Skull className="h-3.5 w-3.5 mr-2" />
                      Óbito
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/resources?patientId=${patient.id}`);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-2" />
                      Solicitar Internação
                    </DropdownMenuItem>
                    {onPrintPatient && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintPatient(patient.id);
                          }}
                        >
                          <Printer className="h-3.5 w-3.5 mr-2" />
                          Imprimir Caso
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-300 dark:hover:bg-red-950/50 font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Excluir Paciente
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              className="flex-shrink-0 p-1 hover:bg-accent/50 rounded-md transition-all duration-200"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground" />
              )}
            </button>
          </div>
          </div>
        </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/50 pt-2 bg-card/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-[8px] print:gap-1">
            <Calendar className="h-3 w-3 print:h-2 print:w-2" />
            <span>Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}</span>
          </div>

          {/* História Admissional */}
          <div className="pt-2 border-t border-border/50 print:pt-1">
            <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">História Admissional / Anamnese</h4>
            <p className="text-xs leading-snug text-foreground whitespace-pre-wrap uppercase print:text-[7.5px] print:leading-tight">
              {patient.admissionHistory}
            </p>
          </div>
        </div>
      )}
      </Card>

      <EditPatientDialog
        patient={patient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={onUpdate}
      />

      <PatientMovementDialog
        patient={patient}
        movementType={movementType}
        isOpen={movementDialogOpen}
        onClose={() => {
          setMovementDialogOpen(false);
          setMovementType(null);
        }}
        onSuccess={() => {
          if (onDelete) {
            onDelete(patient.id);
          }
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white text-lg font-semibold">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300 text-base">
              Tem certeza que deseja excluir o leito <strong className="dark:text-white font-bold">{patient.bedNumber}</strong> do paciente <strong className="dark:text-white font-bold">{patient.name}</strong>?
              <br />
              <span className="dark:text-red-400 text-destructive font-medium mt-2 inline-block">Esta ação não poderá ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  const deletedPatient = { ...patient };
                  setIsDeleting(true);
                  
                  // Wait for animation to complete before actually deleting
                  setTimeout(() => {
                    onDelete(patient.id);
                    toastHook({
                      title: "Paciente excluído",
                      description: `Leito ${patient.bedNumber} - ${patient.name} foi removido.`,
                      action: onUndelete ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUndelete(deletedPatient)}
                          className="ml-auto"
                        >
                          Desfazer
                        </Button>
                      ) : undefined,
                    });
                  }, 300);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 font-semibold shadow-lg"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog expandido para Hipóteses / Diagnósticos */}
      <Dialog open={expandedSection === 'diagnoses'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-accent/5 border-2">
          <DialogHeader className="border-b border-border/50 pb-5 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent -m-6 p-6 mb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg",
                  config.badgeColor
                )}>
                  {patient.bedNumber}
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold uppercase tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {patient.name}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {formatAgeDisplay(patient.age)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <h3 className="text-xl font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                Hipóteses / Diagnósticos
              </h3>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6 pr-2 px-6">
            {patient.diagnoses.length > 0 ? (
              <div className="space-y-3">
                {patient.diagnoses.map((diagnosis, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 items-start group animate-fade-in hover-scale"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group-hover:bg-card">
                      {editingField === "diagnoses" && editingArrayIndex === idx ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="text-base uppercase font-medium bg-background/50 border-primary/50"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-9 w-9 text-green-600 hover:bg-green-100 hover:text-green-700 flex-shrink-0"
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-9 w-9 text-red-600 hover:bg-red-100 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base text-foreground leading-relaxed uppercase font-medium flex-1">
                            {diagnosis}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing("diagnoses", diagnosis, idx)}
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeArrayItem("diagnoses", idx)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <p className="text-lg font-medium">Nenhuma hipótese ou diagnóstico registrado</p>
                <p className="text-sm mt-2">Adicione a primeira hipótese diagnóstica</p>
              </div>
            )}
            <Button
              onClick={() => startEditing("diagnoses", "", patient.diagnoses.length)}
              className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <span className="text-lg mr-2">+</span>
              Adicionar Nova Hipótese / Diagnóstico
            </Button>
            
            {/* História Admissional / Anamnese */}
            {patient.admissionHistory && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="text-lg font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  História Admissional / Anamnese
                </h4>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-foreground leading-relaxed uppercase whitespace-pre-wrap">
                    {patient.admissionHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog expandido para Exames */}
      <Dialog open={expandedSection === 'exams'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-accent/5 border-2">
          <DialogHeader className="border-b border-border/50 pb-5 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent -m-6 p-6 mb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg",
                  config.badgeColor
                )}>
                  {patient.bedNumber}
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold uppercase tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {patient.name}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {formatAgeDisplay(patient.age)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <h3 className="text-xl font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                Exames
              </h3>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6 pr-2 px-6">
            {patient.relevantExams.length > 0 ? (
              <div className="space-y-3">
                {patient.relevantExams.map((exam, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 items-start group animate-fade-in hover-scale"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group-hover:bg-card">
                      {editingField === "relevantExams" && editingArrayIndex === idx ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="text-base uppercase font-medium bg-background/50 border-primary/50"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-9 w-9 text-green-600 hover:bg-green-100 hover:text-green-700 flex-shrink-0"
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-9 w-9 text-red-600 hover:bg-red-100 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base text-foreground leading-relaxed uppercase font-medium flex-1">
                            {exam}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing("relevantExams", exam, idx)}
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeArrayItem("relevantExams", idx)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <span className="text-4xl">🔬</span>
                </div>
                <p className="text-lg font-medium">Nenhum exame registrado</p>
                <p className="text-sm mt-2">Adicione o primeiro exame complementar</p>
              </div>
            )}
            <Button
              onClick={() => startEditing("relevantExams", "", patient.relevantExams.length)}
              className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <span className="text-lg mr-2">+</span>
              Adicionar Novo Exame
            </Button>
            
            {/* História Admissional / Anamnese */}
            {patient.admissionHistory && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="text-lg font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  História Admissional / Anamnese
                </h4>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-foreground leading-relaxed uppercase whitespace-pre-wrap">
                    {patient.admissionHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog expandido para Antecedentes */}
      <Dialog open={expandedSection === 'medicalHistory'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-accent/5 border-2">
          <DialogHeader className="border-b border-border/50 pb-5 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent -m-6 p-6 mb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg",
                  config.badgeColor
                )}>
                  {patient.bedNumber}
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold uppercase tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {patient.name}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {formatAgeDisplay(patient.age)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <h3 className="text-xl font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                Antecedentes
              </h3>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6 pr-2 px-6">
            {patient.medicalHistory.length > 0 ? (
              <div className="space-y-3">
                {patient.medicalHistory.map((history, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 items-start group animate-fade-in hover-scale"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group-hover:bg-card">
                      {editingField === "medicalHistory" && editingArrayIndex === idx ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="text-base uppercase font-medium bg-background/50 border-primary/50"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-9 w-9 text-green-600 hover:bg-green-100 hover:text-green-700 flex-shrink-0"
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-9 w-9 text-red-600 hover:bg-red-100 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base text-foreground leading-relaxed uppercase font-medium flex-1">
                            {history}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing("medicalHistory", history, idx)}
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeArrayItem("medicalHistory", idx)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <p className="text-lg font-medium">Nenhum antecedente registrado</p>
                <p className="text-sm mt-2">Adicione o primeiro antecedente mórbido</p>
              </div>
            )}
            <Button
              onClick={() => startEditing("medicalHistory", "", patient.medicalHistory.length)}
              className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <span className="text-lg mr-2">+</span>
              Adicionar Novo Antecedente
            </Button>
            
            {/* História Admissional / Anamnese */}
            {patient.admissionHistory && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="text-lg font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  História Admissional / Anamnese
                </h4>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-foreground leading-relaxed uppercase whitespace-pre-wrap">
                    {patient.admissionHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog expandido para Programações / Pendências */}
      <Dialog open={expandedSection === 'pendencies'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-accent/5 border-2">
          <DialogHeader className="border-b border-border/50 pb-5 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent -m-6 p-6 mb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg",
                  config.badgeColor
                )}>
                  {patient.bedNumber}
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold uppercase tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {patient.name}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {formatAgeDisplay(patient.age)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <h3 className="text-xl font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                Programações / Pendências
              </h3>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-6 pr-2 px-6">
            {patient.pendencies.length > 0 ? (
              <div className="space-y-3">
                {patient.pendencies.map((pendency, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 items-start group animate-fade-in hover-scale"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group-hover:bg-card">
                      {editingField === "pendencies" && editingArrayIndex === idx ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              const target = e.target as HTMLInputElement;
                              const start = target.selectionStart ?? 0;
                              const end = target.selectionEnd ?? 0;
                              setEditValue(e.target.value.toUpperCase());
                              requestAnimationFrame(() => {
                                target.setSelectionRange(start, end);
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                saveInlineEdit();
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            className="text-base uppercase font-medium bg-background/50 border-primary/50"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-9 w-9 text-green-600 hover:bg-green-100 hover:text-green-700 flex-shrink-0"
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-9 w-9 text-red-600 hover:bg-red-100 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-base text-foreground leading-relaxed uppercase font-medium flex-1">
                            {pendency}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing("pendencies", pendency, idx)}
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeArrayItem("pendencies", idx)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <p className="text-lg font-medium">Nenhuma programação ou pendência registrada</p>
                <p className="text-sm mt-2">Adicione a primeira programação ou pendência</p>
              </div>
            )}
            <Button
              onClick={() => startEditing("pendencies", "", patient.pendencies.length)}
              className="mt-4 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <span className="text-lg mr-2">+</span>
              Adicionar Nova Programação / Pendência
            </Button>
            
            {/* História Admissional / Anamnese */}
            {patient.admissionHistory && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="text-lg font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  História Admissional / Anamnese
                </h4>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-foreground leading-relaxed uppercase whitespace-pre-wrap">
                    {patient.admissionHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Medical Responsibility Dialog */}
      <MedicalResponsibilityDialog
        open={medicalResponsibilityDialogOpen}
        onOpenChange={setMedicalResponsibilityDialogOpen}
        currentResponsibility={localMedicalResponsibility}
        onSave={(responsibility) => {
          setLocalMedicalResponsibility(responsibility);
          onUpdate({ ...patient, medicalResponsibility: responsibility });
          toastHook({
            title: "Responsabilidade atualizada",
            description: "As informações de responsabilidade médica foram salvas.",
          });
        }}
        sectorColor={sectorColorMap[patient.sector]}
      />
    </>
  );
}
