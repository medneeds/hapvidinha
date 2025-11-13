import { useState, useEffect } from "react";
import { SectorSection } from "@/components/SectorSection";
import { PatientCard } from "@/components/PatientCard";
import { mockPatients } from "@/data/mockPatients";
import { Patient } from "@/types/patient";
import { Activity, Users, Clock, Printer, Eye, EyeOff, ClipboardList, LogOut, CheckSquare, Trash2, Undo, Plus, StickyNote, Edit, List, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hospital_patients_data";
const HISTORY_KEY = "hospital_patients_history";
const NOTES_KEY = "hospital_notes";
const CHECKLIST_KEY = "hospital_checklist";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : mockPatients;
  });
  const [history, setHistory] = useState<Patient[][]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<string>(() => {
    const saved = localStorage.getItem(NOTES_KEY);
    return saved || "";
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [printingSector, setPrintingSector] = useState<string | null>(null);
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { signOut, user, role } = useAuth();

  // Persist patients data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Persist notes to localStorage
  useEffect(() => {
    localStorage.setItem(NOTES_KEY, notes);
  }, [notes]);

  // Persist checklist to localStorage
  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
  }, [checklist]);

  const saveToHistory = (currentPatients: Patient[]) => {
    setHistory(prev => [...prev.slice(-9), currentPatients]); // Keep last 10 states
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const newItem: ChecklistItem = {
      id: `checklist-${Date.now()}`,
      text: newChecklistItem.toUpperCase(),
      completed: false
    };
    
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItem("");
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };
  
  const filterPatients = (sectorPatients: Patient[]) => {
    if (!showOnlyOccupied) return sectorPatients;
    return sectorPatients.filter(p => p.name.trim() !== "");
  };

  const redPatients = filterPatients(patients.filter((p) => p.sector === "red"));
  const yellowPatients = filterPatients(patients.filter((p) => p.sector === "yellow"));
  const bluePatients = filterPatients(patients.filter((p) => p.sector === "blue"));
  const outsidePatients = filterPatients(patients.filter((p) => p.sector === "outside"));

  const totalPatients = patients.length;
  const criticalPatients = redPatients.length;

  const handleUpdatePatient = (updatedPatient: Patient) => {
    saveToHistory(patients);
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    toast({
      title: "Paciente atualizado",
      description: `Os dados do paciente ${updatedPatient.name} foram atualizados com sucesso.`,
    });
  };

  const handleAddExtraBed = (sector: Patient['sector']) => {
    saveToHistory(patients);
    const sectorPrefix = sector === 'red' ? 'V' : sector === 'yellow' ? 'A' : sector === 'blue' ? 'Z' : 'F';
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
      title: sector === "outside" ? "Paciente fora de ala adicionado" : "Leito extra adicionado",
      description: `Leito ${newPatient.bedNumber} criado com sucesso.`,
    });
  };

  const handleDeletePatient = (patientId: string) => {
    saveToHistory(patients);
    const patient = patients.find(p => p.id === patientId);
    setPatients((prev) => prev.filter(p => p.id !== patientId));
    toast({
      title: "Leito deletado",
      description: `O leito ${patient?.bedNumber} foi removido com sucesso.`,
      variant: "destructive",
    });
  };

  const handleToggleSelection = (patientId: string) => {
    setSelectedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedPatients.size === 0) return;
    
    if (window.confirm(`Tem certeza que deseja deletar ${selectedPatients.size} leito(s) selecionado(s)?`)) {
      saveToHistory(patients);
      setPatients((prev) => prev.filter(p => !selectedPatients.has(p.id)));
      toast({
        title: "Leitos deletados",
        description: `${selectedPatients.size} leito(s) removido(s) com sucesso.`,
        variant: "destructive",
      });
      setSelectedPatients(new Set());
      setSelectionMode(false);
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPatients(new Set());
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast({
        title: "Nenhuma ação para desfazer",
        description: "Não há histórico de ações disponível.",
        variant: "destructive",
      });
      return;
    }

    const previousState = history[history.length - 1];
    setPatients(previousState);
    setHistory(prev => prev.slice(0, -1));
    toast({
      title: "Ação desfeita",
      description: "A última ação foi desfeita com sucesso.",
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

  const handlePrintSelected = () => {
    if (selectedPatients.size === 0) return;
    
    setPrintingSector("selected");
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
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 print:py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <SidebarTrigger className="print:hidden flex-shrink-0" />
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-primary rounded-lg flex items-center justify-center print:h-8 print:w-8 shadow-glow transition-transform hover:scale-105 duration-200 flex-shrink-0">
                    <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground print:h-4 print:w-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-2xl font-bold text-foreground print:text-xl uppercase tracking-tight truncate">Mapa de Pacientes</h1>
                    <p className="text-[10px] sm:text-sm text-muted-foreground print:text-xs uppercase tracking-wide hidden sm:block">Sistema de Controle Hospitalar</p>
                  </div>
                </div>

                <div className="flex gap-1.5 sm:gap-3 print:gap-2 items-center flex-shrink-0">
                  <ThemeToggle />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="print:hidden h-8 w-8 sm:h-10 sm:w-10"
                    title="Desfazer última ação"
                  >
                    <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowOnlyOccupied(!showOnlyOccupied)}
                    className="print:hidden h-8 w-8 sm:h-10 sm:w-10"
                    title={showOnlyOccupied ? "Mostrar todos os leitos" : "Mostrar apenas ocupados"}
                  >
                    {showOnlyOccupied ? <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </Button>
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="icon"
                    onClick={handleToggleSelectionMode}
                    className="print:hidden h-8 w-8 sm:h-10 sm:w-10"
                    title="Modo de seleção múltipla"
                  >
                    <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  {selectionMode && selectedPatients.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrintSelected}
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10"
                        title={`Imprimir ${selectedPatients.size} selecionado(s)`}
                      >
                        <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDeleteSelected}
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10"
                        title={`Deletar ${selectedPatients.size} selecionado(s)`}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrint}
                    className="print:hidden hidden sm:flex h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="hidden md:flex items-center gap-2 bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg print:px-2 print:py-1">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">Total</p>
                      <p className="text-sm sm:text-base font-bold text-foreground">{totalPatients}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 bg-critical/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-critical/20 print:px-2 print:py-1">
                    <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-critical" />
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">Críticos</p>
                      <p className="text-sm sm:text-base font-bold text-critical">{criticalPatients}</p>
                    </div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-border mx-1 sm:mx-2 print:hidden hidden lg:block" />
                  <div className="hidden lg:flex items-center gap-2 sm:gap-3 print:hidden">
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs font-semibold text-foreground uppercase tracking-tight">
                        {user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">
                        {role === 'admin' ? 'Administrador' : 'Médico'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={signOut}
                      title="Sair"
                      className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 print:py-2">
            <div className="space-y-3 sm:space-y-4 print:space-y-2">
              <div className={printingSector && printingSector !== "red" && printingSector !== "selected" ? "print:hidden" : ""}>
                <SectorSection 
                  sector="red" 
                  patients={redPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "red" || printingSector === "selected"}
                  onPrintSector={() => handlePrintSector("red")}
                  onAddExtraBed={() => handleAddExtraBed("red")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  printOnlySelected={printingSector === "selected"}
                />
              </div>
              <div className={printingSector && printingSector !== "yellow" && printingSector !== "selected" ? "print:hidden" : ""}>
                <SectorSection 
                  sector="yellow" 
                  patients={yellowPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "yellow" || printingSector === "selected"}
                  onPrintSector={() => handlePrintSector("yellow")}
                  onAddExtraBed={() => handleAddExtraBed("yellow")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  printOnlySelected={printingSector === "selected"}
                />
              </div>
              <div className={printingSector && printingSector !== "blue" && printingSector !== "selected" ? "print:hidden" : ""}>
                <SectorSection 
                  sector="blue" 
                  patients={bluePatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  expandedForPrint={printingSector === "blue" || printingSector === "selected"}
                  onPrintSector={() => handlePrintSector("blue")}
                  onAddExtraBed={() => handleAddExtraBed("blue")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  printOnlySelected={printingSector === "selected"}
                />
              </div>

              {/* Pacientes Fora das Alas Section */}
              <div className="mt-6 print:hidden">
                <Card className="border-2 border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg font-bold uppercase flex items-center gap-2">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        Pacientes Fora das Alas
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => handleAddExtraBed("outside")}
                        className="h-8 px-3 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {outsidePatients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum paciente fora das alas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {outsidePatients.map((patient) => (
                          <PatientCard
                            key={patient.id}
                            patient={patient}
                            onUpdate={handleUpdatePatient}
                            onDelete={handleDeletePatient}
                            selectionMode={selectionMode}
                            isSelected={selectedPatients.has(patient.id)}
                            onToggleSelection={handleToggleSelection}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Anotações e Lembretes Section */}
              <div className="mt-6 print:hidden">
                <Card className="border-2 border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg font-bold uppercase flex items-center gap-2">
                      <StickyNote className="h-4 w-4 sm:h-5 sm:w-5" />
                      Anotações e Lembretes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="text" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="text" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Texto Livre
                        </TabsTrigger>
                        <TabsTrigger value="checklist" className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          Checklist
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="text" className="space-y-2">
                        <Textarea
                          placeholder="DIGITE AQUI SUAS ANOTAÇÕES E LEMBRETES IMPORTANTES..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value.toUpperCase())}
                          className="min-h-[250px] resize-none uppercase font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {notes.length} caracteres
                        </p>
                      </TabsContent>
                      
                      <TabsContent value="checklist" className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="ADICIONAR NOVO ITEM..."
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value.toUpperCase())}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddChecklistItem();
                              }
                            }}
                            className="uppercase text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={handleAddChecklistItem}
                            disabled={!newChecklistItem.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {checklist.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              NENHUM ITEM NA CHECKLIST
                            </p>
                          ) : (
                            checklist.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border group"
                              >
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => handleToggleChecklistItem(item.id)}
                                  className="flex-shrink-0"
                                />
                                <span
                                  className={cn(
                                    "flex-1 text-sm uppercase",
                                    item.completed && "line-through text-muted-foreground"
                                  )}
                                >
                                  {item.text}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveChecklistItem(item.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {checklist.filter(item => item.completed).length} de {checklist.length} itens completos
                        </p>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
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
