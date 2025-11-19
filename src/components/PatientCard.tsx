import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit, Trash2, Copy, ArrowRightLeft, Printer, Check, X, GripVertical, MoreVertical, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import { useToast } from "@/hooks/use-toast";
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
}

function SortablePendencyItem({ id, index, pendency }: SortablePendencyItemProps) {
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight flex items-center gap-2 rounded px-1 -mx-1 py-1",
        isDragging ? "bg-accent/50 z-50" : "hover:bg-accent/30"
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
      <span className="flex-1">{pendency}</span>
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
}

function SortablePendencyItemCollapsed({ 
  id, 
  index, 
  pendency, 
  onEdit, 
  onRemove, 
  isLast, 
  onAddNew,
  editingField 
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

  return (
    <div 
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
        <span className="break-words">{pendency}</span>
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
  inputRef
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingArrayIndex, setEditingArrayIndex] = useState<number>(-1);
  const [expandedSection, setExpandedSection] = useState<'diagnoses' | 'exams' | 'pendencies' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = sectorConfig[patient.sector];
  const { toast } = useToast();

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
      toast({
        title: "Nome copiado",
        description: `"${patient.name}" foi copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o nome.",
        variant: "destructive",
      });
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

  const saveInlineEdit = () => {
    if (!editingField) return;

    const updatedPatient = { ...patient };
    
    if (editingField === "name") {
      updatedPatient.name = editValue.toUpperCase();
    } else if (editingField === "age") {
      updatedPatient.age = parseInt(editValue) || patient.age;
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
    }

    onUpdate(updatedPatient);
    setEditingField(null);
    setEditValue("");
    setEditingArrayIndex(-1);
    
    toast({
      title: "Campo atualizado",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const saveAndContinueAdding = () => {
    if (!editingField || !editValue.trim()) return;

    const updatedPatient = { ...patient };
    
    if (editingField === "diagnoses") {
      updatedPatient.diagnoses = [...patient.diagnoses, editValue.toUpperCase()];
    } else if (editingField === "relevantExams") {
      updatedPatient.relevantExams = [...patient.relevantExams, editValue.toUpperCase()];
    } else if (editingField === "pendencies") {
      updatedPatient.pendencies = [...patient.pendencies, editValue.toUpperCase()];
    }

    onUpdate(updatedPatient);
    setEditValue("");
    // Mantém editingField e editingArrayIndex para continuar adicionando
    
    toast({
      title: "Item adicionado",
      description: "Continue adicionando mais itens ou pressione Escape para finalizar.",
    });
  };

  const removeArrayItem = (field: "diagnoses" | "relevantExams" | "pendencies", index: number) => {
    const updatedPatient = { ...patient };
    
    if (field === "diagnoses") {
      updatedPatient.diagnoses = patient.diagnoses.filter((_, i) => i !== index);
    } else if (field === "relevantExams") {
      updatedPatient.relevantExams = patient.relevantExams.filter((_, i) => i !== index);
    } else if (field === "pendencies") {
      updatedPatient.pendencies = patient.pendencies.filter((_, i) => i !== index);
    }

    onUpdate(updatedPatient);
    toast({
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
      toast({
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
      toast({
        title: "Ordem atualizada",
        description: "A ordem das hipóteses foi reorganizada.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Se está adicionando novo item (editingArrayIndex === -2), continua adicionando
      if (editingArrayIndex === -2 && (editingField === "diagnoses" || editingField === "pendencies")) {
        saveAndContinueAdding();
      } else {
        saveInlineEdit();
      }
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
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-1.5 items-start">
              {/* Leito - ultra compacto */}
              <div className="flex flex-col md:col-span-1">
                <span className="text-[9px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge className={cn("w-fit text-[10px] py-0 px-1 font-bold leading-tight", config.badgeColor)}>
                  {patient.bedNumber}
                </Badge>
              </div>

              {/* Nome e Idade - mais espaço para nome completo */}
              <div className="flex flex-col md:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
                <div className="group/name relative">
                  <div className="flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      {editingField === "name" ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
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
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-[11px] w-16"
                          />
                          <span className="text-[11px] text-muted-foreground">anos</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={saveInlineEdit}
                            className="h-5 w-5 text-green-600 hover:bg-green-100"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-5 w-5 text-red-600 hover:bg-red-100"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <p 
                          className="text-[11px] text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 w-fit"
                          onClick={() => startEditing("age", patient.age.toString())}
                          title="Clique para editar"
                        >
                          {patient.age > 0 ? `${patient.age} anos` : <span className="italic">Clique para adicionar idade</span>}
                        </p>
                      )}
                    </div>
                    {!editingField && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyName}
                        className="h-5 w-5 opacity-0 group-hover/name:opacity-100 transition-opacity print:hidden hover:bg-primary/10 hover:text-primary flex-shrink-0"
                        title="Copiar nome"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            {/* Hipóteses / Diagnósticos */}
            <div className="flex flex-col md:col-span-2 relative">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">Hipóteses / Diagnósticos</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('diagnoses')}
                  className="h-3 w-3 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-2 w-2" />
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
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
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

            {/* Exames Complementares */}
            <div className="flex flex-col md:col-span-2 relative">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">Exames Complementares</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('exams')}
                  className="h-3 w-3 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-2 w-2" />
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
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
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

            {/* Programações / Pendências - mais espaço */}
            <div className="flex flex-col md:col-span-5 relative">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">Programações / Pendências</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpandedSection('pendencies')}
                  className="h-3 w-3 p-0 text-muted-foreground/40 hover:text-primary opacity-50 hover:opacity-100 transition-opacity print:hidden"
                  title="Visualizar expandido"
                >
                  <Maximize2 className="h-2 w-2" />
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
                              onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
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
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
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
              <DropdownMenuContent align="end" className="w-48">
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
                    <DropdownMenuLabel className="text-xs">Transferir para</DropdownMenuLabel>
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
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Excluir Paciente
                    </DropdownMenuItem>
                  </>
                )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-1 print:grid-cols-2">
            {/* Antecedentes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Antecedentes Mórbidos</h4>
              <ul className="space-y-0 uppercase">
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {history}</li>
                ))}
              </ul>
            </div>

            {/* Exames Relevantes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Exames Relevantes</h4>
              <ul className="space-y-0 uppercase">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {exam}</li>
                ))}
              </ul>
            </div>

            {/* Programação */}
            <div>
              <h4 className="font-semibold text-xs mb-1 flex items-center gap-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">
                <Clock className="h-3 w-3 print:h-2 print:w-2" />
                Programação
              </h4>
              <ul className="space-y-0 uppercase">
                {patient.schedule.map((item, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {item}</li>
                ))}
              </ul>
            </div>

            {/* Programações / Pendências */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Programações / Pendências</h4>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={patient.pendencies.map((_, idx) => `pendency-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-1 uppercase">
                    {patient.pendencies.map((pendency, idx) => (
                      <SortablePendencyItem
                        key={`pendency-${idx}`}
                        id={`pendency-${idx}`}
                        index={idx}
                        pendency={pendency}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o leito <strong>{patient.bedNumber}</strong> do paciente <strong>{patient.name}</strong>?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  const deletedPatient = { ...patient };
                  setIsDeleting(true);
                  
                  // Wait for animation to complete before actually deleting
                  setTimeout(() => {
                    onDelete(patient.id);
                    toast({
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog expandido para Hipóteses / Diagnósticos */}
      <Dialog open={expandedSection === 'diagnoses'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={config.badgeColor}>Leito {patient.bedNumber}</Badge>
              <span className="text-lg">Hipóteses / Diagnósticos</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <div className="text-sm font-semibold text-muted-foreground mb-2">
              Paciente: {patient.name} ({patient.age} anos)
            </div>
            {patient.diagnoses.length > 0 ? (
              <ol className="space-y-3 list-none">
                {patient.diagnoses.map((diagnosis, idx) => (
                  <li key={idx} className="text-base text-foreground leading-relaxed uppercase bg-accent/30 p-3 rounded-md">
                    <span className="font-bold text-primary mr-2">{idx + 1}.</span>
                    {diagnosis}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic text-center py-8">Nenhuma hipótese/diagnóstico registrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog expandido para Exames Complementares */}
      <Dialog open={expandedSection === 'exams'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={config.badgeColor}>Leito {patient.bedNumber}</Badge>
              <span className="text-lg">Exames Complementares</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <div className="text-sm font-semibold text-muted-foreground mb-2">
              Paciente: {patient.name} ({patient.age} anos)
            </div>
            {patient.relevantExams.length > 0 ? (
              <ol className="space-y-3 list-none">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-base text-foreground leading-relaxed uppercase bg-accent/30 p-3 rounded-md">
                    <span className="font-bold text-primary mr-2">{idx + 1}.</span>
                    {exam}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic text-center py-8">Nenhum exame complementar registrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog expandido para Programações / Pendências */}
      <Dialog open={expandedSection === 'pendencies'} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={config.badgeColor}>Leito {patient.bedNumber}</Badge>
              <span className="text-lg">Programações / Pendências</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <div className="text-sm font-semibold text-muted-foreground mb-2">
              Paciente: {patient.name} ({patient.age} anos)
            </div>
            {patient.pendencies.length > 0 ? (
              <ol className="space-y-3 list-none">
                {patient.pendencies.map((pendency, idx) => (
                  <li key={idx} className="text-base text-foreground leading-relaxed uppercase bg-accent/30 p-3 rounded-md">
                    <span className="font-bold text-primary mr-2">{idx + 1}.</span>
                    {pendency}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground italic text-center py-8">Nenhuma programação/pendência registrada</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
