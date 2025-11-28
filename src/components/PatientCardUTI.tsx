import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Copy, Check, X, MoreVertical, GripVertical, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatAgeDisplay } from "@/utils/ageDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

interface PatientCardUTIProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onDelete?: (patientId: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
}

interface SortablePendencyItemProps {
  id: string;
  index: number;
  pendency: string;
  isHighlighted?: boolean;
  onToggleHighlight?: () => void;
  onEdit: () => void;
  onRemove: () => void;
  isEditing: boolean;
  editValue: string;
  onSave: () => void;
  onCancel: () => void;
  onEditValueChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isLast: boolean;
  onAddNew: () => void;
}

function SortablePendencyItem({ 
  id, 
  index, 
  pendency, 
  isHighlighted, 
  onToggleHighlight,
  onEdit,
  onRemove,
  isEditing,
  editValue,
  onSave,
  onCancel,
  onEditValueChange,
  onKeyDown,
  inputRef,
  isLast,
  onAddNew
}: SortablePendencyItemProps) {
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
        "text-[9px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0 group",
        isDragging ? "bg-accent/50 z-50" : "hover:bg-accent/30",
        isHighlighted && "bg-amber-100 dark:bg-amber-900/30 border border-amber-500/50 font-bold"
      )}
    >
      {isEditing ? (
        <>
          <div className="flex-shrink-0 w-3" />
          <div className="flex items-center gap-1 flex-1">
            <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value.toUpperCase())}
              onKeyDown={onKeyDown}
              className="h-4 text-[9px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={onSave} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
              <Check className="h-2 w-2" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancel} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
              <X className="h-2 w-2" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="cursor-grab active:cursor-grabbing print:hidden flex-shrink-0" {...attributes} {...listeners}>
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex items-start gap-1 flex-1 cursor-pointer" onClick={onEdit}>
            <span className="font-semibold text-muted-foreground flex-shrink-0">{index + 1}.</span>
            <span className={cn("flex-1", isHighlighted && "font-bold")}>{pendency}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 print:hidden">
            <Button size="icon" variant="ghost" onClick={onToggleHighlight} className="h-4 w-4 p-0">
              <Star className={cn("h-2 w-2", isHighlighted ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
            </Button>
            {isLast && (
              <Button size="icon" variant="ghost" onClick={onAddNew} className="h-4 w-4 p-0 text-muted-foreground hover:text-primary">
                <span className="text-xs font-bold">+</span>
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onRemove} className="h-4 w-4 p-0 text-red-600 hover:bg-red-100">
              <X className="h-2 w-2" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

export function PatientCardUTI({ 
  patient, 
  onUpdate, 
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelection
}: PatientCardUTIProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingArrayIndex, setEditingArrayIndex] = useState<number>(-1);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast: toastHook } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (editingField && (inputRef.current || textareaRef.current)) {
      if (inputRef.current) inputRef.current.focus();
      if (textareaRef.current) textareaRef.current.focus();
    }
  }, [editingField, editingArrayIndex]);

  const startEditing = (field: string, currentValue: string, arrayIndex: number = -1) => {
    setEditingField(field);
    setEditingArrayIndex(arrayIndex);
    setEditValue(currentValue || "");
  };

  const saveInlineEdit = () => {
    if (!editingField) return;

    const updates: Partial<Patient> = {};
    
    if (editingArrayIndex >= 0) {
      const arrayKey = editingField as keyof Patient;
      const currentArray = patient[arrayKey] as string[];
      const updatedArray = [...currentArray];
      updatedArray[editingArrayIndex] = editValue;
      updates[arrayKey] = updatedArray as any;
    } else if (editingArrayIndex === -2) {
      const arrayKey = editingField as keyof Patient;
      const currentArray = (patient[arrayKey] as string[]) || [];
      updates[arrayKey] = [...currentArray, editValue] as any;
    } else {
      switch (editingField) {
        case "name":
          updates.name = editValue;
          break;
        case "age":
          updates.age = editValue;
          break;
        case "utiAdmissionDate":
          updates.utiAdmissionDate = editValue;
          break;
        case "utiDischargePrediction":
          updates.utiDischargePrediction = editValue;
          break;
        case "utiAllergies":
          updates.utiAllergies = editValue;
          break;
        case "utiAdmissionReason":
          updates.utiAdmissionReason = editValue;
          break;
        case "utiCurrentStatus":
          updates.utiCurrentStatus = editValue;
          break;
        case "utiDevices":
          updates.utiDevices = editValue;
          break;
        case "utiCulturesAntibiotics":
          updates.utiCulturesAntibiotics = editValue;
          break;
        case "utiSpecialties":
          updates.utiSpecialties = editValue;
          break;
      }
    }

    onUpdate({ ...patient, ...updates });
    setEditingField(null);
    setEditingArrayIndex(-1);
    setEditValue("");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingArrayIndex(-1);
    setEditValue("");
  };

  const removeArrayItem = (field: string, index: number) => {
    const arrayKey = field as keyof Patient;
    const currentArray = patient[arrayKey] as string[];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    onUpdate({ ...patient, [arrayKey]: updatedArray });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingArrayIndex === -2) {
        saveInlineEdit();
        setTimeout(() => startEditing(editingField!, "", -2), 50);
      } else {
        saveInlineEdit();
      }
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

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

  const toggleHighlightPendency = (index: number) => {
    const current = patient.highlightedPendencies || [];
    const updated = current.includes(index)
      ? current.filter(i => i !== index)
      : [...current, index];
    onUpdate({ ...patient, highlightedPendencies: updated });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = patient.pendencies.findIndex((_, i) => `pendency-${i}` === active.id);
      const newIndex = patient.pendencies.findIndex((_, i) => `pendency-${i}` === over.id);

      onUpdate({
        ...patient,
        pendencies: arrayMove(patient.pendencies, oldIndex, newIndex),
      });
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4 border-l-purple-500">
      <div className="p-1.5 print:p-1">
        <div className="flex items-start justify-between gap-1 print:gap-0.5">
          {selectionMode && onToggleSelection && (
            <div className="flex items-center justify-center flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(patient.id)}
                className="h-5 w-5 border-2 border-purple-500 data-[state=checked]:bg-purple-500"
              />
            </div>
          )}
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-24 gap-1 items-start print:gap-0.5">
            {/* LINHA 1 - Campos principais */}
            
            {/* Leito - ocupa 2 linhas */}
            <div className="flex flex-col md:col-span-1 md:row-span-2 gap-0.5">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Leito</span>
              <Badge className="w-fit text-[9px] py-0 px-1 font-bold leading-tight bg-purple-500 text-white print:text-[7px]">
                {patient.bedNumber}
              </Badge>
            </div>

            {/* Paciente */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Paciente</span>
              {editingField === "name" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-5 text-[9px] font-semibold uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5"><Check className="h-2.5 w-2.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5"><X className="h-2.5 w-2.5" /></Button>
                </div>
              ) : (
                <p className="font-semibold text-[9px] leading-tight uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1" onClick={() => startEditing("name", patient.name)}>
                  {patient.name || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
              {editingField === "age" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleKeyDown} className="h-4 text-[9px]" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] text-muted-foreground cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1" onClick={() => startEditing("age", typeof patient.age === 'number' ? patient.age.toString() : (patient.age || ""))}>
                  {patient.age ? formatAgeDisplay(patient.age) : <span className="italic">--</span>}
                </p>
              )}
            </div>

            {/* Admissão UTI */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Admissão</span>
              {editingField === "utiAdmissionDate" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} type="datetime-local" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleKeyDown} className="h-4 text-[9px]" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1" onClick={() => startEditing("utiAdmissionDate", patient.utiAdmissionDate || "")}>
                  {patient.utiAdmissionDate ? formatDateTime(patient.utiAdmissionDate) : <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Previsão Alta */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Prev. Alta</span>
              {editingField === "utiDischargePrediction" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiDischargePrediction", patient.utiDischargePrediction || "")}>
                  {patient.utiDischargePrediction || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Alergias */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Alergias</span>
              {editingField === "utiAllergies" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiAllergies", patient.utiAllergies || "")}>
                  {patient.utiAllergies || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Motivo Admissão */}
            <div className="flex flex-col md:col-span-4">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Motivo Admissão</span>
              {editingField === "utiAdmissionReason" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiAdmissionReason", patient.utiAdmissionReason || "")}>
                  {patient.utiAdmissionReason || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Quadro Atual */}
            <div className="flex flex-col md:col-span-4">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Quadro Atual</span>
              {editingField === "utiCurrentStatus" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiCurrentStatus", patient.utiCurrentStatus || "")}>
                  {patient.utiCurrentStatus || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Dispositivos */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Dispositivos</span>
              {editingField === "utiDevices" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiDevices", patient.utiDevices || "")}>
                  {patient.utiDevices || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Culturas/ATB */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Culturas/ATB</span>
              {editingField === "utiCulturesAntibiotics" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiCulturesAntibiotics", patient.utiCulturesAntibiotics || "")}>
                  {patient.utiCulturesAntibiotics || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* LINHA 2 - Campos clínicos */}
            
            {/* Especialidades */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Especialidades</span>
              {editingField === "utiSpecialties" ? (
                <div className="flex items-center gap-0.5">
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4"><X className="h-2 w-2" /></Button>
                </div>
              ) : (
                <p className="text-[9px] leading-snug uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 break-words" onClick={() => startEditing("utiSpecialties", patient.utiSpecialties || "")}>
                  {patient.utiSpecialties || <span className="text-muted-foreground italic">--</span>}
                </p>
              )}
            </div>

            {/* Hipóteses / Diagnósticos */}
            <div className="flex flex-col md:col-span-4">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Hipóteses / Diagnósticos</span>
              <ol className="text-[9px] space-y-0 list-none pl-0">
                {patient.diagnoses?.map((diagnosis, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0">
                    {editingField === "diagnoses" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("diagnoses", diagnosis, idx)}>{diagnosis}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeArrayItem("diagnoses", idx)} className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"><X className="h-2 w-2 text-red-600" /></Button>
                      </>
                    )}
                  </li>
                ))}
                {editingField === "diagnoses" && editingArrayIndex === -2 && (
                  <li className="flex items-center gap-1 bg-accent/30 rounded px-1 py-0">
                    <span className="font-semibold text-muted-foreground">{(patient.diagnoses?.length || 0) + 1}.</span>
                    <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" placeholder="NOVA" />
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                  </li>
                )}
              </ol>
              {(!patient.diagnoses || patient.diagnoses.length === 0) && editingField !== "diagnoses" && (
                <Button size="icon" variant="ghost" onClick={() => startEditing("diagnoses", "", -2)} className="h-4 w-4 text-muted-foreground"><span className="text-xs">+</span></Button>
              )}
            </div>

            {/* Antecedentes */}
            <div className="flex flex-col md:col-span-4">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Antecedentes</span>
              <ol className="text-[9px] space-y-0 list-none pl-0">
                {patient.medicalHistory?.map((history, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0">
                    {editingField === "medicalHistory" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("medicalHistory", history, idx)}>{history}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeArrayItem("medicalHistory", idx)} className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"><X className="h-2 w-2 text-red-600" /></Button>
                      </>
                    )}
                  </li>
                ))}
                {editingField === "medicalHistory" && editingArrayIndex === -2 && (
                  <li className="flex items-center gap-1 bg-accent/30 rounded px-1 py-0">
                    <span className="font-semibold text-muted-foreground">{(patient.medicalHistory?.length || 0) + 1}.</span>
                    <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" placeholder="NOVO" />
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                  </li>
                )}
              </ol>
              {(!patient.medicalHistory || patient.medicalHistory.length === 0) && editingField !== "medicalHistory" && (
                <Button size="icon" variant="ghost" onClick={() => startEditing("medicalHistory", "", -2)} className="h-4 w-4 text-muted-foreground"><span className="text-xs">+</span></Button>
              )}
            </div>

            {/* Exames */}
            <div className="flex flex-col md:col-span-4">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Exames</span>
              <ol className="text-[9px] space-y-0 list-none pl-0">
                {patient.relevantExams?.map((exam, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0">
                    {editingField === "relevantExams" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("relevantExams", exam, idx)}>{exam}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeArrayItem("relevantExams", idx)} className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"><X className="h-2 w-2 text-red-600" /></Button>
                      </>
                    )}
                  </li>
                ))}
                {editingField === "relevantExams" && editingArrayIndex === -2 && (
                  <li className="flex items-center gap-1 bg-accent/30 rounded px-1 py-0">
                    <span className="font-semibold text-muted-foreground">{(patient.relevantExams?.length || 0) + 1}.</span>
                    <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" placeholder="NOVO" />
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                  </li>
                )}
              </ol>
              {(!patient.relevantExams || patient.relevantExams.length === 0) && editingField !== "relevantExams" && (
                <Button size="icon" variant="ghost" onClick={() => startEditing("relevantExams", "", -2)} className="h-4 w-4 text-muted-foreground"><span className="text-xs">+</span></Button>
              )}
            </div>

            {/* Programações / Pendências */}
            <div className="flex flex-col md:col-span-9">
              <span className="text-[9px] font-medium text-muted-foreground mb-0">Programações / Pendências</span>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={patient.pendencies?.map((_, i) => `pendency-${i}`) || []} strategy={verticalListSortingStrategy}>
                  <ol className="text-[9px] space-y-0 list-none pl-0">
                    {patient.pendencies?.map((pendency, idx) => (
                      <SortablePendencyItem
                        key={`pendency-${idx}`}
                        id={`pendency-${idx}`}
                        index={idx}
                        pendency={pendency}
                        isHighlighted={patient.highlightedPendencies?.includes(idx)}
                        onToggleHighlight={() => toggleHighlightPendency(idx)}
                        onEdit={() => startEditing("pendencies", pendency, idx)}
                        onRemove={() => removeArrayItem("pendencies", idx)}
                        isEditing={editingField === "pendencies" && editingArrayIndex === idx}
                        editValue={editValue}
                        onSave={saveInlineEdit}
                        onCancel={cancelEditing}
                        onEditValueChange={(val) => setEditValue(val)}
                        onKeyDown={handleKeyDown}
                        inputRef={inputRef}
                        isLast={idx === (patient.pendencies?.length || 0) - 1}
                        onAddNew={() => startEditing("pendencies", "", -2)}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
              {editingField === "pendencies" && editingArrayIndex === -2 && (
                <div className="flex items-center gap-1 bg-accent/30 rounded px-1 py-0">
                  <div className="w-3" />
                  <span className="font-semibold text-muted-foreground">{(patient.pendencies?.length || 0) + 1}.</span>
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value.toUpperCase())} onKeyDown={handleKeyDown} className="h-4 text-[9px] uppercase flex-1 border-0 bg-transparent p-0" placeholder="NOVA" />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0"><Check className="h-2 w-2" /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0"><X className="h-2 w-2" /></Button>
                </div>
              )}
              {(!patient.pendencies || patient.pendencies.length === 0) && editingField !== "pendencies" && (
                <Button size="icon" variant="ghost" onClick={() => startEditing("pendencies", "", -2)} className="h-4 w-4 text-muted-foreground"><span className="text-xs">+</span></Button>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(patient.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir paciente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
