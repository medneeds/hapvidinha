import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown, ChevronUp, Plus, Clock, Calendar, Trash2, FileEdit, Send, ChevronsUpDown, Copy, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { toast } from "sonner";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Evolution {
  id: string;
  content: string;
  created_by_email: string | null;
  created_at: string;
}

interface GroupedEvolutions {
  label: string;
  date: string;
  evolutions: Evolution[];
}

interface PatientEvolutionsPanelProps {
  patientId: string;
  patientName: string;
}

type FieldSize = 'compact' | 'medium' | 'expanded';

const FIELD_SIZES: Record<FieldSize, { label: string; maxH: string; inputH: string }> = {
  compact: { label: 'P', maxH: 'max-h-[80px]', inputH: 'min-h-[60px] max-h-[120px]' },
  medium: { label: 'M', maxH: 'max-h-[160px]', inputH: 'min-h-[100px] max-h-[200px]' },
  expanded: { label: 'G', maxH: 'max-h-[400px]', inputH: 'min-h-[160px] max-h-[400px]' },
};

export function PatientEvolutionsPanel({ patientId, patientName }: PatientEvolutionsPanelProps) {
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fieldSize, setFieldSize] = useState<FieldSize>('medium');
  const { user, role: userRole } = useAuth();
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();

  const fetchEvolutions = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)('patient_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvolutions(data || []);
    } catch (err) {
      console.error('Error fetching evolutions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchEvolutions();
  }, [fetchEvolutions]);

  const handleSave = async () => {
    if (!newContent.trim() || !currentHospital || !currentState) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase.from as any)('patient_evolutions').insert({
        patient_id: patientId,
        content: newContent.trim(),
        created_by: user?.id,
        created_by_email: user?.email,
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        department: currentDepartment,
      });
      if (error) throw error;
      toast.success('Evolução registrada com sucesso');
      setNewContent("");
      setIsAdding(false);
      await fetchEvolutions();
    } catch (err) {
      console.error('Error saving evolution:', err);
      toast.error('Erro ao salvar evolução');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase.from as any)('patient_evolutions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Evolução removida');
      setEvolutions(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      toast.error('Erro ao remover evolução');
    }
    setDeleteId(null);
  };

  const handleDuplicate = (content: string) => {
    setNewContent(content);
    setIsAdding(true);
    toast.info('Evolução copiada para edição');
  };

  const getDateLabel = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const groupedEvolutions: GroupedEvolutions[] = evolutions.reduce<GroupedEvolutions[]>((groups, evo) => {
    const dateKey = format(parseISO(evo.created_at), 'yyyy-MM-dd');
    const label = getDateLabel(evo.created_at);
    const existing = groups.find(g => g.date === dateKey);
    if (existing) {
      existing.evolutions.push(evo);
    } else {
      groups.push({ label, date: dateKey, evolutions: [evo] });
    }
    return groups;
  }, []);

  const toggleGroup = (date: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(groupedEvolutions.map(g => g.date)));
    }
    setAllCollapsed(!allCollapsed);
  };

  const cycleFieldSize = () => {
    const sizes: FieldSize[] = ['compact', 'medium', 'expanded'];
    const idx = sizes.indexOf(fieldSize);
    setFieldSize(sizes[(idx + 1) % sizes.length]);
  };

  const extractUsername = (email: string | null) => {
    if (!email) return "Desconhecido";
    return email.split('@')[0].toUpperCase();
  };

  const currentSize = FIELD_SIZES[fieldSize];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground uppercase">
            Evoluções Clínicas
          </h4>
          {evolutions.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {evolutions.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Field size toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleFieldSize}
            className="h-7 px-2 text-xs text-muted-foreground"
            title={`Tamanho: ${fieldSize === 'compact' ? 'Compacto' : fieldSize === 'medium' ? 'Médio' : 'Expandido'}`}
          >
            {fieldSize === 'compact' ? (
              <Minimize2 className="h-3.5 w-3.5 mr-1" />
            ) : fieldSize === 'expanded' ? (
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 mr-1 opacity-50" />
            )}
            {currentSize.label}
          </Button>
          {groupedEvolutions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              {allCollapsed ? "Expandir" : "Retrair"}
            </Button>
          )}
          <Button
            variant={isAdding ? "secondary" : "default"}
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="h-7 px-2.5 text-xs"
          >
            {isAdding ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Nova Evolução
              </>
            )}
          </Button>
        </div>
      </div>

      {/* New evolution input */}
      {isAdding && (
        <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
            <span className="text-primary font-medium">• {extractUsername(user?.email || null)}</span>
          </div>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Descreva a evolução clínica do paciente..."
            className={cn("text-xs uppercase resize-y overflow-y-auto", currentSize.inputH)}
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!newContent.trim() || isSaving}
              className="h-7 px-3 text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              {isSaving ? "Salvando..." : "Registrar Evolução"}
            </Button>
          </div>
        </div>
      )}

      {/* Evolutions list */}
      {isLoading ? (
        <div className="text-center text-xs text-muted-foreground py-4">Carregando evoluções...</div>
      ) : evolutions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <FileEdit className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Nenhuma evolução registrada</p>
          <p className="text-[10px] mt-0.5 opacity-70">Clique em "Nova Evolução" para adicionar</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-3 pr-2">
            {groupedEvolutions.map((group) => {
              const isCollapsed = collapsedGroups.has(group.date);
              return (
                <Collapsible
                  key={group.date}
                  open={!isCollapsed}
                  onOpenChange={() => toggleGroup(group.date)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors group">
                      <Calendar className="h-3.5 w-3.5 text-primary/70" />
                      <span className="text-xs font-semibold text-foreground uppercase flex-1 text-left">
                        {group.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {group.evolutions.length} {group.evolutions.length === 1 ? 'registro' : 'registros'}
                      </Badge>
                      {isCollapsed ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-1">
                    <div className="space-y-1.5 pl-2 border-l-2 border-primary/20 ml-[7px]">
                      {group.evolutions.map((evo) => (
                        <div
                          key={evo.id}
                          className="relative pl-4 py-2 px-3 bg-card/80 border border-border/40 rounded-lg hover:border-border/70 transition-all group/item"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[7px] top-3.5 w-3 h-3 rounded-full bg-primary/30 border-2 border-primary/60 group-hover/item:bg-primary/50 transition-colors" />
                          
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1 min-w-0">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="font-medium">
                                  {format(parseISO(evo.created_at), "HH:mm")}
                                </span>
                                <span className="text-primary/80 font-semibold">
                                  • {extractUsername(evo.created_by_email)}
                                </span>
                              </div>
                              {/* Scrollable read-only content with adjustable size */}
                              <div className={cn(
                                "overflow-y-auto scrollbar-thin rounded-md p-1",
                                currentSize.maxH
                              )}>
                                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap uppercase select-text">
                                  {evo.content}
                                </p>
                              </div>
                            </div>
                            {/* Action buttons: copy (duplicate) and delete (admin only) */}
                            <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => handleDuplicate(evo.content)}
                                title="Duplicar para nova evolução"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              {userRole === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive/60 hover:text-destructive"
                                  onClick={() => setDeleteId(evo.id)}
                                  title="Excluir evolução"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir esta evolução? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
