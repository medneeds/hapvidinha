import jsPDF from "jspdf";
import networkFullLogo from "@/assets/hapvida-notredame-full-logo.png";

export interface ChestPainProtocolPdfData {
  patient_name: string;
  birth_date: string | null;
  attendance_number: string | null;
  responsible_name: string | null;
  hospital: string | null;
  patient_weight: number | null;
  opening_date: string | null;
  opening_time: string | null;
  created_at: string;
  pain_onset_date: string | null;
  pain_onset_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  pain_classification: string | null;
  pain_location: string | null;
  pain_irradiation: string | null;
  associated_symptoms: string | null;
  ecg_date: string | null;
  ecg_time: string | null;
  ecg_st_elevation: boolean | null;
  ecg_st_depression: boolean | null;
  ecg_new_lbbb: boolean | null;
  ecg_t_inversion: boolean | null;
  ecg_normal: boolean | null;
  ecg_findings: string | null;
  heart_history: number | null;
  heart_ecg: number | null;
  heart_age: number | null;
  heart_risk_factors: number | null;
  heart_troponin: number | null;
  heart_total: number | null;
  heart_risk_level: string | null;
  troponin_0h_value: number | null;
  troponin_3h_value: number | null;
  is_stemi: boolean | null;
  killip_class: string | null;
  reperfusion_strategy: string | null;
  fibrinolytic_drug: string | null;
  fibrinolytic_date: string | null;
  fibrinolytic_time: string | null;
  balloon_date: string | null;
  balloon_time: string | null;
  therapy_morphine: boolean | null;
  therapy_oxygen: boolean | null;
  therapy_nitrate: boolean | null;
  therapy_aas: boolean | null;
  therapy_betablocker: boolean | null;
  therapy_clopidogrel: boolean | null;
  therapy_heparin: boolean | null;
  therapy_statin: boolean | null;
  destination: string | null;
  destination_date: string | null;
  destination_time: string | null;
  outcome: string | null;
  outcome_date: string | null;
  outcome_time: string | null;
  notes: string | null;
}

const PRIMARY = [0, 80, 157];
const ACCENT = [220, 38, 38];
const DARK = [30, 30, 30];
const LIGHT_BG = [245, 247, 250];
const GRAY = [120, 120, 120];

function checkbox(doc: jsPDF, x: number, y: number, checked: boolean) {
  doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.3);
  doc.rect(x, y - 3, 3.5, 3.5);
  if (checked) {
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(x + 0.5, y - 2.5, 2.5, 2.5, "F");
  }
}

export function generateChestPainProtocolPdf(data: ChestPainProtocolPdfData) {
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
  doc.text("PROTOCOLO DE DOR TORÁCICA", W - M, y - 2, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("Síndromes Coronarianas Agudas", W - M, y + 2, { align: "right" });

  y += 6;
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);

  // IDENTIFICATION
  y += 6;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 16, 2, 2, "F");
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

  // TEMPOS
  y += 7;
  doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
  doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text("TEMPOS CRÍTICOS", M + 3, y + 1);
  y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("INÍCIO DA DOR", col1, y);
  doc.text("CHEGADA", M + CW / 3 + 3, y);
  doc.text("ABERTURA PROTOCOLO", M + (CW / 3) * 2 + 3, y);
  y += 4;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${data.pain_onset_date || "—"} ${data.pain_onset_time || ""}`, col1, y);
  doc.text(`${data.arrival_date || "—"} ${data.arrival_time || ""}`, M + CW / 3 + 3, y);
  doc.text(`${data.opening_date || "—"} ${data.opening_time || ""}`, M + (CW / 3) * 2 + 3, y);

  // CARACTERIZAÇÃO
  y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(`CLASSIFICAÇÃO DA DOR: ${data.pain_classification || "—"}`, M, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  if (data.pain_location) doc.text(`Local: ${data.pain_location.slice(0, 80)}`, col1, y);
  if (data.pain_irradiation) { y += 3.5; doc.text(`Irradiação: ${data.pain_irradiation.slice(0, 80)}`, col1, y); }
  if (data.associated_symptoms) { y += 3.5; doc.text(`Sintomas associados: ${data.associated_symptoms.slice(0, 80)}`, col1, y); }

  // ECG
  y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(`ELETROCARDIOGRAMA — ${data.ecg_date || "—"} ${data.ecg_time || ""}`, M, y);
  y += 4;
  const ecg = [
    { v: data.ecg_st_elevation, l: "Supra ST" },
    { v: data.ecg_st_depression, l: "Infra ST" },
    { v: data.ecg_new_lbbb, l: "BRE novo" },
    { v: data.ecg_t_inversion, l: "T invertida" },
    { v: data.ecg_normal, l: "Normal" },
  ];
  ecg.forEach((it, i) => {
    const cx = i < 3 ? col1 + (i % 3) * 35 : col1 + (i - 3) * 35;
    const cy = y + (i < 3 ? 0 : 5);
    checkbox(doc, cx, cy, !!it.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(it.l, cx + 5, cy);
  });
  y += 12;

  // HEART SCORE
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`HEART SCORE: ${data.heart_total ?? "—"} / 10 — ${data.heart_risk_level || "N/A"}`, M, y);
  y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`H:${data.heart_history ?? "—"} | E:${data.heart_ecg ?? "—"} | A:${data.heart_age ?? "—"} | R:${data.heart_risk_factors ?? "—"} | T:${data.heart_troponin ?? "—"}`, M, y);

  // TROPONINAS
  y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text("TROPONINA 0H", col1, y); doc.text("TROPONINA 3H", col2, y);
  y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(data.troponin_0h_value !== null ? String(data.troponin_0h_value) : "—", col1, y);
  doc.text(data.troponin_3h_value !== null ? String(data.troponin_3h_value) : "—", col2, y);

  // STEMI / Reperfusão
  y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.text(`STEMI: ${data.is_stemi ? "SIM" : "NÃO"}${data.killip_class ? ` | KILLIP ${data.killip_class}` : ""}`, M, y);
  y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`Reperfusão: ${(data.reperfusion_strategy || "—").toUpperCase()}`, col1, y);
  if (data.balloon_date) doc.text(`Balão: ${data.balloon_date} ${data.balloon_time || ""}`, col2, y);

  // MONABCH
  y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text("TERAPIA MONABCH", M, y);
  y += 4;
  const therapy = [
    { v: data.therapy_morphine, l: "Morfina" },
    { v: data.therapy_oxygen, l: "Oxigênio" },
    { v: data.therapy_nitrate, l: "Nitrato" },
    { v: data.therapy_aas, l: "AAS" },
    { v: data.therapy_betablocker, l: "Beta-bloq" },
    { v: data.therapy_clopidogrel, l: "Clopidogrel" },
    { v: data.therapy_heparin, l: "Heparina" },
    { v: data.therapy_statin, l: "Estatina" },
  ];
  therapy.forEach((it, i) => {
    const cx = col1 + (i % 4) * 42;
    const cy = y + Math.floor(i / 4) * 5;
    checkbox(doc, cx, cy, !!it.v);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(it.l, cx + 5, cy);
  });
  y += 12;

  // DESFECHO
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
  doc.text("HAPVIDA NOTREDAME INTERMÉDICA — Protocolo de Dor Torácica", M, fY + 3);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, W - M, fY + 3, { align: "right" });
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.rect(0, 293, W, 1.5, "F");
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]); doc.rect(0, 294.5, W, 3, "F");

  doc.save(`protocolo-dor-toracica-${data.patient_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
