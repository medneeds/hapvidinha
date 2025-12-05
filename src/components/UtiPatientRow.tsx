import { Patient } from "@/types/patient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical } from "lucide-react";
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
  color: string;
}

// Linha 1: Leito, Paciente, Setor de Origem, Admissão UTI, Previsão de Alta, Alergias, Motivo da Admissão
const line1Fields: FieldConfig[] = [
  { key: "bed", label: "Leito", getValue: (p) => p.bedNumber, color: "bg-blue-500/20 border-blue-500/30" },
  { key: "name", label: "Paciente", getValue: (p) => p.name, color: "bg-purple-500/20 border-purple-500/30" },
  { key: "origin", label: "Setor de Origem", getValue: (p) => p.utiOriginSector || "-", color: "bg-slate-500/20 border-slate-500/30" },
  { key: "admission", label: "Admissão UTI", getValue: (p) => p.utiAdmissionDate || "-", color: "bg-green-500/20 border-green-500/30" },
  { key: "discharge", label: "Previsão de Alta", getValue: (p) => p.utiDischargePrediction || "-", color: "bg-emerald-500/20 border-emerald-500/30" },
  { key: "allergies", label: "Alergias", getValue: (p) => p.utiAllergies || "-", color: "bg-red-500/20 border-red-500/30" },
  { key: "reason", label: "Motivo Admissão", getValue: (p) => p.utiAdmissionReason || "-", color: "bg-orange-500/20 border-orange-500/30" },
];

// Linha 2: Hipóteses/Diagnósticos, Quadro Atual, Especialidades, Dispositivos, Exames, Culturas/ATB, Programações/Pendências
const line2Fields: FieldConfig[] = [
  { key: "diagnoses", label: "Hipóteses / Diagnósticos", getValue: (p) => p.diagnoses || "-", color: "bg-amber-500/20 border-amber-500/30" },
  { key: "status", label: "Quadro Atual", getValue: (p) => p.utiCurrentStatus || "-", color: "bg-cyan-500/20 border-cyan-500/30" },
  { key: "specialties", label: "Especialidades", getValue: (p) => p.utiSpecialties || "-", color: "bg-indigo-500/20 border-indigo-500/30" },
  { key: "devices", label: "Dispositivos", getValue: (p) => p.utiDevices || "-", color: "bg-violet-500/20 border-violet-500/30" },
  { key: "exams", label: "Exames", getValue: (p) => p.relevantExams || "-", color: "bg-pink-500/20 border-pink-500/30" },
  { key: "cultures", label: "Culturas / ATB", getValue: (p) => p.utiCulturesAntibiotics || "-", color: "bg-rose-500/20 border-rose-500/30" },
  { key: "pendencies", label: "Programações / Pendências", getValue: (p) => p.pendencies || "-", color: "bg-yellow-500/20 border-yellow-500/30" },
];

const formatValue = (value: string | string[]): string => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("; ") : "-";
  }
  return value || "-";
};

interface FieldCellProps {
  field: FieldConfig;
  patient: Patient;
  isFirst?: boolean;
}

function FieldCell({ field, patient, isFirst }: FieldCellProps) {
  const value = field.getValue(patient);
  const displayValue = formatValue(value);
  
  return (
    <div 
      className={cn(
        "flex flex-col py-2 px-3 border border-border/30 rounded",
        field.color,
        field.key === "bed" && "flex-shrink-0 w-[70px]",
        field.key === "name" && "flex-[2] min-w-[150px]",
        !["bed", "name"].includes(field.key) && "flex-1 min-w-[100px]"
      )}
    >
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
        {field.label}
      </span>
      <span className={cn(
        "text-sm font-medium text-foreground line-clamp-2",
        field.key === "bed" && "text-base font-bold",
        field.key === "name" && "font-semibold"
      )}>
        {displayValue}
      </span>
    </div>
  );
}

export function UtiPatientRow({ 
  patient, 
  onUpdate, 
  onDelete,
  onPrintPatient,
  onRefetch 
}: UtiPatientRowProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex">
          {/* Fixed Actions Column */}
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 border-r border-border bg-muted/30 flex-shrink-0">
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

          {/* Two-line Fields Container */}
          <div className="flex-1 flex flex-col gap-1 p-2">
            {/* Line 1 */}
            <div className="flex gap-1 flex-wrap">
              {line1Fields.map((field) => (
                <FieldCell key={field.key} field={field} patient={patient} />
              ))}
            </div>
            
            {/* Line 2 */}
            <div className="flex gap-1 flex-wrap">
              {line2Fields.map((field) => (
                <FieldCell key={field.key} field={field} patient={patient} />
              ))}
            </div>
          </div>
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
