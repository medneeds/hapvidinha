import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit, Trash2, Copy, ArrowRightLeft, Printer, X, GripVertical, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import { useToast } from "@/hooks/use-toast";
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
      <span className="uppercase break-words flex-1">{pendency}</span>
    </li>
  );
}

// Sortable pendency item for collapsed view
interface SortableCollapsedPendencyProps {
  id: string;
  index: number;
  pendency: string;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  isLast: boolean;
  isEditing: boolean;
}

function SortableCollapsedPendency({ 
  id, 
  index, 
  pendency, 
  onEdit, 
  onRemove, 
  onAdd, 
  isLast,
  isEditing 
}: SortableCollapsedPendencyProps) {
  const [isDragStarting, setIsDragStarting] = useState(false);
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

  const handleTextClick = () => {
    if (!isDragStarting) {
      onEdit(index);
    }
  };

  const handleDragStart = () => {
    setIsDragStarting(true);
  };

  const handleDragEnd = () => {
    setTimeout(() => setIsDragStarting(false), 100);
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
      <div className="flex items-start gap-1 flex-1" onClick={handleTextClick}>
        <div
          className="cursor-grab active:cursor-grabbing print:hidden flex-shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
        <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
        <span className="break-words cursor-pointer">{pendency}</span>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="opacity-0 group-hover/item:opacity-100 hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
        {isLast && !isEditing && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
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

export function PatientCard({ patient, onUpdate, onDelete, onUndelete, selectionMode = false, isSelected = false, onToggleSelection, onTransfer, onPrintPatient }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingArrayIndex, setEditingArrayIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = sectorConfig[patient.sector];
  const { toast } = useToast();

  // Column widths state (percentages)
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('patient-card-column-widths');
    return saved ? JSON.parse(saved) : {
      leito: 8.33, // 1/12
      paciente: 25, // 3/12
      hd: 25, // 3/12
      pendencies: 41.67 // 5/12
    };
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidths = useRef({ leito: 0, paciente: 0, hd: 0, pendencies: 0 });

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('patient-card-column-widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
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
    if (!editValue.trim() && editingArrayIndex !== -2) {
      cancelEditing();
      return;
    }

    const updatedPatient = { ...patient };
    
    if (editingField === "name") {
      updatedPatient.name = editValue.toUpperCase();
    } else if (editingField === "age") {
      updatedPatient.age = parseInt(editValue) || patient.age;
    } else if (editingField === "diagnoses") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.diagnoses = [...patient.diagnoses, editValue.toUpperCase()];
        }
      } else {
        updatedPatient.diagnoses = patient.diagnoses.map((d, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : d
        );
      }
    } else if (editingField === "pendencies") {
      if (editingArrayIndex === -2) {
        if (editValue.trim()) {
          updatedPatient.pendencies = [...patient.pendencies, editValue.toUpperCase()];
        }
      } else {
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

  const removeArrayItem = (field: "diagnoses" | "pendencies", index: number) => {
    const updatedPatient = { ...patient };
    
    if (field === "diagnoses") {
      updatedPatient.diagnoses = patient.diagnoses.filter((_, i) => i !== index);
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[1] || active.id.toString().split('-')[2]);
      const newIndex = parseInt(over.id.toString().split('-')[1] || over.id.toString().split('-')[2]);

      const newPendencies = arrayMove(patient.pendencies, oldIndex, newIndex);
      onUpdate({
        ...patient,
        pendencies: newPendencies,
      });

      toast({
        title: "Ordem atualizada",
        description: "A ordem das pendências foi reorganizada.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement && e.shiftKey)) {
      e.preventDefault();
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const confirmDelete = () => {
    setIsDeleteDialogOpen(false);
    setIsDeleting(true);
    
    setTimeout(() => {
      if (onDelete) {
        onDelete(patient.id);
        
        toast({
          title: "Paciente excluído",
          description: "O paciente foi removido com sucesso.",
          action: onUndelete ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onUndelete(patient);
                toast({
                  title: "Paciente restaurado",
                  description: "O paciente foi restaurado com sucesso.",
                });
              }}
            >
              Desfazer
            </Button>
          ) : undefined,
        });
      }
    }, 300);
  };

  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(column);
    resizeStartX.current = e.clientX;
    resizeStartWidths.current = { ...columnWidths };
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizingColumn) return;

      const deltaX = e.clientX - resizeStartX.current;
      const containerWidth = 100; // percentage based
      const deltaPercent = (deltaX / window.innerWidth) * 100;

      const newWidths = { ...resizeStartWidths.current };
      
      // Adjust the current column and the next column
      if (resizingColumn === 'leito') {
        const newLeito = Math.max(5, Math.min(20, newWidths.leito + deltaPercent));
        const diff = newLeito - newWidths.leito;
        newWidths.leito = newLeito;
        newWidths.paciente = Math.max(10, newWidths.paciente - diff);
      } else if (resizingColumn === 'paciente') {
        const newPaciente = Math.max(10, Math.min(40, newWidths.paciente + deltaPercent));
        const diff = newPaciente - newWidths.paciente;
        newWidths.paciente = newPaciente;
        newWidths.hd = Math.max(10, newWidths.hd - diff);
      } else if (resizingColumn === 'hd') {
        const newHD = Math.max(10, Math.min(40, newWidths.hd + deltaPercent));
        const diff = newHD - newWidths.hd;
        newWidths.hd = newHD;
        newWidths.pendencies = Math.max(20, newWidths.pendencies - diff);
      }

      setColumnWidths(newWidths);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizingColumn, columnWidths]);

  if (isDeleting) {
    return null;
  }

  return (
    <>
      {/* Backdrop when editing */}
      {editingField && !isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 print:hidden"
          onClick={cancelEditing}
        />
      )}

      <Card className={cn(
        "hover:shadow-md transition-all duration-200 overflow-visible",
        config.color,
        selectionMode && isSelected && "ring-2 ring-primary ring-offset-2",
        isResizing && "select-none"
      )}>
        <div className="p-2.5 print:p-1.5">
        <div className="flex items-start gap-2 md:gap-3 print:gap-1.5">
          {/* Checkbox */}
          {selectionMode && (
            <div className="flex items-center pt-1.5 print:hidden">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection?.(patient.id)}
                className="h-4 w-4"
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="flex-1 flex gap-0 print:gap-1 items-start min-w-0">
              {/* Leito */}
              <div className="flex flex-col flex-shrink-0 min-w-0 relative px-2" style={{ width: `${columnWidths.leito}%` }}>
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge variant="outline" className={cn(config.badgeColor, "text-sm font-bold text-center whitespace-nowrap px-1.5 py-0.5 print:text-xs")}>
                  {patient.bedNumber}
                </Badge>
                
                {/* Resizer */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-1 h-full cursor-col-resize print:hidden transition-all",
                    isResizing && resizingColumn === 'leito' 
                      ? "bg-primary w-2" 
                      : "bg-border/30 hover:bg-primary/70 hover:w-1.5"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'leito')}
                >
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                </div>
              </div>

              {/* Paciente */}
              <div className="flex flex-col min-w-0 relative px-2" style={{ width: `${columnWidths.paciente}%` }}>
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
                
                {/* Edit popup for name */}
                {editingField === "name" && (
                  <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[280px]">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground block">Nome do Paciente</label>
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        className="h-9 text-sm uppercase text-foreground font-medium"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                        <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Salvar</Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Edit popup for age */}
                {editingField === "age" && (
                  <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[200px]">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground block">Idade</label>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={inputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-9 text-sm w-20"
                        />
                        <span className="text-sm text-muted-foreground">anos</span>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                        <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Salvar</Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-1 group/name min-w-0">
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-semibold text-sm text-foreground leading-tight uppercase break-words cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                      onClick={() => startEditing("name", patient.name)}
                      title="Clique para editar"
                    >
                      {patient.name}
                    </p>
                    <p 
                      className="text-[11px] text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 w-fit"
                      onClick={() => startEditing("age", patient.age.toString())}
                      title="Clique para editar"
                    >
                      {patient.age} anos
                    </p>
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
                
                {/* Resizer */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-1 h-full cursor-col-resize print:hidden transition-all",
                    isResizing && resizingColumn === 'paciente' 
                      ? "bg-primary w-2" 
                      : "bg-border/30 hover:bg-primary/70 hover:w-1.5"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'paciente')}
                >
                  <div className="absolute inset-y-0 -left-2 -right-2" />
                </div>
              </div>

            {/* Hipóteses / Diagnósticos */}
            <div className="flex flex-col relative px-2" style={{ width: `${columnWidths.hd}%` }}>
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Hipóteses / Diagnósticos</span>
              
              {/* Edit popup for diagnosis */}
              {editingField === "diagnoses" && editingArrayIndex >= 0 && (
                <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[320px]">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">Editar Hipótese/Diagnóstico</label>
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      onKeyDown={handleKeyDown}
                      className="h-9 text-sm uppercase text-foreground font-medium"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                      <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Salvar</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add popup for diagnosis */}
              {editingField === "diagnoses" && editingArrayIndex === -2 && (
                <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[320px]">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">Nova Hipótese/Diagnóstico</label>
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      onKeyDown={handleKeyDown}
                      className="h-9 text-sm uppercase text-foreground"
                      placeholder="DIGITE A NOVA HIPÓTESE"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                      <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Adicionar</Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 print:gap-0.5 items-center">
                {patient.diagnoses.map((diagnosis, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[10px] py-0 px-1.5 uppercase cursor-pointer hover:bg-accent group/badge print:text-[7.5px] print:px-1 print:py-0"
                    onClick={() => startEditing("diagnoses", diagnosis, idx)}
                  >
                    <span className="break-words">{diagnosis}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeArrayItem("diagnoses", idx);
                      }}
                      className="ml-1 opacity-0 group-hover/badge:opacity-100 hover:text-destructive print:hidden"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    {idx === patient.diagnoses.length - 1 && editingField !== "diagnoses" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing("diagnoses", "", -2);
                        }}
                        className="ml-1 text-muted-foreground hover:text-primary print:hidden"
                        title="Adicionar Hipótese/Diagnóstico"
                      >
                        <span className="text-xs">+</span>
                      </button>
                    )}
                  </Badge>
                ))}
                
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
              </div>
              
              {/* Resizer */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-1 h-full cursor-col-resize print:hidden transition-all",
                  isResizing && resizingColumn === 'hd' 
                    ? "bg-primary w-2" 
                    : "bg-border/30 hover:bg-primary/70 hover:w-1.5"
                )}
                onMouseDown={(e) => handleResizeStart(e, 'hd')}
              >
                <div className="absolute inset-y-0 -left-2 -right-2" />
              </div>
            </div>

            {/* Programações / Pendências */}
            <div className="flex flex-col relative px-2" style={{ width: `${columnWidths.pendencies}%` }}>
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Programações / Pendências</span>
              
              {/* Edit popup for pendency */}
              {editingField === "pendencies" && editingArrayIndex >= 0 && (
                <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[400px]">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">Editar Pendência #{editingArrayIndex + 1}</label>
                    <textarea
                      ref={textareaRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          saveInlineEdit();
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="w-full min-h-[80px] text-sm uppercase text-foreground font-medium resize-y border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                      <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Salvar</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add popup for pendency */}
              {editingField === "pendencies" && editingArrayIndex === -2 && (
                <div className="absolute z-50 top-0 left-0 right-0 bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[400px]">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">Nova Programação/Pendência</label>
                    <textarea
                      ref={textareaRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          saveInlineEdit();
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="w-full min-h-[80px] text-sm uppercase text-foreground resize-y border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      placeholder="DIGITE A NOVA PENDÊNCIA"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                      <Button size="sm" onClick={saveInlineEdit} className="bg-primary">Adicionar</Button>
                    </div>
                  </div>
                </div>
              )}
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={patient.pendencies.map((_, idx) => `pendency-collapsed-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    {patient.pendencies.map((pendency, idx) => (
                      <SortableCollapsedPendency
                        key={`pendency-collapsed-${idx}`}
                        id={`pendency-collapsed-${idx}`}
                        index={idx}
                        pendency={pendency}
                        onEdit={(index) => startEditing("pendencies", patient.pendencies[index], index)}
                        onRemove={(index) => removeArrayItem("pendencies", index)}
                        onAdd={() => startEditing("pendencies", "", -2)}
                        isLast={idx === patient.pendencies.length - 1}
                        isEditing={editingField === "pendencies"}
                      />
                    ))}
                    
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
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-1 flex-shrink-0 print:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 hover:bg-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Editar Detalhes
                </DropdownMenuItem>
                {onPrintPatient && (
                  <DropdownMenuItem onClick={() => onPrintPatient(patient.id)}>
                    <Printer className="h-3.5 w-3.5 mr-2" />
                    Imprimir Paciente
                  </DropdownMenuItem>
                )}
                {onTransfer && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Transferir para</DropdownMenuLabel>
                    {(Object.keys(sectorLabels) as Array<keyof typeof sectorLabels>)
                      .filter(key => key !== patient.sector)
                      .map((key) => (
                        <DropdownMenuItem 
                          key={key}
                          onClick={() => handleTransfer(key)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                          {sectorLabels[key]}
                        </DropdownMenuItem>
                      ))}
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
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Antecedentes Mórbidos</h4>
              <ul className="space-y-0 uppercase">
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {history}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Exames Relevantes</h4>
              <ul className="space-y-0 uppercase">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {exam}</li>
                ))}
              </ul>
            </div>

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

          {patient.admissionHistory && (
            <div className="pt-2 border-t border-border/50">
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">História Admissional</h4>
              <p className="text-xs text-foreground leading-snug whitespace-pre-line uppercase print:text-[7.5px] print:leading-snug">
                {patient.admissionHistory}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>

    <EditPatientDialog
      patient={patient}
      open={isEditDialogOpen}
      onOpenChange={setIsEditDialogOpen}
      onSave={(updatedPatient) => {
        onUpdate(updatedPatient);
        setIsEditDialogOpen(false);
      }}
    />

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o paciente <strong>{patient.name}</strong>? Esta ação pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
