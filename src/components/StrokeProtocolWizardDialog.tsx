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
import { Brain, Download, Trash2 } from "lucide-react";
import { generateStrokeProtocolPdf } from "@/utils/strokeProtocolPdf";
import { DeleteProtocolDialog } from "./DeleteProtocolDialog";

interface Props {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingProtocolId?: string | null;
}

const NIHSS_FIELDS: { key: string; label: string; max: number }[] = [
  { key: "nihss_1a_consciousness", label: "1a. Nível de consciência", max: 3 },
  { key: "nihss_1b_questions", label: "1b. Perguntas (mês/idade)", max: 2 },
  { key: "nihss_1c_commands", label: "1c. Comandos (abrir/fechar olhos, mão)", max: 2 },
  { key: "nihss_2_gaze", label: "2. Olhar conjugado", max: 2 },
  { key: "nihss_3_visual_fields", label: "3. Campos visuais", max: 3 },
  { key: "nihss_4_facial_palsy", label: "4. Paralisia facial", max: 3 },
  { key: "nihss_5a_left_arm", label: "5a. Motor MSE", max: 4 },
  { key: "nihss_5b_right_arm", label: "5b. Motor MSD", max: 4 },
  { key: "nihss_6a_left_leg", label: "6a. Motor MIE", max: 4 },
  { key: "nihss_6b_right_leg", label: "6b. Motor MID", max: 4 },
  { key: "nihss_7_ataxia", label: "7. Ataxia de membros", max: 2 },
  { key: "nihss_8_sensory", label: "8. Sensibilidade", max: 2 },
  { key: "nihss_9_language", label: "9. Linguagem (afasia)", max: 3 },
  { key: "nihss_10_dysarthria", label: "10. Disartria", max: 2 },
  { key: "nihss_11_extinction", label: "11. Extinção/desatenção", max: 2 },
];

