import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar } from "lucide-react";
import { format, parseISO, differenceInDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DhdReportDialog } from "./DhdReportDialog";

interface DhdPatient {
  id: string;
  patient_name: string;
  patient_age: string | null;
  diagnosis: string | null;
  start_date: string;
  end_date: string;
  medication_schedule: string | null;
  medication_days: string[] | any;
  dhd_report: string | null;
  status: string;
}

interface DhdPatientCardProps {
  patient: DhdPatient;
  onMedicationToggle: (patientId: string, date: string, currentDays: string[]) => void;
  onRefresh: () => void;
}

export function DhdPatientCard({ patient, onMedicationToggle, onRefresh }: DhdPatientCardProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const startDate = parseISO(patient.start_date);
  const endDate = parseISO(patient.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const completedDays = patient.medication_days.length;
  const progressPercentage = (completedDays / totalDays) * 100;
  const daysRemaining = differenceInDays(endDate, new Date());

  // Generate all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    onMedicationToggle(patient.id, dateStr, patient.medication_days);
  };

  const isDayMarked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return patient.medication_days.includes(dateStr);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1 uppercase">{patient.patient_name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {patient.patient_age && <span>{patient.patient_age}</span>}
                {patient.patient_age && patient.diagnosis && <span>•</span>}
                {patient.diagnosis && (
                  <span className="line-clamp-1">{patient.diagnosis}</span>
                )}
              </div>
              {patient.medication_schedule && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {patient.medication_schedule}
                  </Badge>
                </div>
              )}
            </div>
            <Badge
              variant={daysRemaining >= 0 ? "default" : "secondary"}
              className="ml-2"
            >
              {daysRemaining >= 0
                ? `${daysRemaining} dias restantes`
                : "Prazo encerrado"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{completedDays}/{totalDays} dias</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário de Medicações
            </p>
            
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {allDays.map((day, index) => {
                const isMarked = isDayMarked(day);
                const isPast = day < new Date();
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-all
                      ${isMarked
                        ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                        : "bg-muted hover:bg-muted/70"}
                      ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                      ${isPast && !isMarked ? "opacity-40" : ""}
                    `}
                    title={format(day, "dd/MM/yyyy", { locale: ptBR })}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Clique nos dias para marcar/desmarcar medicações realizadas
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {patient.dhd_report && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportDialogOpen(true)}
                className="flex-1 gap-2"
              >
                <FileText className="h-4 w-4" />
                Ver Relatório
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <DhdReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        patient={patient}
      />
    </>
  );
}