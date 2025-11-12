import { SectorSection } from "@/components/SectorSection";
import { mockPatients } from "@/data/mockPatients";
import { Activity, Users, Clock } from "lucide-react";

const Index = () => {
  const redPatients = mockPatients.filter((p) => p.sector === "red");
  const yellowPatients = mockPatients.filter((p) => p.sector === "yellow");
  const bluePatients = mockPatients.filter((p) => p.sector === "blue");

  const totalPatients = mockPatients.length;
  const criticalPatients = redPatients.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mapa de Pacientes</h1>
                <p className="text-sm text-muted-foreground">Sistema de Controle Hospitalar</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{totalPatients}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-critical/10 px-4 py-2 rounded-lg border border-critical/20">
                <Activity className="h-5 w-5 text-critical" />
                <div>
                  <p className="text-xs text-muted-foreground">Críticos</p>
                  <p className="text-lg font-bold text-critical">{criticalPatients}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Atualizado</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date().toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <SectorSection sector="red" patients={redPatients} />
          <SectorSection sector="yellow" patients={yellowPatients} />
          <SectorSection sector="blue" patients={bluePatients} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Sistema de Gestão Hospitalar - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
