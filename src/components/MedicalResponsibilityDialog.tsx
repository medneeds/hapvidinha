import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MedicalResponsibility, MedicalResponsibilityType, PatientCategory } from "@/types/patient";
import { X, Stethoscope, UserCog, UsersRound, Check, Baby, Bone, Scissors, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalResponsibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResponsibility?: MedicalResponsibility;
  onSave: (responsibility: MedicalResponsibility, suggestedCategory?: PatientCategory) => void;
  sectorColor: string;
}

const CONJUNTO_OPTIONS = [
  { id: 'porta', label: 'Porta', icon: Stethoscope },
  { id: 'lider', label: 'Líder', icon: UserCog },
  { id: 'obstetra', label: 'Obstetra', icon: Baby },
  { id: 'cirurgiao_geral', label: 'Cirurgião Geral', icon: Scissors },
  { id: 'traumatologista', label: 'Traumatologista', icon: Bone },
] as const;

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
  const [portaNames, setPortaNames] = useState(
    currentResponsibility?.portaNames || ""
  );
  const [conjuntoWith, setConjuntoWith] = useState<string[]>(
    currentResponsibility?.conjuntoWith || []
  );
  const [conjuntoFreeText, setConjuntoFreeText] = useState(
    currentResponsibility?.conjuntoFreeText || ""
  );

  useEffect(() => {
    if (open) {
      setType(currentResponsibility?.type || null);
      setOfficeNumber(currentResponsibility?.officeNumber || "");
      setLeaderNames(currentResponsibility?.leaderNames || "");
      setPortaNames(currentResponsibility?.portaNames || "");
      setConjuntoWith(currentResponsibility?.conjuntoWith || []);
      setConjuntoFreeText(currentResponsibility?.conjuntoFreeText || "");
    }
  }, [open, currentResponsibility]);

  const getSuggestedCategory = (): PatientCategory => {
    const allInvolved = [type, ...conjuntoWith];
    if (allInvolved.includes('obstetra')) return 'clinica_medica';
    if (allInvolved.includes('traumatologista')) return 'cirurgico';
    if (allInvolved.includes('cirurgiao_geral')) return 'cirurgico';
    return null;
  };

  const handleSave = () => {
    const responsibility: MedicalResponsibility = {
      type,
      officeNumber: type === 'porta' || type === 'conjunto' || type === 'obstetra' || type === 'cirurgiao_geral' || type === 'traumatologista' ? officeNumber : undefined,
      leaderNames: type === 'lider' || type === 'conjunto' ? leaderNames : undefined,
      portaNames: type === 'porta' || type === 'conjunto' || type === 'obstetra' || type === 'cirurgiao_geral' || type === 'traumatologista' ? portaNames : undefined,
      conjuntoWith: type === 'conjunto' ? conjuntoWith : undefined,
      conjuntoFreeText: type === 'conjunto' && conjuntoFreeText ? conjuntoFreeText : undefined,
    };
    onSave(responsibility, getSuggestedCategory());
    onOpenChange(false);
  };

  const handleClear = () => {
    setType(null);
    setOfficeNumber("");
    setLeaderNames("");
    setPortaNames("");
    setConjuntoWith([]);
    setConjuntoFreeText("");
  };

  const toggleConjuntoOption = (optionId: string) => {
    setConjuntoWith(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const suggestedCategory = getSuggestedCategory();

  const categoryLabels: Record<string, { label: string; emoji: string }> = {
    clinico: { label: 'Clínico', emoji: '🩺' },
    cirurgico: { label: 'Cirúrgico', emoji: '🔪' },
    obstetrico: { label: 'Obstétrico', emoji: '🤰' },
    trauma: { label: 'Trauma', emoji: '🦴' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-background dark:bg-gray-900 border-2 dark:border-gray-700 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 dark:text-white" style={{ color: sectorColor }}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: `${sectorColor}20` }}
            >
              <UsersRound className="h-5 w-5" style={{ color: sectorColor }} />
            </div>
            Responsabilidade Médica
          </DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            Configure o tipo de acompanhamento e responsáveis pelo paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground dark:text-white">Selecione o Tipo de Acompanhamento</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Nenhum */}
              <button
                type="button"
                onClick={() => setType(null)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md dark:hover:shadow-gray-700/50",
                  type === null
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-500 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700">
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </div>
                <span className="font-semibold text-xs dark:text-white">Nenhum</span>
              </button>
              
              {/* Porta */}
              {renderTypeButton('porta', 'Porta', 'Consultório', Stethoscope, type, setType, sectorColor)}
              {/* Líder */}
              {renderTypeButton('lider', 'Líder', '100% do caso', UserCog, type, setType, sectorColor)}
              {/* Conjunto */}
              {renderTypeButton('conjunto', 'Conjunto', 'Multi-seguimento', UsersRound, type, setType, sectorColor)}
              {/* Obstetra */}
              {renderTypeButton('obstetra', 'Obstetra', 'Especialista', Baby, type, setType, sectorColor)}
              {/* Cirurgião */}
              {renderTypeButton('cirurgiao_geral', 'Cirurgião', 'Geral', Scissors, type, setType, sectorColor)}
              {/* Traumato */}
              {renderTypeButton('traumatologista', 'Traumato', 'Ortopedista', Bone, type, setType, sectorColor)}
            </div>
          </div>

          {/* Conjunto: multi-seleção de especialidades */}
          {type === 'conjunto' && (
            <div className="space-y-3 p-3 rounded-lg border-2 dark:border-gray-700" style={{ borderColor: `${sectorColor}30`, backgroundColor: `${sectorColor}05` }}>
              <Label className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                <UsersRound className="h-4 w-4" style={{ color: sectorColor }} />
                Seguimento Conjunto Com:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {CONJUNTO_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isChecked = conjuntoWith.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleConjuntoOption(option.id)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left",
                        isChecked
                          ? 'shadow-sm dark:shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300'
                      )}
                      style={{
                        borderColor: isChecked ? sectorColor : undefined,
                        backgroundColor: isChecked ? `${sectorColor}15` : undefined,
                      }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isChecked ? "border-transparent" : "border-gray-300 dark:border-gray-600"
                      )}
                        style={{ backgroundColor: isChecked ? sectorColor : undefined }}
                      >
                        {isChecked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: isChecked ? sectorColor : undefined }} />
                      <span className={cn("text-xs font-medium dark:text-white", isChecked && "font-semibold")}>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground dark:text-gray-400">Outras especialidades (campo livre)</Label>
                <Input
                  value={conjuntoFreeText}
                  onChange={(e) => setConjuntoFreeText(e.target.value)}
                  placeholder="Ex: Nefrologia, Neurologia, Cardiologia..."
                  className="text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              {suggestedCategory && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 border border-border/50">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Sugestão de categoria: <strong>{categoryLabels[suggestedCategory].emoji} {categoryLabels[suggestedCategory].label}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {(type === 'porta' || type === 'conjunto' || type === 'obstetra' || type === 'cirurgiao_geral' || type === 'traumatologista') && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="office" className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                  <Stethoscope className="h-4 w-4" style={{ color: sectorColor }} />
                  Número do Consultório
                </Label>
                <Input
                  id="office"
                  value={officeNumber}
                  onChange={(e) => setOfficeNumber(e.target.value)}
                  placeholder="Ex: 3, 5A, etc."
                  className="border-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  style={{ borderColor: `${sectorColor}40` }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portaNames" className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                  <Stethoscope className="h-4 w-4" style={{ color: sectorColor }} />
                  {type === 'porta' || type === 'conjunto' ? 'Nomes dos Médicos Porta' : 'Nomes dos Médicos Especialistas'}
                </Label>
                <Input
                  id="portaNames"
                  value={portaNames}
                  onChange={(e) => setPortaNames(e.target.value)}
                  placeholder="Ex: Dr. Carlos, Dra. Ana"
                  className="border-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  style={{ borderColor: `${sectorColor}40` }}
                />
              </div>
            </div>
          )}

          {(type === 'lider' || type === 'conjunto') && (
            <div className="space-y-2">
              <Label htmlFor="leaders" className="text-sm font-semibold flex items-center gap-2 dark:text-white">
                <UserCog className="h-4 w-4" style={{ color: sectorColor }} />
                Nomes dos Médicos Líderes
              </Label>
              <Input
                id="leaders"
                value={leaderNames}
                onChange={(e) => setLeaderNames(e.target.value)}
                placeholder="Ex: Dr. João, Dra. Maria"
                className="border-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                style={{ borderColor: `${sectorColor}40` }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 dark:border-gray-600 dark:hover:bg-destructive/20 dark:text-white transition-all"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-accent dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white transition-all"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="gap-2 shadow-sm hover:shadow-md transition-all text-white dark:shadow-lg"
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

function renderTypeButton(
  typeValue: MedicalResponsibilityType,
  label: string,
  subtitle: string,
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
  currentType: MedicalResponsibilityType,
  setType: (t: MedicalResponsibilityType) => void,
  sectorColor: string
) {
  const isSelected = currentType === typeValue;
  return (
    <button
      type="button"
      onClick={() => setType(typeValue)}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md dark:hover:shadow-lg animate-fade-in",
        isSelected && 'shadow-md dark:shadow-lg',
        !isSelected && 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
      )}
      style={{
        borderColor: isSelected ? sectorColor : undefined,
        backgroundColor: isSelected ? `${sectorColor}20` : undefined,
      }}
    >
      <div 
        className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-110"
        style={{ backgroundColor: `${sectorColor}25` }}
      >
        <Icon className="h-5 w-5" style={{ color: sectorColor }} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-semibold text-xs dark:text-white">{label}</span>
        <span className="text-[10px] text-muted-foreground dark:text-gray-400 text-center leading-tight">{subtitle}</span>
      </div>
    </button>
  );
}
