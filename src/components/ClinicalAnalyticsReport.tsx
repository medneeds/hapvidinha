import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, X, Loader2, CalendarRange } from "lucide-react";
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
  const grave = ["sepse", "iam", "irpa", "insuficiência respiratória", "choque", "pcr", "hemorrag", "abdome agudo", "lma", "leucemia"];
  const gravissimo = ["óbito", "pcr", "choque séptico", "falência", "gravíssimo"];
  
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
    const dialyticPatients = data.recurrentPatients.filter(p => 
      p.diagnoses.toLowerCase().includes("drc") || p.diagnoses.toLowerCase().includes("diál") || p.diagnoses.toLowerCase().includes("hemodiálise")
    );
    if (dialyticPatients.length > 0) {
      const totalVisits = dialyticPatients.reduce((sum, p) => sum + p.visits, 0);
      insights.push(`FALHA DE FLUXO DIALÍTICO: ${totalVisits} visitas de ${dialyticPatients.length} pacientes DRC à emergência. Recomenda-se encaminhamento ao serviço de nefrologia ambulatorial.`);
    }
  }
  
  if (data.deaths.length > 0) {
    const youngDeaths = data.deaths.filter(d => d.history.toLowerCase().includes("nega") || d.history === "—");
    if (youngDeaths.length > 0) {
      insights.push(`CASO SENTINELA — ${youngDeaths.length} óbito(s) sem comorbidades prévias. Avaliar protocolos de detecção precoce.`);
    }
  }
  
  if (data.utiTransfers.length > 3) {
    const cardioTransfers = data.utiTransfers.filter(t => t.syndrome.toLowerCase().includes("cardio"));
    if (cardioTransfers.length >= 2) {
      insights.push(`ALTA DEMANDA CARDIOVASCULAR PARA UTI: ${cardioTransfers.length} transferências por SCA/ICC no período. Considerar ampliação de leitos coronarianos.`);
    }
  }
  
  if (data.totalObitos > 0) {
    const taxaObito = ((data.totalObitos / data.totalMovements) * 100).toFixed(2);
    insights.push(`TAXA DE MORTALIDADE: ${taxaObito}% no período (${data.totalObitos} óbitos em ${data.totalMovements} movimentações).`);
  }
  
  const topSyndrome = data.syndromes[0];
  if (topSyndrome) {
    insights.push(`PERFIL EPIDEMIOLÓGICO DOMINANTE: ${topSyndrome.name} representando ${topSyndrome.percentage}% (${topSyndrome.count} casos) das movimentações.`);
  }
  
  if (data.recurrentPatients.filter(p => p.severity === "GRAVÍSSIMO").length > 0) {
    insights.push(`ATENÇÃO: ${data.recurrentPatients.filter(p => p.severity === "GRAVÍSSIMO").length} paciente(s) recorrente(s) com classificação GRAVÍSSIMO. Necessário plano de acompanhamento.`);
  }
  
  if (data.totalAltas > 0) {
    const taxaAlta = ((data.totalAltas / data.totalMovements) * 100).toFixed(1);
    insights.push(`TAXA DE RESOLUBILIDADE: ${taxaAlta}% de altas no período. ${data.totalAltas > data.totalTransferencias ? 'Boa capacidade resolutiva.' : 'Proporção elevada de transferências.'}`);
  }
  
  return insights.slice(0, 8);
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
    try {
      const { from, to, label } = getPeriodDates(periodType, parseInt(periodOffset));
      
      const { data: movements, error } = await supabase
        .from("patient_movements")
        .select("*")
        .eq("hospital_unit_id", currentHospital.id)
        .eq("state_id", currentState.id)
        .eq("department", currentDepartment)
        .gte("created_at", startOfDay(from).toISOString())
        .lte("created_at", endOfDay(to).toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const movs = movements || [];
      
      // KPIs
      const totalAltas = movs.filter(m => m.movement_type === "alta").length;
      const totalTransferencias = movs.filter(m => m.movement_type === "transferencia" || m.movement_type === "transferência").length;
      const totalObitos = movs.filter(m => m.movement_type === "obito" || m.movement_type === "óbito").length;
      
      // Deaths
      const deathMovs = movs.filter(m => m.movement_type === "obito" || m.movement_type === "óbito");
      const deaths: DeathRecord[] = deathMovs.map(m => {
        const snapshot = m.patient_snapshot as any || {};
        const diagnoses = snapshot.diagnoses || m.notes || "Sem diagnóstico registrado";
        const history = snapshot.medical_history || "—";
        return {
          name: m.patient_name,
          date: format(new Date(m.created_at), "dd/MM/yyyy"),
          diagnoses,
          history,
          severity: "GRAVÍSSIMO",
          syndrome: classifySyndrome(diagnoses),
          alert: history.toLowerCase().includes("nega") ? `CASO SENTINELA — Paciente sem comorbidades prévias, óbito por ${diagnoses.split("/")[0].trim()}` : undefined,
        };
      });
      
      // UTI Transfers
      const utiMovs = movs.filter(m => {
        const dest = (m.destination || "").toLowerCase();
        return dest.includes("uti") || dest.includes("unidade de terapia");
      });
      const utiTransfers: UtiTransfer[] = utiMovs.map(m => {
        const snapshot = m.patient_snapshot as any || {};
        const diagnoses = snapshot.diagnoses || m.notes || "Sem diagnóstico registrado";
        const history = snapshot.medical_history || "—";
        return {
          name: m.patient_name,
          date: format(new Date(m.created_at), "dd/MM"),
          diagnoses,
          history,
          syndrome: classifySyndrome(diagnoses),
        };
      });
      
      // Recurrent patients
      const patientVisits: Record<string, { count: number; diagnoses: string[]; snapshots: any[] }> = {};
      movs.forEach(m => {
        const key = m.patient_name.toUpperCase().trim();
        if (!patientVisits[key]) patientVisits[key] = { count: 0, diagnoses: [], snapshots: [] };
        patientVisits[key].count++;
        const snapshot = m.patient_snapshot as any || {};
        if (snapshot.diagnoses) patientVisits[key].diagnoses.push(snapshot.diagnoses);
        if (m.notes) patientVisits[key].diagnoses.push(m.notes);
        patientVisits[key].snapshots.push(snapshot);
      });
      
      const recurrentPatients: RecurrentPatient[] = Object.entries(patientVisits)
        .filter(([, v]) => v.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 15)
        .map(([name, v]) => {
          const allDiag = [...new Set(v.diagnoses)].join(" / ") || "Sem registro";
          const history = v.snapshots[0]?.medical_history || "";
          return {
            name,
            visits: v.count,
            diagnoses: allDiag.length > 120 ? allDiag.substring(0, 117) + "..." : allDiag,
            pattern: v.count >= 4 ? "Alta recorrência — investigar acompanhamento ambulatorial" :
                     v.count >= 3 ? "Recorrência moderada — avaliar plano terapêutico" :
                     "Readmissão — monitorar evolução",
            severity: classifySeverity(allDiag, history),
          };
        });
      
      // Syndromes
      const syndromeCounts: Record<string, number> = {};
      movs.forEach(m => {
        const snapshot = m.patient_snapshot as any || {};
        const text = (snapshot.diagnoses || "") + " " + (m.notes || "") + " " + (m.destination || "");
        const syndrome = classifySyndrome(text);
        syndromeCounts[syndrome] = (syndromeCounts[syndrome] || 0) + 1;
      });
      
      const totalForSyndromes = movs.length || 1;
      const syndromes: SyndromeData[] = Object.entries(syndromeCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalForSyndromes) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .filter(s => s.name !== "Outras")
        .slice(0, 11);
      
      // Add "Outras" if needed
      const classifiedCount = syndromes.reduce((sum, s) => sum + s.count, 0);
      if (classifiedCount < movs.length) {
        syndromes.push({
          name: "Outras / Não classificadas",
          count: movs.length - classifiedCount,
          percentage: Math.round(((movs.length - classifiedCount) / totalForSyndromes) * 100),
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
          
          <!-- KPIs -->
          <div class="kpi-row">
            <div class="kpi-card"><div class="value">${reportData.totalMovements}</div><div class="label">Movimentações Totais</div></div>
            <div class="kpi-card"><div class="value">${reportData.totalAltas}</div><div class="label">Altas</div></div>
            <div class="kpi-card"><div class="value">${reportData.totalTransferencias}</div><div class="label">Transferências</div></div>
            <div class="kpi-card death"><div class="value">${reportData.totalObitos}</div><div class="label">Óbitos</div></div>
            <div class="kpi-card"><div class="value">${reportData.utiTransfers.length}</div><div class="label">Transferências UTI</div></div>
            <div class="kpi-card"><div class="value">${reportData.recurrentPatients.length}</div><div class="label">Pacientes Recorrentes</div></div>
          </div>

          <!-- ÓBITOS -->
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

          <!-- UTI -->
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

          <!-- RECORRÊNCIA -->
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

          <!-- SÍNDROMES -->
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

          <!-- INSIGHTS -->
          <h2 class="section-title amber">5. Insights para Gestão</h2>
          ${reportData.managementInsights.length > 0 ? reportData.managementInsights.map((insight, i) => `
            <div class="insight-box"><strong>${i + 1}.</strong> ${insight}</div>
          `).join('') : '<p class="empty-notice">Dados insuficientes para gerar insights no período.</p>'}

          <!-- FOOTER -->
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
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-foreground whitespace-nowrap">Relatório Analítico Clínico</h2>
        
        {/* Period Filters */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <Select value={periodType} onValueChange={(v: PeriodType) => { setPeriodType(v); setPeriodOffset("0"); }}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={periodOffset} onValueChange={setPeriodOffset}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2" disabled={isLoading || !reportData}>
            <Printer className="h-4 w-4" /> Gerar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-muted/50 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Gerando relatório analítico...</span>
          </div>
        ) : !reportData ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Sem dados disponíveis para o período selecionado.
          </div>
        ) : (
          <div ref={printRef} className="max-w-4xl mx-auto bg-white text-black rounded-lg shadow-lg p-8" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
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
                <thead><tr className="bg-red-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
                <tbody>
                  {reportData.deaths.map((d, i) => (
                    <>
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-1.5 font-semibold">{d.name}</td>
                        <td className="p-1.5 text-center">{d.date}</td>
                        <td className="p-1.5">{d.diagnoses}</td>
                        <td className="p-1.5">{d.syndrome}</td>
                      </tr>
                      {d.alert && <tr key={`alert-${i}`}><td colSpan={4} className="px-1.5 pb-2"><div className="bg-red-50 border border-red-200 border-l-4 border-l-red-600 p-1.5 rounded text-red-800 text-[10px] font-semibold">⚠ {d.alert}</div></td></tr>}
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
                <thead><tr className="bg-orange-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
                <tbody>
                  {reportData.utiTransfers.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-1.5 font-semibold">{t.name}</td>
                      <td className="p-1.5 text-center">{t.date}</td>
                      <td className="p-1.5">{t.diagnoses}</td>
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

            {/* Footer */}
            <div className="mt-6 pt-3 border-t-2 border-[#013ba6] flex justify-between text-[9px] text-gray-400">
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
