import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MedicalResponsibility, MedicalResponsibilityType } from "@/types/patient";
import { X, Stethoscope, UserCog, UsersRound, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
            <Label className="text-sm font-semibold text-foreground">Selecione o Tipo de Acompanhamento</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType(null)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md",
                  type === null
                    ? 'border-gray-400 bg-gray-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </div>
                <span className="font-semibold text-xs">Nenhum</span>
              </button>
              
              <button
                type="button"
                onClick={() => setType('porta')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md animate-fade-in",
                  type === 'porta' && 'shadow-md'
                )}
                style={{
                  borderColor: type === 'porta' ? sectorColor : '#e5e7eb',
                  backgroundColor: type === 'porta' ? `${sectorColor}10` : '#ffffff',
                }}
              >
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <Stethoscope className="h-5 w-5" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold text-xs">Porta</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">Consultório</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setType('lider')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md animate-fade-in",
                  type === 'lider' && 'shadow-md'
                )}
                style={{
                  borderColor: type === 'lider' ? sectorColor : '#e5e7eb',
                  backgroundColor: type === 'lider' ? `${sectorColor}10` : '#ffffff',
                }}
              >
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <UserCog className="h-5 w-5" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold text-xs">Líder</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">100% do caso</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setType('conjunto')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md animate-fade-in",
                  type === 'conjunto' && 'shadow-md'
                )}
                style={{
                  borderColor: type === 'conjunto' ? sectorColor : '#e5e7eb',
                  backgroundColor: type === 'conjunto' ? `${sectorColor}10` : '#ffffff',
                }}
              >
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: `${sectorColor}20` }}
                >
                  <UsersRound className="h-5 w-5" style={{ color: sectorColor }} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold text-xs">Conjunto</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">Líder + Porta</span>
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

        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            disabled={!type}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-accent transition-all"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="gap-2 shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: sectorColor }}
            >
              <Check className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
