import { Patient, SectorType } from "@/types/patient";
import { PatientCard } from "./PatientCard";
import { Activity, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectorSectionProps {
  sector: SectorType;
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
  expandedForPrint?: boolean;
  onPrintSector?: () => void;
}

const sectorInfo = {
  red: {
    title: "Sala Vermelha",
    subtitle: "Cuidados Especiais",
    icon: "🔴",
    gradientClass: "from-critical/20 to-critical/5"
  },
  yellow: {
    title: "Observação Amarela",
    subtitle: "Em monitorização",
    icon: "🟡",
    gradientClass: "from-warning/20 to-warning/5"
  },
  blue: {
    title: "Observação Azul",
    subtitle: "Sem monitorização",
    icon: "🔵",
    gradientClass: "from-stable/20 to-stable/5"
  }
};

export function SectorSection({ sector, patients, onUpdatePatient, expandedForPrint = false, onPrintSector }: SectorSectionProps) {
  const info = sectorInfo[sector];

  return (
    <section className="space-y-2 print:space-y-1 print:break-inside-avoid">
      <div className={`bg-gradient-to-r ${info.gradientClass} rounded-xl p-3 border border-border/50 print:p-2 print:mb-1`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl print:text-base">{info.icon}</span>
              <h2 className="text-xl font-bold text-foreground print:text-base uppercase">{info.title}</h2>
            </div>
            <p className="text-xs text-muted-foreground print:hidden uppercase">{info.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {onPrintSector && (
              <Button
                variant="outline"
                size="icon"
                onClick={onPrintSector}
                className="h-8 w-8 print:hidden"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 print:px-2 print:py-1">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground">Leitos</p>
                <p className="text-base font-bold text-foreground">{patients.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 print:space-y-1">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50">
            <p>Nenhum paciente neste setor</p>
          </div>
        ) : (
          patients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onUpdate={onUpdatePatient}
              expandedForPrint={expandedForPrint}
            />
          ))
        )}
      </div>
    </section>
  );
}
