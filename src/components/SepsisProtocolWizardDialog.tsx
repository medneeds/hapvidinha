import { useState, useEffect } from "react";
import { Patient } from "@/types/patient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Download, AlertTriangle, CheckCircle2, Stethoscope } from "lucide-react";
import { generateSepsisProtocolPdf } from "@/utils/sepsisProtocolPdf";
import { cn } from "@/lib/utils";

interface SepsisProtocolWizardDialogProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingProtocolId?: string | null;
}

const STEPS = [
  { key: "identification", label: "IDENTIFICAÇÃO" },
  { key: "sirs", label: "CRITÉRIOS SIRS" },
  { key: "dysfunction", label: "DISFUNÇÕES" },
  { key: "focus", label: "FOCO INFECCIOSO" },
  { key: "treatment", label: "TRATAMENTO" },
  { key: "outcome", label: "DESFECHO" },
] as const;

type StepKey = typeof STEPS[number]["key"];

interface FormData {
  patient_name: string;
  birth_date: string;
  attendance_number: string;
  hospital: string;
  responsible_name: string;
  opening_date: string;
  opening_time: string;
  patient_weight: string;
  // SIRS
  sirs_temp_high: boolean;
  sirs_temp_low: boolean;
  sirs_heart_rate: boolean;
  sirs_respiratory_rate: boolean;
  sirs_leukocytosis: boolean;
  sirs_leukopenia: boolean;
  sirs_young_cells: boolean;
  // Dysfunction
  has_organic_dysfunction: boolean | null;
  dysfunction_hypotension: boolean;
  dysfunction_oliguria: boolean;
  dysfunction_pao2: boolean;
  dysfunction_platelets: boolean;
  dysfunction_acidosis: boolean;
  dysfunction_consciousness: boolean;
  dysfunction_bilirubin: boolean;
  // Infection
  has_infection: boolean | null;
  focus_pulmonary: boolean;
  focus_urinary: boolean;
  focus_abdominal: boolean;
  focus_skin: boolean;
  focus_neurological: boolean;
  focus_other: string;
  // Treatment
  blood_culture_date: string;
  blood_culture_time: string;
  lactate_date: string;
  lactate_time: string;
  antibiotic_prescription_date: string;
  antibiotic_prescription_time: string;
  volume_administered: string;
  // Outcome
  destination: string;
  destination_date: string;
  destination_time: string;
  outcome: string;
  outcome_date: string;
  outcome_time: string;
  notes: string;
}

const initialFormData: FormData = {
  patient_name: "",
  birth_date: "",
  attendance_number: "",
  hospital: "",
  responsible_name: "",
  opening_date: new Date().toISOString().split("T")[0],
  opening_time: new Date().toTimeString().slice(0, 5),
  patient_weight: "",
  sirs_temp_high: false,
  sirs_temp_low: false,
  sirs_heart_rate: false,
  sirs_respiratory_rate: false,
  sirs_leukocytosis: false,
  sirs_leukopenia: false,
  sirs_young_cells: false,
  has_organic_dysfunction: null,
  dysfunction_hypotension: false,
  dysfunction_oliguria: false,
  dysfunction_pao2: false,
  dysfunction_platelets: false,
  dysfunction_acidosis: false,
  dysfunction_consciousness: false,
  dysfunction_bilirubin: false,
  has_infection: null,
  focus_pulmonary: false,
  focus_urinary: false,
  focus_abdominal: false,
  focus_skin: false,
  focus_neurological: false,
  focus_other: "",
  blood_culture_date: "",
  blood_culture_time: "",
  lactate_date: "",
  lactate_time: "",
  antibiotic_prescription_date: "",
  antibiotic_prescription_time: "",
  volume_administered: "",
  destination: "",
  destination_date: "",
  destination_time: "",
  outcome: "",
  outcome_date: "",
  outcome_time: "",
  notes: "",
};

