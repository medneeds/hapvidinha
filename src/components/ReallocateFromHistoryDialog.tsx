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
import { RotateCcw, ArrowRight } from "lucide-react";
import { BedSelectionDialog } from "@/components/BedSelectionDialog";
import { buildPatientSlotPayloadFromSnapshot } from "@/utils/patientSlotPayload";
import type { Patient, SectorType } from "@/types/patient";
import type { Database } from "@/integrations/supabase/types";

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

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
  patient_snapshot: Partial<Patient> | null;
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
  const [selectedSector, setSelectedSector] = useState<SectorType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bedPickerOpen, setBedPickerOpen] = useState(false);
  const { toast } = useToast();
  const { currentState, currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();

  const handleProceedToBedPick = () => {
    if (!selectedSector) {
      toast({
        title: "Selecione o setor",
        description: "Escolha o setor de destino antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setBedPickerOpen(true);
  };

  const handleConfirmBed = async (bedNumber: string, vacantPlaceholderId?: string) => {
    if (!movement?.patient_snapshot || !selectedSector) return;
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

      if (vacantPlaceholderId) {
        const { error: fillVacantError } = await supabase
          .from("patients")
          .update(buildPatientSlotPayloadFromSnapshot(snapshot, movement.patient_name, selectedSector))
          .eq("id", vacantPlaceholderId);
        if (fillVacantError) throw fillVacantError;
      } else {
        const insertPayload: PatientInsert = {
          bed_number: bedNumber,
          sector: selectedSector,
          department: currentDepartment,
          state_id: currentState.id,
          hospital_unit_id: currentHospital.id,
          ...buildPatientSlotPayloadFromSnapshot(snapshot, movement.patient_name, selectedSector),
        };
        const { error: insertError } = await supabase.from("patients").insert(insertPayload);
        if (insertError) throw insertError;
      }

      toast({
        title: "Paciente realocado com sucesso",
        description: `${snapshot.name || movement.patient_name} foi realocado para ${sectorLabels[selectedSector]} (Leito ${bedNumber}).`,
      });

      setBedPickerOpen(false);
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
    setBedPickerOpen(false);
    onClose();
  };

  if (!movement) return null;

  return (
    <>
      <Dialog open={isOpen && !bedPickerOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <RotateCcw className="h-6 w-6 text-primary" />
              <DialogTitle className="text-xl">Realocar Paciente</DialogTitle>
            </div>
            <DialogDescription>
              Selecione o setor de destino. No próximo passo você escolherá o leito específico.
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
            <Button onClick={handleProceedToBedPick} disabled={isSubmitting || !selectedSector}>
              Escolher Leito <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedSector && (
        <BedSelectionDialog
          open={bedPickerOpen}
          onOpenChange={(o) => {
            setBedPickerOpen(o);
            // If user dismissed bed picker, keep dialog open to allow re-pick
          }}
          sector={selectedSector}
          title="Realocar — Escolher Leito"
          description={`Selecione o leito em ${sectorLabels[selectedSector]}.`}
          patientName={movement.patient_name}
          onSelect={handleConfirmBed}
        />
      )}
    </>
  );
}
