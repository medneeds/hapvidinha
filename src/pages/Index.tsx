import { useState } from "react";
import { SectorSection } from "@/components/SectorSection";
import { mockPatients } from "@/data/mockPatients";
import { Patient } from "@/types/patient";
import { Activity, Users, Clock, Printer, Eye, EyeOff, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [printingSector, setPrintingSector] = useState<string | null>(null);
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const { toast } = useToast();
  
  const filterPatients = (sectorPatients: Patient[]) => {
    if (!showOnlyOccupied) return sectorPatients;
    return sectorPatients.filter(p => p.name.trim() !== "");
  };

  const redPatients = filterPatients(patients.filter((p) => p.sector === "red"));
  const yellowPatients = filterPatients(patients.filter((p) => p.sector === "yellow"));
  const bluePatients = filterPatients(patients.filter((p) => p.sector === "blue"));

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

  const handleAddExtraBed = (sector: Patient['sector']) => {
    const sectorPrefix = sector === 'red' ? 'V' : sector === 'yellow' ? 'A' : 'Z';
    const sectorPatients = patients.filter(p => p.sector === sector);
    const extraBedNumber = sectorPatients.length + 1;
    
    const newPatient: Patient = {
      id: `${sector}-extra-${Date.now()}`,
      bedNumber: `${sectorPrefix}${String(extraBedNumber).padStart(2, '0')}`,
      name: "",
      age: 0,
      sector: sector,
      diagnoses: [],
      medicalHistory: [],
      relevantExams: [],
      pendencies: [],
      schedule: [],
      admissionHistory: "",
      admissionDate: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setPatients((prev) => [...prev, newPatient]);
    toast({
      title: "Leito extra adicionado",
      description: `Leito ${newPatient.bedNumber} criado com sucesso.`,
    });
  };

  const handleDeletePatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setPatients((prev) => prev.filter(p => p.id !== patientId));
    toast({
      title: "Leito deletado",
      description: `O leito ${patient?.bedNumber} foi removido com sucesso.`,
      variant: "destructive",
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border/30 bg-gradient-card backdrop-blur-xl sticky top-0 z-10 shadow-lg print:static print:border-b-2 print:shadow-none">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            <div className="container mx-auto px-4 py-3 print:py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="print:hidden" />
                  <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center print:h-8 print:w-8 shadow-glow transition-transform hover:scale-105 duration-200">
                    <ClipboardList className="h-6 w-6 text-primary-foreground print:h-4 print:w-4" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground print:text-xl uppercase tracking-tight">Mapa de Pacientes</h1>
                    <p className="text-sm text-muted-foreground print:text-xs uppercase tracking-wide">Sistema de Controle Hospitalar</p>
                  </div>
                </div>

                <div className="flex gap-3 print:gap-2">
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowOnlyOccupied(!showOnlyOccupied)}
                    className="print:hidden"
                    title={showOnlyOccupied ? "Mostrar todos os leitos" : "Mostrar apenas ocupados"}
                  >
                    {showOnlyOccupied ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
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
                      <p className="text-[10px] text-muted-foreground uppercase">Atualizado</p>
                      <p className="text-xs font-bold text-foreground uppercase">
                        {new Date().toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}{" "}
                        {new Date().toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      <p className="text-[10px] font-medium text-foreground">
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
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "red"}
                  onPrintSector={() => handlePrintSector("red")}
                  onAddExtraBed={() => handleAddExtraBed("red")}
                />
              </div>
              <div className={printingSector && printingSector !== "yellow" ? "print:hidden" : ""}>
                <SectorSection 
                  sector="yellow" 
                  patients={yellowPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "yellow"}
                  onPrintSector={() => handlePrintSector("yellow")}
                  onAddExtraBed={() => handleAddExtraBed("yellow")}
                />
              </div>
              <div className={printingSector && printingSector !== "blue" ? "print:hidden" : ""}>
                <SectorSection 
                  sector="blue" 
                  patients={bluePatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "blue"}
                  onPrintSector={() => handlePrintSector("blue")}
                  onAddExtraBed={() => handleAddExtraBed("blue")}
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
