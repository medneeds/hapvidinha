import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { RotateCcw } from "lucide-react";
import { getNextBedNumber } from "@/utils/bedNaming";

interface PatientMovement {
  id: string;
  patient_name: string;
  patient_bed: string | null;
  patient_sector: string | null;
  movement_type: string;
  destination: string | null;
  notes: string | null;
  responsible_doctor: string | null;
  created_at: string;
  patient_snapshot: any;
}

interface ReallocateFromHistoryDialogProps {
  movement: PatientMovement | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const sectorOptions = [
  { value: "red", label: "Sala de Cuidados Especiais (Vermelha)" },
  { value: "yellow", label: "Observação Amarela" },
  { value: "blue", label: "Observação Azul" },
];

const sectorLabels: Record<string, string> = {
  red: "Sala de Cuidados Especiais",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
};

export function ReallocateFromHistoryDialog({
  movement,
  isOpen,
  onClose,
  onSuccess,
}: ReallocateFromHistoryDialogProps) {
  const [selectedSector, setSelectedSector] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentState, currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();

  const handleSubmit = async () => {
    if (!movement?.patient_snapshot || !selectedSector) {
      toast({
        title: "Selecione o setor",
        description: "Escolha o setor de destino para a realocação.",
        variant: "destructive",
      });
      return;
    }

    if (!currentHospital || !currentState) {
      toast({
        title: "Erro",
        description: "Hospital e estado devem estar selecionados.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const snapshot = movement.patient_snapshot;

      // Look for an existing vacant bed in the target sector to prioritize
      const { data: existingPatients } = await supabase
        .from("patients")
        .select("id, bed_number, is_vacant")
        .eq("sector", selectedSector)
        .eq("department", currentDepartment)
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id);

      const occupiedBedNumbers: string[] = [];
      const vacantBeds: { id: string; bed_number: string }[] = [];
      (existingPatients || []).forEach((p: any) => {
        if (p.is_vacant) {
          vacantBeds.push({ id: p.id, bed_number: p.bed_number });
        } else {
          occupiedBedNumbers.push(p.bed_number);
        }
      });

      // Prefer the lowest-numbered vacant regular bed; otherwise let getNextBedNumber pick
      // the next regular slot or an EXTRA bed if regular capacity is full.
      const sortedVacant = [...vacantBeds].sort((a, b) =>
        a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true })
      );
      const vacantTarget = sortedVacant[0];

      const finalBed = vacantTarget
        ? vacantTarget.bed_number
        : getNextBedNumber(selectedSector, occupiedBedNumbers, currentDepartment);

      // If reusing a vacant slot, remove the vacant placeholder row first
      if (vacantTarget) {
        const { error: deleteVacantError } = await supabase
          .from("patients")
          .delete()
          .eq("id", vacantTarget.id);
        if (deleteVacantError) throw deleteVacantError;
      }

      const { error: insertError } = await supabase.from("patients").insert({
        name: snapshot.name || movement.patient_name,
        age: snapshot.age || null,
        bed_number: finalBed,
        sector: selectedSector,
        diagnoses: snapshot.diagnoses?.join("\n") || null,
        medical_history: snapshot.medicalHistory?.join("\n") || null,
        relevant_exams: snapshot.relevantExams?.join("\n") || null,
        pendencies: snapshot.pendencies?.join("\n") || null,
        highlighted_pendencies: snapshot.highlightedPendencies || [],
        highlighted_diagnoses: snapshot.highlightedDiagnoses || [],
        highlighted_medical_history: snapshot.highlightedMedicalHistory || [],
        highlighted_conducts: snapshot.highlightedConducts || [],
        schedule: snapshot.schedule?.join("\n") || null,
        admission_history: snapshot.admissionHistory || null,
        admission_date: snapshot.admissionDate || new Date().toISOString(),
        department: currentDepartment,
        state_id: currentState.id,
        hospital_unit_id: currentHospital.id,
        medical_responsibility: snapshot.medicalResponsibility || null,
        is_vacant: false,
      });

      if (insertError) throw insertError;

      toast({
        title: "Paciente realocado com sucesso",
        description: `${snapshot.name || movement.patient_name} foi realocado para ${sectorLabels[selectedSector]} (Leito ${finalBed}).`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error reallocating patient:", error);
      toast({
        title: "Erro ao realocar paciente",
        description: "Não foi possível realocar o paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSector("");
    onClose();
  };

  if (!movement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Realocar Paciente</DialogTitle>
          </div>
          <DialogDescription>
            Selecione o setor de destino para realocar o paciente de volta às alas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Paciente</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium uppercase">{movement.patient_name}</p>
              <p className="text-sm text-muted-foreground">
                {movement.patient_bed && `Leito anterior: ${movement.patient_bed}`}
                {movement.patient_sector && ` • Setor anterior: ${movement.patient_sector}`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-sector">Setor de Destino *</Label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger id="target-sector">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectorOptions.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedSector}>
            {isSubmitting ? "Realocando..." : "Confirmar Realocação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
