import jsPDF from "jspdf";
import networkFullLogo from "@/assets/hapvida-notredame-full-logo.png";

export interface StrokeProtocolPdfData {
  patient_name: string;
  birth_date: string | null;
  attendance_number: string | null;
  responsible_name: string | null;
  hospital: string | null;
  patient_weight: number | null;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  last_seen_well_date: string | null;
  last_seen_well_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  cincinnati_facial_droop: boolean | null;
  cincinnati_arm_weakness: boolean | null;
  cincinnati_speech_abnormal: boolean | null;
  nihss_total: number | null;
  thrombolysis_eligible: boolean | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  glucose: number | null;
  platelets: number | null;
  inr: number | null;
  ct_date: string | null;
  ct_time: string | null;
  ct_aspects: number | null;
  ct_hemorrhage: boolean | null;
  ct_findings: string | null;
  conduct: string | null;
  thrombolysis_drug: string | null;
  thrombolysis_date: string | null;
  thrombolysis_time: string | null;
  thrombolysis_dose: number | null;
  destination: string | null;
  destination_date: string | null;
  destination_time: string | null;
  outcome: string | null;
  outcome_date: string | null;
  outcome_time: string | null;
  notes: string | null;
}

const PRIMARY = [0, 80, 157];
const ACCENT = [124, 58, 237]; // purple for stroke
const DARK = [30, 30, 30];
const LIGHT_BG = [245, 247, 250];
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

