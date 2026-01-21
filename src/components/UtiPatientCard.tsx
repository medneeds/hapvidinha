import { Patient } from "@/types/patient";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Edit, ChevronDown, MoreVertical, Check, X, Plus, GripVertical, Trash2, AlertTriangle, Stethoscope, ClipboardList, Clock } from "lucide-react";
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
  
  // Try to parse the date
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    // Try DD/MM/YYYY format
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

// Sortable Item for array fields
interface SortableItemProps {
  id: string;
  index: number;
  value: string;
  onEdit: (newValue: string) => void;
  onDelete: () => void;
  compact?: boolean;
}

function SortableItem({ id, index, value, onEdit, onDelete, compact }: SortableItemProps) {
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
    onEdit(localValue);
    setIsEditing(false);
  };

  if (compact) {
    return (
      <span className="text-sm text-foreground/80">
        {index + 1}. {value}
      </span>
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-1 group py-0.5",
        isDragging && "z-50"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 opacity-40 hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <span className="text-primary/70 font-medium text-xs min-w-[16px]">{index + 1}.</span>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="flex-1 text-sm bg-background border border-primary/30 rounded px-1.5 py-0.5 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onBlur={handleSave}
            onClick={(e) => e.stopPropagation()}
          />
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSave}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditing(false)}>
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ) : (
        <>
          <span 
            className="flex-1 text-sm break-words cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {value}
          </span>
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

// Editable Array Field Component
interface EditableArrayFieldProps {
  label: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  icon?: React.ReactNode;
  colorClass?: string;
}

function EditableArrayField({ label, items, onUpdate, icon, colorClass }: EditableArrayFieldProps) {
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
    }
  };

  const handleAddItem = () => {
    if (newItemValue.trim()) {
      onUpdate([...items, newItemValue.trim()]);
      setNewItemValue("");
      setIsAddingNew(false);
    }
  };

  return (
    <div className={cn("rounded-lg p-2 border", colorClass || "bg-muted/30 border-border/50")}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
          {items.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">{items.length}</Badge>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5 text-primary/60 hover:text-primary"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {items.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
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
                  onDelete={() => onUpdate(items.filter((_, i) => i !== idx))}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : !isAddingNew ? (
          <span 
            className="text-sm text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
            onClick={() => setIsAddingNew(true)}
          >
            Clique para adicionar
          </span>
        ) : null}
        
        {isAddingNew && (
          <div className="flex items-center gap-1 mt-1">
            <input
              ref={newInputRef}
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              placeholder="Novo item..."
              className="flex-1 text-sm bg-background border border-primary/30 rounded px-2 py-1 outline-none"
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
      </div>
    </div>
  );
}

// Single value editable field
interface EditableSingleFieldProps {
  label: string;
  value: string;
  onUpdate: (value: string) => void;
  placeholder?: string;
}

function EditableSingleField({ label, value, onUpdate, placeholder }: EditableSingleFieldProps) {
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
    onUpdate(localValue);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="flex-1 text-sm bg-background border border-primary/30 rounded px-2 py-1 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onBlur={handleSave}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
        </div>
      ) : (
        <span 
          className="text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {value || <span className="text-muted-foreground/50">{placeholder || "-"}</span>}
        </span>
      )}
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

  const handleUpdateField = (key: keyof Patient, value: string | string[]) => {
    onUpdate({
      ...patient,
      [key]: value
    });
  };

  // Priority fields always visible
  const quadroAtual = getFieldArray("utiCurrentStatus");
  const pendencias = getFieldArray("pendencies");
  const previsaoAlta = getFieldArray("utiDischargePrediction");

  // Expanded fields by priority
  const dispositivos = getFieldArray("utiDevices");
  const culturasAtb = getFieldArray("utiCulturesAntibiotics");
  const alergias = getFieldArray("utiAllergies");
  const diagnosticos = getFieldArray("diagnoses");
  const especialidades = getFieldArray("utiSpecialties");
  const exames = getFieldArray("relevantExams");
  const setorOrigem = getFieldArray("utiOriginSector");
  const motivoAdmissao = getFieldArray("utiAdmissionReason");

  // Count critical items for badge
  const criticalCount = dispositivos.length + culturasAtb.length;

  return (
    <>
      <div 
        className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
        data-patient-id={patient.id}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Header - Always Visible */}
          <div className="flex items-stretch">
            {/* Left Actions */}
            <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 border-r border-border/30 bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                title="Edição avançada"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
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

            {/* Main Content - Always visible fields */}
            <div className="flex-1 p-2">
              <div className="flex flex-col gap-2">
                {/* Row 1: Identification + Time metrics */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Bed Number */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
                    <span className="text-base font-bold text-primary">{patient.bedNumber}</span>
                  </div>
                  
                  {/* Patient Name */}
                  <div className="flex-1 min-w-[150px]">
                    <EditableSingleField
                      label="Paciente"
                      value={patient.name}
                      onUpdate={(v) => handleUpdateField("name", v)}
                      placeholder="Nome do paciente"
                    />
                  </div>

                  {/* Days in UTI */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-warning/10 rounded-md border border-warning/30">
                    <Clock className="h-3.5 w-3.5 text-warning" />
                    <span className="text-sm font-semibold text-warning">
                      {daysInUti}d UTI
                    </span>
                  </div>

                  {/* Discharge Prediction */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Alta:</span>
                    <span className="text-sm font-medium">{previsaoAlta[0] || "-"}</span>
                  </div>

                  {/* Critical badge */}
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="h-5 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {criticalCount}
                    </Badge>
                  )}
                </div>

                {/* Row 2: Current Status + Pendencies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Quadro Atual */}
                  <div className="flex flex-col gap-0.5 p-2 bg-muted/30 rounded-md border border-border/30">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Quadro Atual</span>
                    <div className="text-sm text-foreground/90">
                      {quadroAtual.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {quadroAtual.map((item, idx) => (
                            <span key={idx} className="inline">{item}{idx < quadroAtual.length - 1 ? ";" : ""}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </div>
                  </div>

                  {/* Pendências */}
                  <div className="flex flex-col gap-0.5 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200/50 dark:border-amber-700/30">
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-3 w-3 text-amber-600" />
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Pendências</span>
                      {pendencias.length > 0 && (
                        <Badge className="h-4 px-1 text-[10px] bg-amber-500">{pendencias.length}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-foreground/90">
                      {pendencias.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {pendencias.slice(0, 2).map((item, idx) => (
                            <SortableItem
                              key={idx}
                              id={`pend-${idx}`}
                              index={idx}
                              value={item}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              compact
                            />
                          ))}
                          {pendencias.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{pendencias.length - 2} mais</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </div>
                  </div>
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

          {/* Expanded Content - Organized by Priority */}
          <CollapsibleContent>
            <div className="border-t border-border/30 p-3 space-y-3 bg-muted/10">
              {/* Critical Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-bold text-destructive uppercase tracking-wide">Crítico</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <EditableArrayField
                    label="Dispositivos"
                    items={dispositivos}
                    onUpdate={(items) => handleUpdateField("utiDevices", items)}
                    colorClass="bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/30"
                  />
                  <EditableArrayField
                    label="Culturas / ATB"
                    items={culturasAtb}
                    onUpdate={(items) => handleUpdateField("utiCulturesAntibiotics", items)}
                    colorClass="bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/30"
                  />
                  <EditableArrayField
                    label="Alergias"
                    items={alergias}
                    onUpdate={(items) => handleUpdateField("utiAllergies", items)}
                    colorClass="bg-orange-50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-700/30"
                  />
                </div>
              </div>

              {/* Evolution Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Evolução</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <EditableArrayField
                    label="Hipóteses / Diagnósticos"
                    items={diagnosticos}
                    onUpdate={(items) => handleUpdateField("diagnoses", items)}
                    colorClass="bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/30"
                  />
                  <EditableArrayField
                    label="Especialidades"
                    items={especialidades}
                    onUpdate={(items) => handleUpdateField("utiSpecialties", items)}
                    colorClass="bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/30"
                  />
                  <EditableArrayField
                    label="Exames"
                    items={exames}
                    onUpdate={(items) => handleUpdateField("relevantExams", items)}
                    colorClass="bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/30"
                  />
                </div>
              </div>

              {/* Administrative Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Administrativo</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <EditableArrayField
                    label="Setor de Origem"
                    items={setorOrigem}
                    onUpdate={(items) => handleUpdateField("utiOriginSector", items)}
                  />
                  <EditableArrayField
                    label="Motivo da Admissão"
                    items={motivoAdmissao}
                    onUpdate={(items) => handleUpdateField("utiAdmissionReason", items)}
                  />
                  <EditableArrayField
                    label="Quadro Atual"
                    items={quadroAtual}
                    onUpdate={(items) => handleUpdateField("utiCurrentStatus", items)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <EditableArrayField
                    label="Programações / Pendências"
                    items={pendencias}
                    onUpdate={(items) => handleUpdateField("pendencies", items)}
                    icon={<ClipboardList className="h-3 w-3 text-amber-600" />}
                    colorClass="bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30"
                  />
                  <EditableArrayField
                    label="Previsão de Alta"
                    items={previsaoAlta}
                    onUpdate={(items) => handleUpdateField("utiDischargePrediction", items)}
                  />
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
