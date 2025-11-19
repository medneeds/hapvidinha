import { useState } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit, Trash2, Copy, ArrowRightLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PatientCardProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onDelete?: (patientId: string) => void;
  onUndelete?: (patient: Patient) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
}

const sectorConfig = {
  red: {
    label: "Sala Vermelha",
    color: "bg-critical/10 border-critical/30 text-critical-foreground",
    badgeColor: "bg-critical text-critical-foreground hover:bg-critical/90"
  },
  yellow: {
    label: "Observação Amarela",
    color: "bg-warning/10 border-warning/30 text-warning-foreground",
    badgeColor: "bg-warning text-warning-foreground hover:bg-warning/90"
  },
  blue: {
    label: "Observação Azul",
    color: "bg-stable/10 border-stable/30 text-stable-foreground",
    badgeColor: "bg-stable text-stable-foreground hover:bg-stable/90"
  },
  outside: {
    label: "Fora das Alas",
    color: "bg-muted/50 border-muted-foreground/30 text-foreground",
    badgeColor: "bg-muted-foreground text-background hover:bg-muted-foreground/90"
  }
};

const sectorLabels = {
  red: "Cuidados Especiais",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
  outside: "Fora das Alas"
};

export function PatientCard({ patient, onUpdate, onDelete, onUndelete, selectionMode = false, isSelected = false, onToggleSelection, onTransfer, onPrintPatient }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const config = sectorConfig[patient.sector];
  const { toast } = useToast();

  const handleCopyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(patient.name);
      toast({
        title: "Nome copiado",
        description: `"${patient.name}" foi copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o nome.",
        variant: "destructive",
      });
    }
  };

  const handleTransfer = (newSector: Patient['sector']) => {
    if (onTransfer && newSector !== patient.sector) {
      onTransfer(patient.id, newSector);
    }
  };

  const checkboxColor = {
    red: "border-critical data-[state=checked]:bg-critical data-[state=checked]:border-critical",
    yellow: "border-warning data-[state=checked]:bg-warning data-[state=checked]:border-warning",
    blue: "border-stable data-[state=checked]:bg-stable data-[state=checked]:border-stable",
    outside: "border-muted-foreground data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
  }[patient.sector];

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg print:shadow-none print:break-inside-avoid print:mb-0 print:w-full", 
        config.color,
        isSelected && "ring-2 ring-primary",
        isDeleting && "animate-[slide-out-left_0.3s_ease-out_forwards]"
      )}>
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-3">
            {selectionMode && onToggleSelection && (
              <div className="flex items-center justify-center print:hidden flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(patient.id)}
                  className={cn("h-5 w-5", checkboxColor)}
                />
              </div>
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
              {/* Leito - mais compacto */}
              <div className="flex flex-col md:col-span-1">
                <span className="text-[9px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge className={cn("w-fit text-[10px] py-0.5 px-1 font-bold min-w-[2rem] justify-center", config.badgeColor)}>
                  {patient.bedNumber}
                </Badge>
              </div>

              {/* Nome e Idade - mais espaço */}
              <div className="flex flex-col md:col-span-3">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
                <div className="group/name relative">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight uppercase truncate">{patient.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{patient.age} anos</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyName}
                      className="h-5 w-5 opacity-0 group-hover/name:opacity-100 transition-opacity print:hidden hover:bg-primary/10 hover:text-primary flex-shrink-0"
                      title="Copiar nome"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* HD - mais espaço */}
              <div className="flex flex-col md:col-span-3">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">HD</span>
                <div className="flex flex-wrap gap-1 print:gap-0.5">
                  {patient.diagnoses.map((diagnosis, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1.5 uppercase">
                      {diagnosis}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Programações / Pendências - mais espaço */}
              <div className="flex flex-col md:col-span-5">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Programações / Pendências</span>
                <ul className="text-xs space-y-0 uppercase">
                  {patient.pendencies.slice(0, 2).map((pendency, idx) => (
                    <li key={idx} className="text-foreground truncate leading-tight">• {pendency}</li>
                  ))}
                  {patient.pendencies.length > 2 && (
                    <li className="text-muted-foreground text-[10px]">
                      +{patient.pendencies.length - 2} mais
                    </li>
                  )}
                </ul>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex gap-1 print:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}
              className="h-8 w-8 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            {onTransfer && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                    title="Transferir para outra ala"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Transferir para</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(sectorLabels) as Array<Patient['sector']>).map((sector) => (
                    sector !== patient.sector && (
                      <DropdownMenuItem
                        key={sector}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransfer(sector);
                        }}
                      >
                        {sectorLabels[sector]}
                      </DropdownMenuItem>
                    )
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onPrintPatient && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintPatient(patient.id);
                }}
                className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                title="Imprimir caso completo"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="h-8 w-8 text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <button 
              className="flex-shrink-0 p-1.5 hover:bg-accent/50 rounded-md transition-all duration-200"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
        </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/50 pt-2 bg-card/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-[8px] print:gap-1">
            <Calendar className="h-3 w-3 print:h-2 print:w-2" />
            <span>Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:gap-1 print:grid-cols-2">
            {/* Antecedentes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Antecedentes Mórbidos</h4>
              <ul className="space-y-0 uppercase">
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {history}</li>
                ))}
              </ul>
            </div>

            {/* Exames Relevantes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Exames Relevantes</h4>
              <ul className="space-y-0 uppercase">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {exam}</li>
                ))}
              </ul>
            </div>

            {/* Programação */}
            <div>
              <h4 className="font-semibold text-xs mb-1 flex items-center gap-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">
                <Clock className="h-3 w-3 print:h-2 print:w-2" />
                Programação
              </h4>
              <ul className="space-y-0 uppercase">
                {patient.schedule.map((item, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {item}</li>
                ))}
              </ul>
            </div>

            {/* Programações / Pendências */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">Programações / Pendências</h4>
              <ul className="space-y-0 uppercase">
                {patient.pendencies.map((pendency, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight print:text-[7.5px] print:leading-tight">• {pendency}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* História Admissional */}
          <div className="pt-2 border-t border-border/50 print:pt-1">
            <h4 className="font-semibold text-xs mb-1 text-foreground uppercase print:text-[8.5px] print:mb-0.5">História Admissional / Anamnese</h4>
            <p className="text-xs leading-snug text-foreground whitespace-pre-wrap uppercase print:text-[7.5px] print:leading-tight">
              {patient.admissionHistory}
            </p>
          </div>
        </div>
      )}
      </Card>

      <EditPatientDialog
        patient={patient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={onUpdate}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o leito <strong>{patient.bedNumber}</strong> do paciente <strong>{patient.name}</strong>?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  const deletedPatient = { ...patient };
                  setIsDeleting(true);
                  
                  // Wait for animation to complete before actually deleting
                  setTimeout(() => {
                    onDelete(patient.id);
                    toast({
                      title: "Paciente excluído",
                      description: `Leito ${patient.bedNumber} - ${patient.name} foi removido.`,
                      action: onUndelete ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUndelete(deletedPatient)}
                          className="ml-auto"
                        >
                          Desfazer
                        </Button>
                      ) : undefined,
                    });
                  }, 300);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
