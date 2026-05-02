import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeartPulse, Search, Eye, Download, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { generateChestPainProtocolPdf } from "@/utils/chestPainProtocolPdf";
import { DeleteProtocolDialog } from "@/components/DeleteProtocolDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ChestPainProtocolsAdminPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const { currentHospital, currentState } = useHospital();
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const canDelete = (p: any) => isAdmin || (p.created_by === user?.id && !p.outcome);

  const fetchProtocols = async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data } = await supabase
      .from("chest_pain_protocols")
      .select("*")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .order("created_at", { ascending: false });
    setProtocols(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProtocols(); }, [currentHospital, currentState]);

  const filtered = protocols.filter(p => {
    const ms = !search || p.patient_name.toLowerCase().includes(search.toLowerCase());
    const mo = filterOutcome === "all" || (filterOutcome === "active" ? !p.outcome : p.outcome === filterOutcome);
    return ms && mo;
  });

  const stats = {
    total: protocols.length,
    active: protocols.filter(p => !p.outcome).length,
    finalized: protocols.filter(p => !!p.outcome).length,
    stemi: protocols.filter(p => p.is_stemi).length,
  };

  const getBadge = (o: string | null) => {
    if (!o) return <Badge variant="outline" className="bg-orange-100 text-orange-700"><Clock className="h-3 w-3 mr-1" />EM CURSO</Badge>;
    if (o === "ÓBITO") return <Badge variant="outline" className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />{o}</Badge>;
    return <Badge variant="outline" className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />{o}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-6 w-6 text-red-600" />
        <div>
          <h1 className="text-xl font-bold uppercase">Protocolos Dor Torácica</h1>
          <p className="text-xs text-muted-foreground">Registro e análise dos protocolos de dor torácica / SCA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Total</p></CardContent></Card>
        <Card className="border-orange-300"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{stats.active}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Em Curso</p></CardContent></Card>
        <Card className="border-green-300"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.finalized}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">Finalizados</p></CardContent></Card>
        <Card className="border-red-300"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.stemi}</p><p className="text-[10px] uppercase text-muted-foreground font-semibold">STEMI</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="BUSCAR PACIENTE..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 uppercase" />
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
            <SelectItem value="SCA DESCARTADA">SCA DESCARTADA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Paciente</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Abertura</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">HEART</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Killip</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">STEMI</TableHead>
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
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(p)}>
                    <TableCell className="font-semibold text-xs uppercase max-w-[200px] truncate">{p.patient_name}</TableCell>
                    <TableCell className="text-xs">{p.opening_date ? format(new Date(`${p.opening_date}T${p.opening_time || '00:00'}`), "dd/MM/yy HH:mm") : format(new Date(p.created_at), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.heart_total ?? 0} ({p.heart_risk_level || "—"})</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.killip_class || "—"}</Badge></TableCell>
                    <TableCell>{p.is_stemi ? <Badge className="text-[10px] bg-red-600">SIM</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{getBadge(p.outcome)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setSelected(p); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); generateChestPainProtocolPdf(p); }}><Download className="h-3.5 w-3.5" /></Button>
                        {canDelete(p) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 uppercase"><HeartPulse className="h-5 w-5 text-red-600" />{selected.patient_name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Aberto em {selected.opening_date ? format(new Date(`${selected.opening_date}T${selected.opening_time || '00:00'}`), "dd/MM/yyyy 'às' HH:mm") : format(new Date(selected.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">{getBadge(selected.outcome)} {selected.is_stemi && <Badge className="bg-red-600">STEMI</Badge>}</div>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">HEART Score</p><p className="text-sm font-medium">{selected.heart_total ?? 0} — {selected.heart_risk_level || "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Killip</p><p className="text-sm font-medium">{selected.killip_class || "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Trop 0h</p><p className="text-sm font-medium">{selected.troponin_0h_value ?? "—"}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground font-semibold">Trop 3h</p><p className="text-sm font-medium">{selected.troponin_3h_value ?? "—"}</p></div>
                  <div className="col-span-2"><p className="text-[10px] uppercase text-muted-foreground font-semibold">Reperfusão</p><p className="text-sm font-medium">{selected.reperfusion_strategy || "—"}</p></div>
                  <div className="col-span-2"><p className="text-[10px] uppercase text-muted-foreground font-semibold">Sintomas</p><p className="text-sm">{selected.associated_symptoms || "—"}</p></div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => generateChestPainProtocolPdf(selected)}><Download className="h-4 w-4 mr-2" />Exportar PDF</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteProtocolDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        protocolId={deleteTarget?.id || null}
        table="chest_pain_protocols"
        protocolLabel="PROTOCOLO DE DOR TORÁCICA"
        patientName={deleteTarget?.patient_name}
        isFinalized={!!deleteTarget?.outcome}
        onDeleted={() => { setDeleteTarget(null); fetchProtocols(); }}
      />
    </div>
  );
}
