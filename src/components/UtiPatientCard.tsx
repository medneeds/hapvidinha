import { Patient } from "@/types/patient";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Edit, ChevronDown, MoreVertical, Check, X, Plus, GripVertical, Trash2, AlertTriangle, Stethoscope, ClipboardList, Clock, FileText, FolderOpen, Pill, Activity, Heart, User, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Clinical status options with refined colors - only critical ones are vibrant
const CLINICAL_STATUS_OPTIONS = [
  { value: "gravissimo", label: "GRAVÍSSIMO", color: "bg-red-600 text-white", borderColor: "border-red-600" },
  { value: "grave", label: "GRAVE", color: "bg-red-500 text-white", borderColor: "border-red-500" },
  { value: "grave_estavel", label: "GRAVE ESTÁVEL", color: "bg-amber-600 text-white", borderColor: "border-amber-600" },
  { value: "potencialmente_grave", label: "POT. GRAVE", color: "bg-amber-500 text-white", borderColor: "border-amber-500" },
  { value: "regular", label: "REGULAR", color: "bg-slate-500 text-white", borderColor: "border-slate-500" },
  { value: "paliativado", label: "CUIDADOS PALIATIVOS", color: "bg-violet-600 text-white", borderColor: "border-violet-600" },
] as const;

// Helper to force uppercase on all text inputs
const toUpperCase = (value: string) => value.toUpperCase();
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface UtiPatientCardProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
}

// Calculate days in UTI
function calculateDaysInUti(admissionDate: string[] | undefined): number {
  if (!admissionDate || admissionDate.length === 0) return 0;
  const dateStr = admissionDate[0];
  if (!dateStr) return 0;
  
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (!isNaN(d.getTime())) {
        return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  }
  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

// Sortable Item for drag-and-drop with optional highlight
interface SortableItemProps {
  id: string;
  index: number;
  value: string;
  onEdit: (newValue: string) => void;
  onDelete: () => void;
  showDragHandle?: boolean;
  isHighlighted?: boolean;
  onToggleHighlight?: () => void;
}

function SortableItem({ id, index, value, onEdit, onDelete, showDragHandle = true, isHighlighted, onToggleHighlight }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    if (localValue.trim()) {
      onEdit(localValue.trim().toUpperCase());
    }
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-1 group py-0.5 rounded px-1 -mx-1 transition-colors",
        isDragging && "z-50",
        isHighlighted && "bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/40"
      )}
    >
      {showDragHandle && (
        <button
          className="cursor-grab active:cursor-grabbing p-0.5 opacity-40 hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      <span className={cn(
        "font-medium text-xs min-w-[16px]",
        isHighlighted ? "text-amber-600 dark:text-amber-400" : "text-primary/70"
      )}>{index + 1}.</span>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
            className="flex-1 text-sm bg-background border border-primary/30 rounded px-1.5 py-0.5 outline-none uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <>
          <span 
            className={cn(
              "flex-1 text-sm break-words cursor-pointer hover:text-primary transition-colors",
              isHighlighted && "font-semibold text-amber-800 dark:text-amber-200"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {value}
          </span>
          {onToggleHighlight && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHighlight();
              }}
            >
              <Star className={cn(
                "h-3 w-3 transition-colors",
                isHighlighted ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
              )} />
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}

// Inline editable array field with full functionality
interface InlineEditableArrayProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder?: string;
  showNumbers?: boolean;
  colorClass?: string;
  maxCollapsedItems?: number;
  label?: string;
  icon?: React.ReactNode;
  alwaysShowAll?: boolean;
  highlightedIndices?: number[];
  onUpdateHighlights?: (indices: number[]) => void;
}

