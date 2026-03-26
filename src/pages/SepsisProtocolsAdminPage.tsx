import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Activity, Search, FileText, Eye, Download, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { generateSepsisProtocolPdf } from "@/utils/sepsisProtocolPdf";

interface SepsisProtocolRow {
  id: string;
  patient_name: string;
  patient_id: string | null;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  outcome: string | null;
  outcome_date: string | null;
  outcome_time: string | null;
  has_infection: boolean | null;
  has_organic_dysfunction: boolean | null;
  sirs_temp_high: boolean | null;
  sirs_temp_low: boolean | null;
  sirs_heart_rate: boolean | null;
  sirs_respiratory_rate: boolean | null;
  sirs_leukocytosis: boolean | null;
  sirs_leukopenia: boolean | null;
  sirs_young_cells: boolean | null;
  dysfunction_hypotension: boolean | null;
  dysfunction_oliguria: boolean | null;
  dysfunction_pao2: boolean | null;
  dysfunction_platelets: boolean | null;
  dysfunction_acidosis: boolean | null;
  dysfunction_consciousness: boolean | null;
  dysfunction_bilirubin: boolean | null;
  focus_pulmonary: boolean | null;
  focus_urinary: boolean | null;
  focus_abdominal: boolean | null;
  focus_skin: boolean | null;
  focus_neurological: boolean | null;
  focus_other: string | null;
  responsible_name: string | null;
  hospital: string | null;
  attendance_number: string | null;
  birth_date: string | null;
  patient_weight: number | null;
  blood_culture_date: string | null;
  blood_culture_time: string | null;
  lactate_date: string | null;
  lactate_time: string | null;
  antibiotic_prescription_date: string | null;
  antibiotic_prescription_time: string | null;
  volume_administered: number | null;
  destination: string | null;
  destination_date: string | null;
  destination_time: string | null;
  notes: string | null;
}

