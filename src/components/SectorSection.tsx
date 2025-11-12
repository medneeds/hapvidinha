import { Patient, SectorType } from "@/types/patient";
import { PatientCard } from "./PatientCard";
import { Activity } from "lucide-react";

interface SectorSectionProps {
  sector: SectorType;
  patients: Patient[];
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
    subtitle: "Média Complexidade",
    icon: "🟡",
    gradientClass: "from-warning/20 to-warning/5"
  },
  blue: {
    title: "Observação Azul",
    subtitle: "Baixa Complexidade",
    icon: "🔵",
    gradientClass: "from-stable/20 to-stable/5"
  }
};

export function SectorSection({ sector, patients }: SectorSectionProps) {
  const info = sectorInfo[sector];

  return (
    <section className="space-y-4">
      <div className={`bg-gradient-to-r ${info.gradientClass} rounded-xl p-6 border border-border/50`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{info.icon}</span>
              <h2 className="text-2xl font-bold text-foreground">{info.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{info.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Leitos ocupados</p>
              <p className="text-xl font-bold text-foreground">{patients.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border/50">
            <p>Nenhum paciente neste setor</p>
          </div>
        ) : (
          patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        )}
      </div>
    </section>
  );
}
