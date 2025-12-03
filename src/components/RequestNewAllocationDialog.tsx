import { useState } from "react";
import { Bed, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBedAllocationRequests } from "@/hooks/useBedAllocationRequests";
import { usePatients } from "@/hooks/usePatients";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/types/patient";

interface RequestNewAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSector: "Cuidados Especiais" | "Observação Amarela" | "Observação Azul";
}

const sectorToInternalSector: Record<string, Patient['sector']> = {
  "Cuidados Especiais": "red",
  "Observação Amarela": "yellow",
  "Observação Azul": "blue",
};

export function RequestNewAllocationDialog({
  open,
  onOpenChange,
  targetSector,
}: RequestNewAllocationDialogProps) {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useBedAllocationRequests();
  const { createPatient } = usePatients();
  const { currentDepartment } = useDepartment();
  const { currentHospital, currentState } = useHospital();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do paciente.",
        variant: "destructive",
      });
      return;
    }

    if (!currentHospital || !currentState) {
      toast({
        title: "Erro",
        description: "Hospital ou estado não selecionado.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create a door patient in the "outside" sector
      const sectorPrefix = 'F';
      
      // Get highest bed number for outside sector
      const { data: existingBeds } = await supabase
        .from('patients')
        .select('bed_number')
        .eq('sector', 'outside')
        .eq('department', currentDepartment)
        .eq('hospital_unit_id', currentHospital.id);
      
      const bedNumbers = (existingBeds || [])
        .map(p => parseInt(p.bed_number.substring(1)))
        .filter(n => !isNaN(n));
      
      const maxBedNumber = bedNumbers.length > 0 ? Math.max(...bedNumbers) : 0;
      const newBedNumber = `${sectorPrefix}${String(maxBedNumber + 1).padStart(2, '0')}`;

      // Create the door patient
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          bed_number: newBedNumber,
          name: patientName.toUpperCase(),
          age: patientAge || null,
          sector: 'outside',
          department: currentDepartment,
          state_id: currentState.id,
          hospital_unit_id: currentHospital.id,
          is_door_patient: true,
          allocation_status: 'pending',
          medical_responsibility: { type: 'porta' },
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create the allocation request
      const result = await createRequest(newPatient.id, targetSector);
      
      if (result) {
        toast({
          title: "Solicitação enviada",
          description: `Paciente ${patientName} cadastrado e solicitação de alocação em ${targetSector} enviada ao líder.`,
        });
        onOpenChange(false);
        setPatientName("");
        setPatientAge("");
      }
    } catch (error) {
      console.error('Error creating allocation request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectorColor = () => {
    switch (targetSector) {
      case "Cuidados Especiais": return "text-red-500";
      case "Observação Amarela": return "text-yellow-500";
      case "Observação Azul": return "text-blue-500";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Solicitar Alocação de Leito
          </DialogTitle>
          <DialogDescription>
            Cadastre o paciente e solicite alocação em{" "}
            <span className={`font-semibold ${getSectorColor()}`}>{targetSector}</span>.
            O líder será notificado para aprovar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Nome do Paciente *</Label>
            <Input
              id="patient-name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value.toUpperCase())}
              placeholder="NOME COMPLETO DO PACIENTE"
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-age">Idade (opcional)</Label>
            <Input
              id="patient-age"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="Ex: 45 anos"
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              <strong>Setor solicitado:</strong>{" "}
              <span className={`font-semibold ${getSectorColor()}`}>{targetSector}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O paciente será cadastrado em "Fora das Alas" até a aprovação do líder.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-500">
              💡 Após criar, você pode editar os detalhes do paciente (história, diagnósticos, etc.) na Edição Avançada.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!patientName.trim() || isSubmitting}
            className="bg-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enviando..." : "Criar e Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}