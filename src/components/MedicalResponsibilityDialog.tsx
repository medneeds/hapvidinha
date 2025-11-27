import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MedicalResponsibility, MedicalResponsibilityType } from "@/types/patient";
import { X } from "lucide-react";

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle style={{ color: sectorColor }}>
            Responsabilidade Médica
          </DialogTitle>
          <DialogDescription>
            Configure o tipo de acompanhamento e responsáveis pelo paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Acompanhamento</Label>
            <Select
              value={type || "none"}
              onValueChange={(value) =>
                setType(value === "none" ? null : (value as MedicalResponsibilityType))
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="porta">Com a Porta</SelectItem>
                <SelectItem value="lider">Líder 100%</SelectItem>
                <SelectItem value="conjunto">Seguimento Conjunto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === 'porta' || type === 'conjunto') && (
            <div className="space-y-2">
              <Label htmlFor="office">Número do Consultório</Label>
              <Input
                id="office"
                value={officeNumber}
                onChange={(e) => setOfficeNumber(e.target.value)}
                placeholder="Ex: 3, 5A, etc."
              />
            </div>
          )}

          {(type === 'lider' || type === 'conjunto') && (
            <div className="space-y-2">
              <Label htmlFor="leaders">Nomes dos Médicos Líderes</Label>
              <Input
                id="leaders"
                value={leaderNames}
                onChange={(e) => setLeaderNames(e.target.value)}
                placeholder="Ex: Dr. João, Dra. Maria"
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
