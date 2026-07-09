import { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useRef } from "react";
import { formatAgeDisplay } from "@/utils/ageDisplay";
import { whitelabel, getConfidentialityFooter } from "@/config/whitelabel";
import { useHospital } from "@/contexts/HospitalContext";

interface PrintUtiPrioritiesPreviewDialogProps {
  patients: Patient[]; // ordenada pela prioridade
  onClose: () => void;
}

const sectorLabels: Record<string, string> = {
  red: "Vermelha",
  yellow: "Amarela",
  blue: "Azul",
  outside: "Fora das Alas",
};

export function PrintUtiPrioritiesPreviewDialog({
  patients,
  onClose,
}: PrintUtiPrioritiesPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { currentHospital } = useHospital();

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Permita pop-ups para imprimir.");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Prioridades UTI - ${dateStr}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin:0; padding:0; box-sizing:border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important; }
        html { color-scheme: light; background:#fff; }
        html, body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background:#ffffff !important; color:#111827;
        }
        @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
      </style></head><body>${printContent.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-auto print-light bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-card border-b border-border p-3 sm:p-4 flex items-center justify-between shadow-sm gap-2">
        <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">
          Prioridades UTI · {patients.length} paciente(s)
        </h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handlePrint}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Fechar</span>
          </Button>
        </div>
      </div>

      <div className="flex justify-center py-4 sm:py-8 px-2 sm:px-4 bg-background">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-[210mm]">
          <div
            ref={printRef}
            style={{
              width: "100%",
              minHeight: "297mm",
              padding: "14mm",
              backgroundColor: "#ffffff",
              color: "#111827",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            {/* Header institucional */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "3px solid #013ba6",
                paddingBottom: "10px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={whitelabel.logos.networkFull}
                  alt={whitelabel.institution.networkLogoAlt}
                  style={{ height: "42px", width: "auto" }}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "14pt",
                    fontWeight: 700,
                    color: "#013ba6",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Prioridades UTI
                </div>
                <div style={{ fontSize: "8pt", color: "#4b5563", marginTop: "2px" }}>
                  Urgência e Emergência Adulto
                  {currentHospital?.name ? ` · ${currentHospital.name}` : ""}
                </div>
                <div style={{ fontSize: "7.5pt", color: "#6b7280", marginTop: "1px" }}>
                  Emitido em {dateStr} às {timeStr}
                </div>
              </div>
            </div>

            {/* Aviso curto */}
            <div
              style={{
                fontSize: "8pt",
                color: "#374151",
                background: "#f3f4f6",
                borderLeft: "3px solid #013ba6",
                padding: "6px 10px",
                marginBottom: "12px",
              }}
            >
              Lista priorizada de pacientes candidatos a leito de UTI. A ordem
              reflete a prioridade clínica definida pela equipe médica da UE Adulto.
            </div>

            {/* Tabela */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9pt",
                marginBottom: "16px",
              }}
            >
              <thead>
                <tr style={{ background: "#013ba6", color: "#ffffff" }}>
                  <th style={thStyle(30)}>#</th>
                  <th style={thStyle()}>Paciente</th>
                  <th style={thStyle(55)}>Idade</th>
                  <th style={thStyle(70)}>Leito</th>
                  <th style={thStyle(90)}>Setor</th>
                  <th style={{ ...thStyle(), textAlign: "left" }}>
                    Hipóteses / Diagnósticos
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#013ba6" }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, textTransform: "uppercase" }}>
                      {p.name || "—"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {formatAgeDisplay(p.age)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600 }}>
                      {p.bedNumber}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {sectorLabels[p.sector] ?? p.sector}
                    </td>
                    <td style={tdStyle}>
                      {p.diagnoses && p.diagnoses.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: "14px" }}>
                          {p.diagnoses.map((d, i) => (
                            <li key={i} style={{ marginBottom: "2px", lineHeight: 1.3 }}>
                              {d}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                          Sem diagnósticos registrados
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: "24px",
                      }}
                    >
                      Nenhum paciente na lista de prioridades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Assinatura */}
            <div style={{ marginTop: "28px", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      borderTop: "1px solid #111827",
                      paddingTop: "4px",
                      fontSize: "8pt",
                      color: "#4b5563",
                    }}
                  >
                    Médico responsável (nome e assinatura)
                  </div>
                </div>
                <div style={{ width: "180px" }}>
                  <div
                    style={{
                      borderTop: "1px solid #111827",
                      paddingTop: "4px",
                      fontSize: "8pt",
                      color: "#4b5563",
                    }}
                  >
                    CRM
                  </div>
                </div>
                <div style={{ width: "150px" }}>
                  <div
                    style={{
                      borderTop: "1px solid #111827",
                      paddingTop: "4px",
                      fontSize: "8pt",
                      color: "#4b5563",
                    }}
                  >
                    Data / Hora
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div
              style={{
                position: "absolute",
                bottom: "10mm",
                left: "14mm",
                right: "14mm",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "6.5pt",
                color: "#9ca3af",
                paddingTop: "6px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <span>{getConfidentialityFooter()}</span>
              <span>
                {dateStr} {timeStr}
              </span>
              <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                {whitelabel.credits.authorSignature}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = (width?: number): React.CSSProperties => ({
  padding: "8px 6px",
  fontSize: "8.5pt",
  fontWeight: 700,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  border: "1px solid #013ba6",
  ...(width ? { width: `${width}px` } : {}),
});

const tdStyle: React.CSSProperties = {
  padding: "6px",
  fontSize: "8.5pt",
  color: "#1f2937",
  border: "1px solid #e5e7eb",
  verticalAlign: "top",
};
