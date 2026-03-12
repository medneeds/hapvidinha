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
import { ChevronDown, ChevronUp, Plus, Clock, Calendar, Ban, FileEdit, Send, ChevronsUpDown, Copy, Maximize2, Minimize2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { toast } from "sonner";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { whitelabel } from "@/config/whitelabel";

interface Evolution {
  id: string;
  content: string;
  created_by_email: string | null;
  created_at: string;
  suspended?: boolean;
  suspended_at?: string | null;
  suspended_by?: string | null;
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
  const [suspendId, setSuspendId] = useState<string | null>(null);
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

  const handleSuspend = async (id: string) => {
    try {
      const { error } = await (supabase.from as any)('patient_evolutions')
        .update({ 
          suspended: true, 
          suspended_at: new Date().toISOString(),
          suspended_by: user?.email || null
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Evolução suspensa');
      setEvolutions(prev => prev.map(e => 
        e.id === id ? { ...e, suspended: true, suspended_at: new Date().toISOString(), suspended_by: user?.email || null } : e
      ));
    } catch (err) {
      toast.error('Erro ao suspender evolução');
    }
    setSuspendId(null);
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

  const handlePrint = () => {
    if (evolutions.length === 0) {
      toast.info('Nenhuma evolução para imprimir');
      return;
    }

    const activeEvolutions = evolutions.filter(e => !e.suspended);
    const suspendedEvolutions = evolutions.filter(e => e.suspended);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const networkLogoUrl = new URL(whitelabel.logos.networkFull, window.location.origin).href;

    const evolutionRows = (evos: Evolution[], isSuspended = false) => evos.map(evo => {
      const evoDate = format(parseISO(evo.created_at), "dd/MM/yyyy");
      const evoTime = format(parseISO(evo.created_at), "HH:mm");
      const author = extractUsername(evo.created_by_email);
      return `
        <tr style="${isSuspended ? 'opacity: 0.55;' : ''}">
          <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 8pt; color: #4b5563; white-space: nowrap; vertical-align: top;">
            ${evoDate}<br/><strong>${evoTime}</strong>
          </td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 8pt; color: #013ba6; font-weight: 600; white-space: nowrap; vertical-align: top;">
            ${author}
          </td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 8.5pt; color: #1f2937; text-align: justify; line-height: 1.55; ${isSuspended ? 'text-decoration: line-through; color: #9ca3af;' : ''}">
            ${evo.content.replace(/\n/g, '<br/>')}
            ${isSuspended ? '<br/><span style="font-size: 6.5pt; color: #ef4444; font-style: italic;">SUSPENSA</span>' : ''}
          </td>
        </tr>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Evoluções - ${patientName}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; overflow: hidden; }

  .header {
    background: linear-gradient(135deg, #002b80 0%, #013ba6 40%, #0152d4 100%);
    padding: 20px 36px 16px; display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .header::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
  }
  .header .logo-main img { height: 48px; filter: brightness(0) invert(1); }

  .title-bar {
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    padding: 10px 36px; display: flex; align-items: center; justify-content: space-between;
  }
  .title-bar h1 { font-size: 10pt; font-weight: 700; color: #013ba6; text-transform: uppercase; letter-spacing: 2px; }
  .title-bar .hospital-name { font-size: 7.5pt; color: #64748b; font-weight: 500; }

  .patient-strip {
    background: #eef2ff; border-bottom: 1px solid #ddd6fe;
    padding: 10px 36px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  }
  .patient-strip .field { display: flex; flex-direction: column; }
  .patient-strip .field-label { font-size: 5.5pt; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
  .patient-strip .field-value { font-size: 8.5pt; color: #111827; font-weight: 600; margin-top: 1px; }
  .patient-strip .divider { width: 1px; height: 24px; background: #c7d2fe; }

  .body-content { padding: 20px 36px 90px; }
  
  .evo-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .evo-table th {
    background: #f1f5f9; padding: 6px 10px; font-size: 7pt; text-transform: uppercase;
    letter-spacing: 1px; font-weight: 700; color: #475569; text-align: left;
    border-bottom: 2px solid #cbd5e1;
  }

  .section-label {
    font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;
    color: #013ba6; margin: 16px 0 6px; padding-bottom: 4px;
    border-bottom: 1.5px solid #dbeafe; display: flex; align-items: center; gap: 6px;
  }
  .section-label::before { content: ''; width: 3px; height: 12px; background: #013ba6; border-radius: 2px; display: inline-block; }

  .watermark {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg);
    opacity: 0.06; z-index: 0; pointer-events: none;
  }
  .watermark img { width: 320px; }

  .footer { position: fixed; bottom: 0; left: 0; right: 0; width: 210mm; margin: 0 auto; background: #fff; }
  .footer-accent { height: 2px; background: linear-gradient(90deg, #013ba6, #0152d4, #38bdf8, #0152d4, #013ba6); }
  .footer-content { padding: 8px 36px; display: flex; align-items: center; justify-content: space-between; }
  .footer-content .address { font-size: 6pt; color: #94a3b8; line-height: 1.4; max-width: 55%; }
  .footer-content .meta { font-size: 6pt; color: #94a3b8; text-align: right; line-height: 1.4; }
  .footer-content .meta .brand { font-weight: 600; color: #cbd5e1; }

  @media print { html, body { margin: 0 !important; padding: 0 !important; } .page { margin: 0; width: 100%; } }
  @media screen { .page { box-shadow: 0 8px 32px rgba(0,0,0,0.10); margin: 20px auto; border-radius: 3px; } }
</style></head><body>
<div class="page">
  <div class="watermark"><img src="${networkLogoUrl}" alt="" /></div>
  <div class="header"><div class="logo-main"><img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" /></div></div>
  <div class="title-bar"><h1>Evoluções Clínicas</h1><span class="hospital-name">${whitelabel.institution.hospitalName}</span></div>
  <div class="patient-strip">
    <div class="field"><span class="field-label">Paciente</span><span class="field-value">${patientName}</span></div>
    <div class="divider"></div>
    <div class="field"><span class="field-label">Total Evoluções</span><span class="field-value">${activeEvolutions.length} ativa(s)${suspendedEvolutions.length > 0 ? ` / ${suspendedEvolutions.length} suspensa(s)` : ''}</span></div>
    <div class="divider"></div>
    <div class="field"><span class="field-label">Emissão</span><span class="field-value">${dateStr} às ${timeStr}</span></div>
  </div>
  <div class="body-content">
    ${activeEvolutions.length > 0 ? `
    <div class="section-label">Evoluções Ativas</div>
    <table class="evo-table">
      <thead><tr><th>Data/Hora</th><th>Autor</th><th>Evolução</th></tr></thead>
      <tbody>${evolutionRows(activeEvolutions)}</tbody>
    </table>` : ''}
    ${suspendedEvolutions.length > 0 ? `
    <div class="section-label" style="color: #9ca3af; margin-top: 24px;">Evoluções Suspensas</div>
    <table class="evo-table">
      <thead><tr><th>Data/Hora</th><th>Autor</th><th>Evolução</th></tr></thead>
      <tbody>${evolutionRows(suspendedEvolutions, true)}</tbody>
    </table>` : ''}
  </div>
  <div class="footer">
    <div class="footer-accent"></div>
    <div class="footer-content">
      <div class="address">${whitelabel.institution.hospitalName}<br/>Urgência e Emergência — Evoluções Clínicas</div>
      <div class="meta"><span class="brand">${whitelabel.credits.footerText}</span><br/>${dateStr} às ${timeStr}</div>
    </div>
  </div>
</div>
</body></html>`);
    printWindow.document.close();

    const images = printWindow.document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    Promise.all(imagePromises).then(() => {
      setTimeout(() => printWindow.print(), 300);
    });
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
                          className={cn(
                            "relative pl-4 py-2 px-3 border rounded-lg transition-all group/item",
                            evo.suspended 
                              ? "bg-muted/40 border-border/30 opacity-60" 
                              : "bg-card/80 border-border/40 hover:border-border/70"
                          )}
                        >
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute -left-[7px] top-3.5 w-3 h-3 rounded-full border-2 transition-colors",
                            evo.suspended
                              ? "bg-muted-foreground/20 border-muted-foreground/40"
                              : "bg-primary/30 border-primary/60 group-hover/item:bg-primary/50"
                          )} />
                          
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
                                {evo.suspended && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-destructive border-destructive/30">
                                    SUSPENSA
                                  </Badge>
                                )}
                              </div>
                              {/* Scrollable read-only content with adjustable size */}
                              <div className={cn(
                                "overflow-y-auto scrollbar-thin rounded-md p-1",
                                currentSize.maxH
                              )}>
                                <p className={cn(
                                  "text-xs leading-relaxed whitespace-pre-wrap uppercase select-text",
                                  evo.suspended ? "text-muted-foreground line-through" : "text-foreground"
                                )}>
                                  {evo.content}
                                </p>
                              </div>
                              {evo.suspended && evo.suspended_by && (
                                <p className="text-[9px] text-muted-foreground italic">
                                  Suspensa por {extractUsername(evo.suspended_by)} em {evo.suspended_at ? format(parseISO(evo.suspended_at), "dd/MM/yyyy 'às' HH:mm") : ''}
                                </p>
                              )}
                            </div>
                            {/* Action buttons: copy and suspend */}
                            {!evo.suspended && (
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-amber-500/60 hover:text-amber-600"
                                  onClick={() => setSuspendId(evo.id)}
                                  title="Suspender evolução"
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
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

      {/* Suspend confirmation */}
      <AlertDialog open={!!suspendId} onOpenChange={() => setSuspendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar suspensão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja suspender esta evolução? Ela ficará visível com indicação de suspensa, mas não poderá ser reativada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => suspendId && handleSuspend(suspendId)}>
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
