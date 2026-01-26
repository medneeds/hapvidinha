import { Patient, SectorType } from "@/types/patient";
import { ReactNode } from "react";
import { UtiPatientCard } from "./UtiPatientCard";
import { Printer, Plus, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
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

type ColorVariant = 'blue' | 'yellow';

interface UtiSectorSectionProps {
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
  customTitle?: string;
  customIcon?: ReactNode;
  onRefetch?: () => void;
  colorVariant?: ColorVariant;
}

const sectorInfo = {
  red: {
    title: "Cuidados Intensivos",
    subtitle: "Leitos UTI",
    icon: "🏥",
    gradientClass: "bg-primary/15 dark:bg-primary/25 border-l-4 border-l-primary"
  },
  yellow: {
    title: "Semi-Intensivo",
    subtitle: "Leitos Semi",
    icon: "🟡",
    gradientClass: "bg-primary/15 dark:bg-primary/25 border-l-4 border-l-primary"
  },
  blue: {
    title: "Observação UTI",
    subtitle: "Aguardando vaga",
    icon: "🔵",
    gradientClass: "bg-primary/15 dark:bg-primary/25 border-l-4 border-l-primary"
  }
};

interface SortableUtiRowProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  colorVariant?: ColorVariant;
}

function SortableUtiRow(props: SortableUtiRowProps) {
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
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-1 md:gap-2"
      data-patient-id={props.patient.id}
    >
      {props.selectionMode && (
        <Checkbox
          checked={props.isSelected}
          onCheckedChange={() => props.onToggleSelection?.(props.patient.id)}
          className="flex-shrink-0"
        />
      )}
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0 print:hidden hidden md:block"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <UtiPatientCard
          patient={props.patient}
          onUpdate={props.onUpdate}
          onDelete={props.onDelete}
          onPrintPatient={props.onPrintPatient}
          onRefetch={props.onRefetch}
          colorVariant={props.colorVariant}
        />
      </div>
    </div>
  );
}

export function UtiSectorSection({ 
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
  onOpenChange,
  customTitle,
  customIcon,
  onRefetch,
  colorVariant = 'blue'
}: UtiSectorSectionProps) {
  const info = sectorInfo[sector];
  const displayTitle = customTitle || info.title;
  const displayIcon = customIcon || info.icon;
  const [internalIsOpen, setInternalIsOpen] = useState(patients.length > 0);

  // Header color schemes based on colorVariant
  const headerStyles = {
    blue: {
      bg: "bg-primary/15 dark:bg-primary/25 border-l-4 border-l-primary",
      title: "text-primary dark:text-primary",
      button: "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50",
      chevron: "text-primary",
      counter: "border-primary/30 bg-primary/10"
    },
    yellow: {
      bg: "bg-amber-100/60 dark:bg-amber-900/30 border-l-4 border-l-amber-500",
      title: "text-amber-700 dark:text-amber-400",
      button: "border-amber-400/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-400/50",
      chevron: "text-amber-600 dark:text-amber-400",
      counter: "border-amber-400/30 bg-amber-500/10"
    }
  };
  const headerClass = headerStyles[colorVariant].bg;
  const titleClass = headerStyles[colorVariant].title;
  const buttonClass = headerStyles[colorVariant].button;
  const chevronClass = headerStyles[colorVariant].chevron;
  const counterClass = headerStyles[colorVariant].counter;
  
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(patients.length > 0);
    }
  }, [patients.length, controlledIsOpen]);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  
  const displayPatients = patients;

  const allPatientsSelected = patients.length > 0 && patients.every(p => selectedPatients.has(p.id));

  const handleSelectAllSection = () => {
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
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
      <div className={`${headerClass} rounded-xl p-2 border border-border/50 shadow-md print:p-1 print:mb-0.5 print:rounded-md transition-all duration-200 min-h-[48px] print:h-auto flex items-center`}>
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
              <ChevronDown className={`h-5 w-5 transition-transform print:hidden ${chevronClass} ${isOpen ? '' : '-rotate-90'}`} />
              <div className="flex items-center gap-2 print:gap-1">
                <span className="text-lg print:text-sm">{displayIcon}</span>
                <h2 className={`text-lg font-bold print:text-[10px] uppercase ${titleClass}`}>{displayTitle}</h2>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {onAddExtraBed && (
              <Button
                variant="outline"
                size="icon"
                onClick={onAddExtraBed}
                className={`h-8 w-8 print:hidden ${buttonClass}`}
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
                className={`h-8 w-8 print:hidden ${buttonClass}`}
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className={`flex items-center justify-center h-8 w-8 backdrop-blur-sm rounded-lg border print:h-6 print:w-6 ${counterClass}`}>
              <p className={`text-base font-bold print:text-[10px] ${titleClass}`}>{patients.length}</p>
            </div>
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-2 print:space-y-0.5">

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
                <SortableUtiRow
                  key={patient.id}
                  patient={patient}
                  onUpdate={onUpdatePatient}
                  onDelete={onDeletePatient}
                  onPrintPatient={onPrintPatient}
                  onRefetch={onRefetch}
                  selectionMode={selectionMode}
                  isSelected={selectedPatients.has(patient.id)}
                  onToggleSelection={onToggleSelection}
                  colorVariant={colorVariant}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
