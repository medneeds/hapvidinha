import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTemplates: (templates: string[]) => void;
}

const QUICK_TEMPLATES = [
  "SOLICITAR INTERNAÇÃO",
  "SOLICITADA INTERNAÇÃO (AGUARDANDO PSM)",
  "AGUARDANDO EXAMES",
  'SOLICITAR PARECER PARA " "',
  'SOLICITAR PROCEDIMENTO " "',
  "SOLICITADA INTERNAÇÃO EM UTI (AGUARDANDO PSM)",
  "AGUARDANDO ALOCAÇÃO NO SIGA",
  "M.O.V.",
  "MANTER",
  "SOLICITAR HEMODERIVADOS",
  "IR PARA O CENTRO CIRÚRGICO",
  "AGUARDANDO PSM"
];

export function QuickTemplatesDialog({ open, onOpenChange, onAddTemplates }: QuickTemplatesDialogProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const handleToggleTemplate = (template: string) => {
    setSelectedTemplates(prev => 
      prev.includes(template) 
        ? prev.filter(t => t !== template)
        : [...prev, template]
    );
  };

  const handleAdd = () => {
    if (selectedTemplates.length > 0) {
      onAddTemplates(selectedTemplates);
      setSelectedTemplates([]);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedTemplates([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Templates Rápidos de Programações</DialogTitle>
          <DialogDescription>
            Selecione os itens que deseja adicionar às programações/pendências do paciente
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {QUICK_TEMPLATES.map((template) => (
              <div key={template} className="flex items-center space-x-3">
                <Checkbox
                  id={template}
                  checked={selectedTemplates.includes(template)}
                  onCheckedChange={() => handleToggleTemplate(template)}
                />
                <Label
                  htmlFor={template}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {template}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={selectedTemplates.length === 0}
          >
            Adicionar ({selectedTemplates.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
