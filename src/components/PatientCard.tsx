import { useState } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, Calendar, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditPatientDialog } from "./EditPatientDialog";

interface PatientCardProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
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
  }
};

export function PatientCard({ patient, onUpdate }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const config = sectorConfig[patient.sector];

  return (
    <>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md print:shadow-none print:break-inside-avoid", config.color)}>
        <div className="p-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-2 items-start">
              {/* Leito */}
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Leito</span>
                <Badge className={cn("w-fit text-xs py-0 px-2", config.badgeColor)}>
                  {patient.bedNumber}
                </Badge>
              </div>

              {/* Nome e Idade */}
              <div className="flex flex-col md:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Paciente</span>
                <div>
                  <p className="font-semibold text-sm text-foreground leading-tight">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.age} anos</p>
                </div>
              </div>

              {/* Hipóteses Diagnósticas */}
              <div className="flex flex-col md:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Diagnósticos</span>
                <div className="flex flex-wrap gap-1">
                  {patient.diagnoses.map((diagnosis, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1.5">
                      {diagnosis}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pendências */}
              <div className="flex flex-col md:col-span-2">
                <span className="text-[10px] font-medium text-muted-foreground mb-0.5">Pendências</span>
                <ul className="text-xs space-y-0">
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
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <button 
              className="flex-shrink-0 p-1.5 hover:bg-accent/50 rounded-md transition-colors"
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Antecedentes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground">Antecedentes Mórbidos</h4>
              <ul className="space-y-0">
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight">• {history}</li>
                ))}
              </ul>
            </div>

            {/* Exames Relevantes */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground">Exames Relevantes</h4>
              <ul className="space-y-0">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight">• {exam}</li>
                ))}
              </ul>
            </div>

            {/* Programação */}
            <div>
              <h4 className="font-semibold text-xs mb-1 flex items-center gap-1 text-foreground">
                <Clock className="h-3 w-3" />
                Programação
              </h4>
              <ul className="space-y-0">
                {patient.schedule.map((item, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight">• {item}</li>
                ))}
              </ul>
            </div>

            {/* Todas as Pendências */}
            <div>
              <h4 className="font-semibold text-xs mb-1 text-foreground">Todas as Pendências</h4>
              <ul className="space-y-0">
                {patient.pendencies.map((pendency, idx) => (
                  <li key={idx} className="text-xs text-foreground leading-tight">• {pendency}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* História Admissional */}
          <div className="pt-2 border-t border-border/50">
            <h4 className="font-semibold text-xs mb-1 text-foreground">História Admissional / Anamnese</h4>
            <p className="text-xs leading-snug text-foreground whitespace-pre-wrap">
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
    </>
  );
}
