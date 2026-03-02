import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { whitelabel } from "@/config/whitelabel";

// ── Data hardcoded from February 2026 analysis ──

const REPORT_DATA = {
  period: "01/02/2026 a 28/02/2026",
  sector: "URGÊNCIA E EMERGÊNCIA ADULTO",
  totalMovements: 456,
  totalAltas: 249,
  totalTransferencias: 205,
  totalObitos: 2,

  deaths: [
    {
      name: "JOSE JOAQUIM DOS SANTOS",
      date: "03/02/2026",
      diagnoses: "Insuficiência Respiratória Aguda → Hipóxia → PCR / PNM Broncoaspirativa",
      history: "HAS, DM2, DRC não dialítico",
      severity: "GRAVÍSSIMO",
      syndrome: "Respiratória / Infecciosa",
    },
    {
      name: "THARCYLLA VICTORIA PEREIRA SOUZA",
      date: "23/02/2026",
      diagnoses: "Influenza A",
      history: "Nega comorbidades",
      severity: "GRAVÍSSIMO",
      syndrome: "Infecciosa / Viral",
      alert: "CASO SENTINELA — Paciente jovem, sem comorbidades, óbito por Influenza A",
    },
  ],

  utiTransfers: [
    { name: "MARIA MOURA CUNHA", date: "01/02", diagnoses: "Sepse foco pulmonar/urinário + IRPA + IRA + IC descompensada + Acidose metabólica", history: "DM, AVC isquêmico recente, FA crônica", syndrome: "Infecciosa / Cardiovascular" },
    { name: "LUIZ GUSTAVO DUARTE DIAS", date: "01/02", diagnoses: "IC Descompensada + Edema MMII", history: "SAAF, TVP crônica, TEP crônico, Cor Pulmonale, HP", syndrome: "Cardiovascular / Tromboembólica" },
    { name: "FRANCIVALDO SOUSA", date: "01/02", diagnoses: "Pé diabético infectado grave com necrose", history: "Diabetes", syndrome: "Infecciosa / Metabólica" },
    { name: "ADELIA SOARES PAVÃO", date: "03/02", diagnoses: "Bradicardia (FC 48bpm) + inversão QRS V3-V4", history: "—", syndrome: "Cardiovascular / Arritmia" },
    { name: "ELVIRA C. LIMA MACHADO GODOIS", date: "03/02", diagnoses: "Insuficiência respiratória aguda", history: "HAS, SD Stevens-Johnson", syndrome: "Respiratória" },
    { name: "LAURA MARIA MAIA PINHEIRO", date: "03/02", diagnoses: "Gastroenterite bacteriana (pediátrica)", history: "Nega", syndrome: "Infecciosa / Pediátrica" },
    { name: "JOSELENA DE FATIMA LOPES", date: "03/02", diagnoses: "Exacerbação doença de base + Infecção pele/partes moles", history: "Pré-DM, Síndrome de Sweet", syndrome: "Infecciosa / Dermatológica" },
    { name: "MARIA LILAURA PENHA SERRA", date: "03/02", diagnoses: "Sepse foco urinário + Tremores + Síndrome da Fragilidade", history: "Demência por Alzheimer", syndrome: "Infecciosa / Geriátrica" },
    { name: "JOSÉ LEANDRO MARTINS VEIGA", date: "03/02", diagnoses: "Síndrome hemorrágica A/E + Poliglobulia", history: "—", syndrome: "Hematológica" },
    { name: "MARIA MADALENA CORREA SILVA", date: "08/02", diagnoses: "IAM sem supra + IC descompensada + DPOC", history: "Cardiopatia, DPOC, HAS, DM2", syndrome: "Cardiovascular / SCA" },
    { name: "EDSON MOREIRA DOS SANTOS JUNIOR", date: "11/02", diagnoses: "Sepse de foco pulmonar + Derrame pleural", history: "DRC dialítico, Cardiopatia", syndrome: "Infecciosa / Respiratória" },
    { name: "CIRO MONTEIRO CLARINDO", date: "14/02", diagnoses: "IAM sem supra ST + SCA em SAC severa", history: "—", syndrome: "Cardiovascular / SCA" },
    { name: "ANTONIO SERGIO SILVA CORREA", date: "19/02", diagnoses: "Abdome agudo obstrutivo + Hérnia inguinal encarcerada", history: "—", syndrome: "Cirúrgica / Abdominal" },
    { name: "GLEUCIANE MARTINS SANTOS", date: "22/02", diagnoses: "Suspeita de LMA (Leucemia Mielóide Aguda)", history: "—", syndrome: "Hematológica / Oncológica" },
    { name: "JOSE RIBAMAR PEREIRA DE BARROS", date: "26/02", diagnoses: "AVC isquêmico + HAS estágio III", history: "Cardiopatia", syndrome: "Neurológica / Cerebrovascular" },
  ],

  recurrentPatients: [
    { name: "LUIZ FRANCISCO CASTRO", visits: 6, diagnoses: "DRC dialítico — Sessões de hemodiálise", pattern: "Uso inadequado da emergência para sessões dialíticas de rotina", severity: "GRAVE" },
    { name: "MARIO MIRANDA PIRES SOBRINHO", visits: 5, diagnoses: "DRC dialítico — Hipercalemia / Urgência dialítica", pattern: "Mesmo padrão de DRC sem acompanhamento ambulatorial", severity: "GRAVE" },
    { name: "DIEGO MONTEIRO LOPES", visits: 4, diagnoses: "Paciente oncológico: astenia, dor, delirium, síndrome consumptiva", pattern: "Oncológico avançado sem acesso efetivo a cuidados paliativos ambulatoriais", severity: "GRAVE" },
    { name: "HELDER SOUSA MAIA", visits: 3, diagnoses: "PNM + Derrame pleural parapneumônico", pattern: "Reinternação por evolução desfavorável da mesma infecção", severity: "POTENCIALMENTE GRAVE" },
    { name: "CLAUDIO ANTONIO S. DE SOUSA", visits: 3, diagnoses: "ITU / Pielonefrite aguda", pattern: "Recorrência infecciosa urinária", severity: "POTENCIALMENTE GRAVE" },
    { name: "JOANA HELENA BRITO PINTO", visits: 2, diagnoses: "Tentativa de autoextermínio (superdosagem Carbolitium)", pattern: "Recidiva psiquiátrica — paciente de risco", severity: "GRAVE" },
    { name: "JAQUELINE CARDOSO NEVES", visits: 2, diagnoses: "Crise convulsiva / Tremores", pattern: "Escape convulsivo recorrente", severity: "POTENCIALMENTE GRAVE" },
    { name: "JOÃO SILVA AROUCHE", visits: 2, diagnoses: "Anemia grave", pattern: "Anemia recorrente sem investigação etiológica", severity: "POTENCIALMENTE GRAVE" },
    { name: "MARIA DO CARMO SOUZA", visits: 2, diagnoses: "ICC descompensada + PNM + DPOC agudizada / PNM nosocomial", pattern: "Cardiopata crônica descompensando em ciclo", severity: "GRAVE" },
    { name: "MARIA HELENA ALVES DA ROCHA", visits: 2, diagnoses: "Hipocalemia + Hiponatremia + Alcalose metabólica + IRA", pattern: "DHE grave recorrente", severity: "GRAVE" },
    { name: "ADALGIZA ROSA DE CARVALHO SILVA", visits: 2, diagnoses: "Anemia aguda grave + Sangramento retal + POI hemorroidectomia", pattern: "Complicação pós-operatória", severity: "GRAVE" },
    { name: "CIRO MONTEIRO CLARINDO", visits: 2, diagnoses: "Broncopneumonia + Delirium / IAM sem supra + SCA severa", pattern: "Readmissão com agravo: de PNM para SCA", severity: "GRAVÍSSIMO" },
    { name: "ELIZABET R. OLIVEIRA CHAGAS", visits: 2, diagnoses: "Luxação ombro D + PNM broncoaspirativa / Cuidados paliativos", pattern: "Paliativo com complicações traumáticas", severity: "GRAVE" },
    { name: "MARIA IRANILDES DE SOUSA BARROS", visits: 2, diagnoses: "Deiscência de colostomia / Abdome agudo perfurativo", pattern: "Complicação cirúrgica evolutiva", severity: "GRAVÍSSIMO" },
    { name: "MICHELE DO SOCORRO MALCHER", visits: 2, diagnoses: "Falha de acesso de hemodiálise", pattern: "Falha de acesso vascular recorrente em DRC", severity: "GRAVE" },
  ],

  syndromes: [
    { name: "Infecciosas (PNM, ITU, Sepse, IPPB)", percentage: 37, count: 169 },
    { name: "Cardiovasculares (ICC, SCA, IAM, FA, Arritmias)", percentage: 15, count: 68 },
    { name: "Metabólicas/Renais (DRC, DHE, IRA, DM descompensado)", percentage: 13, count: 59 },
    { name: "Neurológicas (AVC, Convulsões, RNC)", percentage: 9, count: 41 },
    { name: "Traumáticas (TCE, Fraturas, Atropelamento)", percentage: 7, count: 32 },
    { name: "Cirúrgicas (Abdome agudo, Hérnias, POI complicado)", percentage: 6, count: 27 },
    { name: "Psiquiátricas (Autoextermínio, Agitação)", percentage: 4, count: 18 },
    { name: "Hematológicas (Anemia grave, LMA, Síndromes hemorrágicas)", percentage: 3, count: 14 },
    { name: "Respiratórias isoladas (DPOC, Broncoespasmo, IRPA)", percentage: 3, count: 14 },
    { name: "Oncológicas (Astenia, Dor, Síndrome consumptiva)", percentage: 2, count: 9 },
    { name: "Gineco-Obstétricas (Abortamento, SUA)", percentage: 1, count: 5 },
  ],

  managementInsights: [
    "FALHA DE FLUXO DIALÍTICO: 11 visitas de 2 pacientes DRC à emergência para sessões de rotina. Recomenda-se encaminhamento ao serviço de nefrologia ambulatorial e centro de diálise.",
    "CASO SENTINELA — ÓBITO JOVEM POR INFLUENZA A: Paciente sem comorbidades. Avaliar cobertura vacinal da região e protocolos de detecção precoce de síndromes gripais graves.",
    "ALTA DEMANDA CARDIOVASCULAR PARA UTI: 4 transferências por SCA/ICC em fevereiro. Considerar ampliação de leitos de unidade coronariana ou protocolo fast-track cardiológico.",
    "PACIENTE ONCOLÓGICO SEM REDE DE SUPORTE: 4 visitas à emergência por astenia e dor. Necessita integração com equipe de cuidados paliativos domiciliares.",
    "RECIDIVA PSIQUIÁTRICA: Paciente com 2 tentativas de autoextermínio no mês. Necessita follow-up psiquiátrico urgente e plano de segurança.",
    "COMPLICAÇÕES CIRÚRGICAS EVOLUTIVAS: 2 casos de readmissão por complicações pós-operatórias (deiscência de colostomia, sangramento pós-hemorroidectomia). Revisar protocolos de alta cirúrgica.",
  ],
};

