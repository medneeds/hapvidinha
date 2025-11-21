import { useState, useEffect } from "react";
import { SectorSection } from "@/components/SectorSection";
import { PatientCard } from "@/components/PatientCard";
import { PrintLayout } from "@/components/PrintLayout";
import { PrintPatientLayout } from "@/components/PrintPatientLayout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Patient } from "@/types/patient";
import { Activity, Users, Clock, Printer, Eye, EyeOff, ClipboardList, LogOut, CheckSquare, Trash2, Undo, Redo, Plus, StickyNote, Edit, List, X, FileText, ChevronDown, GripVertical, ClipboardCheck, Save, MoreVertical, Building2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment, DEPARTMENTS, Department } from "@/contexts/DepartmentContext";
import { supabase } from "@/integrations/supabase/client";
import { RegisterHandoverDialog } from "@/components/RegisterHandoverDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/usePatients";
import { usePatientVersions } from "@/hooks/usePatientVersions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  onUndelete?: (patient: Patient) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
  onTransfer?: (patientId: string, newSector: Patient['sector']) => void;
  onPrintPatient?: (patientId: string) => void;
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
  // Use department context
  const { currentDepartment, setCurrentDepartment } = useDepartment();
  
  // Use real database patients filtered by department
  const { patients: dbPatients, isLoading: patientsLoading, updatePatient: dbUpdatePatient, createPatient: dbCreatePatient, deletePatient: dbDeletePatient, refetch } = usePatients(currentDepartment);
  const [patients, setPatients] = useState<Patient[]>(dbPatients);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const [isRedSectionOpen, setIsRedSectionOpen] = useState(false);
  const [isYellowSectionOpen, setIsYellowSectionOpen] = useState(false);
  const [isBlueSectionOpen, setIsBlueSectionOpen] = useState(false);
  const [isOutsideSectionOpen, setIsOutsideSectionOpen] = useState(false);
  const [isNotesSectionOpen, setIsNotesSectionOpen] = useState(false);
  const [printingSector, setPrintingSector] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'compact' | 'detailed' | null>(null);
  const [printingPatientId, setPrintingPatientId] = useState<string | null>(null);
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [isDeleteSelectedDialogOpen, setIsDeleteSelectedDialogOpen] = useState(false);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const { toast } = useToast();
  const { signOut, user, role, allowedDepartments, loading: authLoading } = useAuth();
  const { saveVersion, fetchVersions } = usePatientVersions();
  const isMobile = useIsMobile();

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

  // Sync database patients to local state
  useEffect(() => {
    if (dbPatients.length > 0) {
      setPatients(dbPatients);
    }
  }, [dbPatients]);

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

  // Smart auto-open sections when they have data (but don't auto-close)
  useEffect(() => {
    const red = patients.filter((p) => p.sector === "red");
    const yellow = patients.filter((p) => p.sector === "yellow");
    const blue = patients.filter((p) => p.sector === "blue");
    const outside = patients.filter((p) => p.sector === "outside");
    
    // Check if sections have any patient with data
    const hasRedData = red.some(p => p.name.trim() !== "");
    const hasYellowData = yellow.some(p => p.name.trim() !== "");
    const hasBlueData = blue.some(p => p.name.trim() !== "");
    const hasOutsideData = outside.some(p => p.name.trim() !== "");
    const hasNotesData = notes.trim() !== "" || checklist.length > 0;
    
    // Only open sections when they have data, never force close
    if (hasRedData) setIsRedSectionOpen(true);
    if (hasYellowData) setIsYellowSectionOpen(true);
    if (hasBlueData) setIsBlueSectionOpen(true);
    if (hasOutsideData) setIsOutsideSectionOpen(true);
    if (hasNotesData) setIsNotesSectionOpen(true);
  }, [patients, notes, checklist]);

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

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    saveToHistory(patients);
    
    try {
      // Update in database
      await dbUpdatePatient(updatedPatient.id, updatedPatient);
      
      // Update local state (will be synced by realtime)
      setPatients((prev) =>
        prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
      );
    } catch (error) {
      // Error toast already shown in dbUpdatePatient
      console.error("Failed to update patient:", error);
    }
  };

  const handleAddExtraBed = async (sector: Patient['sector']) => {
    saveToHistory(patients);
    const sectorPrefix = sector === 'red' ? 'V' : sector === 'yellow' ? 'A' : sector === 'blue' ? 'Z' : 'F';
    
    // Buscar todos os pacientes deste setor do banco de dados para garantir unicidade
    const { data: allSectorPatients } = await supabase
      .from('patients')
      .select('bed_number')
      .eq('sector', sector)
      .eq('department', currentDepartment);
    
    const bedNumbers = (allSectorPatients || [])
      .map(p => parseInt(p.bed_number.substring(1)))
      .filter(n => !isNaN(n));
    
    const maxBedNumber = bedNumbers.length > 0 ? Math.max(...bedNumbers) : 0;
    const extraBedNumber = maxBedNumber + 1;
    
    const newPatientData = {
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

    try {
      await dbCreatePatient(newPatientData, currentDepartment);
      
      // Expandir automaticamente a seção correspondente
      if (sector === 'red') setIsRedSectionOpen(true);
      else if (sector === 'yellow') setIsYellowSectionOpen(true);
      else if (sector === 'blue') setIsBlueSectionOpen(true);
      else if (sector === 'outside') setIsOutsideSectionOpen(true);
    } catch (error) {
      console.error("Failed to create patient:", error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    saveToHistory(patients);
    try {
      await dbDeletePatient(patientId);
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const handleUndeletePatient = async (patient: Patient) => {
    try {
      await dbCreatePatient({
        bedNumber: patient.bedNumber,
        name: patient.name,
        age: patient.age,
        sector: patient.sector,
        diagnoses: patient.diagnoses,
        medicalHistory: patient.medicalHistory,
        relevantExams: patient.relevantExams,
        pendencies: patient.pendencies,
        schedule: patient.schedule,
        admissionHistory: patient.admissionHistory,
        admissionDate: patient.admissionDate,
      }, currentDepartment);
      toast({
        title: "Exclusão desfeita",
        description: `Leito ${patient.bedNumber} - ${patient.name} foi restaurado.`,
      });
    } catch (error) {
      console.error("Failed to restore patient:", error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar o leito.",
        variant: "destructive",
      });
    }
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
    setIsDeleteSelectedDialogOpen(true);
  };

  const confirmDeleteSelected = async () => {
    if (selectedPatients.size === 0) return;
    
    saveToHistory(patients);
    const selectedCount = selectedPatients.size;
    const selectedPatientsList = Array.from(selectedPatients);
    
    try {
      // Delete all selected patients from database in parallel (without toasts or local state updates)
      await Promise.all(
        selectedPatientsList.map(patientId => 
          dbDeletePatient(patientId, { showToast: false, updateLocalState: false })
        )
      );
      
      // Update local state once after all deletions
      setPatients(prev => prev.filter(p => !selectedPatients.has(p.id)));
      
      toast({
        title: "Pacientes excluídos",
        description: `${selectedCount} leito(s) removido(s) com sucesso.`,
      });
      
      setSelectedPatients(new Set());
      setSelectionMode(false);
      setIsDeleteSelectedDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete selected patients:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir alguns pacientes.",
        variant: "destructive",
      });
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

  const handleSaveVersion = async () => {
    try {
      await saveVersion(patients, currentDepartment);
      await fetchVersions(currentDepartment);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
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

  const handleRefreshMap = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Mapa atualizado",
        description: "Os dados foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o mapa.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handlePrintCompact = () => {
    // Imprime direto no modo compacto
    setPrintMode('compact');
    setPrintingSector(null);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 300);
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
      <div 
        className="flex min-h-screen w-full bg-background"
      >
        <AppSidebar 
          onOpenHandover={() => setHandoverDialogOpen(true)} 
        />
        
        {/* Print-only layout - Hidden on screen, visible only when printing */}
        {printMode && (
          <div className="print-layout-container">
            <PrintLayout 
              redPatients={printingSector === "red" ? redPatients : printingSector === "selected" ? redPatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : redPatients}
              yellowPatients={printingSector === "yellow" ? yellowPatients : printingSector === "selected" ? yellowPatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : yellowPatients}
              bluePatients={printingSector === "blue" ? bluePatients : printingSector === "selected" ? bluePatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : bluePatients}
              outsidePatients={printingSector === "outside" ? outsidePatients : printingSector === "selected" ? outsidePatients.filter(p => selectedPatients.has(p.id)) : printingSector ? [] : outsidePatients}
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
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <h1 className="text-sm sm:text-2xl font-bold text-white print:text-xs uppercase tracking-tight truncate">Mapa de Pacientes - Hospital Guarás</h1>
                    <div className="print:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center gap-1.5 h-7 px-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold hover:bg-white/25 transition-all duration-200 rounded-full cursor-pointer shadow-sm hover:shadow-md">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[140px] sm:max-w-none">{currentDepartment}</span>
                            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background border border-border shadow-lg z-[9999] min-w-[280px]">
                          {authLoading ? (
                            <DropdownMenuItem disabled className="text-sm py-2.5 px-3">
                              Carregando...
                            </DropdownMenuItem>
                          ) : (
                            DEPARTMENTS
                              .filter(dept => {
                                // Admin (COORDENADOR) vê todos os departamentos
                                if (role === 'admin') return true;
                                // Outros usuários veem apenas seus departamentos permitidos
                                return allowedDepartments.includes(dept);
                              })
                              .map((dept) => (
                            <DropdownMenuItem 
                              key={dept} 
                              className={cn(
                                "text-sm cursor-pointer py-2.5 px-3 transition-colors",
                                currentDepartment === dept && "bg-accent font-medium"
                              )}
                              onClick={() => {
                                if (dept !== currentDepartment) {
                                  // Admin pode trocar sem senha
                                  if (role === 'admin') {
                                    setCurrentDepartment(dept);
                                    toast({
                                      title: "Setor alterado",
                                      description: `Alternado para: ${dept}`,
                                    });
                                  } else {
                                    // Usuários não-admin NÃO podem trocar de departamento
                                    // (eles só veem seus departamentos permitidos no dropdown)
                                    toast({
                                      title: "Acesso negado",
                                      description: "Você não tem permissão para alterar departamentos.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Building2 className="h-4 w-4 mr-2 opacity-60" />
                              {dept}
                            </DropdownMenuItem>
                          ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 sm:gap-3 print:gap-2 items-center flex-shrink-0">
                  {/* Mobile: Show only essential buttons + dropdown menu */}
                  {isMobile ? (
                    <>
                      <Button
                        variant={selectionMode ? "default" : "outline"}
                        size="icon"
                        onClick={handleToggleSelectionMode}
                        className={`print:hidden h-9 w-9 ${selectionMode ? 'bg-white text-[#013ba6] shadow-md' : 'bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]'}`}
                        title="Modo de seleção"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                      {selectionMode && selectedPatients.size > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrintSelected}
                            className="print:hidden h-9 w-9 bg-gradient-to-br from-critical via-warning to-stable text-white border-0"
                            title={`Imprimir ${selectedPatients.size}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDeleteSelected}
                            className="print:hidden h-9 w-9 bg-red-600 text-white hover:bg-red-700 border-0"
                            title={`Deletar ${selectedPatients.size}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="print:hidden h-9 w-9 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                          <DropdownMenuItem onClick={handleUndo} disabled={history.length === 0}>
                            <Undo className="mr-2 h-4 w-4" />
                            Desfazer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleRedo} disabled={redoHistory.length === 0}>
                            <Redo className="mr-2 h-4 w-4" />
                            Refazer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleSaveVersion}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Versão
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleRefreshMap} disabled={isRefreshing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Atualizar Mapa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handlePrintCompact}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Mapa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowOnlyOccupied(!showOnlyOccupied)}>
                            {showOnlyOccupied ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                            {showOnlyOccupied ? "Mostrar Vazios" : "Ocultar Vazios"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={signOut} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    /* Desktop: Show all buttons as before */
                    <>
                      <ThemeToggle />
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
                        variant="outline"
                        size="icon"
                        onClick={handleSaveVersion}
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                        title="Salvar versão"
                      >
                        <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefreshMap}
                        disabled={isRefreshing}
                        className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-white/90 border-white text-[#013ba6] hover:bg-white hover:text-[#013ba6]"
                        title="Atualizar mapa"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                            className="print:hidden h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-critical via-warning to-stable text-white border-0 hover:shadow-lg hover:scale-105 transition-all"
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
                        className="print:hidden hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-critical via-warning to-stable text-white border-0 hover:shadow-lg hover:scale-105 transition-all"
                        title="Imprimir"
                      >
                        <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10 border border-white/20">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[9px] text-white/70 uppercase leading-none tracking-wide font-medium">Total</p>
                          <p className="text-lg font-bold text-white leading-tight mt-0.5">{totalPatients}</p>
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
                    </>
                  )}
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
                  onUndeletePatient={handleUndeletePatient}
                  onPrintSector={() => handlePrintSector("red")}
                  onAddExtraBed={() => handleAddExtraBed("red")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("red", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                  isOpen={isRedSectionOpen}
                  onOpenChange={setIsRedSectionOpen}
                />
              </div>
              <div>
                <SectorSection 
                  sector="yellow" 
                  patients={yellowPatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  onUndeletePatient={handleUndeletePatient}
                  onPrintSector={() => handlePrintSector("yellow")}
                  onAddExtraBed={() => handleAddExtraBed("yellow")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("yellow", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                  isOpen={isYellowSectionOpen}
                  onOpenChange={setIsYellowSectionOpen}
                />
              </div>
              <div>
                <SectorSection 
                  sector="blue" 
                  patients={bluePatients} 
                  onUpdatePatient={handleUpdatePatient}
                  onDeletePatient={handleDeletePatient}
                  onUndeletePatient={handleUndeletePatient}
                  onPrintSector={() => handlePrintSector("blue")}
                  onAddExtraBed={() => handleAddExtraBed("blue")}
                  selectionMode={selectionMode}
                  selectedPatients={selectedPatients}
                  onToggleSelection={handleToggleSelection}
                  onReorderPatients={(reordered) => handleReorderPatients("blue", reordered)}
                  onTransfer={handleTransferPatient}
                  onPrintPatient={handlePrintPatient}
                  isOpen={isBlueSectionOpen}
                  onOpenChange={setIsBlueSectionOpen}
                />
              </div>

              {/* Pacientes Fora das Alas Section */}
              <div className="mt-6 print:hidden">
                <Collapsible open={isOutsideSectionOpen} onOpenChange={setIsOutsideSectionOpen}>
                  <div className="bg-gradient-card rounded-xl p-2 border border-border/50 shadow-md transition-all duration-200 min-h-[48px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <ChevronDown className={`h-5 w-5 transition-transform ${isOutsideSectionOpen ? '' : '-rotate-90'}`} />
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📍</span>
                            <h2 className="text-lg font-bold text-foreground uppercase">Fora das Alas</h2>
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePrintSector("outside")}
                          className="h-8 w-8"
                          title="Imprimir seção"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center justify-center h-8 w-8 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
                          <p className="text-base font-bold text-foreground">{outsidePatients.length}</p>
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
                                onUndelete={handleUndeletePatient}
                                selectionMode={selectionMode}
                                isSelected={selectedPatients.has(patient.id)}
                                onToggleSelection={handleToggleSelection}
                                onTransfer={handleTransferPatient}
                                onPrintPatient={handlePrintPatient}
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
                  <div className="bg-gradient-card rounded-xl p-2 border border-border/50 shadow-md transition-all duration-200 min-h-[48px] flex items-center">
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

      {/* Department Change Password Dialog - Removido, apenas admin pode trocar */}

      {/* Delete Multiple Patients Confirmation Dialog */}
      <AlertDialog open={isDeleteSelectedDialogOpen} onOpenChange={setIsDeleteSelectedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão Múltipla</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedPatients.size} leito(s)</strong> selecionado(s)?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Index;
