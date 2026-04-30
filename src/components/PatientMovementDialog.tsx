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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { TrendingUp, Skull, ArrowLeftRight } from "lucide-react";
import { usePalliativeFarewell } from "@/contexts/PalliativeFarewellContext";

interface PatientMovementDialogProps {
  patient: Patient | null;
  movementType: "ALTA" | "ÓBITO" | "TRANSFERÊNCIA" | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

const movementConfig = {
  ALTA: {
    title: "Registrar Alta",
    description: "Registre a alta do paciente do serviço de emergência",
    icon: TrendingUp,
    color: "text-green-600",
    showDestination: false,
  },
  ÓBITO: {
    title: "Registrar Óbito",
    description: "Registre o óbito do paciente",
    icon: Skull,
    color: "text-red-600",
    showDestination: false,
  },
  TRANSFERÊNCIA: {
    title: "Registrar Transferência",
    description: "Registre a transferência do paciente para outro setor",
    icon: ArrowLeftRight,
    color: "text-blue-600",
    showDestination: true,
  },
};

const transferDestinations = [
  "UTI",
  "UTI NEONATAL",
  "UTI PEDIÁTRICA",
  "ENFERMARIA",
  "ENFERMARIA PEDIÁTRICA",
  "HEMODINÂMICA",
  "CENTRO CIRÚRGICO",
  "INSTITUTO VOLTA VIDA (IVV)",
  "PSIQUIATRIA (INSTITUTO VOLTA VIDA)",
  "OUTRO HOSPITAL",
];

export function PatientMovementDialog({
  patient,
  movementType,
  isOpen,
  onClose,
  onSuccess,
}: PatientMovementDialogProps) {
  const [destination, setDestination] = useState("");
  const [customDestination, setCustomDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [responsibleDoctor, setResponsibleDoctor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<{ id: string; full_name: string }[]>([]);
  const { toast } = useToast();
  const { triggerFarewell } = usePalliativeFarewell();
  const { currentState, currentHospital } = useHospital();

  useEffect(() => {
    if (isOpen) {
      const fetchDoctors = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .not('full_name', 'is', null)
          .order('full_name');
        if (data) {
          setDoctors(data.filter(d => d.full_name && d.full_name.trim() !== ''));
        }
      };
      fetchDoctors();
    }
  }, [isOpen]);

  const config = movementType ? movementConfig[movementType] : null;
  const Icon = config?.icon;

  const handleSubmit = async () => {
    if (!patient || !movementType) return;

    if (movementType === "TRANSFERÊNCIA" && !destination && !customDestination) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione ou especifique o destino da transferência.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!currentHospital || !currentState) {
        throw new Error('Hospital unit and state must be selected');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const finalDestination = destination === "OUTRO" ? customDestination : destination;

      // Get patient's department from the patient object
      const patientDepartment = (patient as any).department || 'URGÊNCIA E EMERGÊNCIA ADULTO';

      const { data: movementData, error } = await supabase
        .from('patient_movements')
        .insert({
          patient_name: patient.name,
          patient_bed: patient.bedNumber,
          patient_sector: patient.sector,
          movement_type: movementType,
          destination: finalDestination || null,
          notes: notes || null,
          responsible_doctor: responsibleDoctor || null,
          created_by: user?.id,
          patient_snapshot: patient as any,
          department: patientDepartment,
          state_id: currentState.id,
          hospital_unit_id: currentHospital.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: `${config?.title} realizado com sucesso`,
        description: `${movementType.toLowerCase()} registrado(a) no histórico.`,
      });

      // 1) Trigger the palliative farewell overlay FIRST, while we still hold
      //    the patient reference and BEFORE onSuccess unmounts the card.
      //    The overlay lives in the global provider, so it survives unmount.
      const isPalliative = (patient as any).clinicalStatus === 'paliativado';
      const isPalliativeByPendency = patient.pendencies?.some((pendency) =>
        pendency.toUpperCase().includes('CUIDADOS PALIATIVOS')
      );
      const shouldTriggerFarewell = movementType === 'ÓBITO' && (isPalliative || isPalliativeByPendency);
      console.log('[FAREWELL] death movement saved', {
        patientName: patient.name,
        bed: patient.bedNumber,
        sector: patient.sector,
        movementType,
        clinicalStatus: (patient as any).clinicalStatus,
        isPalliative,
        isPalliativeByPendency,
        willTriggerOverlay: shouldTriggerFarewell,
        movementId: movementData?.id ?? null,
        timestamp: new Date().toISOString(),
      });
      if (shouldTriggerFarewell) {
        console.log('[FAREWELL] calling triggerFarewell()', { patientName: patient.name });
        try {
          triggerFarewell(patient.name);
        } catch (e) {
          console.error('[FAREWELL] triggerFarewell threw', e);
        }
      }

      // 2) Create the post-death review record (best-effort — must not block
      //    the rest of the flow if the table/policy fails for any reason).
      if (movementType === "ÓBITO") {
        try {
          const { data: existingReview, error: lookupError } = await supabase
            .from('death_reviews' as any)
            .select('id')
            .eq('state_id', currentState.id)
            .eq('hospital_unit_id', currentHospital.id)
            .eq('department', patientDepartment)
            .eq('patient_bed', patient.bedNumber)
            .is('completed_at', null)
            .maybeSingle();

          if (lookupError) {
            console.error('[DEATH_REVIEW] lookup failed before insert (non-blocking)', lookupError);
          } else if ((existingReview as any)?.id) {
            console.log('[DEATH_REVIEW] pending review already exists — skipping duplicate insert', {
              reviewId: (existingReview as any).id,
              bed: patient.bedNumber,
            });
          } else {
            const { error: reviewError } = await supabase
              .from('death_reviews' as any)
            .insert({
              patient_movement_id: movementData?.id ?? null,
              patient_name: patient.name,
              patient_bed: patient.bedNumber,
              patient_sector: patient.sector,
              department: patientDepartment,
              state_id: currentState.id,
              hospital_unit_id: currentHospital.id,
              created_by: user?.id,
            });
            if (reviewError) {
              console.error('[DEATH_REVIEW] insert failed (non-blocking)', reviewError);
            }
          }
        } catch (e) {
          console.error('[DEATH_REVIEW] insert threw (non-blocking)', e);
        }
      }

      // 3) Notify parent + close dialog. Keep the parent cleanup asynchronous
      //    so the dialog can close before an emergency card is deleted/unmounted.
      const successResult = onSuccess?.();
      handleClose();
      if (successResult && typeof (successResult as Promise<void>).catch === "function") {
        void (successResult as Promise<void>).catch((e) => {
          console.error('[MOVEMENT] post-success cleanup failed', e);
        });
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      toast({
        title: "Erro ao registrar movimentação",
        description: "Não foi possível registrar a movimentação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDestination("");
    setCustomDestination("");
    setNotes("");
    setResponsibleDoctor("");
    onClose();
  };

  if (!config || !patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className={`h-6 w-6 ${config.color}`} />}
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Paciente</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                Leito: {patient.bedNumber} • Setor: {patient.sector}
              </p>
            </div>
          </div>

          {config.showDestination && (
            <div className="space-y-2">
              <Label htmlFor="destination">Destino da Transferência *</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {transferDestinations.map((dest) => (
                    <SelectItem key={dest} value={dest}>
                      {dest}
                    </SelectItem>
                  ))}
                  <SelectItem value="OUTRO">OUTRO (especificar)</SelectItem>
                </SelectContent>
              </Select>
              {destination === "OUTRO" && (
                <Input
                  placeholder="Especifique o destino"
                  value={customDestination}
                  onChange={(e) => setCustomDestination(e.target.value.toUpperCase())}
                  className="mt-2"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="responsibleDoctor">Médico Responsável</Label>
            <Select value={responsibleDoctor} onValueChange={setResponsibleDoctor}>
              <SelectTrigger id="responsibleDoctor">
                <SelectValue placeholder="Selecione o médico responsável (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.full_name!}>
                    {doctor.full_name!.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre esta movimentação (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value.toUpperCase())}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