export function generateStrokeProtocolPdf(data: StrokeProtocolPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const CW = W - M * 2;
  let y = 15;

  // HEADER
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.rect(0, 0, W, 5, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]); doc.rect(0, 5, W, 1.5, "F");
  y = 15;

  try { doc.addImage(networkFullLogo, 'PNG', M, y - 7, 42, 9); } catch {
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.text("HAPVIDA", M, y);
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("PROTOCOLO DE AVC ADULTO", W - M, y - 2, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("Acidente Vascular Cerebral", W - M, y + 2, { align: "right" });

  y += 6;
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);

  // IDENTIFICATION
  y += 6;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 24, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("IDENTIFICAÇÃO DO PACIENTE", M + 3, y + 2);

  const col1 = M + 3;
  const col2 = M + CW / 2 + 3;
  y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("PACIENTE", col1, y); doc.text("DATA NASCIMENTO", col2, y);
  y += 3.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.patient_name || "—", col1, y); doc.text(data.birth_date || "—", col2, y);

  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("MÉDICO RESPONSÁVEL", col1, y); doc.text("Nº ATENDIMENTO", col2, y);
  y += 3.5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.responsible_name || "—", col1, y); doc.text(data.attendance_number || "—", col2, y);

  // TEMPOS CRÍTICOS
  y += 7;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("TEMPOS CRÍTICOS", M + 3, y + 1);
  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("LSW (Last Seen Well)", col1, y);
  doc.text("CHEGADA", M + CW / 3 + 3, y);
  doc.text("ABERTURA PROTOCOLO", M + (CW / 3) * 2 + 3, y);
  y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${data.last_seen_well_date || "—"} ${data.last_seen_well_time || ""}`, col1, y);
  doc.text(`${data.arrival_date || "—"} ${data.arrival_time || ""}`, M + CW / 3 + 3, y);
  doc.text(`${data.opening_date || "—"} ${data.opening_time || ""}`, M + (CW / 3) * 2 + 3, y);

  // CINCINNATI
  y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("CINCINNATI / FAST", M, y);
  y += 4;
  const fast = [
    { v: data.cincinnati_facial_droop, l: "Queda facial (Face)" },
    { v: data.cincinnati_arm_weakness, l: "Fraqueza no braço (Arm)" },
    { v: data.cincinnati_speech_abnormal, l: "Fala alterada (Speech)" },
  ];
  fast.forEach((it, i) => {
    const cx = i === 0 ? col1 : i === 1 ? M + CW / 3 + 3 : M + (CW / 3) * 2 + 3;
    checkbox(doc, cx, y, !!it.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(it.l, cx + 5, y);
  });

  // NIHSS
  y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(`ESCORE NIHSS: ${data.nihss_total ?? "—"} / 42`, M, y);

  // ELEGIBILIDADE TROMBÓLISE
  y += 6;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`ELEGIBILIDADE TROMBÓLISE — ${data.thrombolysis_eligible === true ? "ELEGÍVEL" : data.thrombolysis_eligible === false ? "NÃO ELEGÍVEL" : "N/A"}`, M + 3, y + 1);
  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("PA (mmHg)", col1, y);
  doc.text("GLICEMIA", M + CW / 4 + 3, y);
  doc.text("PLAQUETAS", M + (CW / 4) * 2 + 3, y);
  doc.text("INR", M + (CW / 4) * 3 + 3, y);
  y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.bp_systolic ? `${data.bp_systolic}/${data.bp_diastolic ?? "?"}` : "—", col1, y);
  doc.text(data.glucose ? String(data.glucose) : "—", M + CW / 4 + 3, y);
  doc.text(data.platelets ? String(data.platelets) : "—", M + (CW / 4) * 2 + 3, y);
  doc.text(data.inr ? String(data.inr) : "—", M + (CW / 4) * 3 + 3, y);

  // NEUROIMAGEM
  y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("NEUROIMAGEM", M, y);
  y += 5;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("HORA TC", col1, y + 1);
  doc.text("ASPECTS", M + CW / 3 + 3, y + 1);
  doc.text("HEMORRAGIA", M + (CW / 3) * 2 + 3, y + 1);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${data.ct_date || "—"} ${data.ct_time || ""}`, col1, y + 5);
  doc.text(data.ct_aspects !== null ? String(data.ct_aspects) : "—", M + CW / 3 + 3, y + 5);
  doc.text(data.ct_hemorrhage === true ? "SIM" : data.ct_hemorrhage === false ? "NÃO" : "—", M + (CW / 3) * 2 + 3, y + 5);
  if (data.ct_findings) {
    doc.setFontSize(7); doc.text(`Achados: ${data.ct_findings.slice(0, 100)}`, col1, y + 10);
  }

  // CONDUTA
  y += 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("CONDUTA", M, y);
  y += 5;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("CONDUTA", col1, y + 1);
  doc.text("DROGA", M + CW / 3 + 3, y + 1);
  doc.text("HORA TROMBÓLISE", M + (CW / 3) * 2 + 3, y + 1);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text((data.conduct || "—").toUpperCase(), col1, y + 5);
  doc.text((data.thrombolysis_drug || "—").toUpperCase(), M + CW / 3 + 3, y + 5);
  doc.text(`${data.thrombolysis_date || "—"} ${data.thrombolysis_time || ""}`, M + (CW / 3) * 2 + 3, y + 5);

  // DESFECHO
  y += 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(data.outcome === "ÓBITO" ? 220 : PRIMARY[0], data.outcome === "ÓBITO" ? 38 : PRIMARY[1], data.outcome === "ÓBITO" ? 38 : PRIMARY[2]);
  doc.text("DESFECHO", M, y);
  y += 5;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("DESTINO", col1, y + 1); doc.text("DESFECHO", M + CW / 2, y + 1);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${data.destination || "—"} ${data.destination_date ? `(${data.destination_date} ${data.destination_time || ""})` : ""}`, col1, y + 5.5);
  doc.text(`${data.outcome || "EM CURSO"} ${data.outcome_date ? `(${data.outcome_date} ${data.outcome_time || ""})` : ""}`, M + CW / 2, y + 5.5);

  if (data.notes) {
    y += 12;
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text("OBSERVAÇÕES", col1, y); y += 3;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    const lines = doc.splitTextToSize(data.notes, CW - 6);
    doc.text(lines.slice(0, 4), col1, y);
  }

  // FOOTER
  const fY = 282;
  doc.setDrawColor(200, 200, 200); doc.line(M, fY, W - M, fY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("HAPVIDA NOTREDAME INTERMÉDICA — Protocolo de AVC Adulto", M, fY + 3);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, W - M, fY + 3, { align: "right" });
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.rect(0, 293, W, 1.5, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]); doc.rect(0, 294.5, W, 3, "F");

  doc.save(`protocolo-avc-${data.patient_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
