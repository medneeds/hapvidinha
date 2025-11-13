import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Patient } from "@/types/patient";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegisterHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
}

export function RegisterHandoverDialog({ open, onOpenChange, patients }: RegisterHandoverDialogProps) {
  const [notes, setNotes] = useState("");
  const [shiftType, setShiftType] = useState<string>("DIURNO");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const occupiedBeds = patients.filter(p => p.name.trim() !== "").length;
  const totalPatients = patients.length;

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para registrar uma passagem",
          variant: "destructive",
        });
        return;
      }

      const snapshotData = {
        timestamp: new Date().toISOString(),
        patients: patients.map(p => ({
          id: p.id,
          bedNumber: p.bedNumber,
          name: p.name,
          age: p.age,
          sector: p.sector,
          diagnoses: p.diagnoses,
          medicalHistory: p.medicalHistory,
          relevantExams: p.relevantExams,
          pendencies: p.pendencies,
          schedule: p.schedule,
          admissionHistory: p.admissionHistory,
          admissionDate: p.admissionDate,
        })),
        sectors: {
          red: patients.filter(p => p.sector === 'red').length,
          yellow: patients.filter(p => p.sector === 'yellow').length,
          blue: patients.filter(p => p.sector === 'blue').length,
          outside: patients.filter(p => p.sector === 'outside').length,
        }
      };

      const { error } = await (supabase as any)
        .from('shift_handovers')
        .insert({
          created_by: user.id,
          snapshot_data: snapshotData,
          notes: notes.trim() || null,
          total_patients: totalPatients,
          occupied_beds: occupiedBeds,
          shift_type: shiftType,
        });

      if (error) throw error;

      toast({
        title: "Passagem registrada!",
        description: `Registro salvo com sucesso às ${new Date().toLocaleTimeString('pt-BR')}`,
      });

      setNotes("");
      setShiftType("DIURNO");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar passagem:", error);
      toast({
        title: "Erro ao registrar passagem",
        description: "Não foi possível salvar o registro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            REGISTRAR PASSAGEM DE PLANTÃO
          </DialogTitle>
          <DialogDescription>
            Salve um snapshot do estado atual dos pacientes para consulta histórica
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground uppercase">Leitos Ocupados</p>
              <p className="text-2xl font-bold text-foreground">{occupiedBeds}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase">Total de Leitos</p>
              <p className="text-2xl font-bold text-foreground">{totalPatients}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-type" className="uppercase text-xs font-semibold">
              Tipo de Plantão
            </Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger id="shift-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIURNO">DIURNO</SelectItem>
                <SelectItem value="NOTURNO">NOTURNO</SelectItem>
                <SelectItem value="OUTRO">OUTRO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="uppercase text-xs font-semibold">
              Observações (Opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.toUpperCase())}
              placeholder="ADICIONE OBSERVAÇÕES SOBRE ESTA PASSAGEM..."
              className="min-h-[100px] resize-none uppercase"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            CANCELAR
          </Button>
          <Button
            onClick={handleRegister}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                REGISTRANDO...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4" />
                REGISTRAR PASSAGEM
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
