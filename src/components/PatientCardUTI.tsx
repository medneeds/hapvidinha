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
        "text-[10px] text-foreground leading-snug uppercase rounded px-1 -mx-1 flex items-start justify-between gap-1 py-0.5 group",
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
              className="h-5 text-[10px] uppercase text-foreground flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button size="icon" variant="ghost" onClick={onSave} className="h-4 w-4 text-green-600 hover:bg-green-100 p-0">
              <Check className="h-2.5 w-2.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancel} className="h-4 w-4 text-red-600 hover:bg-red-100 p-0">
              <X className="h-2.5 w-2.5" />
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
              <Star className={cn("h-2.5 w-2.5", isHighlighted ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
            </Button>
            {isLast && (
              <Button size="icon" variant="ghost" onClick={onAddNew} className="h-4 w-4 p-0 text-muted-foreground hover:text-primary">
                <span className="text-xs font-bold">+</span>
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onRemove} className="h-4 w-4 p-0 text-red-600 hover:bg-red-100">
              <X className="h-2.5 w-2.5" />
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
      // Editing existing array item
      const arrayKey = editingField as keyof Patient;
      const currentArray = patient[arrayKey] as string[];
      const updatedArray = [...currentArray];
      updatedArray[editingArrayIndex] = editValue;
      updates[arrayKey] = updatedArray as any;
    } else if (editingArrayIndex === -2) {
      // Adding new array item
      const arrayKey = editingField as keyof Patient;
      const currentArray = (patient[arrayKey] as string[]) || [];
      updates[arrayKey] = [...currentArray, editValue] as any;
    } else {
      // Editing single field
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
        // Restart adding mode
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

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500">
      <div className="p-2">
        <div className="flex items-start justify-between gap-2">
          {selectionMode && onToggleSelection && (
            <div className="flex items-center justify-center flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(patient.id)}
                className="h-5 w-5 border-2 border-blue-500 data-[state=checked]:bg-blue-500"
              />
            </div>
          )}
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-20 gap-1.5 items-start">
            {/* Leito */}
            <div className="flex flex-col md:col-span-1">
              <span className="text-[9px] font-medium text-muted-foreground mb-0.5">Leito</span>
              <Badge className="w-fit text-[10px] py-0 px-1 font-bold leading-tight bg-blue-500 text-white">
                {patient.bedNumber}
              </Badge>
            </div>

            {/* Paciente (Nome + Idade) */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
              <div className="group/name relative">
                <div className="flex items-start gap-1">
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
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-6 w-6">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-6 w-6">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="font-semibold text-sm leading-tight uppercase cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                        onClick={() => startEditing("name", patient.name)}
                      >
                        {patient.name || <span className="text-muted-foreground italic">Adicionar</span>}
                      </p>
                    )}
                    
                    {editingField === "age" ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[11px]"
                        />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5">
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5">
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <p 
                        className="text-[11px] text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                        onClick={() => startEditing("age", typeof patient.age === 'number' ? patient.age.toString() : patient.age)}
                      >
                        {patient.age ? formatAgeDisplay(patient.age) : <span className="italic">Idade</span>}
                      </p>
                    )}
                  </div>
                  {!editingField && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyName}
                      className="h-5 w-5 opacity-60 group-hover/name:opacity-100 transition-opacity"
                      title="Copiar nome"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Admissão UTI + Previsão */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Admissão / Previsão</span>
              {editingField === "utiAdmissionDate" ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={inputRef}
                    type="datetime-local"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-6 text-[10px]"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                  onClick={() => startEditing("utiAdmissionDate", patient.utiAdmissionDate || "")}
                >
                  {patient.utiAdmissionDate ? new Date(patient.utiAdmissionDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : <span className="italic text-muted-foreground">Admissão</span>}
                </p>
              )}
              {editingField === "utiDischargePrediction" ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-5 text-[10px]"
                    placeholder="Ex: 3-5 dias"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-[10px] text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1"
                  onClick={() => startEditing("utiDischargePrediction", patient.utiDischargePrediction || "")}
                >
                  {patient.utiDischargePrediction || <span className="italic">Previsão</span>}
                </p>
              )}
            </div>

            {/* Hipóteses / Diagnósticos */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Hipóteses / Diagnósticos</span>
              <ol className="text-[10px] space-y-0.5 list-none pl-0">
                {patient.diagnoses?.map((diagnosis, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0.5">
                    {editingField === "diagnoses" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                        />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("diagnoses", diagnosis, idx)}>
                          {diagnosis}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeArrayItem("diagnoses", idx)} 
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5 text-red-600" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ol>
              {editingField === "diagnoses" && editingArrayIndex === -2 ? (
                <div className="flex items-center gap-1 mt-0.5 bg-accent/30 rounded px-1 py-0.5">
                  <span className="font-semibold text-muted-foreground text-[10px]">{(patient.diagnoses?.length || 0) + 1}.</span>
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                    placeholder="NOVA HIPÓTESE"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                (!patient.diagnoses || patient.diagnoses.length === 0) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("diagnoses", "", -2)}
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )
              )}
            </div>

            {/* Antecedentes / Comorbidades */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Antecedentes</span>
              <ol className="text-[10px] space-y-0.5 list-none pl-0">
                {patient.medicalHistory?.map((history, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0.5">
                    {editingField === "medicalHistory" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                        />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("medicalHistory", history, idx)}>
                          {history}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeArrayItem("medicalHistory", idx)} 
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5 text-red-600" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ol>
              {editingField === "medicalHistory" && editingArrayIndex === -2 ? (
                <div className="flex items-center gap-1 mt-0.5 bg-accent/30 rounded px-1 py-0.5">
                  <span className="font-semibold text-muted-foreground text-[10px]">{(patient.medicalHistory?.length || 0) + 1}.</span>
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                    placeholder="NOVO"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                (!patient.medicalHistory || patient.medicalHistory.length === 0) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("medicalHistory", "", -2)}
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )
              )}
            </div>

            {/* Motivo Admissão + Quadro Atual */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Motivo / Quadro</span>
              {editingField === "utiAdmissionReason" ? (
                <div className="flex items-start gap-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                    placeholder="Motivo da admissão"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-2"
                  onClick={() => startEditing("utiAdmissionReason", patient.utiAdmissionReason || "")}
                >
                  {patient.utiAdmissionReason || <span className="italic text-muted-foreground">Motivo</span>}
                </p>
              )}
              {editingField === "utiCurrentStatus" ? (
                <div className="flex items-start gap-1 mt-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                    placeholder="Quadro atual"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] text-muted-foreground mt-1 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-2"
                  onClick={() => startEditing("utiCurrentStatus", patient.utiCurrentStatus || "")}
                >
                  {patient.utiCurrentStatus || <span className="italic">Quadro</span>}
                </p>
              )}
            </div>

            {/* Alergias */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Alergias</span>
              {editingField === "utiAllergies" ? (
                <div className="flex items-start gap-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-3"
                  onClick={() => startEditing("utiAllergies", patient.utiAllergies || "")}
                >
                  {patient.utiAllergies || <span className="italic text-muted-foreground">Nenhuma</span>}
                </p>
              )}
            </div>

            {/* Dispositivos */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Dispositivos</span>
              {editingField === "utiDevices" ? (
                <div className="flex items-start gap-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                    placeholder="VM, CVC, SVD..."
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-3"
                  onClick={() => startEditing("utiDevices", patient.utiDevices || "")}
                >
                  {patient.utiDevices || <span className="italic text-muted-foreground">Nenhum</span>}
                </p>
              )}
            </div>

            {/* Culturas / ATB */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Culturas / ATB</span>
              {editingField === "utiCulturesAntibiotics" ? (
                <div className="flex items-start gap-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-3"
                  onClick={() => startEditing("utiCulturesAntibiotics", patient.utiCulturesAntibiotics || "")}
                >
                  {patient.utiCulturesAntibiotics || <span className="italic text-muted-foreground">Nenhum</span>}
                </p>
              )}
            </div>

            {/* Exames */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Exames</span>
              <ol className="text-[10px] space-y-0.5 list-none pl-0">
                {patient.relevantExams?.map((exam, idx) => (
                  <li key={idx} className="flex items-start gap-1 group hover:bg-accent/30 rounded px-1 -mx-1 py-0.5">
                    {editingField === "relevantExams" && editingArrayIndex === idx ? (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                          onKeyDown={handleKeyDown}
                          className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                        />
                        <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-muted-foreground flex-shrink-0">{idx + 1}.</span>
                        <span className="flex-1 cursor-pointer uppercase" onClick={() => startEditing("relevantExams", exam, idx)}>
                          {exam}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeArrayItem("relevantExams", idx)} 
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5 text-red-600" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ol>
              {editingField === "relevantExams" && editingArrayIndex === -2 ? (
                <div className="flex items-center gap-1 mt-0.5 bg-accent/30 rounded px-1 py-0.5">
                  <span className="font-semibold text-muted-foreground text-[10px]">{(patient.relevantExams?.length || 0) + 1}.</span>
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                    placeholder="NOVO"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                (!patient.relevantExams || patient.relevantExams.length === 0) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("relevantExams", "", -2)}
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )
              )}
            </div>

            {/* Programações / Pendências */}
            <div className="flex flex-col md:col-span-3">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Programações / Pendências</span>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={patient.pendencies?.map((_, i) => `pendency-${i}`) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="text-[10px] space-y-0.5 list-none pl-0">
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
              {editingField === "pendencies" && editingArrayIndex === -2 ? (
                <div className="flex items-center gap-1 mt-0.5 bg-accent/30 rounded px-1 py-0.5">
                  <div className="w-3" />
                  <span className="font-semibold text-muted-foreground text-[10px]">{(patient.pendencies?.length || 0) + 1}.</span>
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    className="h-5 text-[10px] uppercase flex-1 border-0 bg-transparent p-0"
                    placeholder="NOVA PENDÊNCIA"
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-4 w-4 p-0">
                    <Check className="h-2.5 w-2.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-4 w-4 p-0">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                (!patient.pendencies || patient.pendencies.length === 0) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("pendencies", "", -2)}
                    className="h-5 w-5 text-muted-foreground"
                  >
                    <span className="text-xs">+</span>
                  </Button>
                )
              )}
            </div>

            {/* Especialidades */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Especialidades</span>
              {editingField === "utiSpecialties" ? (
                <div className="flex items-start gap-1">
                  <Textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-[10px] min-h-[40px] flex-1"
                    placeholder="Ex: Pneumo, Infecto"
                  />
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" onClick={saveInlineEdit} className="h-5 w-5 p-0">
                      <Check className="h-2.5 w-2.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5 p-0">
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-[10px] cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 line-clamp-3"
                  onClick={() => startEditing("utiSpecialties", patient.utiSpecialties || "")}
                >
                  {patient.utiSpecialties || <span className="italic text-muted-foreground">Nenhuma</span>}
                </p>
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
