import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { whitelabel } from "@/config/whitelabel";
import {
  Search, ArrowRight, History, BedDouble, Loader2, Eye, ChevronDown, ChevronUp,
  MapPin, Stethoscope, FileText, ClipboardList, Calendar, Printer, ExternalLink
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Types ──

interface SearchPatient {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  department: string;
  diagnoses: string | null;
}

interface FullPatientData {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  department: string;
  age: string | null;
  admission_date: string | null;
  diagnoses: string | null;
  medical_history: string | null;
  relevant_exams: string | null;
  pendencies: string | null;
  schedule: string | null;
  admission_history: string | null;
  internment_status: string | null;
  internment_notes: string | null;
  clinical_status: string | null;
  medical_responsibility: any;
  uti_admission_date: string | null;
  uti_admission_reason: string | null;
  uti_allergies: string | null;
  uti_current_status: string | null;
  uti_devices: string | null;
  uti_cultures_antibiotics: string | null;
  uti_specialties: string | null;
  uti_origin_sector: string | null;
  uti_daily_conducts: string | null;
  uti_discharge_prediction: string | null;
}

interface SearchMovement {
  id: string;
  patient_name: string;
  movement_type: string;
  destination: string | null;
  patient_sector: string | null;
  patient_bed: string | null;
  created_at: string;
}

interface MovementSnapshot {
  id: string;
  patient_name: string;
  patient_bed: string | null;
  patient_sector: string | null;
  movement_type: string;
  destination: string | null;
  notes: string | null;
  responsible_doctor: string | null;
  created_at: string;
  patient_snapshot: any;
}

// ── Labels ──

const sectorLabel: Record<string, string> = {
  red: "Sala Vermelha",
  yellow: "Obs. Amarela",
  blue: "Obs. Azul",
  outside: "Fora das Alas",
};

const movementTypeLabel: Record<string, string> = {
  admission: "Admissão",
  discharge: "Alta",
  transfer: "Transferência",
  death: "Óbito",
  evasion: "Evasão",
};

const internmentStatusLabel: Record<string, string> = {
  SOLICITACAO_PENDENTE: "Solicitação Pendente",
  PSM_FAVORAVEL: "PSM Favorável",
  AGUARDANDO_VAGA: "Aguardando Vaga",
  IR_PARA_UTI: "Ir para UTI",
  IR_PARA_ENFERMARIA: "Ir para Enfermaria",
};

const clinicalStatusLabel: Record<string, string> = {
  gravissimo: "Gravíssimo",
  grave: "Grave",
  grave_estavel: "Grave Estável",
  potencialmente_grave: "Potencialmente Grave",
  regular: "Regular",
  paliativado: "Paliativado",
};

// ── Helpers ──

function parseItems(value: string | null | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((s: string) => s && s.trim());
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((s: string) => s && s.trim());
  } catch { /* not JSON */ }
  return value.split("\n").map(s => s.trim()).filter(Boolean);
}