function InlineEditableArray({ 
  items, 
  onUpdate, 
  placeholder = "Clique para adicionar",
  showNumbers = true,
  colorClass,
  maxCollapsedItems,
  label,
  icon,
  alwaysShowAll = false,
  highlightedIndices = [],
  onUpdateHighlights
}: InlineEditableArrayProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemValue, setNewItemValue] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isAddingNew && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = items.findIndex((_, i) => `item-${i}` === over.id);
      onUpdate(arrayMove(items, oldIndex, newIndex));
      // Also reorder highlights
      if (onUpdateHighlights && highlightedIndices.length > 0) {
        const newHighlights = highlightedIndices.map(idx => {
          if (idx === oldIndex) return newIndex;
          if (oldIndex < newIndex) {
            if (idx > oldIndex && idx <= newIndex) return idx - 1;
          } else {
            if (idx >= newIndex && idx < oldIndex) return idx + 1;
          }
          return idx;
        });
        onUpdateHighlights(newHighlights);
      }
    }
  };

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      onUpdate([...items, newItemValue.trim().toUpperCase()]);
      setNewItemValue("");
      setIsAddingNew(false);
    } else {
      setIsAddingNew(false);
    }
  };

  const toggleHighlight = (index: number) => {
    if (!onUpdateHighlights) return;
    const isHighlighted = highlightedIndices.includes(index);
    if (isHighlighted) {
      onUpdateHighlights(highlightedIndices.filter(i => i !== index));
    } else {
      onUpdateHighlights([...highlightedIndices, index]);
    }
  };

  const displayItems = maxCollapsedItems && !alwaysShowAll ? items.slice(0, maxCollapsedItems) : items;
  const hiddenCount = maxCollapsedItems && !alwaysShowAll ? Math.max(0, items.length - maxCollapsedItems) : 0;

  return (
    <div className={cn("rounded-md p-2", colorClass)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            {items.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{items.length}</Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-primary/60 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingNew(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      
      <div className="space-y-0.5">
        {items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayItems.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
              {displayItems.map((item, idx) => (
                <SortableItem
                  key={`item-${idx}`}
                  id={`item-${idx}`}
                  index={idx}
                  value={item}
                  onEdit={(newValue) => {
                    const newItems = [...items];
                    newItems[idx] = newValue;
                    onUpdate(newItems);
                  }}
                  onDelete={() => {
                    onUpdate(items.filter((_, i) => i !== idx));
                    // Update highlight indices when deleting
                    if (onUpdateHighlights) {
                      onUpdateHighlights(
                        highlightedIndices
                          .filter(i => i !== idx)
                          .map(i => i > idx ? i - 1 : i)
                      );
                    }
                  }}
                  showDragHandle={showNumbers}
                  isHighlighted={highlightedIndices.includes(idx)}
                  onToggleHighlight={onUpdateHighlights ? () => toggleHighlight(idx) : undefined}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : !isAddingNew ? (
          <span 
            className="text-sm text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
            onClick={() => setIsAddingNew(true)}
          >
            {placeholder}
          </span>
        ) : null}
        
        {hiddenCount > 0 && (
          <span className="text-xs text-muted-foreground pl-5">+{hiddenCount} mais</span>
        )}
        
        {isAddingNew && (
          <div className="flex items-center gap-1 mt-1">
            <input
              ref={newInputRef}
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value.toUpperCase())}
              placeholder="NOVO ITEM..."
              className="flex-1 text-sm bg-background border border-primary/30 rounded px-2 py-1 outline-none uppercase"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewItemValue("");
                }
              }}
              onBlur={handleAddItem}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddItem}>
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={() => {
                setIsAddingNew(false);
                setNewItemValue("");
              }}
            >
              <X className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )}
        
        {!label && !isAddingNew && items.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 text-xs text-primary/60 hover:text-primary p-0 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingNew(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        )}
      </div>
    </div>
  );
}

// Single value inline editable field
interface InlineEditableFieldProps {
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function InlineEditableField({ value, onUpdate, placeholder = "-", className }: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(localValue.toUpperCase());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
        className={cn("bg-background border border-primary/30 rounded px-1.5 py-0.5 outline-none text-sm w-full uppercase", className)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsEditing(false);
        }}
        onBlur={handleSave}
      />
    );
  }

  return (
    <span 
      className={cn("cursor-pointer hover:text-primary transition-colors", className)}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground/50">{placeholder}</span>}
    </span>
  );
}

// Inline editable textarea for longer content
interface InlineEditableTextareaProps {
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
}

function InlineEditableTextarea({ value, onUpdate, placeholder = "-" }: InlineEditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(localValue.toUpperCase());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value.toUpperCase());
          // Auto-resize on change
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        className="w-full bg-background border border-primary/30 rounded px-2 py-1 outline-none text-sm uppercase min-h-[60px] resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsEditing(false);
        }}
        onBlur={handleSave}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div 
      className="cursor-pointer hover:text-primary transition-colors text-sm min-h-[40px] whitespace-pre-wrap"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground/50">{placeholder}</span>}
    </div>
  );
}

