import { Patient, SectorType } from "@/types/patient";
import { PatientCard } from "./PatientCard";
import { Activity, Printer, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  expandedForPrint?: boolean;
  onPrintSector?: () => void;
  onAddExtraBed?: () => void;
  selectionMode?: boolean;
  selectedPatients?: Set<string>;
  onToggleSelection?: (patientId: string) => void;
  printOnlySelected?: boolean;
  onReorderPatients?: (patients: Patient[]) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
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
  expandedForPrint?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PatientCard {...props} />
    </div>
  );
}

export function SectorSection({ sector, patients, onUpdatePatient, onDeletePatient, expandedForPrint = false, onPrintSector, onAddExtraBed, selectionMode = false, selectedPatients = new Set(), onToggleSelection, printOnlySelected = false, onReorderPatients, onTransfer }: SectorSectionProps) {
  const info = sectorInfo[sector];
  const [isOpen, setIsOpen] = useState(true);
  
  const displayPatients = printOnlySelected 
    ? patients.filter(p => selectedPatients.has(p.id))
    : patients;

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2 print:space-y-1 print:break-inside-avoid">
      <div className={`${info.gradientClass} rounded-xl p-3 border border-border/50 shadow-md print:p-2 print:mb-1 transition-all duration-200 h-[72px] flex items-center`}>
        <div className="flex items-center justify-between w-full">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity print:pointer-events-none">
              <ChevronDown className={`h-5 w-5 transition-transform print:hidden ${isOpen ? '' : '-rotate-90'}`} />
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg print:text-base">{info.icon}</span>
                  <h2 className="text-lg font-bold text-foreground print:text-base uppercase">{info.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground print:hidden uppercase">{info.subtitle}</p>
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
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 print:px-2 print:py-1">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Leitos</p>
                <p className="text-base font-bold text-foreground">{patients.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-1.5 print:space-y-1 print:block">
        {displayPatients.length === 0 ? (
          <div className={`text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50 ${printOnlySelected ? 'print:hidden' : ''}`}>
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
                  expandedForPrint={expandedForPrint}
                  selectionMode={selectionMode}
                  isSelected={selectedPatients.has(patient.id)}
                  onToggleSelection={onToggleSelection}
                  onTransfer={onTransfer}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
