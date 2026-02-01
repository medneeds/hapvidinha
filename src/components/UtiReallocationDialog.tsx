import { useState, useEffect } from "react";
import { Patient } from "@/types/patient";
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
import { Input } from "@/components/ui/input";
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
import { ArrowRightLeft, BedDouble } from "lucide-react";

interface UtiReallocationDialogProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUtiUnit?: string; // "UTI 1" or "UTI 2"
  allPatients?: Patient[]; // All patients to calculate next bed number
}

export function UtiReallocationDialog({
  patient,
  isOpen,
  onClose,
  onSuccess,
  currentUtiUnit = "UTI 1",
  allPatients = [],
}: UtiReallocationDialogProps) {
  const [targetUnit, setTargetUnit] = useState<string>("");
  const [targetBed, setTargetBed] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentState, currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTargetUnit("");
      setTargetBed("");
    }
  }, [isOpen]);

  // Calculate next available bed number for target unit
  const getNextBedNumber = (unit: string): string => {
    const unitPatients = allPatients.filter(p => {
      // UTI 1 = sector "red", UTI 2 = sector "yellow"
      const patientUnit = p.sector === "red" ? "UTI 1" : p.sector === "yellow" ? "UTI 2" : "";
      return patientUnit === unit && p.id !== patient?.id;
    });
    
    const bedNumbers = unitPatients.map(p => parseInt(p.bedNumber)).filter(n => !isNaN(n));
    const maxBed = bedNumbers.length > 0 ? Math.max(...bedNumbers) : 0;
    return String(maxBed + 1);
  };

  // Auto-calculate next bed number when target unit changes
  useEffect(() => {
    if (targetUnit && targetUnit !== currentUtiUnit) {
      setTargetBed(getNextBedNumber(targetUnit));
    }
  }, [targetUnit]);

  const handleSubmit = async () => {
    if (!patient) return;

    if (!targetUnit) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a unidade de destino.",
        variant: "destructive",
      });
      return;
    }

    if (!targetBed) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número do leito de destino.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!currentHospital || !currentState) {
        throw new Error('Hospital unit and state must be selected');
      }

      // Map unit to sector
      const newSector = targetUnit === "UTI 1" ? "red" : "yellow";
      const isSameUnit = targetUnit === currentUtiUnit;

      // Check if target bed is already occupied
      const existingPatient = allPatients.find(p => {
        const patientUnit = p.sector === "red" ? "UTI 1" : p.sector === "yellow" ? "UTI 2" : "";
        return patientUnit === targetUnit && p.bedNumber === targetBed && p.id !== patient.id;
      });

      if (existingPatient) {
        toast({
          title: "Leito ocupado",
          description: `O leito ${targetBed} já está ocupado por ${existingPatient.name}. Escolha outro leito.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update patient in database
      const { error } = await supabase
        .from('patients')
        .update({
          bed_number: targetBed,
          sector: newSector,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id);

      if (error) throw error;

      // Register movement if changing between UTI units
      if (!isSameUnit) {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase
          .from('patient_movements')
          .insert({
            patient_name: patient.name,
            patient_bed: patient.bedNumber,
            patient_sector: patient.sector,
            movement_type: 'TRANSFERÊNCIA',
            destination: targetUnit,
            notes: `Realocação de ${currentUtiUnit} Leito ${patient.bedNumber} para ${targetUnit} Leito ${targetBed}`,
            created_by: user?.id,
            patient_snapshot: patient as any,
            department: currentDepartment,
            state_id: currentState.id,
            hospital_unit_id: currentHospital.id,
          });
      }

      toast({
        title: isSameUnit ? "Paciente realocado" : "Paciente transferido",
        description: isSameUnit 
          ? `Paciente realocado para o leito ${targetBed}.`
          : `Paciente transferido para ${targetUnit}, leito ${targetBed}.`,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error reallocating patient:', error);
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
    setTargetUnit("");
    setTargetBed("");
    onClose();
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-xl">Realocar Paciente</DialogTitle>
          </div>
          <DialogDescription>
            Realoque o paciente para outro leito ou unidade de UTI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Paciente</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentUtiUnit} • Leito: {patient.bedNumber}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUnit">Unidade de Destino *</Label>
            <Select value={targetUnit} onValueChange={setTargetUnit}>
              <SelectTrigger id="targetUnit">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTI 1">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-blue-500" />
                    <span>UTI Unidade 1</span>
                  </div>
                </SelectItem>
                <SelectItem value="UTI 2">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-amber-500" />
                    <span>UTI Unidade 2</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetBed">Leito de Destino *</Label>
            <Input
              id="targetBed"
              type="text"
              placeholder="Número do leito"
              value={targetBed}
              onChange={(e) => setTargetBed(e.target.value.toUpperCase())}
            />
            {targetUnit && (
              <p className="text-xs text-muted-foreground">
                Próximo leito disponível sugerido: {getNextBedNumber(targetUnit)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Realocando..." : "Confirmar Realocação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
