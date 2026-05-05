import { Patient, SectorType } from "@/types/patient";
import { SECTOR_BED_CONFIG } from "@/utils/bedNaming";
import { PatientCard } from "./PatientCard";
import { Activity, Printer, Plus, ChevronDown, GripVertical } from "lucide-react";
import { SectorBedIcon } from "@/components/SectorBedIcon";
import { Button } from "@/components/ui/button";
import { EmptySectorState } from "@/components/EmptySectorState";
import { EmptyBedSlot } from "@/components/EmptyBedSlot";
import { DeathReviewGhostCard } from "@/components/DeathReviewGhostCard";
import { useDeathReviews } from "@/hooks/useDeathReviews";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  customTitle?: string;
  customIcon?: string;
  onRefetch?: () => void;
  onRequestFromQueue?: (sector: SectorType) => void;
}

const sectorInfo = {
  red: {
    title: "Cuidados Especiais",
    subtitle: "Leitos V01-V07",
    icon: "🔴",
    gradientClass: "bg-critical/15 dark:bg-critical/25 border-l-4 border-l-critical"
  },
  yellow: {
    title: "Observação Amarela",
    subtitle: "Leitos A01-A06",
    icon: "🟡",
    gradientClass: "bg-warning/15 dark:bg-warning/25 border-l-4 border-l-warning"
  },
  blue: {
    title: "Observação Azul",
    subtitle: "Leitos Z01-Z06",
    icon: "🔵",
    gradientClass: "bg-stable/15 dark:bg-stable/25 border-l-4 border-l-stable"
  },
  outside: {
    title: "Fora das Alas",
    subtitle: "Pacientes externos",
    icon: "⚪",
    gradientClass: "bg-muted/30 dark:bg-muted/40 border-l-4 border-l-muted-foreground/50"
  }
};

