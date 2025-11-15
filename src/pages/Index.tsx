import { useState, useEffect } from "react";
import { SectorSection } from "@/components/SectorSection";
import { PatientCard } from "@/components/PatientCard";
import { PrintLayout } from "@/components/PrintLayout";
import { PrintPatientLayout } from "@/components/PrintPatientLayout";
import { mockPatients } from "@/data/mockPatients";
import { Patient } from "@/types/patient";
import { Activity, Users, Clock, Printer, Eye, EyeOff, ClipboardList, LogOut, CheckSquare, Trash2, Undo, Redo, Plus, StickyNote, Edit, List, X, FileText, ChevronDown, GripVertical, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterHandoverDialog } from "@/components/RegisterHandoverDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STORAGE_KEY = "hospital_patients_data";
const HISTORY_KEY = "hospital_patients_history";
const REDO_HISTORY_KEY = "hospital_patients_redo_history";
const NOTES_KEY = "hospital_notes";
const CHECKLIST_KEY = "hospital_checklist";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Helper component for draggable patient cards
interface SortableOutsidePatientCardProps {
  patient: Patient;
  onUpdate: (patient: Patient) => void;
  onDelete?: (patientId: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
}

function SortableOutsidePatientCard(props: SortableOutsidePatientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.patient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0 print:hidden"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <PatientCard {...props} />
      </div>
    </div>
  );
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
  const [redoHistory, setRedoHistory] = useState<Patient[][]>(() => {
    const saved = localStorage.getItem(REDO_HISTORY_KEY);
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
  const [isOutsideSectionOpen, setIsOutsideSectionOpen] = useState(true);
  const [isNotesSectionOpen, setIsNotesSectionOpen] = useState(true);
  const [printingSector, setPrintingSector] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'compact' | 'detailed' | null>(null);
  const [printingPatientId, setPrintingPatientId] = useState<string | null>(null);
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const { toast } = useToast();
  const { signOut, user, role } = useAuth();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndOutside = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = outsidePatients.findIndex((p) => p.id === active.id);
      const newIndex = outsidePatients.findIndex((p) => p.id === over.id);
      
      const reorderedPatients = arrayMove(outsidePatients, oldIndex, newIndex);
      handleReorderPatients("outside", reorderedPatients);
    }
  };

  // Persist patients data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Persist redo history to localStorage
  useEffect(() => {
    localStorage.setItem(REDO_HISTORY_KEY, JSON.stringify(redoHistory));
  }, [redoHistory]);

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
    setRedoHistory([]); // Clear redo history when new action is performed
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

  const handleReorderPatients = (sector: Patient['sector'], reorderedPatients: Patient[]) => {
    saveToHistory(patients);
    
    // Manter pacientes de outros setores e substituir os do setor reordenado
    const otherSectorPatients = patients.filter(p => p.sector !== sector);
    const newPatients = [...otherSectorPatients, ...reorderedPatients];
    
    setPatients(newPatients);
    toast({
      title: "Ordem atualizada",
      description: "A ordem dos pacientes foi reorganizada.",
    });
  };

  const handleTransferPatient = (patientId: string, newSector: Patient['sector']) => {
    saveToHistory(patients);
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const updatedPatient = { ...patient, sector: newSector };
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
    
    toast({
      title: "Paciente transferido",
      description: `${patient.name} foi transferido para ${
        newSector === 'red' ? 'Cuidados Especiais' :
        newSector === 'yellow' ? 'Observação Amarela' :
        newSector === 'blue' ? 'Observação Azul' : 'Fora das Alas'
      }.`,
    });
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
    setRedoHistory(prev => [...prev, patients]); // Save current state to redo history
    setPatients(previousState);
    setHistory(prev => prev.slice(0, -1));
    toast({
      title: "Ação desfeita",
      description: "A última ação foi desfeita com sucesso.",
    });
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) {
      toast({
        title: "Nenhuma ação para refazer",
        description: "Não há histórico de ações desfeitas disponível.",
        variant: "destructive",
      });
      return;
    }