export default function SepsisProtocolsAdminPage() {
  const [protocols, setProtocols] = useState<SepsisProtocolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<SepsisProtocolRow | null>(null);
  const { currentHospital, currentState } = useHospital();

  useEffect(() => {
    fetchProtocols();
  }, [currentHospital, currentState]);

  const fetchProtocols = async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sepsis_protocols')
        .select('*')
        .eq('hospital_unit_id', currentHospital.id)
        .eq('state_id', currentState.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProtocols((data || []) as unknown as SepsisProtocolRow[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sirsCount = (p: SepsisProtocolRow) => [p.sirs_temp_high, p.sirs_temp_low, p.sirs_heart_rate, p.sirs_respiratory_rate, p.sirs_leukocytosis, p.sirs_leukopenia, p.sirs_young_cells].filter(Boolean).length;
  const dysfunctionCount = (p: SepsisProtocolRow) => [p.dysfunction_hypotension, p.dysfunction_oliguria, p.dysfunction_pao2, p.dysfunction_platelets, p.dysfunction_acidosis, p.dysfunction_consciousness, p.dysfunction_bilirubin].filter(Boolean).length;

  const filtered = protocols.filter(p => {
    const matchesSearch = !search || p.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchesOutcome = filterOutcome === "all" || (filterOutcome === "active" ? !p.outcome : p.outcome === filterOutcome);
    return matchesSearch && matchesOutcome;
  });

  const stats = {
    total: protocols.length,
    active: protocols.filter(p => !p.outcome).length,
    finalized: protocols.filter(p => !!p.outcome).length,
    deaths: protocols.filter(p => p.outcome === "ÓBITO").length,
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-300"><Clock className="h-3 w-3 mr-1" />EM CURSO</Badge>;
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      "ALTA": { color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-300", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      "ÓBITO": { color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-300", icon: <XCircle className="h-3 w-3 mr-1" /> },
      "TRANSFERÊNCIA": { color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-300", icon: <Activity className="h-3 w-3 mr-1" /> },
      "INTERNAÇÃO": { color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-300", icon: <Activity className="h-3 w-3 mr-1" /> },
      "SEPSE DESCARTADA": { color: "bg-muted text-muted-foreground border-border", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    };
    const cfg = map[outcome] || map["SEPSE DESCARTADA"];
    return <Badge variant="outline" className={cfg.color}>{cfg.icon}{outcome}</Badge>;
  };

  const handleExportPdf = (protocol: SepsisProtocolRow) => {
    generateSepsisProtocolPdf(protocol);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Protocolos Sepse</h1>
          <p className="text-xs text-muted-foreground">Registro e análise de todos os protocolos de sepse realizados</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Total</p></CardContent></Card>
        <Card className="border-orange-300 dark:border-orange-800"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{stats.active}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Em Curso</p></CardContent></Card>
        <Card className="border-green-300 dark:border-green-800"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.finalized}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Finalizados</p></CardContent></Card>
        <Card className="border-red-300 dark:border-red-800"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.deaths}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Óbitos</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="BUSCAR POR PACIENTE..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 uppercase" />
        </div>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">TODOS</SelectItem>
            <SelectItem value="active">EM CURSO</SelectItem>
            <SelectItem value="ALTA">ALTA</SelectItem>
            <SelectItem value="ÓBITO">ÓBITO</SelectItem>
            <SelectItem value="TRANSFERÊNCIA">TRANSFERÊNCIA</SelectItem>
            <SelectItem value="INTERNAÇÃO">INTERNAÇÃO</SelectItem>
            <SelectItem value="SEPSE DESCARTADA">SEPSE DESCARTADA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Paciente</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Abertura</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">SIRS</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Disfunções</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Infecção</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Desfecho</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum protocolo encontrado</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedProtocol(p)}>
                    <TableCell className="font-semibold text-xs uppercase max-w-[200px] truncate">{p.patient_name}</TableCell>
                    <TableCell className="text-xs">{p.opening_date ? format(new Date(`${p.opening_date}T${p.opening_time || '00:00'}`), "dd/MM/yy HH:mm") : format(new Date(p.created_at), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", sirsCount(p) >= 2 ? "border-red-300 text-red-600" : "")}>{sirsCount(p)}/7</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-[10px]", dysfunctionCount(p) > 0 ? "border-amber-300 text-amber-600" : "")}>{dysfunctionCount(p)}/7</Badge></TableCell>
                    <TableCell>{p.has_infection === true ? <Badge variant="outline" className="text-[10px] border-red-300 text-red-600">SIM</Badge> : p.has_infection === false ? <Badge variant="outline" className="text-[10px]">NÃO</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{getOutcomeBadge(p.outcome)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setSelectedProtocol(p); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); handleExportPdf(p); }}><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedProtocol} onOpenChange={v => { if (!v) setSelectedProtocol(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selectedProtocol && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base uppercase">
                  <Activity className="h-5 w-5 text-destructive" />
                  {selectedProtocol.patient_name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Protocolo aberto em {selectedProtocol.opening_date ? format(new Date(`${selectedProtocol.opening_date}T${selectedProtocol.opening_time || '00:00'}`), "dd/MM/yyyy 'às' HH:mm") : format(new Date(selectedProtocol.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {getOutcomeBadge(selectedProtocol.outcome)}
                  {selectedProtocol.outcome_date && <span className="text-xs text-muted-foreground">em {selectedProtocol.outcome_date} {selectedProtocol.outcome_time}</span>}
                </div>

                {/* Identification */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Responsável</p><p className="text-sm font-medium">{selectedProtocol.responsible_name || "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Nº Atendimento</p><p className="text-sm font-medium">{selectedProtocol.attendance_number || "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Nascimento</p><p className="text-sm font-medium">{selectedProtocol.birth_date || "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Peso</p><p className="text-sm font-medium">{selectedProtocol.patient_weight ? `${selectedProtocol.patient_weight} kg` : "—"}</p></div>
                </div>

                {/* SIRS */}
                <div className="p-3 rounded-lg bg-muted/40">
                  <h4 className="text-xs font-bold uppercase mb-2">Critérios SIRS ({sirsCount(selectedProtocol)}/7)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { k: "sirs_temp_high", l: "Temp > 38,3°C" },
                      { k: "sirs_temp_low", l: "Temp < 36°C" },
                      { k: "sirs_heart_rate", l: "FC > 90" },
                      { k: "sirs_respiratory_rate", l: "FR > 20" },
                      { k: "sirs_leukocytosis", l: "Leucocitose" },
                      { k: "sirs_leukopenia", l: "Leucopenia" },
                      { k: "sirs_young_cells", l: "Desvio E" },
                    ].map(({ k, l }) => (
                      <Badge key={k} variant={(selectedProtocol as any)[k] ? "default" : "outline"} className={cn("text-[10px]", (selectedProtocol as any)[k] ? "bg-red-600 text-white" : "")}>{l}</Badge>
                    ))}
                  </div>
                </div>

                {/* Dysfunctions */}
                <div className="p-3 rounded-lg bg-muted/40">
                  <h4 className="text-xs font-bold uppercase mb-2">Disfunções Orgânicas ({dysfunctionCount(selectedProtocol)}/7) — {selectedProtocol.has_organic_dysfunction === true ? "CONFIRMADA" : selectedProtocol.has_organic_dysfunction === false ? "NEGADA" : "NÃO AVALIADA"}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { k: "dysfunction_hypotension", l: "Hipotensão" },
                      { k: "dysfunction_oliguria", l: "Oligúria" },
                      { k: "dysfunction_pao2", l: "PaO₂/FiO₂" },
                      { k: "dysfunction_platelets", l: "Plaquetas" },
                      { k: "dysfunction_acidosis", l: "Lactato" },
                      { k: "dysfunction_consciousness", l: "Consciência" },
                      { k: "dysfunction_bilirubin", l: "Bilirrubina" },
                    ].map(({ k, l }) => (
                      <Badge key={k} variant={(selectedProtocol as any)[k] ? "default" : "outline"} className={cn("text-[10px]", (selectedProtocol as any)[k] ? "bg-amber-600 text-white" : "")}>{l}</Badge>
                    ))}
                  </div>
                </div>

                {/* Focus */}
                <div className="p-3 rounded-lg bg-muted/40">
                  <h4 className="text-xs font-bold uppercase mb-2">Foco Infeccioso — Infecção: {selectedProtocol.has_infection === true ? "SIM" : selectedProtocol.has_infection === false ? "NÃO" : "—"}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { k: "focus_pulmonary", l: "Pulmonar" },
                      { k: "focus_urinary", l: "Urinário" },
                      { k: "focus_abdominal", l: "Abdominal" },
                      { k: "focus_skin", l: "Pele" },
                      { k: "focus_neurological", l: "Neurológico" },
                    ].map(({ k, l }) => (
                      <Badge key={k} variant={(selectedProtocol as any)[k] ? "default" : "outline"} className={cn("text-[10px]", (selectedProtocol as any)[k] ? "bg-blue-600 text-white" : "")}>{l}</Badge>
                    ))}
                    {selectedProtocol.focus_other && <Badge className="text-[10px] bg-blue-600 text-white">{selectedProtocol.focus_other}</Badge>}
                  </div>
                </div>

                {/* Treatment */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40">
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Hemocultura</p><p className="text-xs font-medium">{selectedProtocol.blood_culture_date ? `${selectedProtocol.blood_culture_date} ${selectedProtocol.blood_culture_time || ""}` : "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Lactato</p><p className="text-xs font-medium">{selectedProtocol.lactate_date ? `${selectedProtocol.lactate_date} ${selectedProtocol.lactate_time || ""}` : "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Antibiótico</p><p className="text-xs font-medium">{selectedProtocol.antibiotic_prescription_date ? `${selectedProtocol.antibiotic_prescription_date} ${selectedProtocol.antibiotic_prescription_time || ""}` : "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Volume</p><p className="text-xs font-medium">{selectedProtocol.volume_administered ? `${selectedProtocol.volume_administered} mL` : "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Destino</p><p className="text-xs font-medium">{selectedProtocol.destination || "—"}</p></div>
                </div>

                {selectedProtocol.notes && (
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Observações</p>
                    <p className="text-xs whitespace-pre-wrap">{selectedProtocol.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleExportPdf(selectedProtocol)}>
                    <Download className="h-4 w-4 mr-1" />
                    EXPORTAR PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}