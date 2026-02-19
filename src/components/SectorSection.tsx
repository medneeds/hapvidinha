import { Patient, SectorType, PatientCategory } from "@/types/patient";
import { SECTOR_BED_CONFIG } from "@/utils/bedNaming";
import { PatientCard } from "./PatientCard";
import { Activity, Printer, Plus, ChevronDown, GripVertical, Filter } from "lucide-react";
import { SectorBedIcon } from "@/components/SectorBedIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptySectorState } from "@/components/EmptySectorState";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useMemo } from "react";
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

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  clinico: { label: 'Clínicos', emoji: '🩺' },
  cirurgico: { label: 'Cirurgia', emoji: '🔪' },
  obstetrico: { label: 'Obstétricos', emoji: '🤰' },
  trauma: { label: 'Trauma', emoji: '🦴' },
  uncategorized: { label: 'Sem Categoria', emoji: '📋' },
};

const getSectorColorClass = (sector: SectorType) => {
  switch (sector) {
    case 'red': return 'bg-critical/10 border-critical/30 text-critical';
    case 'yellow': return 'bg-warning/10 border-warning/30 text-warning';
    case 'blue': return 'bg-stable/10 border-stable/30 text-stable';
    default: return 'bg-muted/50 border-border text-muted-foreground';
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
  onRefetch?: () => void;
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

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition: transition ?? 'transform 200ms ease',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 print:block print:w-full"
      data-patient-id={props.patient.id}
    >
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

type CategoryFilter = 'all' | PatientCategory | 'uncategorized';

function CategorySubSection({
  categoryKey,
  patients,
  renderPatients,
  sector,
}: {
  categoryKey: string;
  patients: Patient[];
  renderPatients: (patients: Patient[]) => React.ReactNode;
  sector: SectorType;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const catLabel = CATEGORY_LABELS[categoryKey] || CATEGORY_LABELS.uncategorized;
  const sectorColor = categoryKey === 'uncategorized' 
    ? 'bg-muted/50 border-border text-muted-foreground' 
    : getSectorColorClass(sector);

  if (patients.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-0">
      <CollapsibleTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 w-full px-3 py-1 rounded-t-md border-b transition-all text-left",
          sectorColor,
          "hover:shadow-sm",
          isOpen && "rounded-b-none"
        )}>
          <ChevronDown className={cn("h-3 w-3 transition-transform", !isOpen && "-rotate-90")} />
          <span className="text-[10px] leading-none">{catLabel.emoji}</span>
          <span className="text-[11px] font-medium">{catLabel.label}</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold ml-auto">
            {patients.length}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1">
        {renderPatients(patients)}
      </CollapsibleContent>
    </Collapsible>
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
  onRefetch
}: SectorSectionProps) {
  const info = sectorInfo[sector];
  const displayTitle = customTitle || info.title;
  const displayIcon = customIcon || info.icon;
  const [internalIsOpen, setInternalIsOpen] = useState(patients.length > 0);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  
  // Check if any patients have categories set
  const hasCategories = useMemo(() => 
    patients.some(p => p.patientCategory), 
    [patients]
  );
  
  // Group patients by category
  const categorizedPatients = useMemo(() => {
    const groups: Record<string, Patient[]> = {
      clinico: [],
      cirurgico: [],
      obstetrico: [],
      trauma: [],
      uncategorized: [],
    };
    patients.forEach(p => {
      const cat = p.patientCategory || 'uncategorized';
      if (groups[cat]) {
        groups[cat].push(p);
      } else {
        groups.uncategorized.push(p);
      }
    });
    return groups;
  }, [patients]);

  // Filtered patients based on category filter
  const filteredPatients = useMemo(() => {
    if (categoryFilter === 'all') return patients;
    if (categoryFilter === 'uncategorized') return categorizedPatients.uncategorized;
    if (categoryFilter === null) return categorizedPatients.uncategorized;
    return categorizedPatients[categoryFilter] || [];
  }, [patients, categoryFilter, categorizedPatients]);
  
  // Auto-expand when patients are added, auto-collapse when all removed
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(patients.length > 0);
    }
  }, [patients.length, controlledIsOpen]);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  
  const displayPatients = filteredPatients;

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
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderPatients) {
      const oldIndex = displayPatients.findIndex((p) => p.id === active.id);
      const newIndex = displayPatients.findIndex((p) => p.id === over.id);
      const reorderedPatients = arrayMove(displayPatients, oldIndex, newIndex);
      onReorderPatients(reorderedPatients);
    }
  };

  // Determine if we should show sub-sections (only when filter is 'all' and there are categorized patients)
  const showSubSections = categoryFilter === 'all' && hasCategories;

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
      />
    ))
  );

  // Active category counts for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(categorizedPatients).forEach(([key, pts]) => {
      if (pts.length > 0) counts[key] = pts.length;
    });
    return counts;
  }, [categorizedPatients]);

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
            <div className="flex items-center justify-center h-8 min-w-[2rem] px-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 print:h-6 print:min-w-[1.5rem]">
              <p className="text-base font-bold text-foreground print:text-[10px]">
                {patients.length}
                {SECTOR_BED_CONFIG[sector] && SECTOR_BED_CONFIG[sector].maxRegularBeds !== Infinity && (
                  <span className="text-xs font-normal text-muted-foreground">/{SECTOR_BED_CONFIG[sector].maxRegularBeds}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Category filter chips - only show when categories exist */}
        {hasCategories && isOpen && (
          <div className="flex items-center gap-1.5 mt-2 px-1 print:hidden overflow-x-auto">
            <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all whitespace-nowrap",
                categoryFilter === 'all'
                  ? "bg-foreground/10 border-foreground/30 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent"
              )}
            >
              Todos ({patients.length})
            </button>
            {Object.entries(categoryCounts).map(([key, count]) => {
              const catLabel = CATEGORY_LABELS[key];
              if (!catLabel) return null;
              const isActive = categoryFilter === (key === 'uncategorized' ? 'uncategorized' : key);
              const sectorColor = key === 'uncategorized' 
                ? 'bg-muted/50 border-border text-muted-foreground' 
                : getSectorColorClass(sector);
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key === 'uncategorized' ? 'uncategorized' : key as PatientCategory)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all whitespace-nowrap",
                    isActive
                      ? sectorColor
                      : "border-transparent text-muted-foreground hover:bg-accent"
                  )}
                >
                  {catLabel.emoji} {catLabel.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CollapsibleContent className="space-y-1.5 print:space-y-0.5">
        {displayPatients.length === 0 ? (
          <EmptySectorState
            sectorName={displayTitle}
            sectorIcon={displayIcon}
            onAddBed={onAddExtraBed}
          />
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
              {showSubSections ? (
                // Render categorized sub-sections
                <>
                  {['clinico', 'cirurgico', 'obstetrico', 'trauma', 'uncategorized'].map(catKey => {
                    const catPatients = categorizedPatients[catKey] || [];
                    if (catPatients.length === 0) return null;
                    return (
                      <CategorySubSection
                        key={catKey}
                        categoryKey={catKey}
                        patients={catPatients}
                        renderPatients={renderPatientCards}
                        sector={sector}
                      />
                    );
                  })}
                </>
              ) : (
                // Flat list (no sub-sections)
                renderPatientCards(displayPatients)
              )}
            </SortableContext>
          </DndContext>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
