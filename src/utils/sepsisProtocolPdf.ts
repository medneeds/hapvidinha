import jsPDF from "jspdf";

interface ProtocolData {
  patient_name: string;
  birth_date: string | null;
  attendance_number: string | null;
  responsible_name: string | null;
  hospital: string | null;
  patient_weight: number | null;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  sirs_temp_high: boolean | null;
  sirs_temp_low: boolean | null;
  sirs_heart_rate: boolean | null;
  sirs_respiratory_rate: boolean | null;
  sirs_leukocytosis: boolean | null;
  sirs_leukopenia: boolean | null;
  sirs_young_cells: boolean | null;
  has_organic_dysfunction: boolean | null;
  dysfunction_hypotension: boolean | null;
  dysfunction_oliguria: boolean | null;
  dysfunction_pao2: boolean | null;
  dysfunction_platelets: boolean | null;
  dysfunction_acidosis: boolean | null;
  dysfunction_consciousness: boolean | null;
  dysfunction_bilirubin: boolean | null;
  has_infection: boolean | null;
  focus_pulmonary: boolean | null;
  focus_urinary: boolean | null;
  focus_abdominal: boolean | null;
  focus_skin: boolean | null;
  focus_neurological: boolean | null;
  focus_other: string | null;
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
  outcome: string | null;
  outcome_date: string | null;
  outcome_time: string | null;
  notes: string | null;
}

const PRIMARY = [0, 80, 157]; // Hapvida blue
const ACCENT = [220, 38, 38]; // red for sepsis
const DARK = [30, 30, 30];
const LIGHT_BG = [245, 247, 250];
const WHITE = [255, 255, 255];
const GRAY = [120, 120, 120];

function checkbox(doc: jsPDF, x: number, y: number, checked: boolean) {
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(x, y - 3, 3.5, 3.5);
  if (checked) {
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(x + 0.5, y - 2.5, 2.5, 2.5, "F");
  }
}

