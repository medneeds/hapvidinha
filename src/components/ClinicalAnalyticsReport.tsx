import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, X, CalendarRange, Brain, Sparkles, FileSpreadsheet } from "lucide-react";
import { whitelabel } from "@/config/whitelabel";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ──
interface DeathRecord {
  name: string;
  date: string;
  diagnoses: string;
  history: string;
  severity: string;
  syndrome: string;
  alert?: string;
}

interface UtiTransfer {
  name: string;
  date: string;
  diagnoses: string;
  history: string;
  syndrome: string;
}

interface RecurrentPatient {
  name: string;
  visits: number;
  diagnoses: string;
  pattern: string;
  severity: string;
}

interface SyndromeData {
  name: string;
  percentage: number;
  count: number;
}

interface ReportData {
  period: string;
  sector: string;
  totalMovements: number;
  totalAltas: number;
  totalTransferencias: number;
  totalObitos: number;
  deaths: DeathRecord[];
  utiTransfers: UtiTransfer[];
  recurrentPatients: RecurrentPatient[];
  syndromes: SyndromeData[];
  managementInsights: string[];
}

type PeriodType = "mensal" | "trimestral" | "semestral";

// ── Helpers ──
function extractText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.filter(Boolean).join(" / ");
  return String(val);
}

// ── Syndrome classifier ──
const SYNDROME_KEYWORDS: Record<string, string[]> = {
  "Infecciosas (PNM, ITU, Sepse, IPPB)": ["pnm", "pneumonia", "itu", "sepse", "infec", "broncopneumonia", "celulite", "abscesso", "meningite", "endocardite", "pielonefrite", "erisipela"],
  "Cardiovasculares (ICC, SCA, IAM, FA, Arritmias)": ["iam", "infarto", "icc", "insuficiência cardíaca", "fa ", "fibrilação", "arritmia", "sca", "bradicardia", "taquicardia", "angina", "edema agudo", "cardio"],
  "Metabólicas/Renais (DRC, DHE, IRA, DM descompensado)": ["drc", "renal", "dialí", "hemodiálise", "hipocalemia", "hiponatremia", "hipercalemia", "cetoacidose", "dm descomp", "ira", "dhe", "alcalose", "acidose metabólica"],
  "Neurológicas (AVC, Convulsões, RNC)": ["avc", "convuls", "epilep", "rnc", "rebaixamento", "coma", "meningite", "encefalo", "stroke"],
  "Traumáticas (TCE, Fraturas, Atropelamento)": ["tce", "fratura", "trauma", "atropel", "queda", "luxação", "contusão"],
  "Cirúrgicas (Abdome agudo, Hérnias, POI complicado)": ["abdome agudo", "hérnia", "poi", "pós-operatório", "cirúrg", "apendicite", "colecistite", "obstruti", "deiscência"],
  "Psiquiátricas (Autoextermínio, Agitação)": ["autoextermínio", "suicíd", "psiqui", "agitação", "delirium", "surto"],
  "Hematológicas (Anemia grave, LMA, Síndromes hemorrágicas)": ["anemia", "leucemia", "lma", "hemorrág", "plaquetopenia", "trombocitopenia", "pancitopenia"],
  "Respiratórias isoladas (DPOC, Broncoespasmo, IRPA)": ["dpoc", "broncoespasmo", "irpa", "insuficiência respiratória", "asma", "derrame pleural"],
  "Oncológicas (Astenia, Dor, Síndrome consumptiva)": ["oncológ", "neoplasia", "câncer", "tumor", "metástase", "consumptiva", "paliativ"],
  "Gineco-Obstétricas (Abortamento, SUA)": ["abortamento", "sua", "gineco", "obstétri", "eclâmpsia", "gravidez"],
};

function classifySyndrome(text: string): string {
  const lower = text.toLowerCase();
  for (const [syndrome, keywords] of Object.entries(SYNDROME_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return syndrome;
    }
  }
  return "Outras";
}

function classifySeverity(diagnoses: string, history: string): string {
  const text = (diagnoses + " " + history).toLowerCase();
  const gravissimo = ["óbito", "pcr", "choque séptico", "falência", "gravíssimo", "parada cardio"];
  const grave = ["sepse", "iam", "irpa", "insuficiência respiratória", "choque", "hemorrag", "abdome agudo", "lma", "leucemia", "grave"];
  
  for (const kw of gravissimo) {
    if (text.includes(kw)) return "GRAVÍSSIMO";
  }
  for (const kw of grave) {
    if (text.includes(kw)) return "GRAVE";
  }
  return "POTENCIALMENTE GRAVE";
}

function getPeriodDates(type: PeriodType, offset: number): { from: Date; to: Date; label: string } {
  const now = new Date();
  
  if (type === "mensal") {
    const target = subMonths(now, offset);
    return {
      from: startOfMonth(target),
      to: endOfMonth(target),
      label: format(target, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()),
    };
  }
  
  if (type === "trimestral") {
    const endMonth = subMonths(now, offset * 3);
    const startMonth = subMonths(endMonth, 2);
    return {
      from: startOfMonth(startMonth),
      to: endOfMonth(endMonth),
      label: `${format(startOfMonth(startMonth), "MMM", { locale: ptBR })} a ${format(endOfMonth(endMonth), "MMM yyyy", { locale: ptBR })}`,
    };
  }
  
  // semestral
  const endMonth = subMonths(now, offset * 6);
  const startMonth = subMonths(endMonth, 5);
  return {
    from: startOfMonth(startMonth),
    to: endOfMonth(endMonth),
    label: `${format(startOfMonth(startMonth), "MMM", { locale: ptBR })} a ${format(endOfMonth(endMonth), "MMM yyyy", { locale: ptBR })}`,
  };
}