export function ClinicalAnalyticsReport({ onClose }: { onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita pop-ups para gerar o PDF.');
      return;
    }

    const networkLogoUrl = new URL(whitelabel.logos.networkFull, window.location.origin).href;
    const platformLogoUrl = new URL(whitelabel.logos.platform, window.location.origin).href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Analítico Clínico - Fevereiro 2026</title>
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
          </style>
        </head>
        <body>
          <div class="watermark"><img src="${platformLogoUrl}" /></div>
          
          <div class="header">
            <img src="${platformLogoUrl}" alt="HapMap" />
            <div class="header-center">
              <h1>Relatório Analítico Clínico</h1>
              <p>Análise Epidemiológica e de Gravidade — Fevereiro 2026</p>
            </div>
            <img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" />
          </div>
          
          <div class="meta-bar">
            <span><strong>Setor:</strong> ${REPORT_DATA.sector}</span>
            <span><strong>Período:</strong> ${REPORT_DATA.period}</span>
            <span><strong>Total de Movimentações:</strong> ${REPORT_DATA.totalMovements}</span>
            <span><strong>Gerado por:</strong> HapMap 2.0 — IA Analítica</span>
          </div>
          
          <!-- KPIs -->
          <div class="kpi-row">
            <div class="kpi-card"><div class="value">${REPORT_DATA.totalMovements}</div><div class="label">Movimentações Totais</div></div>
            <div class="kpi-card"><div class="value">${REPORT_DATA.totalAltas}</div><div class="label">Altas</div></div>
            <div class="kpi-card"><div class="value">${REPORT_DATA.totalTransferencias}</div><div class="label">Transferências</div></div>
            <div class="kpi-card death"><div class="value">${REPORT_DATA.totalObitos}</div><div class="label">Óbitos</div></div>
            <div class="kpi-card"><div class="value">${REPORT_DATA.utiTransfers.length}</div><div class="label">Transferências UTI</div></div>
            <div class="kpi-card"><div class="value">${REPORT_DATA.recurrentPatients.length}</div><div class="label">Pacientes Recorrentes</div></div>
          </div>

          <!-- ÓBITOS -->
          <h2 class="section-title red">1. Óbitos — Eventos Sentinela</h2>
          <table>
            <tr><th>Paciente</th><th>Data</th><th>Diagnóstico</th><th>Antecedentes</th><th>Síndrome</th></tr>
            ${REPORT_DATA.deaths.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.date}</td>
                <td>${d.diagnoses}</td>
                <td>${d.history}</td>
                <td>${d.syndrome}</td>
              </tr>
              ${d.alert ? `<tr><td colspan="5"><div class="alert-box">⚠ ${d.alert}</div></td></tr>` : ''}
            `).join('')}
          </table>

          <!-- UTI -->
          <h2 class="section-title orange">2. Casos Gravíssimos — Transferências para UTI</h2>
          <table>
            <tr><th>Paciente</th><th>Data</th><th>Diagnóstico Principal</th><th>Antecedentes</th><th>Classificação Sindrômica</th></tr>
            ${REPORT_DATA.utiTransfers.map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td>${t.date}</td>
                <td>${t.diagnoses}</td>
                <td>${t.history}</td>
                <td>${t.syndrome}</td>
              </tr>
            `).join('')}
          </table>

          <div class="page-break"></div>
          
          <div class="header">
            <img src="${platformLogoUrl}" alt="HapMap" />
            <div class="header-center">
              <h1>Relatório Analítico Clínico</h1>
              <p>Recorrência e Distribuição Sindrômica — Fevereiro 2026</p>
            </div>
            <img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" />
          </div>

          <!-- RECORRÊNCIA -->
          <h2 class="section-title purple">3. Pacientes Recorrentes — Análise de Padrão</h2>
          <table>
            <tr><th>Paciente</th><th>Visitas</th><th>Diagnósticos</th><th>Padrão Identificado</th><th>Gravidade</th></tr>
            ${REPORT_DATA.recurrentPatients.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td style="text-align:center; font-weight:700; font-size:11pt; color:#7c3aed;">${r.visits}</td>
                <td>${r.diagnoses}</td>
                <td><em>${r.pattern}</em></td>
                <td><span class="badge ${r.severity === 'GRAVÍSSIMO' ? 'badge-gravissimo' : r.severity === 'GRAVE' ? 'badge-grave' : 'badge-potencial'}">${r.severity}</span></td>
              </tr>
            `).join('')}
          </table>

          <!-- SÍNDROMES -->
          <h2 class="section-title teal">4. Distribuição Sindrômica</h2>
          <div style="margin-bottom: 14px;">
            ${REPORT_DATA.syndromes.map(s => `
              <div class="syndrome-bar">
                <div class="bar-label">${s.name}</div>
                <div class="bar-track"><div class="bar-fill" style="width: ${s.percentage * 2.5}%;"></div></div>
                <div class="bar-value">${s.count} (${s.percentage}%)</div>
              </div>
            `).join('')}
          </div>

          <!-- INSIGHTS -->
          <h2 class="section-title amber">5. Insights para Gestão</h2>
          ${REPORT_DATA.managementInsights.map((insight, i) => `
            <div class="insight-box"><strong>${i + 1}.</strong> ${insight}</div>
          `).join('')}

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
    setTimeout(() => printWindow.print(), 500);
  };

  const networkLogoUrl = whitelabel.logos.networkFull;
  const platformLogoUrl = whitelabel.logos.platform;

  const getSeverityColor = (severity: string) => {
    if (severity === 'GRAVÍSSIMO') return 'bg-red-100 text-red-700 border-red-300';
    if (severity === 'GRAVE') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-amber-100 text-amber-700 border-amber-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Relatório Analítico Clínico — Fevereiro 2026</h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Gerar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-muted/50 p-4">
        <div ref={printRef} className="max-w-4xl mx-auto bg-white text-black rounded-lg shadow-lg p-8" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-[3px] border-[#013ba6] mb-4">
            <img src={platformLogoUrl} alt="HapMap" className="h-12" />
            <div className="text-center flex-1 px-4">
              <h1 className="text-xl font-extrabold text-[#013ba6] tracking-wide uppercase">Relatório Analítico Clínico</h1>
              <p className="text-xs text-gray-500">Análise Epidemiológica e de Gravidade — Fevereiro 2026</p>
            </div>
            <img src={networkLogoUrl} alt="Hapvida" className="h-10" />
          </div>

          {/* Meta */}
          <div className="flex justify-between bg-blue-50 px-3 py-2 rounded-md mb-4 text-xs text-gray-600">
            <span><strong className="text-[#013ba6]">Setor:</strong> {REPORT_DATA.sector}</span>
            <span><strong className="text-[#013ba6]">Período:</strong> {REPORT_DATA.period}</span>
            <span><strong className="text-[#013ba6]">Total:</strong> {REPORT_DATA.totalMovements} movimentações</span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-6 gap-2 mb-5">
            {[
              { v: REPORT_DATA.totalMovements, l: "Movimentações", c: "text-[#013ba6]" },
              { v: REPORT_DATA.totalAltas, l: "Altas", c: "text-[#013ba6]" },
              { v: REPORT_DATA.totalTransferencias, l: "Transferências", c: "text-[#013ba6]" },
              { v: REPORT_DATA.totalObitos, l: "Óbitos", c: "text-red-600" },
              { v: REPORT_DATA.utiTransfers.length, l: "UTI", c: "text-[#013ba6]" },
              { v: REPORT_DATA.recurrentPatients.length, l: "Recorrentes", c: "text-[#013ba6]" },
            ].map((kpi, i) => (
              <div key={i} className="border rounded-lg p-2 text-center bg-gray-50">
                <div className={`text-2xl font-extrabold ${kpi.c}`}>{kpi.v}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">{kpi.l}</div>
              </div>
            ))}
          </div>

          {/* Deaths */}
          <h2 className="text-sm font-bold text-red-600 border-l-4 border-red-600 pl-2 mb-2 uppercase tracking-wider">1. Óbitos — Eventos Sentinela</h2>
          <table className="w-full text-xs mb-4 border-collapse">
            <thead><tr className="bg-red-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
            <tbody>
              {REPORT_DATA.deaths.map((d, i) => (
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

          {/* UTI Transfers */}
          <h2 className="text-sm font-bold text-orange-600 border-l-4 border-orange-600 pl-2 mb-2 uppercase tracking-wider">2. Casos Gravíssimos — Transferências UTI</h2>
          <table className="w-full text-xs mb-4 border-collapse">
            <thead><tr className="bg-orange-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Data</th><th className="p-1.5 text-left">Diagnóstico</th><th className="p-1.5 text-left">Síndrome</th></tr></thead>
            <tbody>
              {REPORT_DATA.utiTransfers.map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-1.5 font-semibold">{t.name}</td>
                  <td className="p-1.5 text-center">{t.date}</td>
                  <td className="p-1.5">{t.diagnoses}</td>
                  <td className="p-1.5">{t.syndrome}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Recurrence */}
          <h2 className="text-sm font-bold text-purple-600 border-l-4 border-purple-600 pl-2 mb-2 uppercase tracking-wider">3. Pacientes Recorrentes</h2>
          <table className="w-full text-xs mb-4 border-collapse">
            <thead><tr className="bg-purple-600 text-white"><th className="p-1.5 text-left">Paciente</th><th className="p-1.5">Visitas</th><th className="p-1.5 text-left">Diagnósticos</th><th className="p-1.5 text-left">Padrão</th><th className="p-1.5">Gravidade</th></tr></thead>
            <tbody>
              {REPORT_DATA.recurrentPatients.map((r, i) => (
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

          {/* Syndromes */}
          <h2 className="text-sm font-bold text-teal-600 border-l-4 border-teal-600 pl-2 mb-2 uppercase tracking-wider">4. Distribuição Sindrômica</h2>
          <div className="mb-4 space-y-1">
            {REPORT_DATA.syndromes.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-64 text-right text-gray-700">{s.name}</span>
                <div className="flex-1 h-3.5 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#013ba6] to-[#0152d4] rounded" style={{ width: `${s.percentage * 2.5}%` }} />
                </div>
                <span className="w-16 text-gray-600 font-semibold">{s.count} ({s.percentage}%)</span>
              </div>
            ))}
          </div>

          {/* Insights */}
          <h2 className="text-sm font-bold text-amber-600 border-l-4 border-amber-600 pl-2 mb-2 uppercase tracking-wider">5. Insights para Gestão</h2>
          <div className="space-y-1.5 mb-4">
            {REPORT_DATA.managementInsights.map((insight, i) => (
              <div key={i} className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 px-2.5 py-1.5 rounded text-xs text-green-900">
                <strong className="text-green-700">{i + 1}.</strong> {insight}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t-2 border-[#013ba6] flex justify-between text-[9px] text-gray-400">
            <span>{whitelabel.platform.fullName} — {whitelabel.institution.networkName}</span>
            <span>{whitelabel.credits.authorSignature}</span>
          </div>
          <p className="text-center text-[8px] text-gray-400 uppercase tracking-widest mt-1">Documento Confidencial — Uso exclusivo da coordenação médica</p>
        </div>
      </div>
    </div>
  );
}
