import { Patient } from "@/types/patient";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Check, X } from "lucide-react";
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
  key: keyof Patient | string;
  label: string;
  getValue: (patient: Patient) => string | string[];
  line: 1 | 2;
}

const fields: FieldConfig[] = [
  // Line 1
  { key: "bedNumber", label: "Leito", getValue: (p) => p.bedNumber, line: 1 },
  { key: "name", label: "Paciente", getValue: (p) => p.name, line: 1 },
  { key: "utiOriginSector", label: "Setor de Origem", getValue: (p) => p.utiOriginSector || "-", line: 1 },
  { key: "utiAdmissionDate", label: "Admissão UTI", getValue: (p) => p.utiAdmissionDate || "-", line: 1 },
  { key: "utiDischargePrediction", label: "Previsão de Alta", getValue: (p) => p.utiDischargePrediction || "-", line: 1 },
  { key: "utiAllergies", label: "Alergias", getValue: (p) => p.utiAllergies || "-", line: 1 },
  { key: "utiAdmissionReason", label: "Motivo Admissão", getValue: (p) => p.utiAdmissionReason || "-", line: 1 },
  // Line 2
  { key: "diagnoses", label: "Hipóteses / Diagnósticos", getValue: (p) => p.diagnoses || "-", line: 2 },
  { key: "utiCurrentStatus", label: "Quadro Atual", getValue: (p) => p.utiCurrentStatus || "-", line: 2 },
  { key: "utiSpecialties", label: "Especialidades", getValue: (p) => p.utiSpecialties || "-", line: 2 },
  { key: "utiDevices", label: "Dispositivos", getValue: (p) => p.utiDevices || "-", line: 2 },
  { key: "relevantExams", label: "Exames", getValue: (p) => p.relevantExams || "-", line: 2 },
  { key: "utiCulturesAntibiotics", label: "Culturas / ATB", getValue: (p) => p.utiCulturesAntibiotics || "-", line: 2 },
  { key: "pendencies", label: "Programações / Pendências", getValue: (p) => p.pendencies || "-", line: 2 },
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
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function FieldCell({ 
  field, 
  patient, 
  isEditing, 
  editValue, 
  onEditChange,
  onStartEdit,
  onSave,
  onCancel 
}: FieldCellProps) {
  const value = field.getValue(patient);
  const displayValue = formatValue(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const isSpecialField = field.key === "bedNumber" || field.key === "name";
  
  return (
    <div 
      className={cn(
        "flex flex-col py-2 px-3 rounded-md border transition-all duration-200",
        "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/40",
        field.key === "bedNumber" && "flex-shrink-0 w-[70px] bg-primary/5 dark:bg-primary/10 border-primary/20",
        field.key === "name" && "flex-[2] min-w-[150px] bg-slate-100/50 dark:bg-slate-700/30",
        !isSpecialField && "flex-1 min-w-[100px]",
        isEditing && "ring-2 ring-primary/30 bg-white dark:bg-slate-800"
      )}
      onDoubleClick={() => !isEditing && onStartEdit()}
    >
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-0.5">
        {field.label}
      </span>
      
      {isEditing ? (
        <div className="flex flex-col gap-1">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="text-sm bg-transparent border-none outline-none resize-none min-h-[24px] text-foreground"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSave();
              }
              if (e.key === 'Escape') {
                onCancel();
              }
            }}
          />
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={onSave}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <span className={cn(
          "text-sm text-foreground/90 line-clamp-2 cursor-pointer hover:text-foreground transition-colors",
          field.key === "bedNumber" && "text-base font-bold text-primary",
          field.key === "name" && "font-semibold"
        )}>
          {displayValue}
        </span>
      )}
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const line1Fields = fields.filter(f => f.line === 1);
  const line2Fields = fields.filter(f => f.line === 2);

  const handleStartEdit = (fieldKey: string, currentValue: string | string[]) => {
    setEditingField(fieldKey);
    setEditValue(formatValue(currentValue));
  };

  const handleSave = () => {
    if (editingField) {
      const updatedPatient = {
        ...patient,
        [editingField]: editValue === "-" ? "" : editValue
      };
      onUpdate(updatedPatient);
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  return (
    <>
      <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="flex">
          {/* Fixed Actions Column */}
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 border-r border-border/30 bg-slate-50/50 dark:bg-slate-800/20 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Editar paciente"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
          <div className="flex-1 flex flex-col gap-1.5 p-2">
            {/* Line 1 */}
            <div className="flex gap-1.5 flex-wrap">
              {line1Fields.map((field) => (
                <FieldCell 
                  key={field.key} 
                  field={field} 
                  patient={patient}
                  isEditing={editingField === field.key}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => handleStartEdit(field.key, field.getValue(patient))}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ))}
            </div>
            
            {/* Line 2 */}
            <div className="flex gap-1.5 flex-wrap">
              {line2Fields.map((field) => (
                <FieldCell 
                  key={field.key} 
                  field={field} 
                  patient={patient}
                  isEditing={editingField === field.key}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => handleStartEdit(field.key, field.getValue(patient))}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
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