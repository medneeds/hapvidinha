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
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", config.color)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3 items-start">
            {/* Leito */}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-1">Leito</span>
              <Badge className={cn("w-fit", config.badgeColor)}>
                {patient.bedNumber}
              </Badge>
            </div>

            {/* Nome e Idade */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground mb-1">Paciente</span>
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="text-sm text-muted-foreground">{patient.age} anos</p>
              </div>
            </div>

            {/* Hipóteses Diagnósticas */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground mb-1">Diagnósticos</span>
              <div className="flex flex-wrap gap-1">
                {patient.diagnoses.map((diagnosis, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {diagnosis}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pendências */}
            <div className="flex flex-col md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground mb-1">Pendências</span>
              <ul className="text-sm space-y-0.5">
                {patient.pendencies.slice(0, 2).map((pendency, idx) => (
                  <li key={idx} className="text-foreground truncate">• {pendency}</li>
                ))}
                {patient.pendencies.length > 2 && (
                  <li className="text-muted-foreground text-xs">
                    +{patient.pendencies.length - 2} mais
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <button 
              className="flex-shrink-0 p-2 hover:bg-accent/50 rounded-full transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
        </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4 bg-card/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Admissão: {new Date(patient.admissionDate).toLocaleString('pt-BR')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Antecedentes */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Antecedentes Mórbidos</h4>
              <ul className="space-y-1">
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} className="text-sm text-foreground">• {history}</li>
                ))}
              </ul>
            </div>

            {/* Exames Relevantes */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Exames Relevantes</h4>
              <ul className="space-y-1">
                {patient.relevantExams.map((exam, idx) => (
                  <li key={idx} className="text-sm text-foreground">• {exam}</li>
                ))}
              </ul>
            </div>

            {/* Programação */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4" />
                Programação
              </h4>
              <ul className="space-y-1">
                {patient.schedule.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground">• {item}</li>
                ))}
              </ul>
            </div>

            {/* Todas as Pendências */}
            <div>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Todas as Pendências</h4>
              <ul className="space-y-1">
                {patient.pendencies.map((pendency, idx) => (
                  <li key={idx} className="text-sm text-foreground">• {pendency}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* História Admissional */}
          <div className="pt-3 border-t border-border/50">
            <h4 className="font-semibold text-sm mb-2 text-foreground">História Admissional / Anamnese</h4>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
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