export function generateSepsisProtocolPdf(data: ProtocolData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const CW = W - M * 2;
  let y = 15;

  // ─── HEADER ─────────────────────────────────
  // Top accent bar
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, W, 5, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(0, 5, W, 1.5, "F");

  y = 14;

  // Load Hapvida logo from assets
  try {
    const logoImg = new Image();
    logoImg.src = networkFullLogo;
    // Add logo image - Hapvida NotreDame Intermédica full logo
    doc.addImage(networkFullLogo, 'PNG', M, y - 6, 55, 12);
  } catch {
    // Fallback to text if image fails
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text("HAPVIDA", M, y);
    doc.setFontSize(9);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("NOTREDAME INTERMÉDICA", M + 30, y);
  }

  // Title right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("PROTOCOLO DE SEPSE ADULTO", W - M, y, { align: "right" });
  doc.setFontSize(6.5);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("Gestão de Protocolos Clínicos", W - M, y + 4, { align: "right" });

  y += 8;
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(M, y + 0.8, W - M, y + 0.8);

  // ─── IDENTIFICATION ─────────────────────────
  y += 6;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 24, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("IDENTIFICAÇÃO DO PACIENTE", M + 3, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);

  const col1 = M + 3;
  const col2 = M + CW / 2 + 3;

  y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("PACIENTE", col1, y);
  doc.text("DATA NASCIMENTO", col2, y);
  y += 3.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.patient_name || "—", col1, y);
  doc.text(data.birth_date || "—", col2, y);

  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("MÉDICO RESPONSÁVEL", col1, y);
  doc.text("Nº ATENDIMENTO", col2, y);
  y += 3.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.responsible_name || "—", col1, y);
  doc.text(data.attendance_number || "—", col2, y);

  // Opening date / weight
  y += 7;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW / 3 - 2, 10, 1, 1, "F");
  doc.roundedRect(M + CW / 3, y - 2, CW / 3 - 2, 10, 1, 1, "F");
  doc.roundedRect(M + (CW / 3) * 2, y - 2, CW / 3, 10, 1, 1, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("DATA ABERTURA", col1, y + 1);
  doc.text("HORA ABERTURA", M + CW / 3 + 3, y + 1);
  doc.text("PESO (KG)", M + (CW / 3) * 2 + 3, y + 1);
  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.opening_date || "—", col1, y);
  doc.text(data.opening_time || "—", M + CW / 3 + 3, y);
  doc.text(data.patient_weight ? String(data.patient_weight) : "—", M + (CW / 3) * 2 + 3, y);

  // ─── SIRS ───────────────────────────────────
  y += 10;
  const sirsItems = [
    { v: data.sirs_temp_high, l: "Temperatura > 38,3°C" },
    { v: data.sirs_temp_low, l: "Temperatura < 36°C" },
    { v: data.sirs_heart_rate, l: "FC > 90 bpm" },
    { v: data.sirs_respiratory_rate, l: "FR > 20 irpm" },
    { v: data.sirs_leukocytosis, l: "Leucocitose > 12.000" },
    { v: data.sirs_leukopenia, l: "Leucopenia < 4.000" },
    { v: data.sirs_young_cells, l: "Desvio E > 10%" },
  ];
  const sirsCount = sirsItems.filter(s => s.v).length;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(`CRITÉRIOS SIRS (${sirsCount}/7)`, M, y);
  if (sirsCount >= 2) {
    doc.setFontSize(6.5);
    doc.text("— TRIAGEM POSITIVA", M + 42, y);
  }

  y += 4;
  sirsItems.forEach((item, i) => {
    const cx = i < 4 ? col1 : col2;
    const cy = y + (i < 4 ? i : i - 4) * 5;
    checkbox(doc, cx, cy, !!item.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(item.l, cx + 5, cy);
  });
  y += Math.ceil(sirsItems.length / 2) * 5 + 2;

  // ─── DYSFUNCTION ────────────────────────────
  const dysfItems = [
    { v: data.dysfunction_hypotension, l: "Hipotensão (PAS < 90)" },
    { v: data.dysfunction_oliguria, l: "Oligúria" },
    { v: data.dysfunction_pao2, l: "PaO2/FiO2 < 300" },
    { v: data.dysfunction_platelets, l: "Plaquetas < 100.000" },
    { v: data.dysfunction_acidosis, l: "Lactato elevado" },
    { v: data.dysfunction_consciousness, l: "Rebaixamento consciência" },
    { v: data.dysfunction_bilirubin, l: "Bilirrubina > 2" },
  ];
  const dysfCount = dysfItems.filter(d => d.v).length;

  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`DISFUNÇÕES ORGÂNICAS (${dysfCount}/7) — ${data.has_organic_dysfunction === true ? "CONFIRMADA" : data.has_organic_dysfunction === false ? "NEGADA" : "N/A"}`, M, y);

  y += 4;
  dysfItems.forEach((item, i) => {
    const cx = i < 4 ? col1 : col2;
    const cy = y + (i < 4 ? i : i - 4) * 5;
    checkbox(doc, cx, cy, !!item.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(item.l, cx + 5, cy);
  });
  y += Math.ceil(dysfItems.length / 2) * 5 + 2;

  // ─── FOCUS ──────────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`FOCO INFECCIOSO — Infecção: ${data.has_infection === true ? "SIM" : data.has_infection === false ? "NÃO" : "N/A"}`, M, y);

  y += 4;
  const focusItems = [
    { v: data.focus_pulmonary, l: "Pulmonar" },
    { v: data.focus_urinary, l: "Urinário" },
    { v: data.focus_abdominal, l: "Abdominal" },
    { v: data.focus_skin, l: "Pele / Partes moles" },
    { v: data.focus_neurological, l: "Neurológico" },
  ];
  focusItems.forEach((item, i) => {
    const cx = i < 3 ? col1 : col2;
    const cy = y + (i < 3 ? i : i - 3) * 5;
    checkbox(doc, cx, cy, !!item.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(item.l, cx + 5, cy);
  });
  if (data.focus_other) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(7);
    doc.text(`Outro: ${data.focus_other}`, col2, y + 10);
  }
  y += Math.ceil(focusItems.length / 2) * 5 + 4;

  // ─── TREATMENT ──────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("PACOTE TERAPÊUTICO (1ª HORA)", M, y);

  y += 5;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 20, 2, 2, "F");

  const t3w = CW / 3;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("HEMOCULTURA", col1, y + 1);
  doc.text("LACTATO", M + t3w + 3, y + 1);
  doc.text("ANTIBIÓTICO", M + t3w * 2 + 3, y + 1);

  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.blood_culture_date ? `${data.blood_culture_date} ${data.blood_culture_time || ""}` : "—", col1, y + 5);
  doc.text(data.lactate_date ? `${data.lactate_date} ${data.lactate_time || ""}` : "—", M + t3w + 3, y + 5);
  doc.text(data.antibiotic_prescription_date ? `${data.antibiotic_prescription_date} ${data.antibiotic_prescription_time || ""}` : "—", M + t3w * 2 + 3, y + 5);

  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("RESSUSCITAÇÃO VOLÊMICA", col1, y + 11);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.volume_administered ? `${data.volume_administered} mL (${data.patient_weight ? Math.round(data.volume_administered / data.patient_weight) + " mL/kg" : "—"})` : "—", col1, y + 15);

  y += 24;

  // ─── OUTCOME ────────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(data.outcome === "ÓBITO" ? ACCENT[0] : PRIMARY[0], data.outcome === "ÓBITO" ? ACCENT[1] : PRIMARY[1], data.outcome === "ÓBITO" ? ACCENT[2] : PRIMARY[2]);
  doc.text("DESFECHO", M, y);

  y += 5;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("DESTINO", col1, y + 1);
  doc.text("DESFECHO", M + CW / 2, y + 1);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${data.destination || "—"} ${data.destination_date ? `(${data.destination_date} ${data.destination_time || ""})` : ""}`, col1, y + 5.5);
  doc.text(`${data.outcome || "EM CURSO"} ${data.outcome_date ? `(${data.outcome_date} ${data.outcome_time || ""})` : ""}`, M + CW / 2, y + 5.5);

  if (data.notes) {
    y += 10;
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("OBSERVAÇÕES", col1, y);
    y += 3;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    const lines = doc.splitTextToSize(data.notes, CW - 6);
    doc.text(lines, col1, y);
  }

  // ─── FOOTER ─────────────────────────────────
  const fY = 282;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, fY, W - M, fY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("HAPVIDA NOTREDAME INTERMÉDICA — Protocolo de Sepse Adulto", M, fY + 3);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, W - M, fY + 3, { align: "right" });

  // Bottom accent
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 293, W, 1.5, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.rect(0, 294.5, W, 3, "F");

  doc.save(`protocolo-sepse-${data.patient_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}