export function SepsisProtocolWizardDialog({
  patient,
  isOpen,
  onClose,
  onSuccess,
  existingProtocolId,
}: SepsisProtocolWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolId, setProtocolId] = useState<string | null>(existingProtocolId || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { currentHospital, currentState } = useHospital();
  const { user } = useAuth();

  // Initialize form with patient data
  useEffect(() => {
    if (isOpen && patient) {
      setFormData({
        ...initialFormData,
        patient_name: patient.name || "",
      });
      if (!existingProtocolId) {
        setCurrentStep(0);
        setProtocolId(null);
        setStartTime(null);
        setElapsedSeconds(0);
      }
    }
  }, [isOpen, patient, existingProtocolId]);

  // Load existing protocol data
  useEffect(() => {
    if (isOpen && existingProtocolId) {
      const loadProtocol = async () => {
        const { data, error } = await supabase
          .from('sepsis_protocols')
          .select('*')
          .eq('id', existingProtocolId)
          .single();
        
        if (data && !error) {
          setProtocolId(data.id);
          setFormData({
            patient_name: data.patient_name || "",
            birth_date: data.birth_date || "",
            attendance_number: data.attendance_number || "",
            hospital: data.hospital || "",
            responsible_name: data.responsible_name || "",
            opening_date: data.opening_date || "",
            opening_time: data.opening_time || "",
            patient_weight: data.patient_weight?.toString() || "",
            sirs_temp_high: data.sirs_temp_high || false,
            sirs_temp_low: data.sirs_temp_low || false,
            sirs_heart_rate: data.sirs_heart_rate || false,
            sirs_respiratory_rate: data.sirs_respiratory_rate || false,
            sirs_leukocytosis: data.sirs_leukocytosis || false,
            sirs_leukopenia: data.sirs_leukopenia || false,
            sirs_young_cells: data.sirs_young_cells || false,
            has_organic_dysfunction: data.has_organic_dysfunction,
            dysfunction_hypotension: data.dysfunction_hypotension || false,
            dysfunction_oliguria: data.dysfunction_oliguria || false,
            dysfunction_pao2: data.dysfunction_pao2 || false,
            dysfunction_platelets: data.dysfunction_platelets || false,
            dysfunction_acidosis: data.dysfunction_acidosis || false,
            dysfunction_consciousness: data.dysfunction_consciousness || false,
            dysfunction_bilirubin: data.dysfunction_bilirubin || false,
            has_infection: data.has_infection,
            focus_pulmonary: data.focus_pulmonary || false,
            focus_urinary: data.focus_urinary || false,
            focus_abdominal: data.focus_abdominal || false,
            focus_skin: data.focus_skin || false,
            focus_neurological: data.focus_neurological || false,
            focus_other: data.focus_other || "",
            blood_culture_date: data.blood_culture_date || "",
            blood_culture_time: data.blood_culture_time || "",
            lactate_date: data.lactate_date || "",
            lactate_time: data.lactate_time || "",
            antibiotic_prescription_date: data.antibiotic_prescription_date || "",
            antibiotic_prescription_time: data.antibiotic_prescription_time || "",
            volume_administered: data.volume_administered?.toString() || "",
            destination: data.destination || "",
            destination_date: data.destination_date || "",
            destination_time: data.destination_time || "",
            outcome: data.outcome || "",
            outcome_date: data.outcome_date || "",
            outcome_time: data.outcome_time || "",
            notes: data.notes || "",
          });
          // Set start time from protocol data
          if (data.opening_date && data.opening_time) {
            setStartTime(new Date(`${data.opening_date}T${data.opening_time}`));
          } else {
            setStartTime(new Date(data.created_at));
          }
        }
      };
      loadProtocol();
    }
  }, [isOpen, existingProtocolId]);

  // Timer
  useEffect(() => {
    if (!startTime || formData.outcome) return;
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, formData.outcome]);

  const ONE_HOUR = 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / ONE_HOUR) * 100);
  const isExpired = elapsedSeconds >= ONE_HOUR;

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartProtocol = async () => {
    if (isSubmitting) return;

    if (!patient) {
      toast({ title: "Erro", description: "Nenhum paciente selecionado.", variant: "destructive" });
      return;
    }
    if (!currentHospital || !currentState) {
      toast({ title: "Erro", description: "Hospital/Estado não configurado.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Erro", description: "Sessão expirada. Faça login novamente.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const openingDate = formData.opening_date || now.toISOString().split("T")[0];
      const openingTime = formData.opening_time || now.toTimeString().slice(0, 5);
      const openingDateTime = new Date(`${openingDate}T${openingTime}`);

      const { data, error } = await supabase
        .from('sepsis_protocols')
        .insert({
          patient_id: patient.id,
          patient_name: formData.patient_name || patient.name,
          hospital_unit_id: currentHospital.id,
          state_id: currentState.id,
          created_by: user.id,
          opening_date: openingDate,
          opening_time: openingTime,
          birth_date: formData.birth_date || null,
          attendance_number: formData.attendance_number || null,
          hospital: formData.hospital || null,
          responsible_name: formData.responsible_name || null,
          patient_weight: formData.patient_weight ? parseFloat(formData.patient_weight) : null,
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error("Nenhum dado retornado");

      setProtocolId(data.id);
      setStartTime(openingDateTime);
      setCurrentStep(1);
      onSuccess?.();
      toast({ title: "Protocolo Sepse iniciado", description: "Golden Hour em andamento. Preencha as etapas." });
    } catch (err: any) {
      console.error('Erro ao iniciar protocolo sepse:', err);
      toast({ title: "Erro ao iniciar protocolo", description: err?.message || "Não foi possível iniciar o protocolo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCurrentStep = async () => {
    if (!protocolId) return;
    setIsSubmitting(true);
    try {
      const stepKey = STEPS[currentStep].key;
      let updateData: Record<string, any> = {};

      if (stepKey === "sirs") {
        updateData = {
          sirs_temp_high: formData.sirs_temp_high,
          sirs_temp_low: formData.sirs_temp_low,
          sirs_heart_rate: formData.sirs_heart_rate,
          sirs_respiratory_rate: formData.sirs_respiratory_rate,
          sirs_leukocytosis: formData.sirs_leukocytosis,
          sirs_leukopenia: formData.sirs_leukopenia,
          sirs_young_cells: formData.sirs_young_cells,
        };
      } else if (stepKey === "dysfunction") {
        updateData = {
          has_organic_dysfunction: formData.has_organic_dysfunction,
          dysfunction_hypotension: formData.dysfunction_hypotension,
          dysfunction_oliguria: formData.dysfunction_oliguria,
          dysfunction_pao2: formData.dysfunction_pao2,
          dysfunction_platelets: formData.dysfunction_platelets,
          dysfunction_acidosis: formData.dysfunction_acidosis,
          dysfunction_consciousness: formData.dysfunction_consciousness,
          dysfunction_bilirubin: formData.dysfunction_bilirubin,
        };
      } else if (stepKey === "focus") {
        updateData = {
          has_infection: formData.has_infection,
          focus_pulmonary: formData.focus_pulmonary,
          focus_urinary: formData.focus_urinary,
          focus_abdominal: formData.focus_abdominal,
          focus_skin: formData.focus_skin,
          focus_neurological: formData.focus_neurological,
          focus_other: formData.focus_other || null,
        };
      } else if (stepKey === "treatment") {
        updateData = {
          blood_culture_date: formData.blood_culture_date || null,
          blood_culture_time: formData.blood_culture_time || null,
          lactate_date: formData.lactate_date || null,
          lactate_time: formData.lactate_time || null,
          antibiotic_prescription_date: formData.antibiotic_prescription_date || null,
          antibiotic_prescription_time: formData.antibiotic_prescription_time || null,
          volume_administered: formData.volume_administered ? parseFloat(formData.volume_administered) : null,
          patient_weight: formData.patient_weight ? parseFloat(formData.patient_weight) : null,
        };
      } else if (stepKey === "outcome") {
        updateData = {
          destination: formData.destination || null,
          destination_date: formData.destination_date || null,
          destination_time: formData.destination_time || null,
          outcome: formData.outcome || null,
          outcome_date: formData.outcome_date || null,
          outcome_time: formData.outcome_time || null,
          notes: formData.notes || null,
        };
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('sepsis_protocols')
          .update(updateData)
          .eq('id', protocolId);
        if (error) throw error;
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0 && !protocolId) {
      await handleStartProtocol();
      return;
    }
    await saveCurrentStep();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinalize = async () => {
    if (!formData.outcome) {
      toast({ title: "Desfecho obrigatório", description: "Selecione o desfecho do paciente para finalizar.", variant: "destructive" });
      return;
    }
    await saveCurrentStep();
    toast({ title: "Protocolo Sepse finalizado", description: "Protocolo registrado com sucesso." });
    onSuccess?.();
    onClose();
  };

  const sirsCount = [
    formData.sirs_temp_high,
    formData.sirs_temp_low,
    formData.sirs_heart_rate,
    formData.sirs_respiratory_rate,
    formData.sirs_leukocytosis,
    formData.sirs_leukopenia,
    formData.sirs_young_cells,
  ].filter(Boolean).length;

  const dysfunctionCount = [
    formData.dysfunction_hypotension,
    formData.dysfunction_oliguria,
    formData.dysfunction_pao2,
    formData.dysfunction_platelets,
    formData.dysfunction_acidosis,
    formData.dysfunction_consciousness,
    formData.dysfunction_bilirubin,
  ].filter(Boolean).length;

  const focusCount = [formData.focus_pulmonary, formData.focus_urinary, formData.focus_abdominal, formData.focus_skin, formData.focus_neurological].filter(Boolean).length + (formData.focus_other ? 1 : 0);
  const hasTreatmentData = !!(formData.blood_culture_date || formData.lactate_date || formData.antibiotic_prescription_date || formData.volume_administered);

  const getStepStatus = (i: number): "empty" | "partial" | "complete" | "alert" => {
    if (i === 0) return protocolId ? "complete" : formData.patient_name ? "partial" : "empty";
    if (i === 1) return sirsCount >= 2 ? "alert" : sirsCount > 0 ? "partial" : "empty";
    if (i === 2) return dysfunctionCount > 0 ? (formData.has_organic_dysfunction !== null ? "complete" : "partial") : "empty";
    if (i === 3) return formData.has_infection !== null ? (focusCount > 0 ? "complete" : "partial") : "empty";
    if (i === 4) return hasTreatmentData ? "partial" : "empty";
    if (i === 5) return formData.outcome ? "complete" : "empty";
    return "empty";
  };

  const fillNowDateTime = (dateField: keyof FormData, timeField: keyof FormData) => {
    const now = new Date();
    updateField(dateField, now.toISOString().split("T")[0]);
    updateField(timeField, now.toTimeString().slice(0, 5));
  };

  const NowButton = ({ dateField, timeField, label }: { dateField: keyof FormData; timeField: keyof FormData; label?: string }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 text-[10px] gap-1 px-2 font-semibold uppercase"
      onClick={() => fillNowDateTime(dateField, timeField)}
    >
      <Clock className="h-3 w-3" />
      {label || "AGORA"}
    </Button>
  );

  const renderStepContent = () => {
    const step = STEPS[currentStep].key;

    if (step === "identification") {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <NowButton dateField="opening_date" timeField="opening_time" label="DATA/HORA ABERTURA = AGORA" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-semibold uppercase">Nome do Paciente</Label>
              <Input value={formData.patient_name} onChange={e => updateField("patient_name", e.target.value.toUpperCase())} className="uppercase" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Data de Nascimento</Label>
              <Input type="date" value={formData.birth_date} onChange={e => updateField("birth_date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Nº Atendimento</Label>
              <Input value={formData.attendance_number} onChange={e => updateField("attendance_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Peso (kg)</Label>
              <Input type="number" step="0.1" value={formData.patient_weight} onChange={e => updateField("patient_weight", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Médico Responsável</Label>
              <Input value={formData.responsible_name} onChange={e => updateField("responsible_name", e.target.value.toUpperCase())} className="uppercase" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Data Abertura</Label>
              <Input type="date" value={formData.opening_date} onChange={e => updateField("opening_date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Hora Abertura</Label>
              <Input type="time" value={formData.opening_time} onChange={e => updateField("opening_time", e.target.value)} />
            </div>
          </div>
        </div>
      );
    }

    if (step === "sirs") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Marque os critérios presentes (≥2 para triagem positiva):</p>
          <div className={cn("text-xs font-bold px-2 py-1 rounded", sirsCount >= 2 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-muted text-muted-foreground")}>
            {sirsCount}/7 CRITÉRIOS MARCADOS {sirsCount >= 2 && "— TRIAGEM POSITIVA"}
          </div>
          {[
            { key: "sirs_temp_high", label: "Temperatura > 38,3°C" },
            { key: "sirs_temp_low", label: "Temperatura < 36°C" },
            { key: "sirs_heart_rate", label: "Frequência cardíaca > 90 bpm" },
            { key: "sirs_respiratory_rate", label: "Frequência respiratória > 20 irpm ou PaCO₂ < 32" },
            { key: "sirs_leukocytosis", label: "Leucocitose > 12.000/mm³" },
            { key: "sirs_leukopenia", label: "Leucopenia < 4.000/mm³" },
            { key: "sirs_young_cells", label: "Desvio à esquerda (> 10% formas jovens)" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
              <Checkbox checked={(formData as any)[key]} onCheckedChange={v => updateField(key as keyof FormData, !!v)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (step === "dysfunction") {
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Marque as disfunções orgânicas presentes:</p>
          <div className={cn("text-xs font-bold px-2 py-1 rounded", dysfunctionCount > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : "bg-muted text-muted-foreground")}>
            {dysfunctionCount}/7 DISFUNÇÕES MARCADAS
          </div>
          {[
            { key: "dysfunction_hypotension", label: "Hipotensão (PAS < 90 ou PAM < 65 mmHg)" },
            { key: "dysfunction_oliguria", label: "Oligúria (diurese < 0,5 ml/kg/h por 2h)" },
            { key: "dysfunction_pao2", label: "Relação PaO₂/FiO₂ < 300" },
            { key: "dysfunction_platelets", label: "Plaquetas < 100.000/mm³" },
            { key: "dysfunction_acidosis", label: "Lactato > 2x o valor normal" },
            { key: "dysfunction_consciousness", label: "Rebaixamento do nível de consciência" },
            { key: "dysfunction_bilirubin", label: "Bilirrubina > 2 mg/dL" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
              <Checkbox checked={(formData as any)[key]} onCheckedChange={v => updateField(key as keyof FormData, !!v)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <div className="pt-2 border-t">
            <Label className="text-xs font-semibold uppercase">Há disfunção orgânica confirmada?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formData.has_organic_dysfunction === true} onCheckedChange={() => updateField("has_organic_dysfunction", true)} />
                <span className="text-sm">SIM</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formData.has_organic_dysfunction === false} onCheckedChange={() => updateField("has_organic_dysfunction", false)} />
                <span className="text-sm">NÃO</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (step === "focus") {
      return (
        <div className="space-y-3">
          <div className="border-b pb-3">
            <Label className="text-xs font-semibold uppercase">Há infecção confirmada ou suspeita?</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formData.has_infection === true} onCheckedChange={() => updateField("has_infection", true)} />
                <span className="text-sm">SIM</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={formData.has_infection === false} onCheckedChange={() => updateField("has_infection", false)} />
                <span className="text-sm">NÃO</span>
              </label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Foco infeccioso suspeito/confirmado:</p>
          {[
            { key: "focus_pulmonary", label: "Pulmonar" },
            { key: "focus_urinary", label: "Urinário" },
            { key: "focus_abdominal", label: "Abdominal" },
            { key: "focus_skin", label: "Pele / Partes moles" },
            { key: "focus_neurological", label: "Neurológico" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer">
              <Checkbox checked={(formData as any)[key]} onCheckedChange={v => updateField(key as keyof FormData, !!v)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <div>
            <Label className="text-xs font-semibold uppercase">Outro foco</Label>
            <Input value={formData.focus_other} onChange={e => updateField("focus_other", e.target.value.toUpperCase())} className="uppercase" placeholder="ESPECIFICAR" />
          </div>
        </div>
      );
    }

    if (step === "treatment") {
      return (
        <div className="space-y-4">
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase">Hemocultura</h4>
              <NowButton dateField="blood_culture_date" timeField="blood_culture_time" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Data</Label><Input type="date" value={formData.blood_culture_date} onChange={e => updateField("blood_culture_date", e.target.value)} /></div>
              <div><Label className="text-xs">Hora</Label><Input type="time" value={formData.blood_culture_time} onChange={e => updateField("blood_culture_time", e.target.value)} /></div>
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase">Lactato</h4>
              <NowButton dateField="lactate_date" timeField="lactate_time" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Data</Label><Input type="date" value={formData.lactate_date} onChange={e => updateField("lactate_date", e.target.value)} /></div>
              <div><Label className="text-xs">Hora</Label><Input type="time" value={formData.lactate_time} onChange={e => updateField("lactate_time", e.target.value)} /></div>
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase">Prescrição de Antibiótico</h4>
              <NowButton dateField="antibiotic_prescription_date" timeField="antibiotic_prescription_time" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Data</Label><Input type="date" value={formData.antibiotic_prescription_date} onChange={e => updateField("antibiotic_prescription_date", e.target.value)} /></div>
              <div><Label className="text-xs">Hora</Label><Input type="time" value={formData.antibiotic_prescription_time} onChange={e => updateField("antibiotic_prescription_time", e.target.value)} /></div>
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <h4 className="text-xs font-bold uppercase">Ressuscitação Volêmica</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Peso (kg)</Label><Input type="number" step="0.1" value={formData.patient_weight} onChange={e => updateField("patient_weight", e.target.value)} /></div>
              <div><Label className="text-xs">Volume (mL)</Label><Input type="number" value={formData.volume_administered} onChange={e => updateField("volume_administered", e.target.value)} /></div>
            </div>
          </div>
        </div>
      );
    }

    if (step === "outcome") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-semibold uppercase">Destino</Label>
              <Select value={formData.destination} onValueChange={v => updateField("destination", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTI">UTI</SelectItem>
                  <SelectItem value="ENFERMARIA">ENFERMARIA</SelectItem>
                  <SelectItem value="CENTRO CIRÚRGICO">CENTRO CIRÚRGICO</SelectItem>
                  <SelectItem value="PERMANECE EMERGÊNCIA">PERMANECE EMERGÊNCIA</SelectItem>
                  <SelectItem value="OUTRO HOSPITAL">OUTRO HOSPITAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex justify-end">
              <NowButton dateField="destination_date" timeField="destination_time" label="DESTINO = AGORA" />
            </div>
            <div><Label className="text-xs">Data Destino</Label><Input type="date" value={formData.destination_date} onChange={e => updateField("destination_date", e.target.value)} /></div>
            <div><Label className="text-xs">Hora Destino</Label><Input type="time" value={formData.destination_time} onChange={e => updateField("destination_time", e.target.value)} /></div>
          </div>
          <div className="border-t pt-4 space-y-3">
            <div className="col-span-2">
              <Label className="text-xs font-semibold uppercase">Desfecho *</Label>
              <Select value={formData.outcome} onValueChange={v => updateField("outcome", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o desfecho" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTA">ALTA</SelectItem>
                  <SelectItem value="ÓBITO">ÓBITO</SelectItem>
                  <SelectItem value="TRANSFERÊNCIA">TRANSFERÊNCIA</SelectItem>
                  <SelectItem value="INTERNAÇÃO">INTERNAÇÃO</SelectItem>
                  <SelectItem value="SEPSE DESCARTADA">SEPSE DESCARTADA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex justify-end">
                <NowButton dateField="outcome_date" timeField="outcome_time" label="DESFECHO = AGORA" />
              </div>
              <div><Label className="text-xs">Data Desfecho</Label><Input type="date" value={formData.outcome_date} onChange={e => updateField("outcome_date", e.target.value)} /></div>
              <div><Label className="text-xs">Hora Desfecho</Label><Input type="time" value={formData.outcome_time} onChange={e => updateField("outcome_time", e.target.value)} /></div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase">Observações</Label>
              <Textarea value={formData.notes} onChange={e => updateField("notes", e.target.value.toUpperCase())} className="uppercase resize-none" rows={3} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v && !isSubmitting) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0" onInteractOutside={e => { if (isSubmitting || protocolId) e.preventDefault(); }} onEscapeKeyDown={e => { if (isSubmitting) e.preventDefault(); }}>
        {/* Timer Header */}
        {startTime && (
          <div className={cn(
            "px-4 py-2 flex items-center gap-3 border-b",
            isExpired ? "bg-red-600/15 animate-pulse" : "bg-orange-500/10"
          )}>
            <Activity className={cn("h-4 w-4", isExpired ? "text-red-500" : "text-orange-500")} />
            <span className={cn("text-xs font-bold uppercase", isExpired ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400")}>
              {isExpired ? "GOLDEN HOUR EXCEDIDA" : "GOLDEN HOUR"}
            </span>
            <div className="flex-1">
              <Progress value={progressPercent} className={cn("h-2", isExpired ? "[&>div]:bg-red-500" : "[&>div]:bg-orange-500")} />
            </div>
            <span className={cn("text-xs font-mono font-bold tabular-nums", isExpired ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400")}>
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
        )}

        {/* Step Indicators */}
        <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {STEPS.map((step, i) => (
            <button
              key={step.key}
              onClick={() => { if (protocolId && i > 0) { saveCurrentStep(); setCurrentStep(i); } }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase whitespace-nowrap transition-colors",
                i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : getStepStatus(i) === "complete" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 cursor-pointer"
                  : getStepStatus(i) === "alert" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 cursor-pointer"
                  : getStepStatus(i) === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 cursor-pointer"
                  : "text-muted-foreground/60"
              )}
            >
              {getStepStatus(i) === "complete" ? <Check className="h-3 w-3" />
                : getStepStatus(i) === "alert" ? <AlertTriangle className="h-3 w-3" />
                : <span className="text-[9px]">{i + 1}</span>}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Status Summary Bar */}
        {protocolId && (
          <div className="px-4 py-1.5 border-b bg-muted/20 flex items-center gap-3 text-[10px] font-semibold uppercase overflow-x-auto scrollbar-none">
            <span className={cn("flex items-center gap-1", sirsCount >= 2 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
              <Stethoscope className="h-3 w-3" />SIRS {sirsCount}/7
            </span>
            <span className={cn("flex items-center gap-1", dysfunctionCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
              DISF {dysfunctionCount}/7
            </span>
            <span className={cn("flex items-center gap-1", formData.has_infection === true ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
              INF {formData.has_infection === true ? "SIM" : formData.has_infection === false ? "NÃO" : "—"}
            </span>
            <span className={cn("flex items-center gap-1", focusCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
              FOCO {focusCount}
            </span>
            <span className={cn("flex items-center gap-1", hasTreatmentData ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
              {hasTreatmentData ? <CheckCircle2 className="h-3 w-3" /> : null}TTO
            </span>
          </div>
        )}

        <DialogHeader className="px-6 pt-4 pb-0">
          <DialogTitle className="text-base font-bold uppercase flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            {STEPS[currentStep].label}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {currentStep === 0 && !protocolId
              ? 'Preencha os dados de identificação e clique em "ABRIR AGORA" para iniciar o protocolo.'
              : `Etapa ${currentStep + 1} de ${STEPS.length}`}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t flex-row gap-2 flex-wrap">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev} size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              ANTERIOR
            </Button>
          )}
          {protocolId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => generateSepsisProtocolPdf({ ...formData, created_at: startTime?.toISOString() || new Date().toISOString(), patient_weight: formData.patient_weight ? parseFloat(formData.patient_weight) : null, volume_administered: formData.volume_administered ? parseFloat(formData.volume_administered) : null } as any)}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          )}
          <div className="flex-1" />
          {currentStep === 0 && !protocolId ? (
            <Button type="button" onClick={handleNext} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-36">
              <Activity className="h-4 w-4 mr-1" />
              {isSubmitting ? "INICIANDO..." : "ABRIR AGORA"}
            </Button>
          ) : currentStep === STEPS.length - 1 ? (
            <Button type="button" onClick={handleFinalize} disabled={isSubmitting} className="min-w-36">
              <Check className="h-4 w-4 mr-1" />
              {isSubmitting ? "FINALIZANDO..." : "FINALIZAR PROTOCOLO"}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} disabled={isSubmitting} size="sm">
              PRÓXIMO
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
