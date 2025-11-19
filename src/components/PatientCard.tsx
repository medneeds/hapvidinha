import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit, Trash2, Copy, ArrowRightLeft, Printer, Check, X, GripVertical } from "lucide-react";
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
      <span className="flex-1">{pendency}</span>
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
      if (editingArrayIndex === -1) {
        // Adding new
        updatedPatient.diagnoses = [...patient.diagnoses, editValue.toUpperCase()];
      } else {
        // Editing existing
        updatedPatient.diagnoses = patient.diagnoses.map((d, i) => 
          i === editingArrayIndex ? editValue.toUpperCase() : d
        );
      }
    } else if (editingField === "pendencies") {
      if (editingArrayIndex === -1) {
        // Adding new
        updatedPatient.pendencies = [...patient.pendencies, editValue.toUpperCase()];
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveInlineEdit();
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
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-3">
            {selectionMode && onToggleSelection && (
              <div className="flex items-center justify-center print:hidden flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(patient.id)}
                  className={cn("h-5 w-5", checkboxColor)}
                />
              </div>
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
              {/* Leito - ultra compacto */}
              <div className="flex flex-col md:col-span-1">
                <span className="text-[9px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge className={cn("w-fit text-[10px] py-0 px-1 font-bold leading-tight", config.badgeColor)}>
                  {patient.bedNumber}
                </Badge>
              </div>

              {/* Nome e Idade - mais espaço para nome completo */}
              <div className="flex flex-col md:col-span-5">
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
                          {patient.name}
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
                          {patient.age} anos
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

              {/* HD */}
              <div className="flex flex-col md:col-span-3">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">HD</span>
                <div className="flex flex-wrap gap-1 print:gap-0.5">
                  {editingField === "diagnoses" && editingArrayIndex === -2 ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        className="h-5 text-[10px] w-24 uppercase"
                        placeholder="NOVO HD"
                      />
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
                  ) : null}
                  
                  {patient.diagnoses.map((diagnosis, idx) => (
                    editingField === "diagnoses" && editingArrayIndex === idx ? (
                      <div key={idx} className="flex items-center gap-1">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] w-24 uppercase"
                        />
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
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-[10px] py-0 px-1.5 uppercase group/badge cursor-pointer hover:bg-secondary/80"
                        onClick={() => startEditing("diagnoses", diagnosis, idx)}
                      >
                        {diagnosis}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeArrayItem("diagnoses", idx);
                          }}
                          className="ml-1 opacity-0 group-hover/badge:opacity-100 hover:text-destructive"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </Badge>
                    )
                  ))}
                  
                  {editingField !== "diagnoses" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing("diagnoses", "", -2)}
                      className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden"
                      title="Adicionar HD"
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Programações / Pendências */}
              <div className="flex flex-col md:col-span-3">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Programações / Pendências</span>
                <div className="space-y-0.5">
                  {editingField === "pendencies" && editingArrayIndex === -2 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground w-4 flex-shrink-0">{patient.pendencies.length + 1}.</span>
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        className="h-5 text-[10px] uppercase"
                        placeholder="NOVA PENDÊNCIA"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveInlineEdit}
                        className="h-5 w-5 text-green-600 hover:bg-green-100 flex-shrink-0"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-5 w-5 text-red-600 hover:bg-red-100 flex-shrink-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ) : null}
                  
                  {patient.pendencies.slice(0, 2).map((pendency, idx) => (
                    editingField === "pendencies" && editingArrayIndex === idx ? (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-muted-foreground w-4 flex-shrink-0">{idx + 1}.</span>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] uppercase"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={saveInlineEdit}
                          className="h-5 w-5 text-green-600 hover:bg-green-100 flex-shrink-0"
                        >
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="h-5 w-5 text-red-600 hover:bg-red-100 flex-shrink-0"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        key={idx} 
                        className="text-xs text-foreground leading-tight uppercase group/item cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 flex items-center justify-between"
                        onClick={() => startEditing("pendencies", pendency, idx)}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span className="font-semibold text-muted-foreground">{idx + 1}.</span>
                          {pendency}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeArrayItem("pendencies", idx);
                          }}
                          className="ml-1 opacity-0 group-hover/item:opacity-100 hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )
                  ))}
                  
                  {patient.pendencies.length > 2 && editingField !== "pendencies" && (
                    <div className="text-muted-foreground text-[10px] pl-5">
                      +{patient.pendencies.length - 2} mais
                    </div>
                  )}
                  
                  {editingField !== "pendencies" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing("pendencies", "", -2)}
                      className="h-5 w-5 text-muted-foreground hover:text-primary print:hidden ml-5"
                      title="Adicionar Programação/Pendência"
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex gap-1 print:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}
              className="h-8 w-8 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            {onTransfer && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                    title="Transferir para outra ala"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Transferir para</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(sectorLabels) as Array<Patient['sector']>).map((sector) => (
                    sector !== patient.sector && (
                      <DropdownMenuItem
                        key={sector}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransfer(sector);
                        }}
                      >
                        {sectorLabels[sector]}
                      </DropdownMenuItem>
                    )
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onPrintPatient && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintPatient(patient.id);
                }}
                className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                title="Imprimir caso completo"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="h-8 w-8 text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <button 
              className="flex-shrink-0 p-1.5 hover:bg-accent/50 rounded-md transition-all duration-200"
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
    </>
  );
}
