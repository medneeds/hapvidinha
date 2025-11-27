import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalResponsibility, MedicalResponsibilityType } from "@/types/patient";
import { X, Stethoscope, UserCog, UsersRound } from "lucide-react";

interface MedicalResponsibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResponsibility?: MedicalResponsibility;
  onSave: (responsibility: MedicalResponsibility) => void;
  sectorColor: string;
}

export const MedicalResponsibilityDialog = ({
  open,
  onOpenChange,
  currentResponsibility,
  onSave,
  sectorColor,
}: MedicalResponsibilityDialogProps) => {
  const [type, setType] = useState<MedicalResponsibilityType>(
    currentResponsibility?.type || null
  );
  const [officeNumber, setOfficeNumber] = useState(
    currentResponsibility?.officeNumber || ""
  );
  const [leaderNames, setLeaderNames] = useState(
    currentResponsibility?.leaderNames || ""
  );

  const handleSave = () => {
    onSave({
      type,
      officeNumber: type === 'porta' || type === 'conjunto' ? officeNumber : undefined,
      leaderNames: type === 'lider' || type === 'conjunto' ? leaderNames : undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave({
      type: null,
      officeNumber: undefined,
      leaderNames: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2" style={{ color: sectorColor }}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${sectorColor}15` }}
            >
              <UsersRound className="h-5 w-5" style={{ color: sectorColor }} />
            </div>
            Responsabilidade Médica
          </DialogTitle>
          <DialogDescription>
            Configure o tipo de acompanhamento e responsáveis pelo paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label htmlFor="type" className="text-sm font-semibold">Tipo de Acompanhamento</Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setType(null)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  type === null
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                  <X className="h-4 w-4 text-gray-500" />
                </div>
                <span className="font-medium text-sm">Nenhum</span>
              </button>
              
              <button
                type="button"
                onClick={() => setType('porta')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  type === 'porta'
                    ? 'bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={{
                  borderColor: type === 'porta' ? sectorColor : undefined,
                  backgroundColor: type === 'porta' ? `${sectorColor}10` : undefined,
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <Stethoscope className="h-4 w-4" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">Médico Porta</span>
                  <span className="text-xs text-muted-foreground">Paciente sob responsabilidade do consultório</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setType('lider')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  type === 'lider'
                    ? 'bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={{
                  borderColor: type === 'lider' ? sectorColor : undefined,
                  backgroundColor: type === 'lider' ? `${sectorColor}10` : undefined,
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <UserCog className="h-4 w-4" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">Médico Líder</span>
                  <span className="text-xs text-muted-foreground">Líderes assumiram 100% do caso</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setType('conjunto')}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  type === 'conjunto'
                    ? 'bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                style={{
                  borderColor: type === 'conjunto' ? sectorColor : undefined,
                  backgroundColor: type === 'conjunto' ? `${sectorColor}10` : undefined,
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <UsersRound className="h-4 w-4" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">Seguimento Conjunto</span>
                  <span className="text-xs text-muted-foreground">Líder + Porta em conjunto</span>
                </div>
              </button>
            </div>
          </div>

          {(type === 'porta' || type === 'conjunto') && (
            <div className="space-y-2">
              <Label htmlFor="office" className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4" style={{ color: sectorColor }} />
                Número do Consultório
              </Label>
              <Input
                id="office"
                value={officeNumber}
                onChange={(e) => setOfficeNumber(e.target.value)}
                placeholder="Ex: 3, 5A, etc."
                className="border-2"
                style={{ borderColor: `${sectorColor}40` }}
              />
            </div>
          )}

          {(type === 'lider' || type === 'conjunto') && (
            <div className="space-y-2">
              <Label htmlFor="leaders" className="text-sm font-semibold flex items-center gap-2">
                <UserCog className="h-4 w-4" style={{ color: sectorColor }} />
                Nomes dos Médicos Líderes
              </Label>
              <Input
                id="leaders"
                value={leaderNames}
                onChange={(e) => setLeaderNames(e.target.value)}
                placeholder="Ex: Dr. João, Dra. Maria"
                className="border-2"
                style={{ borderColor: `${sectorColor}40` }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} style={{ backgroundColor: sectorColor }}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
