import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { whitelabel } from "@/config/whitelabel";
import { useHospital } from "@/contexts/HospitalContext";

interface PrintExaminusAiDialogProps {
  title: string;
  prompt: string;
  content: string;
  patientLabel?: string;
  onClose: () => void;
}

export function PrintExaminusAiDialog({
  title,
  prompt,
  content,
  patientLabel,
  onClose,
}: PrintExaminusAiDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { currentHospital } = useHospital();

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Permita pop-ups para imprimir.");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head>
      <title>${title} - ${dateStr}</title>
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
        @page { size: A4 portrait; margin: 18mm 15mm 15mm 15mm; }
      </style></head><body>${printContent.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };

  const isHeading = (line: string) =>
    /^[A-ZÀ-Ú0-9º°()\/\s.,-]+$/.test(line.trim()) &&
    line.trim().length > 2 &&
    !line.trim().startsWith("-");

  return (
    <div className="fixed inset-0 z-[9999] overflow-auto print-light bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-card border-b border-border p-3 sm:p-4 flex items-center justify-between shadow-sm gap-2">
        <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">
          {title}
        </h2>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handlePrint} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
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
              boxSizing: "border-box",
            }}
          >
            {/* Cabeçalho institucional */}
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
                  style={{ height: "34px", objectFit: "contain" }}
                />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#013ba6" }}>
                    {currentHospital?.name || whitelabel.institution.hospitalName}
                  </div>
                  <div style={{ fontSize: "9px", color: "#6b7280" }}>
                    {whitelabel.platform.fullName} · EXAMINUS IA
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "9px", color: "#6b7280" }}>
                <div>{dateStr}</div>
                <div>{timeStr}</div>
              </div>
            </div>

            <h1
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {title}
            </h1>
            {patientLabel && (
              <div style={{ fontSize: "10px", color: "#374151", marginBottom: "10px" }}>
                {patientLabel}
              </div>
            )}

            <div
              style={{
                background: "#f3f4f6",
                borderLeft: "3px solid #013ba6",
                padding: "8px 10px",
                fontSize: "10px",
                color: "#374151",
                marginBottom: "14px",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong style={{ color: "#013ba6" }}>SOLICITAÇÃO: </strong>
              {prompt}
            </div>

            <div style={{ fontSize: "10.5px", lineHeight: 1.55, color: "#111827" }}>
              {content.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} style={{ height: "6px" }} />;
                if (isHeading(trimmed)) {
                  return (
                    <div
                      key={i}
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "#013ba6",
                        marginTop: "10px",
                        marginBottom: "3px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {trimmed}
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ paddingLeft: trimmed.startsWith("-") ? "8px" : 0 }}>
                    {trimmed}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "18px",
                paddingTop: "8px",
                borderTop: "1px solid #d1d5db",
                fontSize: "8px",
                color: "#6b7280",
                lineHeight: 1.4,
              }}
            >
              Conteúdo gerado por inteligência artificial como apoio à decisão clínica. Não substitui
              o julgamento do médico assistente nem constitui prescrição. Documento sem identificação
              nominal do paciente enviada à IA.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