export function StrokeProtocolWizardDialog({ patient, isOpen, onClose, onSuccess, existingProtocolId }: Props) {
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
    last_seen_well_date: "",
    last_seen_well_time: "",
    patient_weight: "",
    bp_systolic: "",
    bp_diastolic: "",
    glucose: "",
    inr: "",
    platelets: "",
    cincinnati_facial_droop: false,
    cincinnati_arm_weakness: false,
    cincinnati_speech_abnormal: false,
    ct_date: "",
    ct_time: "",
    ct_hemorrhage: false,
    ct_aspects: "",
    ct_findings: "",
    thrombolysis_eligible: null as boolean | null,
    thrombolysis_drug: "",
    thrombolysis_dose: "",
    thrombolysis_date: "",
    thrombolysis_time: "",
    exclusion_window: false,
    exclusion_age: false,
    exclusion_bp_high: false,
    exclusion_glucose: false,
    exclusion_platelets_low: false,
    exclusion_inr_high: false,
    exclusion_anticoagulation: false,
    exclusion_recent_surgery: false,
    exclusion_active_bleeding: false,
    exclusion_previous_stroke: false,
    exclusion_other: "",
    conduct: "",
    destination: "",
    destination_date: "",
    destination_time: "",
    outcome: "",
    outcome_date: "",
    outcome_time: "",
    notes: "",
    ...Object.fromEntries(NIHSS_FIELDS.map(f => [f.key, 0])),
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
      const { data } = await supabase.from("stroke_protocols").select("*").eq("id", existingProtocolId).single();
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

  const nihssTotal = NIHSS_FIELDS.reduce((sum, f) => sum + (Number(form[f.key]) || 0), 0);

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
    last_seen_well_date: form.last_seen_well_date || null,
    last_seen_well_time: form.last_seen_well_time || null,
    patient_weight: form.patient_weight ? parseFloat(form.patient_weight) : null,
    bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
    bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
    glucose: form.glucose ? parseFloat(form.glucose) : null,
    inr: form.inr ? parseFloat(form.inr) : null,
    platelets: form.platelets ? parseInt(form.platelets) : null,
    cincinnati_facial_droop: !!form.cincinnati_facial_droop,
    cincinnati_arm_weakness: !!form.cincinnati_arm_weakness,
    cincinnati_speech_abnormal: !!form.cincinnati_speech_abnormal,
    ...Object.fromEntries(NIHSS_FIELDS.map(f => [f.key, Number(form[f.key]) || 0])),
    nihss_total: nihssTotal,
    ct_date: form.ct_date || null,
    ct_time: form.ct_time || null,
    ct_hemorrhage: !!form.ct_hemorrhage,
    ct_aspects: form.ct_aspects ? parseInt(form.ct_aspects) : null,
    ct_findings: form.ct_findings ? form.ct_findings.toUpperCase() : null,
    thrombolysis_eligible: form.thrombolysis_eligible,
    thrombolysis_drug: form.thrombolysis_drug ? form.thrombolysis_drug.toUpperCase() : null,
    thrombolysis_dose: form.thrombolysis_dose ? parseFloat(form.thrombolysis_dose) : null,
    thrombolysis_date: form.thrombolysis_date || null,
    thrombolysis_time: form.thrombolysis_time || null,
    exclusion_window: !!form.exclusion_window,
    exclusion_age: !!form.exclusion_age,
    exclusion_bp_high: !!form.exclusion_bp_high,
    exclusion_glucose: !!form.exclusion_glucose,
    exclusion_platelets_low: !!form.exclusion_platelets_low,
    exclusion_inr_high: !!form.exclusion_inr_high,
    exclusion_anticoagulation: !!form.exclusion_anticoagulation,
    exclusion_recent_surgery: !!form.exclusion_recent_surgery,
    exclusion_active_bleeding: !!form.exclusion_active_bleeding,
    exclusion_previous_stroke: !!form.exclusion_previous_stroke,
    exclusion_other: form.exclusion_other ? form.exclusion_other.toUpperCase() : null,
    conduct: form.conduct ? form.conduct.toUpperCase() : null,
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
      const { data, error } = await supabase.from("stroke_protocols").insert({
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
      toast({ title: "Protocolo AVC iniciado" });
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Erro ao iniciar protocolo", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (close = false) => {
    if (!protocolId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("stroke_protocols").update(buildPayload() as any).eq("id", protocolId);
      if (error) throw error;
      toast({ title: close ? "Protocolo finalizado" : "Salvo" });
      onSuccess?.();
      if (close) onClose();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!protocolId) return;
    const { data } = await supabase.from("stroke_protocols").select("*").eq("id", protocolId).single();
    if (data) generateStrokeProtocolPdf(data as any);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase">
              <Brain className="h-5 w-5 text-purple-600" />
              Protocolo AVC — {patient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cincinnati / FAST · NIHSS · Janela de Trombólise · Critérios de Exclusão
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
                <div><Label className="text-xs">Última vez bem (data)</Label><Input type="date" value={form.last_seen_well_date} onChange={e => update("last_seen_well_date", e.target.value)} /></div>
                <div><Label className="text-xs">Última vez bem (hora)</Label><Input type="time" value={form.last_seen_well_time} onChange={e => update("last_seen_well_time", e.target.value)} /></div>
                <div><Label className="text-xs">Chegada (data)</Label><Input type="date" value={form.arrival_date} onChange={e => update("arrival_date", e.target.value)} /></div>
                <div><Label className="text-xs">Chegada (hora)</Label><Input type="time" value={form.arrival_time} onChange={e => update("arrival_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* SINAIS VITAIS / LAB */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">2. Sinais e Laboratório</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><Label className="text-xs">PA Sistólica</Label><Input type="number" value={form.bp_systolic} onChange={e => update("bp_systolic", e.target.value)} /></div>
                <div><Label className="text-xs">PA Diastólica</Label><Input type="number" value={form.bp_diastolic} onChange={e => update("bp_diastolic", e.target.value)} /></div>
                <div><Label className="text-xs">Glicemia (mg/dL)</Label><Input type="number" value={form.glucose} onChange={e => update("glucose", e.target.value)} /></div>
                <div><Label className="text-xs">INR</Label><Input type="number" step="0.1" value={form.inr} onChange={e => update("inr", e.target.value)} /></div>
                <div><Label className="text-xs">Plaquetas (×10³)</Label><Input type="number" value={form.platelets} onChange={e => update("platelets", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* CINCINNATI */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">3. Escala de Cincinnati / FAST</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { k: "cincinnati_facial_droop", l: "Assimetria facial" },
                  { k: "cincinnati_arm_weakness", l: "Fraqueza de braço" },
                  { k: "cincinnati_speech_abnormal", l: "Fala alterada" },
                ].map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 p-2 border rounded cursor-pointer">
                    <Checkbox checked={!!form[k]} onCheckedChange={v => update(k, !!v)} />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
            </section>

            <Separator />

            {/* NIHSS */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">4. NIHSS</h3>
                <Badge variant="outline" className="text-xs">Total: {nihssTotal}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {NIHSS_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-2 p-2 border rounded">
                    <Label className="text-xs flex-1">{f.label}</Label>
                    <Select value={String(form[f.key])} onValueChange={v => update(f.key, parseInt(v))}>
                      <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: f.max + 1 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* NEUROIMAGEM */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">5. Neuroimagem (TC)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Data TC</Label><Input type="date" value={form.ct_date} onChange={e => update("ct_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora TC</Label><Input type="time" value={form.ct_time} onChange={e => update("ct_time", e.target.value)} /></div>
                <div><Label className="text-xs">ASPECTS (0-10)</Label><Input type="number" min={0} max={10} value={form.ct_aspects} onChange={e => update("ct_aspects", e.target.value)} /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 p-2 border rounded w-full"><Checkbox checked={!!form.ct_hemorrhage} onCheckedChange={v => update("ct_hemorrhage", !!v)} /><span className="text-sm">Hemorragia</span></label></div>
              </div>
              <Textarea placeholder="ACHADOS DA TC" value={form.ct_findings} onChange={e => update("ct_findings", e.target.value.toUpperCase())} className="text-xs" />
            </section>

            <Separator />

            {/* TROMBÓLISE / EXCLUSÕES */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">6. Trombólise & Exclusões</h3>
              <div className="flex gap-2 mb-2">
                <Button type="button" size="sm" variant={form.thrombolysis_eligible === true ? "default" : "outline"} onClick={() => update("thrombolysis_eligible", true)}>ELEGÍVEL</Button>
                <Button type="button" size="sm" variant={form.thrombolysis_eligible === false ? "destructive" : "outline"} onClick={() => update("thrombolysis_eligible", false)}>NÃO ELEGÍVEL</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { k: "exclusion_window", l: "Fora da janela (>4,5h)" },
                  { k: "exclusion_age", l: "Idade limite" },
                  { k: "exclusion_bp_high", l: "PA > 185/110" },
                  { k: "exclusion_glucose", l: "Glicemia <50 ou >400" },
                  { k: "exclusion_platelets_low", l: "Plaquetas <100mil" },
                  { k: "exclusion_inr_high", l: "INR >1,7" },
                  { k: "exclusion_anticoagulation", l: "Anticoagulação plena" },
                  { k: "exclusion_recent_surgery", l: "Cirurgia recente" },
                  { k: "exclusion_active_bleeding", l: "Sangramento ativo" },
                  { k: "exclusion_previous_stroke", l: "AVC prévio <3m" },
                ].map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 p-2 border rounded cursor-pointer text-xs">
                    <Checkbox checked={!!form[k]} onCheckedChange={v => update(k, !!v)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
              <Input placeholder="OUTRO MOTIVO DE EXCLUSÃO" value={form.exclusion_other} onChange={e => update("exclusion_other", e.target.value.toUpperCase())} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div><Label className="text-xs">Trombolítico</Label><Input value={form.thrombolysis_drug} onChange={e => update("thrombolysis_drug", e.target.value.toUpperCase())} placeholder="ALTEPLASE" /></div>
                <div><Label className="text-xs">Dose (mg)</Label><Input type="number" value={form.thrombolysis_dose} onChange={e => update("thrombolysis_dose", e.target.value)} /></div>
                <div><Label className="text-xs">Data infusão</Label><Input type="date" value={form.thrombolysis_date} onChange={e => update("thrombolysis_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora infusão</Label><Input type="time" value={form.thrombolysis_time} onChange={e => update("thrombolysis_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* CONDUTA / DESTINO */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">7. Conduta e Destino</h3>
              <Textarea placeholder="CONDUTA" value={form.conduct} onChange={e => update("conduct", e.target.value.toUpperCase())} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="md:col-span-1"><Label className="text-xs">Destino</Label><Input value={form.destination} onChange={e => update("destination", e.target.value.toUpperCase())} /></div>
                <div><Label className="text-xs">Data</Label><Input type="date" value={form.destination_date} onChange={e => update("destination_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora</Label><Input type="time" value={form.destination_time} onChange={e => update("destination_time", e.target.value)} /></div>
              </div>
            </section>

            <Separator />

            {/* DESFECHO */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">8. Desfecho</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Desfecho</Label>
                  <Select value={form.outcome || ""} onValueChange={v => update("outcome", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALTA">ALTA</SelectItem>
                      <SelectItem value="ÓBITO">ÓBITO</SelectItem>
                      <SelectItem value="TRANSFERÊNCIA">TRANSFERÊNCIA</SelectItem>
                      <SelectItem value="INTERNAÇÃO">INTERNAÇÃO</SelectItem>
                      <SelectItem value="AVC DESCARTADO">AVC DESCARTADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Data</Label><Input type="date" value={form.outcome_date} onChange={e => update("outcome_date", e.target.value)} /></div>
                <div><Label className="text-xs">Hora</Label><Input type="time" value={form.outcome_time} onChange={e => update("outcome_time", e.target.value)} /></div>
              </div>
              <Textarea placeholder="OBSERVAÇÕES" value={form.notes} onChange={e => update("notes", e.target.value.toUpperCase())} />
            </section>
          </div>

          <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
            <div className="flex gap-2">
              {protocolId && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={handleExportPdf}>
                    <Download className="h-3 w-3 mr-1" />PDF
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" />Excluir
                  </Button>
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
          table="stroke_protocols"
          protocolLabel="PROTOCOLO DE AVC"
          patientName={form.patient_name}
          isFinalized={!!form.outcome}
          onDeleted={() => { setDeleteOpen(false); onClose(); onSuccess?.(); }}
        />
      )}
    </>
  );
}