function getPeriodOptions(type: PeriodType): { value: string; label: string }[] {
  const count = type === "mensal" ? 12 : type === "trimestral" ? 4 : 2;
  return Array.from({ length: count }, (_, i) => {
    const { label } = getPeriodDates(type, i);
    return { value: String(i), label };
  });
}

function generateInsights(data: ReportData): string[] {
  const insights: string[] = [];
  
  if (data.recurrentPatients.length > 0) {
    const dialyticPatients = data.recurrentPatients.filter(p => {
      const lower = p.diagnoses.toLowerCase();
      return lower.includes("drc") || lower.includes("diál") || lower.includes("hemodiálise");
    });
    if (dialyticPatients.length > 0) {
      const totalVisits = dialyticPatients.reduce((sum, p) => sum + p.visits, 0);
      insights.push(`FALHA DE FLUXO DIALÍTICO: ${totalVisits} visitas de ${dialyticPatients.length} pacientes DRC à emergência. Recomenda-se encaminhamento ao serviço de nefrologia ambulatorial.`);
    }
  }
  
  if (data.deaths.length > 0) {
    const sentinelDeaths = data.deaths.filter(d => {
      const h = d.history.toLowerCase();
      return h.includes("nega") || h === "—" || h === "";
    });
    if (sentinelDeaths.length > 0) {
      insights.push(`CASO SENTINELA — ${sentinelDeaths.length} óbito(s) sem comorbidades prévias. Avaliar protocolos de detecção precoce e cobertura vacinal.`);
    }
  }
  
  if (data.utiTransfers.length > 3) {
    const cardioTransfers = data.utiTransfers.filter(t => t.syndrome.toLowerCase().includes("cardio"));
    if (cardioTransfers.length >= 2) {
      insights.push(`ALTA DEMANDA CARDIOVASCULAR PARA UTI: ${cardioTransfers.length} transferências por SCA/ICC no período. Considerar ampliação de leitos coronarianos ou protocolo fast-track.`);
    }
  }
  
  if (data.totalObitos > 0 && data.totalMovements > 0) {
    const taxaObito = ((data.totalObitos / data.totalMovements) * 100).toFixed(2);
    insights.push(`TAXA DE MORTALIDADE: ${taxaObito}% no período (${data.totalObitos} óbitos em ${data.totalMovements} movimentações).`);
  }
  
  const topSyndrome = data.syndromes[0];
  if (topSyndrome && topSyndrome.name !== "Outras / Não classificadas") {
    insights.push(`PERFIL EPIDEMIOLÓGICO DOMINANTE: ${topSyndrome.name} representando ${topSyndrome.percentage}% (${topSyndrome.count} casos) das movimentações.`);
  }
  
  if (data.recurrentPatients.filter(p => p.severity === "GRAVÍSSIMO").length > 0) {
    insights.push(`ATENÇÃO: ${data.recurrentPatients.filter(p => p.severity === "GRAVÍSSIMO").length} paciente(s) recorrente(s) com classificação GRAVÍSSIMO. Necessário plano de acompanhamento urgente.`);
  }
  
  if (data.totalAltas > 0 && data.totalMovements > 0) {
    const taxaAlta = ((data.totalAltas / data.totalMovements) * 100).toFixed(1);
    insights.push(`TAXA DE RESOLUBILIDADE: ${taxaAlta}% de altas no período. ${data.totalAltas > data.totalTransferencias ? 'Boa capacidade resolutiva.' : 'Proporção elevada de transferências — avaliar gargalos.'}`);
  }

  if (data.utiTransfers.length > 0) {
    insights.push(`DEMANDA UTI: ${data.utiTransfers.length} transferência(s) para UTI no período. Monitorar capacidade e tempo de espera por leitos de terapia intensiva.`);
  }
  
  return insights.slice(0, 8);
}