function SortablePatientCard({ patient, onUpdate, onDelete, onUndelete, selectionMode, isSelected, onToggleSelection, onTransfer, onPrintPatient, onRefetch, dragDisabled }: {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onUndelete?: (patient: Patient) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
  dragDisabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: patient.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-1 md:gap-2">
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection?.(patient.id)}
          className="flex-shrink-0"
        />
      )}
      {!dragDisabled && (
        <div {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0 print:hidden">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <PatientCard
          patient={patient}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onUndelete={onUndelete}
          onTransfer={onTransfer}
          onPrintPatient={onPrintPatient}
          onRefetch={onRefetch}
        />
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
  onOpenChange,
  customTitle,
  customIcon,
  onRefetch,
  onRequestFromQueue
}: SectorSectionProps) {
  const info = sectorInfo[sector];
  const displayTitle = customTitle || info.title;
  const displayIcon = customIcon || info.icon;
  // V/A/Z are FIXED, numerically-ordered emergency observation beds (like UTI).
  const isFixedBedSector = sector === 'red' || sector === 'yellow' || sector === 'blue';
  const sortedPatients = isFixedBedSector
    ? [...patients].sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, 'pt-BR', { numeric: true }))
    : patients;
  const [internalIsOpen, setInternalIsOpen] = useState(patients.length > 0);

  // Pending post-death reviews for THIS sector (beds no longer in the list)
  const department = (patients[0] as any)?.department as string | undefined;
  const { reviews: pendingReviews } = useDeathReviews(department);
  const ghostReviews = pendingReviews.filter(
    (r) =>
      r.patient_sector === sector &&
      !patients.some((p) => p.bedNumber === r.patient_bed)
  );
  
  // Auto-expand when patients are added, auto-collapse when all removed.
  // Fixed-bed sectors (V/A/Z) stay open by default since slots are always present.
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(isFixedBedSector ? true : patients.length > 0);
    }
  }, [patients.length, controlledIsOpen, isFixedBedSector]);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

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
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (isFixedBedSector) return; // V/A/Z stay locked in numeric order
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderPatients) {
      const oldIndex = patients.findIndex((p) => p.id === active.id);
      const newIndex = patients.findIndex((p) => p.id === over.id);
      const reorderedPatients = arrayMove(patients, oldIndex, newIndex);
      onReorderPatients(reorderedPatients);
    }
  };

  const renderPatientCards = (patientsToRender: Patient[]) => (
    patientsToRender.map((patient) => (
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
        onRefetch={onRefetch}
        dragDisabled={isFixedBedSector}
      />
    ))
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3 mb-4 print:space-y-0.5 print:mb-1 print:break-inside-avoid">
      <div className={`${info.gradientClass} rounded-xl p-2 border border-border/50 shadow-md print:p-1 print:mb-0.5 print:rounded-md transition-all duration-200 min-h-[48px] print:h-auto flex flex-col`}>
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
                <SectorBedIcon sectorIcon={displayIcon} size="md" />
                <h2 className="text-lg font-bold text-foreground print:text-[10px] uppercase">{displayTitle}</h2>
              </div>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {onAddExtraBed && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onAddExtraBed()}
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
            <div className="flex items-center justify-center h-8 min-w-[2rem] px-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 print:h-6 print:min-w-[1.5rem]">
              <p className="text-base font-bold text-foreground print:text-[10px]">
                {isFixedBedSector ? sortedPatients.filter(p => !p.isVacant).length : patients.length}
                {SECTOR_BED_CONFIG[sector] && SECTOR_BED_CONFIG[sector].maxRegularBeds !== Infinity && (
                  <span className="text-xs font-normal text-muted-foreground">/{SECTOR_BED_CONFIG[sector].maxRegularBeds}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-1.5 print:space-y-0.5">
        {patients.length === 0 && ghostReviews.length === 0 ? (
          <EmptySectorState
            sectorName={displayTitle}
            sectorIcon={displayIcon}
            onAddBed={onAddExtraBed}
          />
        ) : (
          <>
            {isFixedBedSector ? (
              // Fixed sectors (V/A/Z): render vacant slots as compact pre-allocation rows,
              // occupied beds as full draggable cards — interleaved by bed number.
              (() => {
                const occupiedIds = sortedPatients
                  .filter((p) => !p.isVacant)
                  .map((p) => p.id);
                return (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={occupiedIds} strategy={verticalListSortingStrategy}>
                      {sortedPatients.map((patient) => {
                        const isVacantSlot = patient.isVacant === true;
                        if (isVacantSlot) {
                          return (
                            <EmptyBedSlot
                              key={patient.id}
                              bedNumber={patient.bedNumber}
                              sector={sector}
                              onAllocateNew={() =>
                                onUpdatePatient({ ...patient, isVacant: false, bedStatus: 'available', bedMaintenanceReason: null, bedMaintenanceStartedAt: null, bedMaintenanceStartedBy: null })
                              }
                              onAllocateFromQueue={
                                onRequestFromQueue ? () => onRequestFromQueue(sector) : undefined
                              }
                              isMaintenance={patient.bedStatus === 'maintenance'}
                              maintenanceReason={patient.bedMaintenanceReason}
                              onBlockMaintenance={() => {
                                const reason = window.prompt(`Motivo da interdição do leito ${patient.bedNumber}:`)?.trim().toUpperCase();
                                if (!reason) return;
                                onUpdatePatient({ ...patient, isVacant: true, bedStatus: 'maintenance', bedMaintenanceReason: reason, bedMaintenanceStartedAt: new Date().toISOString() });
                              }}
                              onReleaseMaintenance={() =>
                                onUpdatePatient({ ...patient, bedStatus: 'available', bedMaintenanceReason: null, bedMaintenanceStartedAt: null, bedMaintenanceStartedBy: null })
                              }
                            />
                          );
                        }
                        return (
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
                            onRefetch={onRefetch}
                            dragDisabled={isFixedBedSector}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                );
              })()
            ) : (
              sortedPatients.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedPatients.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {renderPatientCards(sortedPatients)}
                  </SortableContext>
                </DndContext>
              )
            )}
            {ghostReviews.map((review) => (
              <DeathReviewGhostCard key={review.id} review={review} />
            ))}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
