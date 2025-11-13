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
    // Garantir que todos os campos de texto estejam em uppercase
    const uppercaseData = {
      ...formData,
      name: formData.name.toUpperCase(),
      bedNumber: formData.bedNumber.toUpperCase(),
      diagnoses: formData.diagnoses.map(d => d.toUpperCase()),
      medicalHistory: formData.medicalHistory.map(m => m.toUpperCase()),
      relevantExams: formData.relevantExams.map(e => e.toUpperCase()),
      pendencies: formData.pendencies.map(p => p.toUpperCase()),
      schedule: formData.schedule.map(s => s.toUpperCase()),
      admissionHistory: formData.admissionHistory.toUpperCase(),
    };
    onSave(uppercaseData);
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

  const clearAllFields = () => {
    setFormData({
      ...patient,
      name: "",
      age: 0,
      diagnoses: [],
      medicalHistory: [],
      relevantExams: [],
      pendencies: [],
      schedule: [],
      admissionHistory: "",
      admissionDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    });
  };

  const renderArrayField = (
    field: keyof Pick<Patient, "diagnoses" | "medicalHistory" | "relevantExams" | "pendencies" | "schedule">,
    label: string
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addItem(field)}
            className="h-7 px-2 text-xs"
          >
            + Adicionar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => clearField(field)}
            className="h-7 px-2 text-xs"
          >
            Limpar
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        {formData[field].map((item, idx) => (
          <div key={idx} className="flex gap-1.5">
            <Input
              value={item}
              onChange={(e) => updateItem(field, idx, e.target.value.toUpperCase())}
              placeholder={`${label} ${idx + 1}`}
              className="h-9 text-sm uppercase"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeItem(field, idx)}
              className="h-9 w-9 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Editar Paciente - Leito {patient.bedNumber}</DialogTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearAllFields}
            >
              Limpar Tudo
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {/* Informações Básicas em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
            {/* Nome */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Nome</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearField("name")}
                  className="h-6 px-2 text-xs"
                >
                  Limpar
                </Button>
              </div>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="h-9 uppercase"
              />
            </div>

            {/* Idade */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Idade</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setFormData({ ...formData, age: 0 })}
                  className="h-6 px-2 text-xs"
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
                className="h-9"
              />
            </div>

            {/* Leito */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Número do Leito</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearField("bedNumber")}
                  className="h-6 px-2 text-xs"
                >
                  Limpar
                </Button>
              </div>
              <Input
                value={formData.bedNumber}
                onChange={(e) =>
                  setFormData({ ...formData, bedNumber: e.target.value.toUpperCase() })
                }
                className="h-9 uppercase"
              />
            </div>

            {/* Data de Admissão */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Data/Hora de Admissão</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearField("admissionDate")}
                  className="h-6 px-2 text-xs"
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
                className="h-9"
              />
            </div>
          </div>

          {/* Campos de Array em Grid Duplo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Diagnósticos */}
            {renderArrayField("diagnoses", "Hipóteses Diagnósticas")}

            {/* Antecedentes */}
            {renderArrayField("medicalHistory", "Antecedentes Mórbidos")}

            {/* Exames */}
            {renderArrayField("relevantExams", "Exames Relevantes")}

            {/* Pendências */}
            {renderArrayField("pendencies", "Pendências")}
          </div>

          {/* Programação - largura completa */}
          {renderArrayField("schedule", "Programação")}

          {/* História Admissional */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">História Admissional / Anamnese</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearField("admissionHistory")}
                className="h-6 px-2 text-xs"
              >
                Limpar
              </Button>
            </div>
            <Textarea
              value={formData.admissionHistory}
              onChange={(e) =>
                setFormData({ ...formData, admissionHistory: e.target.value.toUpperCase() })
              }
              rows={5}
              className="text-sm resize-none uppercase"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="h-9">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