// ── Loading Animation Component ──
function AILoadingAnimation() {
  const [dots, setDots] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "Nossa inteligência está trabalhando para entregar o melhor relatório possível...",
    "Analisando movimentações e classificando padrões clínicos...",
    "Identificando pacientes recorrentes e eventos sentinela...",
    "Classificando distribuição sindrômica e gravidade...",
    "Gerando insights estratégicos para gestão...",
    "Você não perde por esperar! Quase lá...",
  ];
  
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 3000);
    return () => { clearInterval(dotInterval); clearInterval(msgInterval); };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 animate-fade-in">
      {/* AI Brain Animation */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
        
        {/* Middle ring */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
          {/* Rotating sparkles */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 h-4 w-4 text-primary/60" />
            <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 h-3 w-3 text-primary/40" />
            <Sparkles className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-3.5 w-3.5 text-primary/50" />
            <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-3 w-3 text-primary/40" />
          </div>
          
          {/* Inner brain icon */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Brain className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-[-12px] animate-spin" style={{ animationDuration: '6s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary/70 shadow-sm" />
        </div>
        <div className="absolute inset-[-12px] animate-spin" style={{ animationDuration: '6s', animationDelay: '2s' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/50 shadow-sm" />
        </div>
        <div className="absolute inset-[-12px] animate-spin" style={{ animationDuration: '6s', animationDelay: '4s' }}>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 shadow-sm" />
        </div>
      </div>
      
      {/* Text */}
      <div className="text-center max-w-md space-y-3">
        <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Inteligência Analítica
          <Sparkles className="h-5 w-5 text-primary" />
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed transition-all duration-500">
          {messages[messageIndex]}{dots}
        </p>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto h-1.5 bg-muted rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full" 
            style={{ 
              animation: 'loading-progress 3s ease-in-out infinite',
              width: '60%',
            }} 
          />
        </div>
      </div>
      
      <style>{`
        @keyframes loading-progress {
          0% { width: 5%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 5%; margin-left: 95%; }
        }
      `}</style>
    </div>
  );
}

export function ClinicalAnalyticsReport({ onClose }: { onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const { currentHospital, currentState } = useHospital();
  const { currentDepartment } = useDepartment();
  
  const [periodType, setPeriodType] = useState<PeriodType>("mensal");
  const [periodOffset, setPeriodOffset] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchReportData = useCallback(async () => {
    if (!currentHospital || !currentState) return;
    
    setIsLoading(true);
    setReportData(null);
    
    // Minimum 2s loading for UX
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const { from, to } = getPeriodDates(periodType, parseInt(periodOffset));
      
      const [movResult] = await Promise.all([
        supabase
          .from("patient_movements")
          .select("*")
          .eq("hospital_unit_id", currentHospital.id)
          .eq("state_id", currentState.id)
          .eq("department", currentDepartment)
          .gte("created_at", startOfDay(from).toISOString())
          .lte("created_at", endOfDay(to).toISOString())
          .order("created_at", { ascending: false })
          .limit(1000),
        minLoadTime,
      ]);
      
      if (movResult.error) throw movResult.error;
      
      const movs = movResult.data || [];
      
      // KPIs - movement_type is uppercase in DB
      const totalAltas = movs.filter(m => m.movement_type.toUpperCase() === "ALTA").length;
      const totalTransferencias = movs.filter(m => m.movement_type.toUpperCase() === "TRANSFERÊNCIA" || m.movement_type.toUpperCase() === "TRANSFERENCIA").length;
      const totalObitos = movs.filter(m => m.movement_type.toUpperCase() === "ÓBITO" || m.movement_type.toUpperCase() === "OBITO").length;
      
      // Deaths
      const deathMovs = movs.filter(m => m.movement_type.toUpperCase() === "ÓBITO" || m.movement_type.toUpperCase() === "OBITO");
      const deaths: DeathRecord[] = deathMovs.map(m => {
        const snapshot = (m.patient_snapshot as Record<string, unknown>) || {};
        const diagnoses = extractText(snapshot.diagnoses) || m.notes || "Sem diagnóstico registrado";
        const history = extractText(snapshot.medicalHistory || snapshot.medical_history) || "—";
        return {
          name: m.patient_name,
          date: format(new Date(m.created_at), "dd/MM/yyyy"),
          diagnoses,
          history: history || "—",
          severity: "GRAVÍSSIMO",
          syndrome: classifySyndrome(diagnoses),
          alert: (history.toLowerCase().includes("nega") || history === "—" || !history.trim()) 
            ? `CASO SENTINELA — Paciente sem comorbidades prévias, óbito por ${diagnoses.split("/")[0].trim()}`
            : undefined,
        };
      });
      
      // UTI Transfers - check destination
      const utiMovs = movs.filter(m => {
        const dest = (m.destination || "").toUpperCase();
        return dest.includes("UTI") || dest.includes("UNIDADE DE TERAPIA");
      });
      const utiTransfers: UtiTransfer[] = utiMovs.map(m => {
        const snapshot = (m.patient_snapshot as Record<string, unknown>) || {};
        const diagnoses = extractText(snapshot.diagnoses) || m.notes || "Sem diagnóstico registrado";
        const history = extractText(snapshot.medicalHistory || snapshot.medical_history) || "—";
        return {
          name: m.patient_name,
          date: format(new Date(m.created_at), "dd/MM"),
          diagnoses,
          history: history || "—",
          syndrome: classifySyndrome(diagnoses),
        };
      });
      
      // Recurrent patients
      const patientVisits: Record<string, { count: number; diagnoses: Set<string>; histories: Set<string> }> = {};
      movs.forEach(m => {
        const key = m.patient_name.toUpperCase().trim();
        if (!key) return;
        if (!patientVisits[key]) patientVisits[key] = { count: 0, diagnoses: new Set(), histories: new Set() };
        patientVisits[key].count++;
        const snapshot = (m.patient_snapshot as Record<string, unknown>) || {};
        const diag = extractText(snapshot.diagnoses);
        const hist = extractText(snapshot.medicalHistory || snapshot.medical_history);
        if (diag) patientVisits[key].diagnoses.add(diag);
        if (m.notes) patientVisits[key].diagnoses.add(m.notes);
        if (hist) patientVisits[key].histories.add(hist);
      });
      
      const recurrentPatients: RecurrentPatient[] = Object.entries(patientVisits)
        .filter(([, v]) => v.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 15)
        .map(([name, v]) => {
          const allDiag = [...v.diagnoses].join(" / ");
          const allHist = [...v.histories].join(" ");
          const truncDiag = allDiag.length > 150 ? allDiag.substring(0, 147) + "..." : allDiag;
          return {
            name,
            visits: v.count,
            diagnoses: truncDiag || "Sem registro",
            pattern: v.count >= 5 ? "Altíssima recorrência — necessita acompanhamento ambulatorial urgente" :
                     v.count >= 3 ? "Recorrência significativa — avaliar plano terapêutico" :
                     "Readmissão — monitorar evolução clínica",
            severity: classifySeverity(allDiag, allHist),
          };
        });
      
      // Syndromes
      const syndromeCounts: Record<string, number> = {};
      movs.forEach(m => {
        const snapshot = (m.patient_snapshot as Record<string, unknown>) || {};
        const text = extractText(snapshot.diagnoses) + " " + (m.notes || "") + " " + (m.destination || "");
        const syndrome = classifySyndrome(text);
        syndromeCounts[syndrome] = (syndromeCounts[syndrome] || 0) + 1;
      });
      
      const totalForSyndromes = movs.length || 1;
      const syndromes: SyndromeData[] = Object.entries(syndromeCounts)
        .filter(([name]) => name !== "Outras")
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalForSyndromes) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 11);
      
      const classifiedCount = syndromes.reduce((sum, s) => sum + s.count, 0);
      const otherCount = (syndromeCounts["Outras"] || 0) + (movs.length - classifiedCount - (syndromeCounts["Outras"] || 0));
      if (otherCount > 0) {
        syndromes.push({
          name: "Outras / Não classificadas",
          count: otherCount,
          percentage: Math.round((otherCount / totalForSyndromes) * 100),
        });
      }
      
      const periodLabel = `${format(from, "dd/MM/yyyy")} a ${format(to, "dd/MM/yyyy")}`;
      
      const data: ReportData = {
        period: periodLabel,
        sector: currentDepartment,
        totalMovements: movs.length,
        totalAltas,
        totalTransferencias,
        totalObitos,
        deaths,
        utiTransfers,
        recurrentPatients,
        syndromes,
        managementInsights: [],
      };
      
      data.managementInsights = generateInsights(data);
      
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [periodType, periodOffset, currentHospital, currentState, currentDepartment]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handlePrint = () => {
    if (!reportData || !printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita pop-ups para gerar o PDF.');
      return;
    }

    const networkLogoUrl = new URL(whitelabel.logos.networkFull, window.location.origin).href;
    const platformLogoUrl = new URL(whitelabel.logos.platform, window.location.origin).href;
    const { label } = getPeriodDates(periodType, parseInt(periodOffset));
    const periodTypeLabel = periodType === "mensal" ? "Mensal" : periodType === "trimestral" ? "Trimestral" : "Semestral";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Analítico Clínico - ${label}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
              background: white; color: #1a1a2e;
              padding: 10mm 14mm;
              font-size: 9pt;
              line-height: 1.4;
            }
            @page { size: A4 portrait; margin: 6mm; }
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .page-break { page-break-before: always; }
            }
            .header {
              display: flex; align-items: center; justify-content: space-between;
              padding-bottom: 10px; border-bottom: 3px solid #013ba6;
              margin-bottom: 14px;
            }
            .header img { height: 50px; width: auto; object-fit: contain; }
            .header-center { text-align: center; flex: 1; padding: 0 16px; }
            .header-center h1 { font-size: 14pt; color: #013ba6; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
            .header-center p { font-size: 8pt; color: #64748b; }
            .meta-bar {
              display: flex; justify-content: space-between; align-items: center;
              background: #f0f4ff; padding: 6px 12px; border-radius: 6px;
              margin-bottom: 14px; font-size: 8pt; color: #334155;
            }
            .meta-bar strong { color: #013ba6; }
            .section-title {
              font-size: 11pt; font-weight: 700; color: #013ba6;
              border-left: 4px solid #013ba6; padding-left: 8px;
              margin: 14px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .section-title.red { color: #dc2626; border-color: #dc2626; }
            .section-title.orange { color: #ea580c; border-color: #ea580c; }
            .section-title.purple { color: #7c3aed; border-color: #7c3aed; }
            .section-title.teal { color: #0d9488; border-color: #0d9488; }
            .section-title.amber { color: #d97706; border-color: #d97706; }
            
            .kpi-row { display: flex; gap: 10px; margin-bottom: 14px; }
            .kpi-card {
              flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
              border-radius: 8px; padding: 10px 14px; text-align: center;
            }
            .kpi-card .value { font-size: 22pt; font-weight: 800; color: #013ba6; }
            .kpi-card .label { font-size: 7pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-card.death .value { color: #dc2626; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 8pt; }
            th { background: #013ba6; color: white; padding: 5px 6px; text-align: left; font-weight: 600; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.3px; }
            td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr:nth-child(even) { background: #f8fafc; }
            
            .badge {
              display: inline-block; padding: 1px 6px; border-radius: 4px;
              font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
            }
            .badge-gravissimo { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .badge-grave { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
            .badge-potencial { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
            
            .alert-box {
              background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626;
              padding: 6px 10px; border-radius: 4px; margin-top: 4px; font-size: 7.5pt;
              color: #991b1b; font-weight: 600;
            }
            
            .syndrome-bar {
              display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
            }
            .syndrome-bar .bar-label { width: 260px; font-size: 8pt; text-align: right; }
            .syndrome-bar .bar-track { flex: 1; height: 14px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
            .syndrome-bar .bar-fill { height: 100%; background: linear-gradient(90deg, #013ba6, #0152d4); border-radius: 3px; }
            .syndrome-bar .bar-value { width: 60px; font-size: 7.5pt; color: #334155; font-weight: 600; }
            
            .insight-box {
              background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a;
              padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; font-size: 8pt;
              color: #14532d;
            }
            .insight-box strong { color: #15803d; }
            
            .footer {
              margin-top: 20px; padding-top: 10px; border-top: 2px solid #013ba6;
              display: flex; justify-content: space-between; font-size: 7pt; color: #94a3b8;
            }
            .watermark {
              position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
              opacity: 0.03; z-index: 0; pointer-events: none;
            }
            .watermark img { width: 400px; }
            .confidential {
              text-align: center; font-size: 6.5pt; color: #94a3b8;
              text-transform: uppercase; letter-spacing: 1px; margin-top: 6px;
            }
            .empty-notice {
              text-align: center; padding: 20px; color: #94a3b8; font-style: italic; font-size: 9pt;
            }
            .period-badge {
              display: inline-block; background: #013ba6; color: white; padding: 2px 10px;
              border-radius: 12px; font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="watermark"><img src="${platformLogoUrl}" /></div>
          
          <div class="header">
            <img src="${platformLogoUrl}" alt="HapMap" />
            <div class="header-center">
              <h1>Relatório Analítico Clínico</h1>
              <p>Análise Epidemiológica e de Gravidade — <span class="period-badge">${periodTypeLabel}</span> ${label}</p>
            </div>
            <img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" />
          </div>
          
          <div class="meta-bar">
            <span><strong>Setor:</strong> ${reportData.sector}</span>
            <span><strong>Período:</strong> ${reportData.period}</span>
            <span><strong>Total de Movimentações:</strong> ${reportData.totalMovements}</span>
            <span><strong>Gerado por:</strong> HapMap 2.0 — IA Analítica</span>
          </div>
          
          <div class="kpi-row">
            <div class="kpi-card"><div class="value">${reportData.totalMovements}</div><div class="label">Movimentações Totais</div></div>
            <div class="kpi-card"><div class="value">${reportData.totalAltas}</div><div class="label">Altas</div></div>
            <div class="kpi-card"><div class="value">${reportData.totalTransferencias}</div><div class="label">Transferências</div></div>
            <div class="kpi-card death"><div class="value">${reportData.totalObitos}</div><div class="label">Óbitos</div></div>
            <div class="kpi-card"><div class="value">${reportData.utiTransfers.length}</div><div class="label">Transferências UTI</div></div>
            <div class="kpi-card"><div class="value">${reportData.recurrentPatients.length}</div><div class="label">Pacientes Recorrentes</div></div>
          </div>

          <h2 class="section-title red">1. Óbitos — Eventos Sentinela</h2>
          ${reportData.deaths.length > 0 ? `
          <table>
            <tr><th>Paciente</th><th>Data</th><th>Diagnóstico</th><th>Antecedentes</th><th>Síndrome</th></tr>
            ${reportData.deaths.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.date}</td>
                <td>${d.diagnoses}</td>
                <td>${d.history}</td>
                <td>${d.syndrome}</td>
              </tr>
              ${d.alert ? `<tr><td colspan="5"><div class="alert-box">⚠ ${d.alert}</div></td></tr>` : ''}
            `).join('')}
          </table>` : '<p class="empty-notice">Nenhum óbito registrado no período.</p>'}

          <h2 class="section-title orange">2. Casos Gravíssimos — Transferências para UTI</h2>
          ${reportData.utiTransfers.length > 0 ? `
          <table>
            <tr><th>Paciente</th><th>Data</th><th>Diagnóstico Principal</th><th>Antecedentes</th><th>Classificação Sindrômica</th></tr>
            ${reportData.utiTransfers.map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.date}</td>
                <td>${t.diagnoses}</td>
                <td>${t.history}</td>
                <td>${t.syndrome}</td>
              </tr>
            `).join('')}
          </table>` : '<p class="empty-notice">Nenhuma transferência para UTI registrada no período.</p>'}

          <div class="page-break"></div>
          
          <div class="header">
            <img src="${platformLogoUrl}" alt="HapMap" />
            <div class="header-center">
              <h1>Relatório Analítico Clínico</h1>
              <p>Recorrência e Distribuição Sindrômica — ${label}</p>
            </div>
            <img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" />
          </div>

          <h2 class="section-title purple">3. Pacientes Recorrentes — Análise de Padrão</h2>
          ${reportData.recurrentPatients.length > 0 ? `
          <table>
            <tr><th>Paciente</th><th>Visitas</th><th>Diagnósticos</th><th>Padrão Identificado</th><th>Gravidade</th></tr>
            ${reportData.recurrentPatients.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td style="text-align:center; font-weight:700; font-size:11pt; color:#7c3aed;">${r.visits}</td>
                <td>${r.diagnoses}</td>
                <td><em>${r.pattern}</em></td>
                <td><span class="badge ${r.severity === 'GRAVÍSSIMO' ? 'badge-gravissimo' : r.severity === 'GRAVE' ? 'badge-grave' : 'badge-potencial'}">${r.severity}</span></td>
              </tr>
            `).join('')}
          </table>` : '<p class="empty-notice">Nenhum paciente com recorrência identificada no período.</p>'}

          <h2 class="section-title teal">4. Distribuição Sindrômica</h2>
          ${reportData.syndromes.length > 0 ? `
          <div style="margin-bottom: 14px;">
            ${reportData.syndromes.map(s => `
              <div class="syndrome-bar">
                <div class="bar-label">${s.name}</div>
                <div class="bar-track"><div class="bar-fill" style="width: ${Math.min(s.percentage * 2.5, 100)}%;"></div></div>
                <div class="bar-value">${s.count} (${s.percentage}%)</div>
              </div>
            `).join('')}
          </div>` : '<p class="empty-notice">Sem dados sindrômicos para o período.</p>'}

          <h2 class="section-title amber">5. Insights para Gestão</h2>
          ${reportData.managementInsights.length > 0 ? reportData.managementInsights.map((insight, i) => `
            <div class="insight-box"><strong>${i + 1}.</strong> ${insight}</div>
          `).join('') : '<p class="empty-notice">Dados insuficientes para gerar insights no período.</p>'}

          <div class="footer">
            <span>${whitelabel.platform.fullName} — ${whitelabel.institution.networkName}</span>
            <span>Documento gerado automaticamente • ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>${whitelabel.credits.authorSignature}</span>
          </div>
          <div class="confidential">Documento Confidencial — Uso exclusivo da coordenação médica</div>
        </body>
      </html>
    `);

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
      setTimeout(() => printWindow.print(), 200);
    });
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    const { label } = getPeriodDates(periodType, parseInt(periodOffset));
    const periodTypeLabel = periodType === "mensal" ? "Mensal" : periodType === "trimestral" ? "Trimestral" : "Semestral";

    const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cell = (v: string | number, type: 'String' | 'Number' = 'String', styleId = '') => {
      const style = styleId ? ` ss:StyleID="${styleId}"` : '';
      return `<Cell${style}><Data ss:Type="${type}">${type === 'String' ? escXml(String(v)) : v}</Data></Cell>`;
    };
    const row = (cells: string[]) => `<Row>${cells.join('')}</Row>`;

    const styles = `
      <Styles>
        <Style ss:ID="Default"><Font ss:FontName="Segoe UI" ss:Size="9"/></Style>
        <Style ss:ID="Title"><Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#013BA6"/></Style>
        <Style ss:ID="Subtitle"><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#64748B"/></Style>
        <Style ss:ID="Header"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#013BA6" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderRed"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#DC2626" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderOrange"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#EA580C" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderPurple"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#7C3AED" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderTeal"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0D9488" ss:Pattern="Solid"/></Style>
        <Style ss:ID="HeaderAmber"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#D97706" ss:Pattern="Solid"/></Style>
        <Style ss:ID="SectionTitle"><Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#013BA6"/><Interior ss:Color="#F0F4FF" ss:Pattern="Solid"/></Style>
        <Style ss:ID="KpiValue"><Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#013BA6"/><Alignment ss:Horizontal="Center"/></Style>
        <Style ss:ID="KpiLabel"><Font ss:FontName="Segoe UI" ss:Size="8" ss:Color="#64748B"/><Alignment ss:Horizontal="Center"/></Style>
        <Style ss:ID="AlertRow"><Font ss:FontName="Segoe UI" ss:Size="8" ss:Bold="1" ss:Color="#991B1B"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/></Style>
        <Style ss:ID="InsightRow"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#14532D"/><Interior ss:Color="#F0FDF4" ss:Pattern="Solid"/></Style>
        <Style ss:ID="Bold"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1"/></Style>
        <Style ss:ID="Percent"><NumberFormat ss:Format="0%"/></Style>
        <Style ss:ID="Zebra"><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
        <Style ss:ID="Footer"><Font ss:FontName="Segoe UI" ss:Size="7" ss:Color="#94A3B8" ss:Italic="1"/></Style>
      </Styles>`;

    // ── Sheet 1: Resumo ──
    let resumoRows = [
      row([cell('RELATÓRIO ANALÍTICO CLÍNICO', 'String', 'Title')]),
      row([cell(`${periodTypeLabel} — ${label}`, 'String', 'Subtitle')]),
      row([cell(`Setor: ${reportData.sector} | Período: ${reportData.period}`, 'String', 'Subtitle')]),
      row([cell(`Gerado por: ${whitelabel.platform.fullName} — IA Analítica`, 'String', 'Footer')]),
      row([]),
      row([cell('Indicador', 'String', 'Header'), cell('Valor', 'String', 'Header')]),
      row([cell('Movimentações Totais'), cell(reportData.totalMovements, 'Number')]),
      row([cell('Altas'), cell(reportData.totalAltas, 'Number')]),
      row([cell('Transferências'), cell(reportData.totalTransferencias, 'Number')]),
      row([cell('Óbitos'), cell(reportData.totalObitos, 'Number')]),
      row([cell('Transferências UTI'), cell(reportData.utiTransfers.length, 'Number')]),
      row([cell('Pacientes Recorrentes'), cell(reportData.recurrentPatients.length, 'Number')]),
    ];

    // ── Sheet 2: Óbitos ──
    let obitosRows = [
      row([cell('1. ÓBITOS — EVENTOS SENTINELA', 'String', 'SectionTitle')]),
      row([]),
      row([cell('Paciente', 'String', 'HeaderRed'), cell('Data', 'String', 'HeaderRed'), cell('Diagnóstico', 'String', 'HeaderRed'), cell('Antecedentes', 'String', 'HeaderRed'), cell('Síndrome', 'String', 'HeaderRed'), cell('Alerta Sentinela', 'String', 'HeaderRed')]),
    ];
    if (reportData.deaths.length > 0) {
      reportData.deaths.forEach((d, i) => {
        const style = i % 2 === 0 ? 'Zebra' : '';
        obitosRows.push(row([cell(d.name, 'String', style ? 'Bold' : 'Bold'), cell(d.date, 'String', style), cell(d.diagnoses, 'String', style), cell(d.history, 'String', style), cell(d.syndrome, 'String', style), cell(d.alert || '', 'String', d.alert ? 'AlertRow' : style)]));
      });
    } else {
      obitosRows.push(row([cell('Nenhum óbito registrado no período.')]));
    }

    // ── Sheet 3: UTI ──
    let utiRows = [
      row([cell('2. CASOS GRAVÍSSIMOS — TRANSFERÊNCIAS UTI', 'String', 'SectionTitle')]),
      row([]),
      row([cell('Paciente', 'String', 'HeaderOrange'), cell('Data', 'String', 'HeaderOrange'), cell('Diagnóstico', 'String', 'HeaderOrange'), cell('Antecedentes', 'String', 'HeaderOrange'), cell('Síndrome', 'String', 'HeaderOrange')]),
    ];
    if (reportData.utiTransfers.length > 0) {
      reportData.utiTransfers.forEach((t, i) => {
        const style = i % 2 === 0 ? 'Zebra' : '';
        utiRows.push(row([cell(t.name, 'String', 'Bold'), cell(t.date, 'String', style), cell(t.diagnoses, 'String', style), cell(t.history, 'String', style), cell(t.syndrome, 'String', style)]));
      });
    } else {
      utiRows.push(row([cell('Nenhuma transferência UTI no período.')]));
    }

    // ── Sheet 4: Recorrentes ──
    let recorrentesRows = [
      row([cell('3. PACIENTES RECORRENTES — ANÁLISE DE PADRÃO', 'String', 'SectionTitle')]),
      row([]),
      row([cell('Paciente', 'String', 'HeaderPurple'), cell('Visitas', 'String', 'HeaderPurple'), cell('Diagnósticos', 'String', 'HeaderPurple'), cell('Padrão Identificado', 'String', 'HeaderPurple'), cell('Gravidade', 'String', 'HeaderPurple')]),
    ];
    if (reportData.recurrentPatients.length > 0) {
      reportData.recurrentPatients.forEach((r, i) => {
        const style = i % 2 === 0 ? 'Zebra' : '';
        recorrentesRows.push(row([cell(r.name, 'String', 'Bold'), cell(r.visits, 'Number'), cell(r.diagnoses, 'String', style), cell(r.pattern, 'String', style), cell(r.severity, 'String', style)]));
      });
    } else {
      recorrentesRows.push(row([cell('Nenhum paciente recorrente identificado.')]));
    }

    // ── Sheet 5: Síndromes ──
    let sindromesRows = [
      row([cell('4. DISTRIBUIÇÃO SINDRÔMICA', 'String', 'SectionTitle')]),
      row([]),
      row([cell('Síndrome', 'String', 'HeaderTeal'), cell('Casos', 'String', 'HeaderTeal'), cell('Percentual', 'String', 'HeaderTeal')]),
    ];
    reportData.syndromes.forEach((s, i) => {
      const style = i % 2 === 0 ? 'Zebra' : '';
      sindromesRows.push(row([cell(s.name, 'String', style), cell(s.count, 'Number'), cell(`${s.percentage}%`)]));
    });

    // ── Sheet 6: Insights ──
    let insightsRows = [
      row([cell('5. INSIGHTS PARA GESTÃO', 'String', 'SectionTitle')]),
      row([]),
      row([cell('Nº', 'String', 'HeaderAmber'), cell('Insight', 'String', 'HeaderAmber')]),
    ];
    reportData.managementInsights.forEach((insight, i) => {
      insightsRows.push(row([cell(i + 1, 'Number'), cell(insight, 'String', 'InsightRow')]));
    });

    const makeSheet = (name: string, rows: string[], colWidths: number[]) => `
      <Worksheet ss:Name="${escXml(name)}">
        <Table>${colWidths.map(w => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`).join('')}
          ${rows.join('\n')}
        </Table>
      </Worksheet>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${styles}
  ${makeSheet('Resumo', resumoRows, [200, 120])}
  ${makeSheet('Óbitos', obitosRows, [180, 80, 250, 200, 180, 250])}
  ${makeSheet('Transferências UTI', utiRows, [180, 80, 250, 200, 180])}
  ${makeSheet('Recorrentes', recorrentesRows, [180, 70, 250, 250, 120])}
  ${makeSheet('Síndromes', sindromesRows, [300, 80, 80])}
  ${makeSheet('Insights', insightsRows, [40, 600])}
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-analitico-clinico-${label.replace(/\s+/g, '-').toLowerCase()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const networkLogoUrl = whitelabel.logos.networkFull;
  const platformLogoUrl = whitelabel.logos.platform;
  const periodOptions = getPeriodOptions(periodType);
  const { label: currentPeriodLabel } = getPeriodDates(periodType, parseInt(periodOffset));

  const getSeverityColor = (severity: string) => {
    if (severity === 'GRAVÍSSIMO') return 'bg-red-100 text-red-700 border-red-300';
    if (severity === 'GRAVE') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-amber-100 text-amber-700 border-amber-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">IA Analítica</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Period filter bar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-medium shrink-0">Período:</span>
          
          {/* Period type tabs */}
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            {(["mensal", "trimestral", "semestral"] as PeriodType[]).map(type => (
              <button
                key={type}
                onClick={() => { setPeriodType(type); setPeriodOffset("0"); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  periodType === type 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                }`}
              >
                {type === "mensal" ? "Mensal" : type === "trimestral" ? "Trimestral" : "Semestral"}
              </button>
            ))}
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <Select value={periodOffset} onValueChange={setPeriodOffset}>
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs text-muted-foreground ml-auto">
            {currentDepartment}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-muted/50 p-4">
        {isLoading ? (
          <div className="max-w-lg mx-auto mt-12 bg-background rounded-xl shadow-lg border p-8">
            <AILoadingAnimation />
          </div>
        ) : !reportData || reportData.totalMovements === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
            <CalendarRange className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm">Sem movimentações registradas para o período selecionado.</p>
            <p className="text-xs">Tente selecionar um período diferente ou verifique o setor ativo.</p>
          </div>
        ) : (
          <div ref={printRef} className="max-w-4xl mx-auto bg-white text-black rounded-lg shadow-lg p-8 animate-fade-in" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b-[3px] border-[#013ba6] mb-4">
              <img src={platformLogoUrl} alt="HapMap" className="h-12" />
              <div className="text-center flex-1 px-4">
                <h1 className="text-xl font-extrabold text-[#013ba6] tracking-wide uppercase">Relatório Analítico Clínico</h1>
                <p className="text-xs text-gray-500">
                  Análise Epidemiológica e de Gravidade — 
                  <span className="inline-block bg-[#013ba6] text-white px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1">
                    {periodType === "mensal" ? "MENSAL" : periodType === "trimestral" ? "TRIMESTRAL" : "SEMESTRAL"}
                  </span>
                  {" "}{currentPeriodLabel}
                </p>
              </div>
              <img src={networkLogoUrl} alt="Hapvida" className="h-10" />
            </div>

            {/* Meta */}
            <div className="flex justify-between bg-blue-50 px-3 py-2 rounded-md mb-4 text-xs text-gray-600">
              <span><strong className="text-[#013ba6]">Setor:</strong> {reportData.sector}</span>
              <span><strong className="text-[#013ba6]">Período:</strong> {reportData.period}</span>
              <span><strong className="text-[#013ba6]">Total:</strong> {reportData.totalMovements} movimentações</span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-6 gap-2 mb-5">
              {[
                { v: reportData.totalMovements, l: "Movimentações", c: "text-[#013ba6]" },
                { v: reportData.totalAltas, l: "Altas", c: "text-[#013ba6]" },
                { v: reportData.totalTransferencias, l: "Transferências", c: "text-[#013ba6]" },
                { v: reportData.totalObitos, l: "Óbitos", c: "text-red-600" },
                { v: reportData.utiTransfers.length, l: "UTI", c: "text-[#013ba6]" },
                { v: reportData.recurrentPatients.length, l: "Recorrentes", c: "text-[#013ba6]" },
              ].map((kpi, i) => (
                <div key={i} className="border rounded-lg p-2 text-center bg-gray-50">
                  <div className={`text-2xl font-extrabold ${kpi.c}`}>{kpi.v}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{kpi.l}</div>
                </div>
              ))}
            </div>

            {/* Deaths */}
            <h2 className="text-sm font-bold text-red-600 border-l-4 border-red-600 pl-2 mb-2 uppercase tracking-wider">1. Óbitos — Eventos Sentinela</h2>
            {reportData.deaths.length > 0 ? (
              <table className="w-full text-xs mb-4 border-collapse">
                <thead><tr className="bg-red-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Antecedentes</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
                <tbody>
                  {reportData.deaths.map((d, i) => (
                    <>
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-1.5 font-semibold">{d.name}</td>
                        <td className="p-1.5 text-center">{d.date}</td>
                        <td className="p-1.5">{d.diagnoses}</td>
                        <td className="p-1.5">{d.history}</td>
                        <td className="p-1.5">{d.syndrome}</td>
                      </tr>
                      {d.alert && <tr key={`alert-${i}`}><td colSpan={5} className="px-1.5 pb-2"><div className="bg-red-50 border border-red-200 border-l-4 border-l-red-600 p-1.5 rounded text-red-800 text-[10px] font-semibold">⚠ {d.alert}</div></td></tr>}
                    </>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-400 italic mb-4 text-center py-3">Nenhum óbito registrado no período.</p>
            )}

            {/* UTI Transfers */}
            <h2 className="text-sm font-bold text-orange-600 border-l-4 border-orange-600 pl-2 mb-2 uppercase tracking-wider">2. Casos Gravíssimos — Transferências UTI</h2>
            {reportData.utiTransfers.length > 0 ? (
              <table className="w-full text-xs mb-4 border-collapse">
                <thead><tr className="bg-orange-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Antecedentes</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
                <tbody>
                  {reportData.utiTransfers.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-1.5 font-semibold">{t.name}</td>
                      <td className="p-1.5 text-center">{t.date}</td>
                      <td className="p-1.5">{t.diagnoses}</td>
                      <td className="p-1.5">{t.history}</td>
                      <td className="p-1.5">{t.syndrome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-400 italic mb-4 text-center py-3">Nenhuma transferência UTI no período.</p>
            )}

            {/* Recurrence */}
            <h2 className="text-sm font-bold text-purple-600 border-l-4 border-purple-600 pl-2 mb-2 uppercase tracking-wider">3. Pacientes Recorrentes</h2>
            {reportData.recurrentPatients.length > 0 ? (
              <table className="w-full text-xs mb-4 border-collapse">
                <thead><tr className="bg-purple-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Visitas</th><th className="p-1.5 text-left">Diagnósticos</th><th className="p-1.5 text-left">Padrão</th><th className="p-1.5">Gravidade</th></tr></thead>
                <tbody>
                  {reportData.recurrentPatients.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-1.5 font-semibold">{r.name}</td>
                      <td className="p-1.5 text-center font-bold text-purple-700 text-base">{r.visits}</td>
                      <td className="p-1.5">{r.diagnoses}</td>
                      <td className="p-1.5 italic text-gray-600">{r.pattern}</td>
                      <td className="p-1.5"><span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSeverityColor(r.severity)}`}>{r.severity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-400 italic mb-4 text-center py-3">Nenhum paciente recorrente identificado.</p>
            )}

            {/* Syndromes */}
            <h2 className="text-sm font-bold text-teal-600 border-l-4 border-teal-600 pl-2 mb-2 uppercase tracking-wider">4. Distribuição Sindrômica</h2>
            {reportData.syndromes.length > 0 ? (
              <div className="mb-4 space-y-1">
                {reportData.syndromes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-64 text-right text-gray-700">{s.name}</span>
                    <div className="flex-1 h-3.5 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#013ba6] to-[#0152d4] rounded" style={{ width: `${Math.min(s.percentage * 2.5, 100)}%` }} />
                    </div>
                    <span className="w-16 text-gray-600 font-semibold">{s.count} ({s.percentage}%)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mb-4 text-center py-3">Sem dados sindrômicos.</p>
            )}

            {/* Insights */}
            <h2 className="text-sm font-bold text-amber-600 border-l-4 border-amber-600 pl-2 mb-2 uppercase tracking-wider">5. Insights para Gestão</h2>
            {reportData.managementInsights.length > 0 ? (
              <div className="space-y-1.5 mb-4">
                {reportData.managementInsights.map((insight, i) => (
                  <div key={i} className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 px-2.5 py-1.5 rounded text-xs text-green-900">
                    <strong className="text-green-700">{i + 1}.</strong> {insight}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mb-4 text-center py-3">Dados insuficientes para insights.</p>
            )}

            {/* Export buttons */}
            <div className="flex items-center justify-center gap-3 mt-6 mb-4">
              <Button onClick={handlePrint} className="gap-2" size="sm">
                <Printer className="h-4 w-4" /> Gerar PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="gap-2" size="sm">
                <FileSpreadsheet className="h-4 w-4" /> Gerar Excel
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t-2 border-[#013ba6] flex justify-between text-[9px] text-gray-400">
              <span>{whitelabel.platform.fullName} — {whitelabel.institution.networkName}</span>
              <span>{whitelabel.credits.authorSignature}</span>
            </div>
            <p className="text-center text-[8px] text-gray-400 uppercase tracking-widest mt-1">Documento Confidencial — Uso exclusivo da coordenação médica</p>
          </div>
        )}
      </div>
    </div>
  );
}
