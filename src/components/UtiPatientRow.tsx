import { Patient } from "@/types/patient";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Edit, MoreVertical, Bed } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UtiPatientRowProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onPrintPatient?: (patientId: string) => void;
  onRefetch?: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  getValue: (patient: Patient) => string | string[];
  width: string;
  color: string;
}

const fieldConfigs: FieldConfig[] = [
  {
    key: "bed",
    label: "Leito",
    getValue: (p) => p.bedNumber,
    width: "min-w-[80px]",
    color: "bg-blue-500/20 border-blue-500/50"
  },
  {
    key: "name",
    label: "Paciente",
    getValue: (p) => p.name,
    width: "min-w-[180px]",
    color: "bg-purple-500/20 border-purple-500/50"
  },
  {
    key: "origin",
    label: "Setor de Origem",
    getValue: (p) => p.utiOriginSector || "-",
    width: "min-w-[140px]",
    color: "bg-slate-500/20 border-slate-500/50"
  },
  {
    key: "admission",
    label: "Admissão UTI",
    getValue: (p) => p.utiAdmissionDate || "-",
    width: "min-w-[120px]",
    color: "bg-green-500/20 border-green-500/50"
  },
  {
    key: "discharge",
    label: "Previsão de Alta",
    getValue: (p) => p.utiDischargePrediction || "-",
    width: "min-w-[140px]",
    color: "bg-emerald-500/20 border-emerald-500/50"
  },
  {
    key: "allergies",
    label: "Alergias",
    getValue: (p) => p.utiAllergies || "-",
    width: "min-w-[140px]",
    color: "bg-red-500/20 border-red-500/50"
  },
  {
    key: "reason",
    label: "Motivo Admissão",
    getValue: (p) => p.utiAdmissionReason || "-",
    width: "min-w-[180px]",
    color: "bg-orange-500/20 border-orange-500/50"
  },
  {
    key: "diagnoses",
    label: "Hipóteses / Diagnósticos",
    getValue: (p) => p.diagnoses || "-",
    width: "min-w-[200px]",
    color: "bg-amber-500/20 border-amber-500/50"
  },
  {
    key: "status",
    label: "Quadro Atual",
    getValue: (p) => p.utiCurrentStatus || "-",
    width: "min-w-[180px]",
    color: "bg-cyan-500/20 border-cyan-500/50"
  },
  {
    key: "specialties",
    label: "Especialidades",
    getValue: (p) => p.utiSpecialties || "-",
    width: "min-w-[160px]",
    color: "bg-indigo-500/20 border-indigo-500/50"
  },
  {
    key: "devices",
    label: "Dispositivos",
    getValue: (p) => p.utiDevices || "-",
    width: "min-w-[160px]",
    color: "bg-violet-500/20 border-violet-500/50"
  },
  {
    key: "exams",
    label: "Exames",
    getValue: (p) => p.relevantExams || "-",
    width: "min-w-[180px]",
    color: "bg-pink-500/20 border-pink-500/50"
  },
  {
    key: "cultures",
    label: "Culturas / ATB",
    getValue: (p) => p.utiCulturesAntibiotics || "-",
    width: "min-w-[180px]",
    color: "bg-rose-500/20 border-rose-500/50"
  },
  {
    key: "pendencies",
    label: "Programações / Pendências",
    getValue: (p) => p.pendencies || "-",
    width: "min-w-[220px]",
    color: "bg-yellow-500/20 border-yellow-500/50"
  }
];

export function UtiPatientRow({ 
  patient, 
  onUpdate, 
  onDelete,
  onPrintPatient,
  onRefetch 
}: UtiPatientRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const formatValue = (value: string | string[]): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join("; ") : "-";
    }
    return value || "-";
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-stretch">
          {/* Fixed Actions Column */}
          <div className="flex items-center gap-1 px-2 py-2 border-r border-border bg-muted/30 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8"
              title="Editar paciente"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
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

          {/* Scroll Navigation Left */}
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="h-full w-8 rounded-none border-r border-border hover:bg-accent flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Scrollable Fields Container */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--muted-foreground)) transparent'
            }}
          >
            <div className="flex">
              {fieldConfigs.map((field) => {
                const value = field.getValue(patient);
                const displayValue = formatValue(value);
                
                return (
                  <div 
                    key={field.key}
                    className={cn(
                      "flex flex-col py-2 px-3 border-r border-border/50 flex-shrink-0",
                      field.width,
                      field.color
                    )}
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {field.label}
                    </span>
                    <span className={cn(
                      "text-sm font-medium text-foreground line-clamp-2",
                      field.key === "bed" && "text-lg font-bold",
                      field.key === "name" && "font-semibold"
                    )}>
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scroll Navigation Right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="h-full w-8 rounded-none border-l border-border hover:bg-accent flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
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