    const nextState = redoHistory[redoHistory.length - 1];
    setHistory(prev => [...prev, patients]); // Save current state to undo history
    setPatients(nextState);
    setRedoHistory(prev => prev.slice(0, -1));
    toast({
      title: "Ação refeita",
      description: "A ação foi refeita com sucesso.",
    });
  };

  const handlePrint = () => {
    // Imprime direto no modo detalhado
    setPrintMode('detailed');
    setPrintingSector(null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 100);
  };

  const handlePrintCompact = () => {
    // Imprime direto no modo compacto
    setPrintMode('compact');
    setPrintingSector(null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 100);
  };

  const handlePrintSector = (sector: string) => {
    // Usa modo detalhado para impressão de setor
    setPrintMode('detailed');
    setPrintingSector(sector);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintMode(null);
        setPrintingSector(null);
      }, 500);
    }, 100);
  };

  const handlePrintSelected = () => {
    if (selectedPatients.size === 0) return;
    
    // Usa modo detalhado para impressão
    setPrintMode('detailed');
    setPrintingSector("selected");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintMode(null);
        setPrintingSector(null);
      }, 500);
    }, 100);
  };

  const handlePrintPatient = (patientId: string) => {
    setPrintingPatientId(patientId);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintingPatientId(null);
      }, 500);
    }, 100);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        {/* Print-only layout - Hidden on screen, visible only when printing */}
        {printMode && (
          <div className="print-layout-container">
            <PrintLayout 
              redPatients={printingSector === "red" ? redPatients : printingSector === "selected" ? redPatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : redPatients}
              yellowPatients={printingSector === "yellow" ? yellowPatients : printingSector === "selected" ? yellowPatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : yellowPatients}
              bluePatients={printingSector === "blue" ? bluePatients : printingSector === "selected" ? bluePatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : bluePatients}
              mode={printMode}
              isPreview={false}
            />
          </div>
        )}

        {/* Print individual patient layout */}
        {printingPatientId && (() => {
          const patient = patients.find(p => p.id === printingPatientId);
          return patient ? (
            <div className="print-layout-container">
              <PrintPatientLayout patient={patient} />
            </div>
          ) : null;
        })()}
        
        <div className={`flex-1 flex flex-col min-w-0 ${printMode ? 'print-hide' : ''}`}>
          {/* Header */}
          <header className="border-b border-[#013ba6]/30 bg-[#013ba6] backdrop-blur-xl sticky top-0 z-10 shadow-lg print:static print:border-b print:shadow-none print:mb-1 print:pb-0.5">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent print:hidden"></div>
            <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 print:py-0.5 print:px-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <SidebarTrigger className="print:hidden flex-shrink-0 text-white hover:bg-white/10" />
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-2xl font-bold text-white print:text-xs uppercase tracking-tight truncate">Mapa de Pacientes</h1>
                    <p className="text-[10px] sm:text-sm text-white/80 print:hidden uppercase tracking-wide hidden sm:block">Sistema de Controle Hospitalar</p>
                  </div>
                </div>

                <div className="flex gap-1.5 sm:gap-3 print:gap-2 items-center flex-shrink-0">
                  <ThemeToggle />
                  <Button
                    variant="default"
                    onClick={() => setHandoverDialogOpen(true)}
                    className="print:hidden bg-white text-[#013ba6] hover:bg-white/90 gap-2 shadow-md"
                    title="Registrar Passagem de Plantão"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden sm:inline uppercase tracking-wide font-semibold">Registrar Passagem</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6] disabled:opacity-50"
                    title="Desfazer última ação"
                  >
                    <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRedo}
                    disabled={redoHistory.length === 0}
                    className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6] disabled:opacity-50"
                    title="Refazer ação"
                  >
                    <Redo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="icon"
                    onClick={handleToggleSelectionMode}
                    className={`print:hidden h-8 w-8 sm:h-10 sm:w-10 ${selectionMode ? 'bg-white text-[#013ba6] shadow-md' : 'bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]'}`}
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
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                        title={`Imprimir ${selectedPatients.size} selecionado(s)`}
                      >
                        <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDeleteSelected}
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-red-600 text-white hover:bg-red-700 border-0"
                        title={`Deletar ${selectedPatients.size} selecionado(s)`}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrintCompact}
                    className="print:hidden hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                    title="Impressão compacta"
                  >
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrint}
                    className="print:hidden hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                    title="Impressão detalhada"
                  >
                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="hidden md:flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg print:px-2 print:py-1 backdrop-blur-sm border border-white/20">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-white/80">Total</p>
                      <p className="text-sm sm:text-base font-bold text-white">{totalPatients}</p>
                    </div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-white/20 mx-1 sm:mx-2 print:hidden hidden lg:block" />
                  <div className="hidden lg:flex items-center gap-2 sm:gap-3 print:hidden">
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs font-semibold text-white uppercase tracking-tight">
                        {user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-white/80 uppercase">
                        {role === 'admin' ? 'Administrador' : 'Médico'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={signOut}
                      title="Sair"
                      className="h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                    >
                      <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 print:py-0 print:px-1">
            <div className="space-y-3 sm:space-y-4 print:space-y-1">
              <div>
                <SectorSection 
                  sector="red" 
                  patients={redPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  onPrintSector={() => handlePrintSector("red")}
                  onAddExtraBed={() => handleAddExtraBed("red")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("red", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                />
              </div>
              <div>
                <SectorSection 
                  sector="yellow" 
                  patients={yellowPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  onPrintSector={() => handlePrintSector("yellow")}
                  onAddExtraBed={() => handleAddExtraBed("yellow")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("yellow", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                />
              </div>
              <div>
                <SectorSection 
                  sector="blue" 
                  patients={bluePatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  onPrintSector={() => handlePrintSector("blue")}
                  onAddExtraBed={() => handleAddExtraBed("blue")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("blue", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                />
              </div>

              {/* Pacientes Fora das Alas Section */}
              <div className="mt-6 print:hidden">
                <Collapsible open={isOutsideSectionOpen} onOpenChange={setIsOutsideSectionOpen}>
                  <div className="bg-gradient-card rounded-xl p-3 border border-border/50 shadow-md transition-all duration-200 h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <ChevronDown className={`h-5 w-5 transition-transform ${isOutsideSectionOpen ? '' : '-rotate-90'}`} />
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            <h2 className="text-lg font-bold text-foreground uppercase">Pacientes Fora das Alas</h2>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleAddExtraBed("outside")}
                          className="h-8 w-8"
                          title="Adicionar paciente"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Pacientes</p>
                            <p className="text-base font-bold text-foreground">{outsidePatients.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-3">
                      {outsidePatients.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum paciente fora das alas
                        </p>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEndOutside}
                        >
                          <SortableContext
                            items={outsidePatients.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {outsidePatients.map((patient) => (
                              <SortableOutsidePatientCard
                                key={patient.id}
                                patient={patient}
                                onUpdate={handleUpdatePatient}
                                onDelete={handleDeletePatient}
                                selectionMode={selectionMode}
                                isSelected={selectedPatients.has(patient.id)}
                                onToggleSelection={handleToggleSelection}
                                onTransfer={handleTransferPatient}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Anotações e Lembretes Section */}
              <div className="mt-6 print:hidden">
                <Collapsible open={isNotesSectionOpen} onOpenChange={setIsNotesSectionOpen}>
                  <div className="bg-gradient-card rounded-xl p-3 border border-border/50 shadow-md transition-all duration-200 h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <ChevronDown className={`h-5 w-5 transition-transform ${isNotesSectionOpen ? '' : '-rotate-90'}`} />
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            <h2 className="text-lg font-bold text-foreground uppercase">Anotações e Lembretes</h2>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="mt-3">
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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

      {/* Register Handover Dialog */}
      <RegisterHandoverDialog
        open={handoverDialogOpen}
        onOpenChange={setHandoverDialogOpen}
        patients={patients}
      />
    </SidebarProvider>
  );
};

export default Index;