function formatDateBR(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ── Print Case ──

function printPatientCase(data: {
  name: string;
  bed_number: string;
  sector: string;
  age?: string | null;
  admission_date?: string | null;
  diagnoses: string[];
  medical_history: string[];
  relevant_exams: string[];
  pendencies: string[];
  schedule: string[];
  admission_history: string;
  movement_type?: string;
  destination?: string | null;
  notes?: string | null;
  responsible_doctor?: string | null;
  movement_date?: string;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sLabel = sectorLabel[data.sector] || data.sector;
  const admDateStr = data.admission_date
    ? new Date(data.admission_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Não informada";

  const listItems = (items: string[], fallback = "Não informado") => {
    if (!items.length) return `<p style="color:#888;font-size:12px;">${fallback}</p>`;
    return `<ol style="margin:0;padding-left:18px;">${items.map(i => `<li style="font-size:12px;margin-bottom:3px;text-transform:uppercase;">${i}</li>`).join("")}</ol>`;
  };

  const movementInfo = data.movement_type ? `
    <div style="background:#f0f4ff;border:1px solid #d0d8ef;border-radius:6px;padding:10px 14px;margin-bottom:14px;">
      <p style="font-size:12px;font-weight:700;color:#013ba6;margin-bottom:4px;">MOVIMENTAÇÃO: ${(movementTypeLabel[data.movement_type] || data.movement_type).toUpperCase()}</p>
      ${data.destination ? `<p style="font-size:11px;">Destino: ${data.destination}</p>` : ''}
      ${data.responsible_doctor ? `<p style="font-size:11px;">Médico: ${data.responsible_doctor}</p>` : ''}
      ${data.notes ? `<p style="font-size:11px;">Notas: ${data.notes}</p>` : ''}
      ${data.movement_date ? `<p style="font-size:11px;">Data: ${formatDateBR(data.movement_date)}</p>` : ''}
    </div>
  ` : '';

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html><html><head>
    <title>Caso Clínico - ${data.name}</title>
    <style>
      @page { size: A4 portrait; margin: 18mm; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Tahoma,sans-serif; color:#1a1a1a; background:#fff; }
      .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #013ba6; padding-bottom:12px; margin-bottom:18px; }
      .header-left { display:flex; align-items:center; gap:14px; }
      .header-left img { height:40px; object-fit:contain; }
      .header-right img { height:36px; object-fit:contain; }
      .title { font-size:16px; font-weight:700; color:#013ba6; text-transform:uppercase; }
      .subtitle { font-size:11px; color:#666; margin-top:2px; }
      .patient-info { display:flex; flex-wrap:wrap; gap:8px 20px; background:#f8f9fa; border-radius:8px; padding:12px 16px; margin-bottom:14px; }
      .info-item { font-size:11px; }
      .info-item strong { color:#013ba6; }
      .section { margin-bottom:12px; }
      .section-title { font-size:12px; font-weight:700; color:#013ba6; text-transform:uppercase; border-bottom:1px solid #e0e0e0; padding-bottom:3px; margin-bottom:6px; }
      .footer { margin-top:20px; border-top:2px solid #013ba6; padding-top:10px; display:flex; justify-content:space-between; font-size:10px; color:#888; }
    </style>
    </head><body>
    <div class="header">
      <div class="header-left">
        <img src="${whitelabel.logos.platform}" alt="Logo" />
        <div><div class="title">Caso Clínico</div><div class="subtitle">Gerado em ${dateStr} às ${timeStr}</div></div>
      </div>
      <div class="header-right"><img src="${whitelabel.logos.networkFull}" alt="Rede" /></div>
    </div>
    <div class="patient-info">
      <div class="info-item"><strong>Paciente:</strong> ${data.name}</div>
      <div class="info-item"><strong>Leito:</strong> ${data.bed_number}</div>
      <div class="info-item"><strong>Setor:</strong> ${sLabel}</div>
      ${data.age ? `<div class="info-item"><strong>Idade:</strong> ${data.age}</div>` : ''}
      <div class="info-item"><strong>Admissão:</strong> ${admDateStr}</div>
    </div>
    ${movementInfo}
    <div class="section"><div class="section-title">Hipóteses / Diagnósticos</div>${listItems(data.diagnoses)}</div>
    <div class="section"><div class="section-title">Antecedentes / Comorbidades</div>${listItems(data.medical_history)}</div>
    <div class="section"><div class="section-title">Exames Relevantes</div>${listItems(data.relevant_exams)}</div>
    <div class="section"><div class="section-title">Programações / Pendências</div>${listItems(data.pendencies)}</div>
    ${data.schedule.length ? `<div class="section"><div class="section-title">Plano Terapêutico</div>${listItems(data.schedule)}</div>` : ''}
    <div class="section"><div class="section-title">História Admissional / Anamnese</div><p style="font-size:12px;white-space:pre-wrap;">${data.admission_history || 'Não informada'}</p></div>
    <div class="footer"><span>${whitelabel.platform.fullName}</span><span>${dateStr} ${timeStr}</span></div>
    </body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 400);
}

// ── Sub-components ──

const SearchSkeleton = () => (
  <div className="p-2 space-y-1">
    <div className="px-2 py-1.5"><Skeleton className="h-3 w-28 rounded-sm" /></div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-2.5">
        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-[50%] rounded-sm" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-[35%] rounded-sm" />
        </div>
      </div>
    ))}
  </div>
);

function DetailSection({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" />{title}
      </div>
      <ul className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Patient Detail Panel (for allocated patients) ──

function PatientDetailPanel({ patientId, onPrint, onGoToMap }: {
  patientId: string;
  onPrint: (data: FullPatientData) => void;
  onGoToMap: () => void;
}) {
  const [data, setData] = useState<FullPatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("patients").select("*").eq("id", patientId).single();
      setData(p as FullPatientData | null);
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) return (
    <div className="px-4 py-3 space-y-2 bg-muted/30 border-t border-border">
      <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" />
    </div>
  );
  if (!data) return <p className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">Dados não encontrados.</p>;

  const diagnoses = parseItems(data.diagnoses);
  const medicalHistory = parseItems(data.medical_history);
  const relevantExams = parseItems(data.relevant_exams);
  const pendencies = parseItems(data.pendencies);
  const schedule = parseItems(data.schedule);
  const admissionHistory = data.admission_history || "";
  const isUti = data.department === 'uti';

  const hasData = diagnoses.length || medicalHistory.length || relevantExams.length || pendencies.length || schedule.length || admissionHistory;

  return (
    <div className="bg-muted/30 border-t border-border animate-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-3 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {data.age && <Badge variant="outline" className="text-[10px]">{data.age}</Badge>}
          <Badge variant="outline" className="text-[10px]">{sectorLabel[data.sector] || data.sector}</Badge>
          {data.admission_date && (
            <Badge variant="outline" className="text-[10px]">
              <Calendar className="h-2.5 w-2.5 mr-1" />Adm: {new Date(data.admission_date).toLocaleDateString("pt-BR")}
            </Badge>
          )}
          {data.internment_status && <Badge variant="secondary" className="text-[10px]">{internmentStatusLabel[data.internment_status] || data.internment_status}</Badge>}
          {data.clinical_status && <Badge variant="secondary" className="text-[10px]">{clinicalStatusLabel[data.clinical_status] || data.clinical_status}</Badge>}
        </div>

        <Separator />

        <div className="space-y-2.5">
          <DetailSection icon={Stethoscope} title="Hipóteses / Diagnósticos" items={diagnoses} />
          <DetailSection icon={FileText} title="Antecedentes / Comorbidades" items={medicalHistory} />
          <DetailSection icon={Search} title="Exames Relevantes" items={relevantExams} />
          <DetailSection icon={ClipboardList} title="Programações / Pendências" items={pendencies} />
          {schedule.length > 0 && <DetailSection icon={ClipboardList} title="Plano Terapêutico" items={schedule} />}
          {admissionHistory && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <FileText className="h-3 w-3" />História Admissional / Anamnese
              </div>
              <p className="text-xs text-foreground pl-4 whitespace-pre-wrap">{admissionHistory}</p>
            </div>
          )}
          {isUti && (
            <>
              <DetailSection icon={Stethoscope} title="Motivo da Admissão UTI" items={parseItems(data.uti_admission_reason)} />
              <DetailSection icon={Stethoscope} title="Status Atual UTI" items={parseItems(data.uti_current_status)} />
              <DetailSection icon={Stethoscope} title="Dispositivos" items={parseItems(data.uti_devices)} />
              <DetailSection icon={Stethoscope} title="Culturas / Antibióticos" items={parseItems(data.uti_cultures_antibiotics)} />
              <DetailSection icon={Stethoscope} title="Especialidades" items={parseItems(data.uti_specialties)} />
              <DetailSection icon={ClipboardList} title="Condutas do Dia UTI" items={parseItems(data.uti_daily_conducts)} />
              <DetailSection icon={FileText} title="Alergias" items={parseItems(data.uti_allergies)} />
            </>
          )}
          {data.internment_notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <FileText className="h-3 w-3" />Notas de Internamento
              </div>
              <p className="text-xs text-foreground pl-4">{data.internment_notes}</p>
            </div>
          )}
        </div>

        {!hasData && <p className="text-xs text-muted-foreground italic">Nenhuma informação clínica registrada.</p>}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={() => onPrint(data)}>
          <Printer className="h-3 w-3" />Imprimir Caso
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={onGoToMap}>
          <MapPin className="h-3 w-3" />Ir para o Leito
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ── Movement Detail Panel (for movement history) ──

function MovementDetailPanel({ movementId, onPrint }: {
  movementId: string;
  onPrint: (snapshot: MovementSnapshot) => void;
}) {
  const [data, setData] = useState<MovementSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: m } = await supabase
        .from("patient_movements")
        .select("id, patient_name, patient_bed, patient_sector, movement_type, destination, notes, responsible_doctor, created_at, patient_snapshot")
        .eq("id", movementId)
        .single();
      setData(m as MovementSnapshot | null);
      setLoading(false);
    })();
  }, [movementId]);

  if (loading) return (
    <div className="px-4 py-3 space-y-2 bg-muted/30 border-t border-border">
      <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" />
    </div>
  );
  if (!data) return <p className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">Dados não encontrados.</p>;

  const snapshot = data.patient_snapshot || {};
  const diagnoses = parseItems(snapshot.diagnoses);
  const medicalHistory = parseItems(snapshot.medicalHistory || snapshot.medical_history);
  const relevantExams = parseItems(snapshot.relevantExams || snapshot.relevant_exams);
  const pendencies = parseItems(snapshot.pendencies);
  const schedule = parseItems(snapshot.schedule);
  const admissionHistory = snapshot.admissionHistory || snapshot.admission_history || "";

  const hasData = diagnoses.length || medicalHistory.length || relevantExams.length || pendencies.length || admissionHistory;

  return (
    <div className="bg-muted/30 border-t border-border animate-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-3 space-y-3">
        {/* Movement info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 space-y-1">
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge className="text-[10px]">{movementTypeLabel[data.movement_type] || data.movement_type}</Badge>
            {data.patient_bed && <Badge variant="outline" className="text-[10px]">Leito: {data.patient_bed}</Badge>}
            {data.patient_sector && <Badge variant="outline" className="text-[10px]">{sectorLabel[data.patient_sector] || data.patient_sector}</Badge>}
          </div>
          {data.destination && <p className="text-xs text-foreground">→ Destino: <strong>{data.destination}</strong></p>}
          {data.responsible_doctor && <p className="text-xs text-muted-foreground">Médico: {data.responsible_doctor}</p>}
          {data.notes && <p className="text-xs text-muted-foreground">Notas: {data.notes}</p>}
          <p className="text-[10px] text-muted-foreground">{formatDateBR(data.created_at)}</p>
        </div>

        {hasData ? (
          <>
            <Separator />
            <div className="space-y-2.5">
              <DetailSection icon={Stethoscope} title="Hipóteses / Diagnósticos" items={diagnoses} />
              <DetailSection icon={FileText} title="Antecedentes / Comorbidades" items={medicalHistory} />
              <DetailSection icon={Search} title="Exames Relevantes" items={relevantExams} />
              <DetailSection icon={ClipboardList} title="Programações / Pendências" items={pendencies} />
              {schedule.length > 0 && <DetailSection icon={ClipboardList} title="Plano Terapêutico" items={schedule} />}
              {admissionHistory && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <FileText className="h-3 w-3" />História Admissional / Anamnese
                  </div>
                  <p className="text-xs text-foreground pl-4 whitespace-pre-wrap">{admissionHistory}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">Snapshot clínico não disponível para esta movimentação.</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        {hasData && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={() => onPrint(data)}>
            <Printer className="h-3 w-3" />Imprimir Caso
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──

export interface GlobalSearchHandle { open: () => void; }

interface GlobalSearchDialogProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export const GlobalSearchDialog = forwardRef<GlobalSearchHandle, GlobalSearchDialogProps>(
  function GlobalSearchDialog({ externalOpen, onExternalOpenChange }, ref) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = (val: boolean) => { setInternalOpen(val); onExternalOpenChange?.(val); };

    const [query, setQuery] = useState("");
    const [patients, setPatients] = useState<SearchPatient[]>([]);
    const [movements, setMovements] = useState<SearchMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const searchIdRef = useRef(0);
    const navigate = useNavigate();
    const { currentHospital, currentState } = useHospital();

    useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(!open); }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const performSearch = useCallback(async () => {
      if (!query.trim() || !currentHospital || !currentState) return;
      setLoading(true); setHasSearched(true); setExpandedId(null);
      const currentSearchId = ++searchIdRef.current;
      try {
        const term = query.trim();
        const [patientsResult, movementsResult] = await Promise.all([
          (supabase.rpc as any)('search_patients_global', { p_search_term: term, p_hospital_unit_id: currentHospital.id, p_state_id: currentState.id }),
          (supabase.rpc as any)('search_movements_global', { p_search_term: term, p_hospital_unit_id: currentHospital.id, p_state_id: currentState.id }),
        ]);
        if (currentSearchId !== searchIdRef.current) return;
        if (patientsResult.error || movementsResult.error) {
          const searchTerm = `%${term}%`;
          const [fallbackP, fallbackM] = await Promise.all([
            supabase.from("patients").select("id, name, bed_number, sector, department, diagnoses")
              .eq("hospital_unit_id", currentHospital.id).eq("state_id", currentState.id)
              .or(`name.ilike.${searchTerm},bed_number.ilike.${searchTerm},diagnoses.ilike.${searchTerm}`).limit(8),
            supabase.from("patient_movements").select("id, patient_name, movement_type, destination, patient_sector, patient_bed, created_at")
              .eq("hospital_unit_id", currentHospital.id).eq("state_id", currentState.id)
              .or(`patient_name.ilike.${searchTerm},destination.ilike.${searchTerm},patient_bed.ilike.${searchTerm}`)
              .order("created_at", { ascending: false }).limit(6),
          ]);
          if (currentSearchId !== searchIdRef.current) return;
          setPatients((fallbackP.data || []).filter((p) => p.name && p.name.trim() !== ""));
          setMovements(fallbackM.data || []);
        } else {
          setPatients((patientsResult.data || []) as SearchPatient[]);
          setMovements((movementsResult.data || []) as SearchMovement[]);
        }
      } catch (err) { console.error("Search error:", err); }
      finally { if (currentSearchId === searchIdRef.current) setLoading(false); }
    }, [query, currentHospital, currentState]);

    useEffect(() => {
      if (!open) { setQuery(""); setPatients([]); setMovements([]); setLoading(false); setHasSearched(false); setExpandedId(null); searchIdRef.current = 0; }
    }, [open]);

    const handleGoToMap = (patient: SearchPatient) => {
      setOpen(false);
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(`[data-patient-id="${patient.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 3000);
        }
      }, 300);
    };

    const handlePrintPatient = (data: FullPatientData) => {
      printPatientCase({
        name: data.name,
        bed_number: data.bed_number,
        sector: data.sector,
        age: data.age,
        admission_date: data.admission_date,
        diagnoses: parseItems(data.diagnoses),
        medical_history: parseItems(data.medical_history),
        relevant_exams: parseItems(data.relevant_exams),
        pendencies: parseItems(data.pendencies),
        schedule: parseItems(data.schedule),
        admission_history: data.admission_history || "",
      });
    };

    const handlePrintMovement = (snapshot: MovementSnapshot) => {
      const s = snapshot.patient_snapshot || {};
      printPatientCase({
        name: snapshot.patient_name,
        bed_number: snapshot.patient_bed || "—",
        sector: snapshot.patient_sector || "",
        age: s.age,
        admission_date: s.admissionDate || s.admission_date,
        diagnoses: parseItems(s.diagnoses),
        medical_history: parseItems(s.medicalHistory || s.medical_history),
        relevant_exams: parseItems(s.relevantExams || s.relevant_exams),
        pendencies: parseItems(s.pendencies),
        schedule: parseItems(s.schedule),
        admission_history: s.admissionHistory || s.admission_history || "",
        movement_type: snapshot.movement_type,
        destination: snapshot.destination,
        notes: snapshot.notes,
        responsible_doctor: snapshot.responsible_doctor,
        movement_date: snapshot.created_at,
      });
    };

    const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

    const hasResults = patients.length > 0 || movements.length > 0;

    return (
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <CommandInput
            placeholder="Buscar paciente por nome, leito ou diagnóstico..."
            value={query}
            onValueChange={(val) => {
              setQuery(val);
              if (!val.trim()) { setPatients([]); setMovements([]); setHasSearched(false); setExpandedId(null); }
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) { e.preventDefault(); performSearch(); } }}
            className="border-0 focus:ring-0"
          />
          {query.trim() && (
            <Button size="sm" onClick={performSearch} disabled={loading}
              className="h-8 px-4 gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all duration-200">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span className="text-xs font-medium">Buscar</span>
            </Button>
          )}
        </div>

        <CommandList className="max-h-[70vh]">
          <CommandEmpty>
            {loading ? (
              <div className="text-left -mx-2 -my-4"><SearchSkeleton /></div>
            ) : hasSearched && query.trim() ? (
              "Nenhum resultado encontrado."
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Digite o nome e clique em <strong>Buscar</strong> ou pressione <strong>Enter</strong></p>
                <p className="text-xs mt-1.5 opacity-70">✨ Busca inteligente: ignora acentos, ç e ~</p>
                <p className="text-xs mt-2 opacity-50">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Ctrl</kbd>
                  {" + "}
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">K</kbd>
                  {" para abrir a qualquer momento"}
                </p>
              </div>
            )}
          </CommandEmpty>

          {/* ── Pacientes Alocados ── */}
          {patients.length > 0 && (
            <CommandGroup heading="Pacientes Alocados">
              {patients.map((p) => (
                <div key={`p-${p.id}`}>
                  <div
                    className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => toggleExpand(`patient-${p.id}`)}
                  >
                    <BedDouble className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">{p.bed_number}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{sectorLabel[p.sector] || p.sector} • {p.department}</p>
                    </div>
                    <span className="text-[10px] text-primary font-medium flex items-center gap-1 flex-shrink-0">
                      <Eye className="h-3 w-3" />
                      {expandedId === `patient-${p.id}` ? "Fechar" : "Ver Caso"}
                      {expandedId === `patient-${p.id}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </div>
                  {expandedId === `patient-${p.id}` && (
                    <PatientDetailPanel
                      patientId={p.id}
                      onPrint={handlePrintPatient}
                      onGoToMap={() => handleGoToMap(p)}
                    />
                  )}
                </div>
              ))}
            </CommandGroup>
          )}

          {patients.length > 0 && movements.length > 0 && <CommandSeparator />}

          {/* ── Histórico de Movimentações ── */}
          {movements.length > 0 && (
            <CommandGroup heading="Histórico de Movimentações">
              {movements.map((m) => (
                <div key={`m-${m.id}`}>
                  <div
                    className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => toggleExpand(`movement-${m.id}`)}
                  >
                    <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{m.patient_name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                          {movementTypeLabel[m.movement_type] || m.movement_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.destination && `→ ${m.destination} • `}{formatDateShort(m.created_at)}
                      </p>
                    </div>
                    <span className="text-[10px] text-primary font-medium flex items-center gap-1 flex-shrink-0">
                      <Eye className="h-3 w-3" />
                      {expandedId === `movement-${m.id}` ? "Fechar" : "Ver Caso"}
                      {expandedId === `movement-${m.id}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </div>
                  {expandedId === `movement-${m.id}` && (
                    <MovementDetailPanel movementId={m.id} onPrint={handlePrintMovement} />
                  )}
                </div>
              ))}
            </CommandGroup>
          )}

          {loading && hasResults && (
            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground border-t border-border">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs">Atualizando resultados...</span>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    );
  }
);