export function UtiPatientCard({ 
  patient, 
  onUpdate, 
  onDelete,
  onPrintPatient,
  onRefetch 
}: UtiPatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const daysInUti = useMemo(() => calculateDaysInUti(patient.utiAdmissionDate), [patient.utiAdmissionDate]);

  const getFieldArray = (key: keyof Patient): string[] => {
    const value = patient[key];
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
    return value ? [value as string] : [];
  };

  const handleUpdateField = (key: keyof Patient, value: string | string[] | number[]) => {
    onUpdate({
      ...patient,
      [key]: value
    });
  };

  // Field data
  const quadroAtual = getFieldArray("utiCurrentStatus");
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

  return (
    <>
      <div 
        className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
        data-patient-id={patient.id}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Header - Collapsed View - FULLY EDITABLE */}
          <div className="flex items-stretch">
            {/* Left Actions - Compact */}
            <div className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 border-r border-border/30 bg-muted/30">
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
                <DropdownMenuContent align="start" className="bg-popover border shadow-lg z-50">
                  {onPrintPatient && (
                    <DropdownMenuItem onClick={() => onPrintPatient(patient.id)}>
                      Imprimir
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(patient.id)}
                      className="text-destructive"
                    >
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Main Content - Collapsed View */}
            <div className="flex-1 p-1.5 space-y-1">
              {/* Row 1: Identification Header - Optimized spacing */}
              <div className="flex items-center gap-1.5">
                {/* Bed Number - Compact */}
                <div className="shrink-0 px-1.5 py-0.5 bg-primary/10 rounded border border-primary/20">
                  <InlineEditableField
                    value={patient.bedNumber}
                    onUpdate={(v) => handleUpdateField("bedNumber", v)}
                    placeholder="LEITO"
                    className="text-xs font-bold text-primary w-10 text-center"
                  />
                </div>
                
                {/* Patient Name + Age - Flexible grow */}
                <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                  <InlineEditableField
                    value={patient.name}
                    onUpdate={(v) => handleUpdateField("name", v)}
                    placeholder="NOME DO PACIENTE"
                    className="text-sm font-semibold truncate"
                  />
                  <InlineEditableField
                    value={String(patient.age || "")}
                    onUpdate={(v) => handleUpdateField("age", v)}
                    placeholder="IDADE"
                    className="shrink-0 text-xs text-muted-foreground"
                  />
                </div>

                {/* Clinical Status Selector - Only this uses color */}
                <Select
                  value={patient.clinicalStatus || ""}
                  onValueChange={(v) => handleUpdateField("clinicalStatus", v)}
                >
                  <SelectTrigger 
                    className={cn(
                      "shrink-0 h-5 w-auto px-2 text-[9px] font-bold border-0 rounded",
                      patient.clinicalStatus 
                        ? CLINICAL_STATUS_OPTIONS.find(o => o.value === patient.clinicalStatus)?.color || "bg-muted"
                        : "bg-muted text-muted-foreground"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue placeholder="STATUS">
                      {patient.clinicalStatus 
                        ? CLINICAL_STATUS_OPTIONS.find(o => o.value === patient.clinicalStatus)?.label 
                        : "STATUS"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CLINICAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full", option.color)} />
                          <span className="text-xs font-medium">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Days in UTI - Neutral chip */}
                <div className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  <span className="text-[10px] font-semibold">{daysInUti}d</span>
                </div>

                {/* Discharge - Neutral display */}
                <div className="shrink-0 flex items-center gap-0.5 text-muted-foreground">
                  <span className="text-[9px]">ALTA:</span>
                  <InlineEditableField
                    value={previsaoAlta[0] || ""}
                    onUpdate={(v) => handleUpdateField("utiDischargePrediction", v ? [v] : [])}
                    placeholder="—"
                    className="text-[10px] font-medium w-16"
                  />
                </div>

                {/* Critical badge - Only alert when needed */}
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="shrink-0 h-4 gap-0.5 text-[9px] px-1">
                    <AlertTriangle className="h-2 w-2" />
                    {criticalCount}
                  </Badge>
                )}
              </div>

              {/* Row 2: 4 columns - Elegant tonal elevation */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-card/80 dark:bg-card/60 rounded-lg p-1.5 shadow-sm border border-border/60 dark:border-border/40 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <InlineEditableArray
                    items={diagnosticos}
                    onUpdate={(items) => handleUpdateField("diagnoses", items)}
                    label="HD"
                    icon={<Stethoscope className="h-2.5 w-2.5 text-primary/70" />}
                    alwaysShowAll
                  />
                </div>
                <div className="bg-card/80 dark:bg-card/60 rounded-lg p-1.5 shadow-sm border border-border/60 dark:border-border/40 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <InlineEditableArray
                    items={quadroAtual}
                    onUpdate={(items) => handleUpdateField("utiCurrentStatus", items)}
                    label="QUADRO"
                    icon={<Activity className="h-2.5 w-2.5 text-primary/70" />}
                    alwaysShowAll
                  />
                </div>
                <div className="bg-card/80 dark:bg-card/60 rounded-lg p-1.5 shadow-sm border border-border/60 dark:border-border/40 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <InlineEditableArray
                    items={condutasDia}
                    onUpdate={(items) => handleUpdateField("utiDailyConducts", items)}
                    label="CONDUTAS"
                    icon={<FileText className="h-2.5 w-2.5 text-primary/70" />}
                    alwaysShowAll
                  />
                </div>
                <div className="bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/30 dark:to-card/80 rounded-lg p-1.5 shadow-lg border-2 border-amber-400/40 dark:border-amber-500/30 backdrop-blur-sm ring-2 ring-amber-300/20 dark:ring-amber-600/15 hover:shadow-xl hover:border-amber-400/60 transition-all">
                  <InlineEditableArray
                    items={pendencias}
                    onUpdate={(items) => handleUpdateField("pendencies", items)}
                    label="PENDÊNCIAS"
                    icon={<ClipboardList className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />}
                    alwaysShowAll
                    highlightedIndices={patient.highlightedPendencies || []}
                    onUpdateHighlights={(indices) => handleUpdateField("highlightedPendencies", indices)}
                  />
                </div>
              </div>
            </div>

            {/* Expand Button */}
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="self-center h-full px-3 rounded-none border-l border-border/30 hover:bg-muted/50"
              >
                <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded Content - Complete UTI fields */}
          <CollapsibleContent>
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
                  />
                  <InlineEditableArray
                    items={alergias}
                    onUpdate={(items) => handleUpdateField("utiAllergies", items)}
                    label="ALERGIAS"
                    colorClass="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20"
                    alwaysShowAll
                  />
                  <InlineEditableArray
                    items={culturasAtb}
                    onUpdate={(items) => handleUpdateField("utiCulturesAntibiotics", items)}
                    label="CULTURAS / ATB"
                    icon={<Pill className="h-3 w-3 text-red-400" />}
                    colorClass="bg-red-50/50 dark:bg-red-900/10 border border-red-200/30 dark:border-red-800/20"
                    alwaysShowAll
                  />
                </div>
              </div>

              {/* 🔵 CLÍNICO - Clinical evolution (without HD duplicate) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CLÍNICO</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InlineEditableArray
                    items={getFieldArray("medicalHistory")}
                    onUpdate={(items) => handleUpdateField("medicalHistory", items)}
                    label="ANTECEDENTES"
                    colorClass="bg-muted/50 border border-border/50"
                    alwaysShowAll
                  />
                  <InlineEditableArray
                    items={especialidades}
                    onUpdate={(items) => handleUpdateField("utiSpecialties", items)}
                    label="ESPECIALIDADES"
                    colorClass="bg-muted/50 border border-border/50"
                    alwaysShowAll
                  />
                </div>
                <InlineEditableArray
                  items={exames}
                  onUpdate={(items) => handleUpdateField("relevantExams", items)}
                  label="EXAMES"
                  colorClass="bg-muted/50 border border-border/50"
                  alwaysShowAll
                />
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
                  />
                  <InlineEditableArray
                    items={motivoAdmissao}
                    onUpdate={(items) => handleUpdateField("utiAdmissionReason", items)}
                    label="MOTIVO DA ADMISSÃO"
                    colorClass="bg-muted/30 border border-border/30"
                    alwaysShowAll
                  />
                  <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">ADMISSÃO UTI</span>
                    <InlineEditableField
                      value={getFieldArray("utiAdmissionDate")[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiAdmissionDate", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-sm"
                    />
                  </div>
                  <div className="bg-muted/30 border border-border/30 rounded-md p-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">PREVISÃO DE ALTA</span>
                    <InlineEditableField
                      value={previsaoAlta[0] || ""}
                      onUpdate={(v) => handleUpdateField("utiDischargePrediction", v ? [v] : [])}
                      placeholder="DD/MM/AAAA"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
    </>
  );
}
