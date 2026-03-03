import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { Search, ArrowRight, History, BedDouble, Loader2, Eye, ChevronDown, ChevronUp, MapPin, Stethoscope, FileText, ClipboardList, Calendar } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

const SearchSkeleton = () => (
  <div className="p-2 space-y-1">
    <div className="px-2 py-1.5">
      <Skeleton className="h-3 w-28 rounded-sm" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-2.5" style={{ animationDelay: `${i * 100}ms` }}>
        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-[50%] rounded-sm" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-[35%] rounded-sm" />
        </div>
        <Skeleton className="h-3 w-3 rounded-sm flex-shrink-0" />
      </div>
    ))}
  </div>
);

function parseItems(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((s: string) => s && s.trim());
  } catch {
    // not JSON
  }
  return value.split("\n").map(s => s.trim()).filter(Boolean);
}

function DetailSection({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-foreground list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PatientDetailPanel({ patientId }: { patientId: string }) {
  const [data, setData] = useState<FullPatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      setData(p as FullPatientData | null);
      setLoading(false);
    };
    fetch();
  }, [patientId]);

  if (loading) {
    return (
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  if (!data) {
    return <p className="px-4 py-2 text-xs text-muted-foreground">Dados não encontrados.</p>;
  }

  const diagnoses = parseItems(data.diagnoses);
  const medicalHistory = parseItems(data.medical_history);
  const relevantExams = parseItems(data.relevant_exams);
  const pendencies = parseItems(data.pendencies);
  const schedule = parseItems(data.schedule);
  const admissionHistory = data.admission_history ? [data.admission_history] : [];
  const utiAdmissionReason = parseItems(data.uti_admission_reason);
  const utiCurrentStatus = parseItems(data.uti_current_status);
  const utiDevices = parseItems(data.uti_devices);
  const utiCultures = parseItems(data.uti_cultures_antibiotics);
  const utiSpecialties = parseItems(data.uti_specialties);
  const utiDailyConducts = parseItems(data.uti_daily_conducts);
  const utiAllergies = parseItems(data.uti_allergies);

  const isUti = data.department === 'uti';

  return (
    <div className="px-4 py-3 bg-muted/30 border-t border-border space-y-3 animate-in slide-in-from-top-2 duration-200">
      {/* Header info */}
      <div className="flex flex-wrap gap-2 items-center">
        {data.age && (
          <Badge variant="outline" className="text-[10px]">
            {data.age} {typeof data.age === 'string' && !data.age.toLowerCase().includes('ano') ? 'anos' : ''}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px]">
          {sectorLabel[data.sector] || data.sector}
        </Badge>
        {data.admission_date && (
          <Badge variant="outline" className="text-[10px]">
            <Calendar className="h-2.5 w-2.5 mr-1" />
            Adm: {new Date(data.admission_date).toLocaleDateString("pt-BR")}
          </Badge>
        )}
        {data.internment_status && (
          <Badge variant="secondary" className="text-[10px]">
            {internmentStatusLabel[data.internment_status] || data.internment_status}
          </Badge>
        )}
        {data.clinical_status && (
          <Badge variant="secondary" className="text-[10px]">
            {clinicalStatusLabel[data.clinical_status] || data.clinical_status}
          </Badge>
        )}
      </div>

      <Separator />

      <div className="space-y-2.5">
        <DetailSection icon={Stethoscope} title="Hipóteses / Diagnósticos" items={diagnoses} />
        <DetailSection icon={FileText} title="Antecedentes / Comorbidades" items={medicalHistory} />
        <DetailSection icon={Search} title="Exames Relevantes" items={relevantExams} />
        <DetailSection icon={ClipboardList} title="Programações / Pendências" items={pendencies} />
        {schedule.length > 0 && <DetailSection icon={ClipboardList} title="Plano Terapêutico" items={schedule} />}
        <DetailSection icon={FileText} title="História Admissional / Anamnese" items={admissionHistory} />

        {isUti && (
          <>
            {utiAdmissionReason.length > 0 && <DetailSection icon={Stethoscope} title="Motivo da Admissão UTI" items={utiAdmissionReason} />}
            {utiCurrentStatus.length > 0 && <DetailSection icon={Stethoscope} title="Status Atual UTI" items={utiCurrentStatus} />}
            {utiDevices.length > 0 && <DetailSection icon={Stethoscope} title="Dispositivos" items={utiDevices} />}
            {utiCultures.length > 0 && <DetailSection icon={Stethoscope} title="Culturas / Antibióticos" items={utiCultures} />}
            {utiSpecialties.length > 0 && <DetailSection icon={Stethoscope} title="Especialidades" items={utiSpecialties} />}
            {utiDailyConducts.length > 0 && <DetailSection icon={ClipboardList} title="Condutas do Dia UTI" items={utiDailyConducts} />}
            {utiAllergies.length > 0 && <DetailSection icon={FileText} title="Alergias" items={utiAllergies} />}
          </>
        )}

        {data.internment_notes && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <FileText className="h-3 w-3" />
              Notas de Internamento
            </div>
            <p className="text-xs text-foreground pl-4">{data.internment_notes}</p>
          </div>
        )}
      </div>

      {/* No data message */}
      {!diagnoses.length && !medicalHistory.length && !relevantExams.length && !pendencies.length && !schedule.length && !admissionHistory.length && (
        <p className="text-xs text-muted-foreground italic">Nenhuma informação clínica registrada.</p>
      )}
    </div>
  );
}

export interface GlobalSearchHandle {
  open: () => void;
}

interface GlobalSearchDialogProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export const GlobalSearchDialog = forwardRef<GlobalSearchHandle, GlobalSearchDialogProps>(
  function GlobalSearchDialog({ externalOpen, onExternalOpenChange }, ref) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = (val: boolean) => {
      setInternalOpen(val);
      onExternalOpenChange?.(val);
    };

    const [query, setQuery] = useState("");
    const [patients, setPatients] = useState<SearchPatient[]>([]);
    const [movements, setMovements] = useState<SearchMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
    const searchIdRef = useRef(0);
    const navigate = useNavigate();
    const { currentHospital, currentState } = useHospital();

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
    }));

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setOpen(!open);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = useCallback(async () => {
      if (!query.trim() || !currentHospital || !currentState) return;

      setLoading(true);
      setHasSearched(true);
      setExpandedPatientId(null);
      const currentSearchId = ++searchIdRef.current;

      try {
        const term = query.trim();

        const [patientsResult, movementsResult] = await Promise.all([
          (supabase.rpc as any)('search_patients_global', {
            p_search_term: term,
            p_hospital_unit_id: currentHospital.id,
            p_state_id: currentState.id,
          }),
          (supabase.rpc as any)('search_movements_global', {
            p_search_term: term,
            p_hospital_unit_id: currentHospital.id,
            p_state_id: currentState.id,
          }),
        ]);

        if (currentSearchId !== searchIdRef.current) return;

        if (patientsResult.error || movementsResult.error) {
          console.error("Search RPC error:", patientsResult.error || movementsResult.error);
          const searchTerm = `%${term}%`;
          const [fallbackP, fallbackM] = await Promise.all([
            supabase
              .from("patients")
              .select("id, name, bed_number, sector, department, diagnoses")
              .eq("hospital_unit_id", currentHospital.id)
              .eq("state_id", currentState.id)
              .or(`name.ilike.${searchTerm},bed_number.ilike.${searchTerm},diagnoses.ilike.${searchTerm}`)
              .limit(8),
            supabase
              .from("patient_movements")
              .select("id, patient_name, movement_type, destination, patient_sector, patient_bed, created_at")
              .eq("hospital_unit_id", currentHospital.id)
              .eq("state_id", currentState.id)
              .or(`patient_name.ilike.${searchTerm},destination.ilike.${searchTerm},patient_bed.ilike.${searchTerm}`)
              .order("created_at", { ascending: false })
              .limit(6),
          ]);

          if (currentSearchId !== searchIdRef.current) return;
          setPatients((fallbackP.data || []).filter((p) => p.name && p.name.trim() !== ""));
          setMovements(fallbackM.data || []);
        } else {
          setPatients((patientsResult.data || []) as SearchPatient[]);
          setMovements((movementsResult.data || []) as SearchMovement[]);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (currentSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    }, [query, currentHospital, currentState]);

    useEffect(() => {
      if (!open) {
        setQuery("");
        setPatients([]);
        setMovements([]);
        setLoading(false);
        setHasSearched(false);
        setExpandedPatientId(null);
        searchIdRef.current = 0;
      }
    }, [open]);

    const handleSelectPatient = (patient: SearchPatient) => {
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

    const handleToggleDetails = (e: React.MouseEvent, patientId: string) => {
      e.stopPropagation();
      setExpandedPatientId(prev => prev === patientId ? null : patientId);
    };

    const handleSelectMovement = () => {
      setOpen(false);
      navigate("/movements");
    };

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    };

    const hasResults = patients.length > 0 || movements.length > 0;

    return (
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <CommandInput
            placeholder="Buscar paciente por nome, leito ou diagnóstico..."
            value={query}
            onValueChange={(val) => {
              setQuery(val);
              if (!val.trim()) {
                setPatients([]);
                setMovements([]);
                setHasSearched(false);
                setExpandedPatientId(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                performSearch();
              }
            }}
            className="border-0 focus:ring-0"
          />
          {query.trim() && (
            <Button
              size="sm"
              onClick={performSearch}
              disabled={loading}
              className="h-8 px-4 gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">Buscar</span>
            </Button>
          )}
        </div>
        <CommandList className="max-h-[70vh]">
          <CommandEmpty>
            {loading ? (
              <div className="text-left -mx-2 -my-4">
                <SearchSkeleton />
              </div>
            ) : hasSearched && query.trim() ? (
              "Nenhum resultado encontrado."
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Digite o nome e clique em <strong>Buscar</strong> ou pressione <strong>Enter</strong></p>
                <p className="text-xs mt-1.5 opacity-70">
                  ✨ Busca inteligente: ignora acentos, ç e ~
                </p>
                <p className="text-xs mt-2 opacity-50">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Ctrl</kbd>
                  {" + "}
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">K</kbd>
                  {" para abrir a qualquer momento"}
                </p>
              </div>
            )}
          </CommandEmpty>

          {patients.length > 0 && (
            <CommandGroup heading="Pacientes Alocados">
              {patients.map((p) => (
                <div key={p.id}>
                  <CommandItem
                    className="flex items-center gap-3 cursor-pointer"
                    onSelect={() => handleSelectPatient(p)}
                  >
                    <BedDouble className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                          {p.bed_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {sectorLabel[p.sector] || p.sector} • {p.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                        onClick={(e) => handleToggleDetails(e, p.id)}
                      >
                        <Eye className="h-3 w-3" />
                        {expandedPatientId === p.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </CommandItem>
                  {expandedPatientId === p.id && (
                    <PatientDetailPanel patientId={p.id} />
                  )}
                </div>
              ))}
            </CommandGroup>
          )}

          {patients.length > 0 && movements.length > 0 && <CommandSeparator />}

          {movements.length > 0 && (
            <CommandGroup heading="Histórico de Movimentações">
              {movements.map((m) => (
                <CommandItem
                  key={m.id}
                  onSelect={handleSelectMovement}
                  className="flex items-center gap-3 cursor-pointer"
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
                      {m.destination && `→ ${m.destination} • `}{formatDate(m.created_at)}
                    </p>
                  </div>
                </CommandItem>
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
