import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PanelRequest, diffMinutes, formatHHMM, getRequestStatusInfo } from "@/hooks/useBedRequestsPanel";

const HEADERS = [
  "Nº", "DATA", "HORA SOLICIT.", "SETOR SOLICIT.", "SOLICITANTE", "PACIENTE",
  "DIAGNÓSTICO", "ISOL.", "HORA HOTEL.", "LIB. HOTEL.", "TEMPO HOTEL.",
  "RESP. HOTEL.", "UNIDADE", "ACOMODAÇÃO", "LEITO", "RESP. LEITO",
  "LIB. LEITO", "TRANSF.", "TEMPO FINAL", "MOTIVO N/CUMPR.",
];

function fmtDate(iso: string | null) { return iso ? new Date(iso).toLocaleDateString("pt-BR") : ""; }
function fmtTime(iso: string | null) { return iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""; }

function toRows(requests: PanelRequest[], hospital: string) {
  return requests.map((r, i) => {
    const info = getRequestStatusInfo(r);
    return [
      r.sequence_number ?? i + 1,
      fmtDate(r.created_at),
      fmtTime(r.created_at),
      r.requesting_sector ?? "",
      (r.requesting_doctor_name ?? "").toUpperCase(),
      (r.patient_name ?? "").toUpperCase(),
      (r.diagnosis ?? "").toUpperCase(),
      r.is_isolation ? "SIM" : "NÃO",
      fmtTime(r.hotelaria_requested_at),
      fmtTime(r.hotelaria_released_at),
      formatHHMM(info.hotelMin),
      (r.hotelaria_released_by ?? "").toUpperCase(),
      hospital.toUpperCase(),
      (r.accommodation_type ?? "").toUpperCase(),
      r.requested_bed ?? "",
      (r.bed_released_by ?? "").toUpperCase(),
      fmtTime(r.bed_released_at),
      fmtTime(r.transfer_completed_at),
      formatHHMM(info.totalMin),
      (r.non_compliance_reason ?? "").toUpperCase(),
    ];
  });
}

export function exportPanelExcel(requests: PanelRequest[], hospital: string) {
  const rows = toRows(requests, hospital);
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "GESTÃO DE LEITOS");
  const fname = `gestao-leitos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

export function exportPanelPDF(requests: PanelRequest[], hospital: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, 297, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("GESTÃO DE LEITOS", pageW / 2, 12, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(hospital.toUpperCase(), pageW / 2, 17, { align: "center" });
  doc.text(`EMITIDO EM ${new Date().toLocaleString("pt-BR")}`, pageW / 2, 21, { align: "center" });

  const rows = toRows(requests, hospital);
  autoTable(doc, {
    startY: 25,
    head: [HEADERS],
    body: rows,
    styles: { fontSize: 6, cellPadding: 1, textColor: [0, 0, 0], lineColor: [180, 180, 180], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 8, right: 8, top: 18, bottom: 12 },
    didParseCell: (data) => {
      if (data.section === "body") {
        const r = requests[data.row.index];
        const info = getRequestStatusInfo(r);
        // Tempo final col 18
        if (data.column.index === 18 && info.totalMin !== null) {
          if (info.onTime) data.cell.styles.fillColor = [220, 252, 231];
          else data.cell.styles.fillColor = [254, 226, 226];
        }
        if (data.column.index === 7 && r.is_isolation) {
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`gestao-leitos-${new Date().toISOString().slice(0, 10)}.pdf`);
}
