import { Patient, SectorType } from "@/types/patient";
import { PatientCard } from "./PatientCard";
import { Activity, Printer, Plus, ChevronDown, GripVertical } from "lucide-react";
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

interface SectorSectionProps {
  sector: SectorType;
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onUndeletePatient?: (patient: Patient) => void;
  onPrintSector?: () => void;
  onAddExtraBed?: () => void;
  selectionMode?: boolean;
  selectedPatients?: Set<string>;
  onToggleSelection?: (patientId: string) => void;
  onReorderPatients?: (patients: Patient[]) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sectorInfo = {
  red: {
    title: "Cuidados Especiais",
    subtitle: "Sala Vermelha",
    icon: "🔴",
    gradientClass: "bg-gradient-critical"
  },
  yellow: {
    title: "Observação Amarela",
    subtitle: "Em monitorização",
    icon: "🟡",
    gradientClass: "bg-gradient-warning"
  },
  blue: {
    title: "Observação Azul",
    subtitle: "Sem monitorização",
    icon: "🔵",
    gradientClass: "bg-gradient-stable"
  }
};

interface SortablePatientCardProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onUndelete?: (patient: Patient) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
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
        <PatientCard {...props} />
      </div>
    </div>
  );
}

export function SectorSection({ 
  sector, 
  patients, 
  onUpdatePatient, 
  onDeletePatient,
  onUndeletePatient, 
  onPrintSector, 
  onAddExtraBed, 
  selectionMode = false, 
  selectedPatients = new Set(), 
  onToggleSelection, 
  onReorderPatients, 
  onTransfer, 
  onPrintPatient,
  isOpen: controlledIsOpen,
  onOpenChange
}: SectorSectionProps) {
  const info = sectorInfo[sector];
  const [internalIsOpen, setInternalIsOpen] = useState(patients.length > 0);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  
  const displayPatients = patients;

  // Check if all patients in this section are selected
  const allPatientsSelected = patients.length > 0 && patients.every(p => selectedPatients.has(p.id));
  const somePatientsSelected = patients.some(p => selectedPatients.has(p.id));

  const handleSelectAllSection = () => {
    if (!onToggleSelection) return;
    
    if (allPatientsSelected) {
      // Deselect all patients in this section
      patients.forEach(p => onToggleSelection(p.id));
    } else {
      // Select all patients in this section
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
      const oldIndex = displayPatients.findIndex((p) => p.id === active.id);
      const newIndex = displayPatients.findIndex((p) => p.id === over.id);
      
      const reorderedPatients = arrayMove(displayPatients, oldIndex, newIndex);
      onReorderPatients(reorderedPatients);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2 print:space-y-0.5 print:break-inside-avoid">
      <div className={`${info.gradientClass} rounded-xl p-2.5 border border-border/50 shadow-md print:p-1 print:mb-0.5 print:rounded-md transition-all duration-200 min-h-[56px] print:h-auto flex items-center`}>
        <div className="flex items-center justify-between w-full gap-3">
          {selectionMode && patients.length > 0 && (
            <div className="flex items-center print:hidden" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={allPatientsSelected}
                onCheckedChange={handleSelectAllSection}
                className={`h-5 w-5 border-2 ${
                  sector === 'red' 
                    ? 'border-critical data-[state=checked]:bg-critical data-[state=checked]:border-critical' 
                    : sector === 'yellow' 
                    ? 'border-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning' 
                    : 'border-stable data-[state=checked]:bg-stable data-[state=checked]:border-stable'
                }`}
                aria-label={`Selecionar todos os pacientes de ${info.title}`}
              />
            </div>
          )}
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity print:pointer-events-none flex-1">
              <ChevronDown className={`h-5 w-5 transition-transform print:hidden ${isOpen ? '' : '-rotate-90'}`} />
              <div className="flex items-center gap-2 print:gap-1">
                <span className="text-lg print:text-sm">{info.icon}</span>
                <h2 className="text-lg font-bold text-foreground print:text-[10px] uppercase">{info.title}</h2>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {onAddExtraBed && (
              <Button
                variant="outline"
                size="icon"
                onClick={onAddExtraBed}
                className="h-8 w-8 print:hidden"
                title="Adicionar leito extra"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            {onPrintSector && (
              <Button
                variant="outline"
                size="icon"
                onClick={onPrintSector}
                className="h-8 w-8 print:hidden"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 print:px-1 print:py-0.5 print:border-border/30">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase print:text-[8px]">Leitos</p>
                <p className="text-base font-bold text-foreground print:text-[10px]">{patients.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-1.5 print:space-y-0.5">
        {displayPatients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50">
            <p>Nenhum paciente neste setor</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayPatients.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {displayPatients.map((patient) => (
                <SortablePatientCard
                  key={patient.id}
                  patient={patient}
                  onUpdate={onUpdatePatient}
                  onDelete={onDeletePatient}
                  onUndelete={onUndeletePatient}
                  selectionMode={selectionMode}
                  isSelected={selectedPatients.has(patient.id)}
                  onToggleSelection={onToggleSelection}
                  onTransfer={onTransfer}
                  onPrintPatient={onPrintPatient}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
