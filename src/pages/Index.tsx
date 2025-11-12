import { useState } from "react";
import { SectorSection } from "@/components/SectorSection";
import { mockPatients } from "@/data/mockPatients";
import { Patient } from "@/types/patient";
import { Activity, Users, Clock, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [printingSector, setPrintingSector] = useState<string | null>(null);
  const { toast } = useToast();
  
  const redPatients = patients.filter((p) => p.sector === "red");
  const yellowPatients = patients.filter((p) => p.sector === "yellow");
  const bluePatients = patients.filter((p) => p.sector === "blue");

  const totalPatients = patients.length;
  const criticalPatients = redPatients.length;

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    toast({
      title: "Paciente atualizado",
      description: `Os dados do paciente ${updatedPatient.name} foram atualizados com sucesso.`,
    });
  };

  const handlePrint = () => {
    setPrintingSector(null);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintSector = (sector: string) => {
    setPrintingSector(sector);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingSector(null), 500);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:static print:border-b-2">
        <div className="container mx-auto px-4 py-3 print:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center print:h-8 print:w-8">
                <Activity className="h-6 w-6 text-primary-foreground print:h-4 print:w-4" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground print:text-xl">Mapa de Pacientes</h1>
                <p className="text-sm text-muted-foreground print:text-xs">Sistema de Controle Hospitalar</p>
              </div>
            </div>

            <div className="flex gap-3 print:gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
                className="print:hidden"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg print:px-2 print:py-1">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-base font-bold text-foreground">{totalPatients}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-critical/10 px-3 py-1.5 rounded-lg border border-critical/20 print:px-2 print:py-1">
                <Activity className="h-4 w-4 text-critical" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Críticos</p>
                  <p className="text-base font-bold text-critical">{criticalPatients}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg print:hidden">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Atualizado</p>
                  <p className="text-xs font-medium text-foreground">
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
      <main className="container mx-auto px-4 py-6 print:py-2">
        <div className="space-y-4 print:space-y-2">
          <div className={printingSector && printingSector !== "red" ? "print:hidden" : ""}>
            <SectorSection 
              sector="red" 
              patients={redPatients} 
              onUpdatePatient={handleUpdatePatient}
              expandedForPrint={printingSector === "red"}
              onPrintSector={() => handlePrintSector("red")}
            />
          </div>
          <div className={printingSector && printingSector !== "yellow" ? "print:hidden" : ""}>
            <SectorSection 
              sector="yellow" 
              patients={yellowPatients} 
              onUpdatePatient={handleUpdatePatient}
              expandedForPrint={printingSector === "yellow"}
              onPrintSector={() => handlePrintSector("yellow")}
            />
          </div>
          <div className={printingSector && printingSector !== "blue" ? "print:hidden" : ""}>
            <SectorSection 
              sector="blue" 
              patients={bluePatients} 
              onUpdatePatient={handleUpdatePatient}
              expandedForPrint={printingSector === "blue"}
              onPrintSector={() => handlePrintSector("blue")}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Sistema de Gestão Hospitalar - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
