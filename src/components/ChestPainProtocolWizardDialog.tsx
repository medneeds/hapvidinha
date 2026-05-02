import { useState, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { HeartPulse, Download, Trash2 } from "lucide-react";
import { generateChestPainProtocolPdf } from "@/utils/chestPainProtocolPdf";
import { DeleteProtocolDialog } from "./DeleteProtocolDialog";

interface Props {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingProtocolId?: string | null;
}

const HEART_OPTIONS = [
  { key: "heart_history", label: "História", opts: ["Pouco suspeita (0)", "Moderada (1)", "Altamente suspeita (2)"] },
  { key: "heart_ecg", label: "ECG", opts: ["Normal (0)", "Alteração inespecífica (1)", "Desvio ST significativo (2)"] },
  { key: "heart_age", label: "Idade", opts: ["<45 (0)", "45-65 (1)", "≥65 (2)"] },
  { key: "heart_risk_factors", label: "Fatores de risco", opts: ["Nenhum (0)", "1-2 (1)", "≥3 ou ATC conhecida (2)"] },
  { key: "heart_troponin", label: "Troponina", opts: ["≤ normal (0)", "1-3× (1)", ">3× (2)"] },
];

export function ChestPainProtocolWizardDialog({ patient, isOpen, onClose, onSuccess, existingProtocolId }: Props) {
  const { toast } = useToast();
  const { currentHospital, currentState } = useHospital();
  const { user } = useAuth();
  const [protocolId, setProtocolId] = useState<string | null>(existingProtocolId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState<any>({
    patient_name: "",
    birth_date: "",
    attendance_number: "",
    hospital: "",
    responsible_name: "",
    opening_date: new Date().toISOString().split("T")[0],
    opening_time: new Date().toTimeString().slice(0, 5),
    arrival_date: "",
    arrival_time: "",
    patient_weight: "",
    pain_onset_date: "",
    pain_onset_time: "",
    pain_duration: "",
    pain_location: "",
    pain_irradiation: "",
    pain_classification: "",
    pain_triggering_factors: "",
    pain_relieving_factors: "",
    associated_symptoms: "",
    ecg_date: "",
    ecg_time: "",
    ecg_st_elevation: false,
    ecg_st_depression: false,
    ecg_t_inversion: false,
    ecg_new_lbbb: false,
    ecg_normal: false,
    ecg_findings: "",
    is_stemi: false,
    troponin_0h_value: "",
    troponin_0h_date: "",
    troponin_0h_time: "",
    troponin_3h_value: "",
    troponin_3h_date: "",
    troponin_3h_time: "",
    heart_history: 0,
    heart_ecg: 0,
    heart_age: 0,
    heart_risk_factors: 0,
    heart_troponin: 0,
    killip_class: "",
    therapy_aas: false,
    therapy_clopidogrel: false,
    therapy_heparin: false,
    therapy_nitrate: false,
    therapy_morphine: false,
    therapy_betablocker: false,
    therapy_statin: false,
    therapy_oxygen: false,
    reperfusion_strategy: "",
    fibrinolytic_drug: "",
    fibrinolytic_date: "",
    fibrinolytic_time: "",
    balloon_date: "",
    balloon_time: "",
    destination: "",
    destination_date: "",
    destination_time: "",
    outcome: "",
    outcome_date: "",
    outcome_time: "",
    notes: "",
  });

  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isOpen && patient && !existingProtocolId) {
      setForm((p: any) => ({ ...p, patient_name: patient.name || "" }));
      setProtocolId(null);
    }
  }, [isOpen, patient, existingProtocolId]);

  useEffect(() => {
    if (!isOpen || !existingProtocolId) return;
    (async () => {
      const { data } = await supabase.from("chest_pain_protocols").select("*").eq("id", existingProtocolId).single();
      if (data) {
        setProtocolId(data.id);
        const updated: any = { ...form };
        Object.keys(data).forEach(k => {
          if (k in updated) updated[k] = (data as any)[k] ?? updated[k];
        });
        setForm(updated);
      }
    })();
  }, [isOpen, existingProtocolId]);

  const heartTotal = HEART_OPTIONS.reduce((s, f) => s + (Number(form[f.key]) || 0), 0);
  const heartRisk = heartTotal <= 3 ? "BAIXO" : heartTotal <= 6 ? "MODERADO" : "ALTO";

  const buildPayload = () => ({
    patient_name: (form.patient_name || "").toUpperCase().trim(),
    birth_date: form.birth_date || null,
    attendance_number: form.attendance_number || null,
    hospital: form.hospital || null,
    responsible_name: form.responsible_name || null,
    opening_date: form.opening_date || null,
    opening_time: form.opening_time || null,
    arrival_date: form.arrival_date || null,
    arrival_time: form.arrival_time || null,
    patient_weight: form.patient_weight ? parseFloat(form.patient_weight) : null,
    pain_onset_date: form.pain_onset_date || null,
    pain_onset_time: form.pain_onset_time || null,
    pain_duration: form.pain_duration ? form.pain_duration.toUpperCase() : null,
    pain_location: form.pain_location ? form.pain_location.toUpperCase() : null,
    pain_irradiation: form.pain_irradiation ? form.pain_irradiation.toUpperCase() : null,
    pain_classification: form.pain_classification || null,
    pain_triggering_factors: form.pain_triggering_factors ? form.pain_triggering_factors.toUpperCase() : null,
    pain_relieving_factors: form.pain_relieving_factors ? form.pain_relieving_factors.toUpperCase() : null,
    associated_symptoms: form.associated_symptoms ? form.associated_symptoms.toUpperCase() : null,
    ecg_date: form.ecg_date || null,
    ecg_time: form.ecg_time || null,
    ecg_st_elevation: !!form.ecg_st_elevation,
    ecg_st_depression: !!form.ecg_st_depression,
    ecg_t_inversion: !!form.ecg_t_inversion,
    ecg_new_lbbb: !!form.ecg_new_lbbb,
    ecg_normal: !!form.ecg_normal,
    ecg_findings: form.ecg_findings ? form.ecg_findings.toUpperCase() : null,
    is_stemi: !!form.is_stemi,
    troponin_0h_value: form.troponin_0h_value ? parseFloat(form.troponin_0h_value) : null,
    troponin_0h_date: form.troponin_0h_date || null,
    troponin_0h_time: form.troponin_0h_time || null,
    troponin_3h_value: form.troponin_3h_value ? parseFloat(form.troponin_3h_value) : null,
    troponin_3h_date: form.troponin_3h_date || null,
    troponin_3h_time: form.troponin_3h_time || null,
    heart_history: Number(form.heart_history) || 0,
    heart_ecg: Number(form.heart_ecg) || 0,
    heart_age: Number(form.heart_age) || 0,
    heart_risk_factors: Number(form.heart_risk_factors) || 0,
    heart_troponin: Number(form.heart_troponin) || 0,
    heart_total: heartTotal,
    heart_risk_level: heartRisk,
    killip_class: form.killip_class || null,
    therapy_aas: !!form.therapy_aas,
    therapy_clopidogrel: !!form.therapy_clopidogrel,
    therapy_heparin: !!form.therapy_heparin,
    therapy_nitrate: !!form.therapy_nitrate,
    therapy_morphine: !!form.therapy_morphine,
    therapy_betablocker: !!form.therapy_betablocker,
    therapy_statin: !!form.therapy_statin,
    therapy_oxygen: !!form.therapy_oxygen,
    reperfusion_strategy: form.reperfusion_strategy || null,
    fibrinolytic_drug: form.fibrinolytic_drug ? form.fibrinolytic_drug.toUpperCase() : null,
    fibrinolytic_date: form.fibrinolytic_date || null,
    fibrinolytic_time: form.fibrinolytic_time || null,
    balloon_date: form.balloon_date || null,
    balloon_time: form.balloon_time || null,
    destination: form.destination ? form.destination.toUpperCase() : null,
    destination_date: form.destination_date || null,
    destination_time: form.destination_time || null,
    outcome: form.outcome || null,
    outcome_date: form.outcome_date || null,
    outcome_time: form.outcome_time || null,
    notes: form.notes ? form.notes.toUpperCase() : null,
  });

  const handleStart = async () => {
    if (!patient || !currentHospital || !currentState || !user) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from("chest_pain_protocols").insert({
        patient_id: patient.id,
        patient_name: form.patient_name?.toUpperCase() || patient.name,
        hospital_unit_id: currentHospital.id,
        state_id: currentState.id,
        created_by: user.id,
        opening_date: form.opening_date,
        opening_time: form.opening_time,
      } as any).select("id").single();
      if (error) throw error;
      setProtocolId(data.id);
      toast({ title: "Protocolo Dor Torácica iniciado" });
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleSave = async (close = false) => {
    if (!protocolId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("chest_pain_protocols").update(buildPayload() as any).eq("id", protocolId);
      if (error) throw error;
      toast({ title: close ? "Protocolo finalizado" : "Salvo" });
      onSuccess?.();
      if (close) onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleExportPdf = async () => {
    if (!protocolId) return;
    const { data } = await supabase.from("chest_pain_protocols").select("*").eq("id", protocolId).single();
    if (data) generateChestPainProtocolPdf(data as any);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase">
              <HeartPulse className="h-5 w-5 text-red-600" />
              Protocolo Dor Torácica — {patient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              ECG · HEART Score · Killip · Troponinas seriadas · Reperfusão
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* IDENTIFICAÇÃO */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">1. Identificação</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={form.patient_name} onChange={e => update("patient_name", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => update("birth_date", e.target.value)} /></div>
                <div><Label className="text-xs">Nº Atendimento</Label><Input value={form.attendance_number} onChange={e => update("attendance_number", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Hospital</Label><Input value={form.hospital} onChange={e => update("hospital", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Responsável</Label><Input value={form.responsible_name} onChange={e => update("responsible_name", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Peso (kg)</Label><Input type="number" value={form.patient_weight} onChange={e => update("patient_weight", e.target.value)} /></div>
                <div><Label className="text-xs">Abertura (data)</Label><Input type="date" value={form.opening_date} onChange={e => update("opening_date", e.target.value)} /></div>
                <div><Label className="text-xs">Abertura (hora)</Label><Input type="time" value={form.opening_time} onChange={e => update("opening_time", e.target.value)} /></div>
                <div><Label className="text-xs">Chegada (data)</Label><Input type="date" value={form.arrival_date} onChange={e => update("arrival_date", e.target.value)} /></div>
                <div><Label className="text-xs">Chegada (hora)</Label><Input type="time" value={form.arrival_time} onChange={e => update("arrival_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* DOR */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">2. Caracterização da Dor</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Início (data)</Label><Input type="date" value={form.pain_onset_date} onChange={e => update("pain_onset_date", e.target.value)} /></div>
                <div><Label className="text-xs">Início (hora)</Label><Input type="time" value={form.pain_onset_time} onChange={e => update("pain_onset_time", e.target.value)} /></div>
                <div><Label className="text-xs">Duração</Label><Input value={form.pain_duration} onChange={e => update("pain_duration", e.target.value.toUpperCase())} /></div>
                <div>
                  <Label className="text-xs">Classificação</Label>
                  <Select value={form.pain_classification || ""} onValueChange={v => update("pain_classification", v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANGINOSA TÍPICA">ANGINOSA TÍPICA</SelectItem>
                      <SelectItem value="ANGINOSA ATÍPICA">ANGINOSA ATÍPICA</SelectItem>
                      <SelectItem value="NÃO ANGINOSA">NÃO ANGINOSA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Localização</Label><Input value={form.pain_location} onChange={e => update("pain_location", e.target.value.toUpperCase())} /></div>
                <div className="col-span-2"><Label className="text-xs">Irradiação</Label><Input value={form.pain_irradiation} onChange={e => update("pain_irradiation", e.target.value.toUpperCase())} /></div>
              </div>
              <Textarea placeholder="FATORES DESENCADEANTES" value={form.pain_triggering_factors} onChange={e => update("pain_triggering_factors", e.target.value.toUpperCase())} className="min-h-[60px]" />
              <Textarea placeholder="FATORES DE ALÍVIO" value={form.pain_relieving_factors} onChange={e => update("pain_relieving_factors", e.target.value.toUpperCase())} className="min-h-[60px]" />
              <Textarea placeholder="SINTOMAS ASSOCIADOS (DISPNEIA, SUDORESE, NÁUSEA...)" value={form.associated_symptoms} onChange={e => update("associated_symptoms", e.target.value.toUpperCase())} className="min-h-[60px]" />
            </section>

            <Separator />

            {/* ECG */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">3. ECG</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Data ECG</Label><Input type="date" value={form.ecg_date} onChange={e => update("ecg_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora ECG</Label><Input type="time" value={form.ecg_time} onChange={e => update("ecg_time", e.target.value)} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 p-2 border rounded w-full"><Checkbox checked={!!form.is_stemi} onCheckedChange={v => update("is_stemi", !!v)} /><span className="text-sm font-bold text-red-600">STEMI</span></label></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { k: "ecg_st_elevation", l: "Supra de ST" },
                  { k: "ecg_st_depression", l: "Infra de ST" },
                  { k: "ecg_t_inversion", l: "Inversão de T" },
                  { k: "ecg_new_lbbb", l: "BRE novo" },
                  { k: "ecg_normal", l: "ECG normal" },
                ].map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 p-2 border rounded cursor-pointer text-xs">
                    <Checkbox checked={!!form[k]} onCheckedChange={v => update(k, !!v)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
              <Textarea placeholder="ACHADOS DETALHADOS DO ECG" value={form.ecg_findings} onChange={e => update("ecg_findings", e.target.value.toUpperCase())} />
            </section>

            <Separator />

            {/* TROPONINAS */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">4. Troponinas Seriadas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Trop 0h (ng/mL)</Label><Input type="number" step="0.01" value={form.troponin_0h_value} onChange={e => update("troponin_0h_value", e.target.value)} /></div>
                <div><Label className="text-xs">Data 0h</Label><Input type="date" value={form.troponin_0h_date} onChange={e => update("troponin_0h_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora 0h</Label><Input type="time" value={form.troponin_0h_time} onChange={e => update("troponin_0h_time", e.target.value)} /></div>
                <div><Label className="text-xs">Trop 3h (ng/mL)</Label><Input type="number" step="0.01" value={form.troponin_3h_value} onChange={e => update("troponin_3h_value", e.target.value)} /></div>
                <div><Label className="text-xs">Data 3h</Label><Input type="date" value={form.troponin_3h_date} onChange={e => update("troponin_3h_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora 3h</Label><Input type="time" value={form.troponin_3h_time} onChange={e => update("troponin_3h_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* HEART SCORE */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">5. HEART Score</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">Total: {heartTotal}</Badge>
                  <Badge className={heartRisk === "ALTO" ? "bg-red-600" : heartRisk === "MODERADO" ? "bg-amber-600" : "bg-green-600"}>{heartRisk}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {HEART_OPTIONS.map(f => (
                  <div key={f.key} className="flex items-center gap-2 p-2 border rounded">
                    <Label className="text-xs flex-1">{f.label}</Label>
                    <Select value={String(form[f.key])} onValueChange={v => update(f.key, parseInt(v))}>
                      <SelectTrigger className="w-64 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {f.opts.map((o, i) => <SelectItem key={i} value={String(i)}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* KILLIP / TERAPIA */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">6. Killip & Terapia</h3>
              <div>
                <Label className="text-xs">Classificação Killip</Label>
                <Select value={form.killip_class || ""} onValueChange={v => update("killip_class", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I — Sem ICC</SelectItem>
                    <SelectItem value="II">II — Estertores ou B3</SelectItem>
                    <SelectItem value="III">III — EAP</SelectItem>
                    <SelectItem value="IV">IV — Choque cardiogênico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { k: "therapy_aas", l: "AAS" },
                  { k: "therapy_clopidogrel", l: "Clopidogrel" },
                  { k: "therapy_heparin", l: "Heparina" },
                  { k: "therapy_nitrate", l: "Nitrato" },
                  { k: "therapy_morphine", l: "Morfina" },
                  { k: "therapy_betablocker", l: "Betabloqueador" },
                  { k: "therapy_statin", l: "Estatina" },
                  { k: "therapy_oxygen", l: "Oxigênio" },
                ].map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 p-2 border rounded cursor-pointer text-xs">
                    <Checkbox checked={!!form[k]} onCheckedChange={v => update(k, !!v)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </section>

            <Separator />

            {/* REPERFUSÃO */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">7. Estratégia de Reperfusão</h3>
              <div>
                <Label className="text-xs">Estratégia</Label>
                <Select value={form.reperfusion_strategy || ""} onValueChange={v => update("reperfusion_strategy", v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATC PRIMÁRIA">ATC PRIMÁRIA</SelectItem>
                    <SelectItem value="FIBRINÓLISE">FIBRINÓLISE</SelectItem>
                    <SelectItem value="ESTRATÉGIA INVASIVA">ESTRATÉGIA INVASIVA</SelectItem>
                    <SelectItem value="CONSERVADORA">CONSERVADORA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Fibrinolítico</Label><Input value={form.fibrinolytic_drug} onChange={e => update("fibrinolytic_drug", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Data</Label><Input type="date" value={form.fibrinolytic_date} onChange={e => update("fibrinolytic_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora</Label><Input type="time" value={form.fibrinolytic_time} onChange={e => update("fibrinolytic_time", e.target.value)} /></div>
                <div><Label className="text-xs">Balão (data)</Label><Input type="date" value={form.balloon_date} onChange={e => update("balloon_date", e.target.value)} /></div>
                <div><Label className="text-xs">Balão (hora)</Label><Input type="time" value={form.balloon_time} onChange={e => update("balloon_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* DESFECHO */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">8. Destino e Desfecho</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Destino</Label><Input value={form.destination} onChange={e => update("destination", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Data</Label><Input type="date" value={form.destination_date} onChange={e => update("destination_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora</Label><Input type="time" value={form.destination_time} onChange={e => update("destination_time", e.target.value)} /></div>
                <div>
                  <Label className="text-xs">Desfecho</Label>
                  <Select value={form.outcome || ""} onValueChange={v => update("outcome", v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALTA">ALTA</SelectItem>
                      <SelectItem value="ÓBITO">ÓBITO</SelectItem>
                      <SelectItem value="TRANSFERÊNCIA">TRANSFERÊNCIA</SelectItem>
                      <SelectItem value="INTERNAÇÃO">INTERNAÇÃO</SelectItem>
                      <SelectItem value="SCA DESCARTADA">SCA DESCARTADA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Data desfecho</Label><Input type="date" value={form.outcome_date} onChange={e => update("outcome_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora desfecho</Label><Input type="time" value={form.outcome_time} onChange={e => update("outcome_time", e.target.value)} /></div>
              </div>
              <Textarea placeholder="OBSERVAÇÕES" value={form.notes} onChange={e => update("notes", e.target.value.toUpperCase())} />
            </section>
          </div>

          <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
            <div className="flex gap-2">
              {protocolId && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={handleExportPdf}><Download className="h-3 w-3 mr-1" />PDF</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive"><Trash2 className="h-3 w-3 mr-1" />Excluir</Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
              {!protocolId ? (
                <Button onClick={handleStart} disabled={isSubmitting}>Iniciar Protocolo</Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSubmitting}>Salvar</Button>
                  <Button onClick={() => handleSave(true)} disabled={isSubmitting || !form.outcome}>Finalizar</Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {protocolId && (
        <DeleteProtocolDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          protocolId={protocolId}
          table="chest_pain_protocols"
          protocolLabel="PROTOCOLO DE DOR TORÁCICA"
          patientName={form.patient_name}
          isFinalized={!!form.outcome}
          onDeleted={() => { setDeleteOpen(false); onClose(); onSuccess?.(); }}
        />
      )}
    </>
  );
}
