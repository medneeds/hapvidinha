import { useState } from "react";
import { Patient } from "@/types/patient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Utensils, Printer, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableDietDocument } from "./PrintableDietDocument";

interface DietReleaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

const DIET_TYPES = [
  "Livre",
  "Branda", 
  "Pastosa",
  "Liquidificada",
  "Líquida",
  "Leve",
  "Semi-líquida",
  "Zero",
];

const RESTRICTIONS = [
  { id: "hipossodica", label: "Hipossódica (Hipertensão)" },
  { id: "diabetica", label: "Diabética (DM)" },
  { id: "renal", label: "Renal (DRC)" },
  { id: "hipogordurosa", label: "Hipogordurosa" },
  { id: "hipoproteica", label: "Hipoproteica" },
  { id: "sem_residuo", label: "Sem Resíduo" },
];

export function DietReleaseDialog({ isOpen, onClose, patient }: DietReleaseDialogProps) {
  const [dietRoute, setDietRoute] = useState<"oral" | "enteral">("oral");
  const [selectedDietType, setSelectedDietType] = useState<string>("");
  const [customDietType, setCustomDietType] = useState("");
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [customRestriction, setCustomRestriction] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [crm, setCrm] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleRestrictionChange = (restrictionId: string, checked: boolean) => {
    if (checked) {
      setSelectedRestrictions([...selectedRestrictions, restrictionId]);
    } else {
      setSelectedRestrictions(selectedRestrictions.filter(r => r !== restrictionId));
    }
  };

  const getSelectedRestrictionsLabels = () => {
    const labels = selectedRestrictions.map(id => {
      const restriction = RESTRICTIONS.find(r => r.id === id);
      return restriction?.label || id;
    });
    if (customRestriction.trim()) {
      labels.push(customRestriction.trim());
    }
    return labels;
  };

  const getDietTypeDisplay = () => {
    if (customDietType.trim()) {
      return selectedDietType ? `${selectedDietType} + ${customDietType}` : customDietType;
    }
    return selectedDietType;
  };

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleClose = () => {
    setShowPreview(false);
    setDietRoute("oral");
    setSelectedDietType("");
    setCustomDietType("");
    setSelectedRestrictions([]);
    setCustomRestriction("");
    setBirthDate("");
    setDoctorName("");
    setCrm("");
    onClose();
  };

  const isFormValid = selectedDietType || customDietType.trim();

  if (showPreview) {
    return (
      <PrintableDietDocument
        patient={patient}
        dietRoute={dietRoute}
        dietType={getDietTypeDisplay()}
        restrictions={getSelectedRestrictionsLabels()}
        birthDate={birthDate}
        doctorName={doctorName}
        crm={crm}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-primary" />
            Liberar Dieta - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seção 1: Via da Dieta */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Via da Dieta
            </Label>
            <RadioGroup
              value={dietRoute}
              onValueChange={(value) => setDietRoute(value as "oral" | "enteral")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oral" id="oral" />
                <Label htmlFor="oral" className="cursor-pointer">Oral</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enteral" id="enteral" />
                <Label htmlFor="enteral" className="cursor-pointer">Enteral</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seção 2: Tipo de Dieta */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              Tipo de Dieta
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIET_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={selectedDietType === type ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 text-xs",
                    selectedDietType === type && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedDietType(selectedDietType === type ? "" : type)}
                >
                  {type}
                </Button>
              ))}
            </div>
            <div className="mt-2">
              <Input
                placeholder="Outro tipo / Especificações adicionais..."
                value={customDietType}
                onChange={(e) => setCustomDietType(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Seção 3: Restrições/Comorbidades */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Restrições / Comorbidades
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {RESTRICTIONS.map((restriction) => (
                <div key={restriction.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={restriction.id}
                    checked={selectedRestrictions.includes(restriction.id)}
                    onCheckedChange={(checked) => handleRestrictionChange(restriction.id, !!checked)}
                  />
                  <Label htmlFor={restriction.id} className="text-sm cursor-pointer">
                    {restriction.label}
                  </Label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Outras restrições ou observações..."
              value={customRestriction}
              onChange={(e) => setCustomRestriction(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>

          {/* Seção 4: Dados do Paciente */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Data de Nascimento
            </Label>
            <Input
              placeholder="DD/MM/AAAA"
              value={birthDate}
              onChange={(e) => setBirthDate(formatDateInput(e.target.value))}
              maxLength={10}
              className="text-sm max-w-[200px]"
            />
          </div>

          {/* Seção 5: Médico Responsável */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
              Médico Responsável
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  placeholder="Dr(a). Nome Completo"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CRM</Label>
                <Input
                  placeholder="CRM-MA 00000"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!isFormValid}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!isFormValid}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
