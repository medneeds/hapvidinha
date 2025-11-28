import { Patient } from "@/types/patient";
import { PatientCardUTI } from "./PatientCardUTI";
import { Plus, Printer, ChevronDown, GripVertical, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
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

interface UTISectionProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onAddBed?: () => void;
  onPrintSection?: () => void;
  selectionMode?: boolean;
  selectedPatients?: Set<string>;
  onToggleSelection?: (patientId: string) => void;
  onReorderPatients?: (patients: Patient[]) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SortablePatientCardProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
}

function SortablePatientCard(props: SortablePatientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.patient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 print:block print:w-full">
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0 print:hidden"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 print:w-full">
        <PatientCardUTI {...props} />
      </div>
    </div>
  );
}

export function UTISection({ 
  patients, 
  onUpdatePatient, 
  onDeletePatient,
  onAddBed,
  onPrintSection, 
  selectionMode = false, 
  selectedPatients = new Set(), 
  onToggleSelection, 
  onReorderPatients,
  isOpen: controlledIsOpen,
  onOpenChange
}: UTISectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const allPatientsSelected = patients.length > 0 && patients.every(p => selectedPatients.has(p.id));

  const handleSelectAll = () => {
    if (!onToggleSelection) return;
    
    if (allPatientsSelected) {
      patients.forEach(p => onToggleSelection(p.id));
    } else {
      patients.forEach(p => {
        if (!selectedPatients.has(p.id)) {
          onToggleSelection(p.id);
        }
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderPatients) {
      const oldIndex = patients.findIndex((p) => p.id === active.id);
      const newIndex = patients.findIndex((p) => p.id === over.id);
      
      const reorderedPatients = arrayMove(patients, oldIndex, newIndex);
      onReorderPatients(reorderedPatients);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2 print:space-y-0.5 print:break-inside-avoid">
      <div className="bg-gradient-to-r from-critical/20 via-critical/10 to-critical/20 rounded-xl p-2 border border-critical/30 shadow-lg print:p-1 print:mb-0.5 print:rounded-md transition-all duration-200 min-h-[48px] print:h-auto flex items-center">
        <div className="flex items-center justify-between w-full gap-3">
          {selectionMode && patients.length > 0 && (
            <div className="flex items-center print:hidden" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={allPatientsSelected}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5 border-2 border-critical data-[state=checked]:bg-critical data-[state=checked]:border-critical"
                aria-label="Selecionar todos os pacientes da UTI"
              />
            </div>
          )}
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity print:pointer-events-none flex-1">
              <ChevronDown className={`h-5 w-5 transition-transform print:hidden ${isOpen ? '' : '-rotate-90'}`} />
              <div className="flex items-center gap-2 print:gap-1">
                <Heart className="h-5 w-5 text-critical print:h-4 print:w-4" />
                <h2 className="text-lg font-bold text-foreground print:text-[10px] uppercase">Quadro de Leitos - UTI</h2>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {onAddBed && (
              <Button
                variant="outline"
                size="icon"
                onClick={onAddBed}
                className="h-8 w-8 print:hidden border-critical/50 hover:bg-critical/10"
                title="Adicionar leito"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            {onPrintSection && (
              <Button
                variant="outline"
                size="icon"
                onClick={onPrintSection}
                className="h-8 w-8 print:hidden border-critical/50 hover:bg-critical/10"
                title="Imprimir UTI"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="flex items-center justify-center h-8 w-8 bg-critical/20 backdrop-blur-sm rounded-lg border border-critical/50 print:h-6 print:w-6">
              <p className="text-base font-bold text-critical print:text-[10px]">{patients.length}/10</p>
            </div>
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-1.5 print:space-y-0.5">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50">
            <Heart className="h-12 w-12 mx-auto mb-3 text-critical/30" />
            <p>Nenhum paciente internado na UTI</p>
            <p className="text-xs mt-1">Adicione um leito para começar</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={patients.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {patients.map((patient) => (
                <SortablePatientCard
                  key={patient.id}
                  patient={patient}
                  onUpdate={onUpdatePatient}
                  onDelete={onDeletePatient}
                  selectionMode={selectionMode}
                  isSelected={selectedPatients.has(patient.id)}
                  onToggleSelection={onToggleSelection}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}