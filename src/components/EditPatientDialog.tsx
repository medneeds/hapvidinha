import { useState } from "react";
import { Patient } from "@/types/patient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EditPatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedPatient: Patient) => void;
}

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
  onSave,
}: EditPatientDialogProps) {
  const [formData, setFormData] = useState(patient);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const addItem = (field: keyof Pick<Patient, "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "schedule">) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const updateItem = (
    field: keyof Pick<Patient, "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "schedule">,
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const removeItem = (
    field: keyof Pick<Patient, "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "schedule">,
    index: number
  ) => {
    const updated = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updated });
  };

  const clearField = (field: keyof Patient) => {
    if (Array.isArray(formData[field])) {
      setFormData({ ...formData, [field]: [] });
    } else if (typeof formData[field] === "string") {
      setFormData({ ...formData, [field]: "" });
    }
  };

  const renderArrayField = (
    field: keyof Pick<Patient, "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "schedule">,
    label: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addItem(field)}
          >
            Adicionar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => clearField(field)}
          >
            Limpar
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {formData[field].map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(field, idx, e.target.value)}
              placeholder={`${label} ${idx + 1}`}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeItem(field, idx)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente - Leito {patient.bedNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nome</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearField("name")}
              >
                Limpar
              </Button>
            </div>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Idade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Idade</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setFormData({ ...formData, age: 0 })}
              >
                Limpar
              </Button>
            </div>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          {/* Leito */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Número do Leito</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearField("bedNumber")}
              >
                Limpar
              </Button>
            </div>
            <Input
              value={formData.bedNumber}
              onChange={(e) =>
                setFormData({ ...formData, bedNumber: e.target.value })
              }
            />
          </div>

          {/* Diagnósticos */}
          {renderArrayField("diagnoses", "Hipóteses Diagnósticas")}

          {/* Antecedentes */}
          {renderArrayField("medicalHistory", "Antecedentes Mórbidos")}

          {/* Exames */}
          {renderArrayField("relevantExams", "Exames Relevantes")}

          {/* Pendências */}
          {renderArrayField("pendencies", "Pendências")}

          {/* Programação */}
          {renderArrayField("schedule", "Programação")}

          {/* História Admissional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>História Admissional / Anamnese</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearField("admissionHistory")}
              >
                Limpar
              </Button>
            </div>
            <Textarea
              value={formData.admissionHistory}
              onChange={(e) =>
                setFormData({ ...formData, admissionHistory: e.target.value })
              }
              rows={6}
            />
          </div>

          {/* Data de Admissão */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Data/Hora de Admissão</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearField("admissionDate")}
              >
                Limpar
              </Button>
            </div>
            <Input
              type="datetime-local"
              value={formData.admissionDate.replace(" ", "T")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  admissionDate: e.target.value.replace("T", " "),
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
