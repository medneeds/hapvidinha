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
  "M.O.V.",
  "SOLICITAR INTERNAÇÃO",
  "SOLICITADA INTERNAÇÃO EM UTI (AGUARDANDO PSM)",
  "SOLICITADA INTERNAÇÃO EM UTI (PSM FAVORÁVEL)",
  "IR PARA LEITO DE UTI",
  "SOLICITADA INTERNAÇÃO EM ENFERMARIA (AGUARDANDO PSM)",
  "SOLICITADA INTERNAÇÃO EM ENFERMARIA (PSM FAVORÁVEL)",
  "AGUARDANDO ALOCAÇÃO NO SIGA",
  "IR PARA LEITO DE ENFERMARIA",
  "SOLICITADA INTERNAÇÃO PSIQUIÁTRICA (AGUARDANDO PSM)",
  "IR PARA LEITO O INSTITUTO VOLTA VIDA (IVV)",
  "AGUARDANDO EXAMES",
  "IR PARA O CENTRO CIRÚRGICO",
  "INTERNAÇÃO EM UTI NEGADA POR CARÊNCIA CONTRATUAL",
  "INTERNAÇÃO EM ENFERMARIA NEGADA POR CARÊNCIA CONTRATUAL",
  "PSM ORIENTA REALIZAÇÃO DO EXAME VIA PQA",
  "PSM ORIENTA REALIZAÇÃO DO PROCEDIMENTO VIA PQA",
  "PSM ORIENTA PERMANÊNCIA EM OBSERVAÇÃO (PACK 30H) E REDISCUSSÃO APÓS O PERÍODO",
  "SEGUIMENTO CONJUNTO COM TELECARDIO",
  "SEGUIMENTO CONJUNTO COM TELENEURO"
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-xl font-bold tracking-wide uppercase">
            TEMPLATES RÁPIDOS DE PROGRAMAÇÕES
          </DialogTitle>
          <DialogDescription className="text-sm uppercase tracking-wide">
            SELECIONE OS ITENS QUE DESEJA ADICIONAR ÀS PROGRAMAÇÕES/PENDÊNCIAS DO PACIENTE
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-2">
            {QUICK_TEMPLATES.map((template, index) => (
              <div 
                key={template} 
                className="group flex items-center space-x-3 p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-accent/10 hover:border-accent/50 transition-all duration-200 cursor-pointer"
                onClick={() => handleToggleTemplate(template)}
              >
                <Checkbox
                  id={template}
                  checked={selectedTemplates.includes(template)}
                  onCheckedChange={() => handleToggleTemplate(template)}
                  className="flex-shrink-0"
                />
                <Label
                  htmlFor={template}
                  className="text-sm font-medium leading-relaxed cursor-pointer flex-1 group-hover:text-accent-foreground transition-colors"
                >
                  {template}
                </Label>
                <span className="text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="uppercase tracking-wide"
          >
            CANCELAR
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={selectedTemplates.length === 0}
            className="uppercase tracking-wide font-semibold"
          >
            ADICIONAR ({selectedTemplates.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
