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
  key: keyof Patient;
  label: string;
  isArray: boolean;
  line: 1 | 2;
  minWidth: string;
}

const fields: FieldConfig[] = [
  // Line 1
  { key: "bedNumber", label: "Leito", isArray: false, line: 1, minWidth: "70px" },
  { key: "name", label: "Paciente", isArray: false, line: 1, minWidth: "160px" },
  { key: "utiOriginSector", label: "Setor de Origem", isArray: true, line: 1, minWidth: "120px" },
  { key: "utiAdmissionDate", label: "Admissão UTI", isArray: true, line: 1, minWidth: "110px" },
  { key: "utiDischargePrediction", label: "Previsão de Alta", isArray: true, line: 1, minWidth: "110px" },
  { key: "utiAllergies", label: "Alergias", isArray: true, line: 1, minWidth: "120px" },
  { key: "utiAdmissionReason", label: "Motivo Admissão", isArray: true, line: 1, minWidth: "150px" },
  // Line 2
  { key: "diagnoses", label: "Hipóteses / Diagnósticos", isArray: true, line: 2, minWidth: "180px" },
  { key: "utiCurrentStatus", label: "Quadro Atual", isArray: true, line: 2, minWidth: "150px" },
  { key: "utiSpecialties", label: "Especialidades", isArray: true, line: 2, minWidth: "130px" },
  { key: "utiDevices", label: "Dispositivos", isArray: true, line: 2, minWidth: "130px" },
  { key: "relevantExams", label: "Exames", isArray: true, line: 2, minWidth: "150px" },
  { key: "utiCulturesAntibiotics", label: "Culturas / ATB", isArray: true, line: 2, minWidth: "150px" },
  { key: "pendencies", label: "Programações / Pendências", isArray: true, line: 2, minWidth: "180px" },
];

const getFieldValue = (patient: Patient, key: keyof Patient): string => {
  const value = patient[key];
  if (Array.isArray(value)) {
    return value.filter(v => typeof v === 'string').join("; ");
  }
  return (value as string) || "";
};

const getFieldArray = (patient: Patient, key: keyof Patient): string[] => {
  const value = patient[key];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return value ? [value as string] : [];
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
  const items = field.isArray ? getFieldArray(patient, field.key) : [];
  const singleValue = !field.isArray ? getFieldValue(patient, field.key) : "";
  const hasContent = field.isArray ? items.length > 0 : !!singleValue;
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
        "flex flex-col py-2 px-3 rounded-md border transition-all duration-200 flex-shrink-0",
        "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/40",
        "hover:bg-slate-100/70 dark:hover:bg-slate-700/40 cursor-pointer",
        field.key === "bedNumber" && "bg-primary/5 dark:bg-primary/10 border-primary/20",
        field.key === "name" && "bg-slate-100/50 dark:bg-slate-700/30",
        isEditing && "ring-2 ring-primary/40 bg-white dark:bg-slate-800 shadow-md"
      )}
      style={{ minWidth: field.minWidth, maxWidth: isEditing ? "400px" : "300px" }}
      onClick={() => !isEditing && onStartEdit()}
    >
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1">
        {field.label}
      </span>
      
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="text-sm bg-transparent border border-border/50 rounded px-2 py-1 outline-none resize-none min-h-[60px] text-foreground focus:border-primary/50"
            rows={3}
            placeholder={field.isArray ? "Separe itens com ; (ponto e vírgula)" : "Digite o valor..."}
            onClick={(e) => e.stopPropagation()}
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
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "text-sm text-foreground/90",
          field.key === "bedNumber" && "text-base font-bold text-primary",
          field.key === "name" && "font-semibold"
        )}>
          {!hasContent ? (
            <span className="text-muted-foreground/50">-</span>
          ) : field.isArray && items.length > 0 ? (
            <ul className="space-y-0.5 list-none">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary/70 font-medium text-xs min-w-[16px]">{idx + 1}.</span>
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span>{singleValue}</span>
          )}
        </div>
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
  const [editingField, setEditingField] = useState<keyof Patient | null>(null);
  const [editValue, setEditValue] = useState("");

  const line1Fields = fields.filter(f => f.line === 1);
  const line2Fields = fields.filter(f => f.line === 2);

  const handleStartEdit = (field: FieldConfig) => {
    const currentValue = getFieldValue(patient, field.key);
    setEditingField(field.key);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (editingField) {
      const field = fields.find(f => f.key === editingField);
      if (field) {
        let newValue: string | string[];
        
        if (field.isArray) {
          newValue = editValue
            .split(";")
            .map(item => item.trim())
            .filter(item => item.length > 0);
        } else {
          newValue = editValue;
        }
        
        const updatedPatient = {
          ...patient,
          [editingField]: newValue
        };
        
        onUpdate(updatedPatient);
      }
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
              title="Edição avançada"
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

          {/* Two-line Scrollable Fields Container */}
          <div className="flex-1 flex flex-col gap-1.5 p-2 overflow-hidden">
            {/* Line 1 - Horizontal scroll */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-1">
              <div className="flex gap-1.5" style={{ width: "max-content" }}>
                {line1Fields.map((field) => (
                  <FieldCell 
                    key={field.key} 
                    field={field} 
                    patient={patient}
                    isEditing={editingField === field.key}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onStartEdit={() => handleStartEdit(field)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
            
            {/* Line 2 - Horizontal scroll */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-1">
              <div className="flex gap-1.5" style={{ width: "max-content" }}>
                {line2Fields.map((field) => (
                  <FieldCell 
                    key={field.key} 
                    field={field} 
                    patient={patient}
                    isEditing={editingField === field.key}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onStartEdit={() => handleStartEdit(field)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
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