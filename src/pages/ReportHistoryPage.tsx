import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivacy, maskName } from "@/contexts/PrivacyContext";
import { whitelabel } from "@/config/whitelabel";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Search, FileText, Eye, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface MedicalReport {
  id: string;
  patient_name: string;
  patient_age: string | null;
  patient_bed: string | null;
  patient_sector: string | null;
  report_content: string;
  created_by_email: string | null;
  created_at: string;
}

const sectorLabels: Record<string, string> = {
  red: "Vermelho",
  yellow: "Amarelo",
  blue: "Azul",
};

export default function ReportHistoryPage() {
  const { currentState, currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();
  const { role } = useAuth();
  const { namesHidden } = usePrivacy();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, [currentHospital, currentState, currentDepartment]);

  const fetchReports = async () => {
    if (!currentHospital || !currentState) return;
    setLoading(true);
    const { data, error } = await (supabase.from as any)("medical_reports")
      .select("id, patient_name, patient_age, patient_bed, patient_sector, report_content, created_by_email, created_at")
      .eq("hospital_unit_id", currentHospital.id)
      .eq("state_id", currentState.id)
      .eq("department", currentDepartment)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar relatórios");
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medical_reports").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir relatório");
    } else {
      toast.success("Relatório excluído");
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    }
  };

  const handleReprint = (report: MedicalReport) => {
    const networkLogoUrl = new URL(whitelabel.logos.networkFull, window.location.origin).href;
    const now = new Date();
    const originalDate = format(parseISO(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const escapedContent = report.report_content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const sectorLabel = sectorLabels[report.patient_sector || ""] || report.patient_sector || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório - ${report.patient_name}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; overflow: hidden; }
  .header { background: linear-gradient(135deg, #002b80 0%, #013ba6 40%, #0152d4 100%); padding: 20px 36px 16px; display: flex; align-items: center; justify-content: center; position: relative; }
  .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24); }
  .header .logo-main img { height: 48px; filter: brightness(0) invert(1); }
  .title-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 36px; display: flex; align-items: center; justify-content: space-between; }
  .title-bar h1 { font-size: 10pt; font-weight: 700; color: #013ba6; text-transform: uppercase; letter-spacing: 2px; }
  .title-bar .hospital-name { font-size: 7.5pt; color: #64748b; font-weight: 500; }
  .patient-strip { background: #eef2ff; border-bottom: 1px solid #ddd6fe; padding: 10px 36px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .patient-strip .field { display: flex; flex-direction: column; }
  .patient-strip .field-label { font-size: 5.5pt; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
  .patient-strip .field-value { font-size: 8.5pt; color: #111827; font-weight: 600; margin-top: 1px; }
  .patient-strip .divider { width: 1px; height: 24px; background: #c7d2fe; }
  .body-content { padding: 24px 36px 90px; font-size: 9pt; line-height: 1.7; color: #334155; min-height: calc(297mm - 160px); }
  .body-content .section-title { font-size: 7pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #013ba6; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1.5px solid #dbeafe; display: flex; align-items: center; gap: 6px; }
  .body-content .section-title::before { content: ''; width: 3px; height: 12px; background: #013ba6; border-radius: 2px; }
  .body-text { text-align: justify; word-break: break-word; }
  .reprint-notice { font-size: 6.5pt; color: #94a3b8; text-align: center; padding: 4px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); opacity: 0.06; z-index: 0; pointer-events: none; }
  .watermark img { width: 320px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; width: 210mm; margin: 0 auto; background: #fff; }
  .footer-accent { height: 2px; background: linear-gradient(90deg, #013ba6, #0152d4, #38bdf8, #0152d4, #013ba6); }
  .footer-content { padding: 8px 36px; display: flex; align-items: center; justify-content: space-between; }
  .footer-content .address { font-size: 6pt; color: #94a3b8; line-height: 1.4; max-width: 55%; }
  .footer-content .meta { font-size: 6pt; color: #94a3b8; text-align: right; line-height: 1.4; }
  .footer-content .meta .brand { font-weight: 600; color: #cbd5e1; }
  @media print { html, body { margin: 0 !important; padding: 0 !important; } .page { margin: 0; width: 100%; } }
  @media screen { .page { box-shadow: 0 8px 32px rgba(0,0,0,0.10); margin: 20px auto; border-radius: 3px; } }
</style></head><body>
<div class="page">
  <div class="watermark"><img src="${networkLogoUrl}" alt="" /></div>
  <div class="header"><div class="logo-main"><img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" /></div></div>
  <div class="reprint-notice">REIMPRESSÃO — Relatório original emitido em ${originalDate}</div>
  <div class="title-bar"><h1>Relatório Médico</h1><span class="hospital-name">${whitelabel.institution.hospitalName}</span></div>
  <div class="patient-strip">
    <div class="field"><span class="field-label">Paciente</span><span class="field-value">${report.patient_name}</span></div>
    <div class="divider"></div>
    ${report.patient_age ? `<div class="field"><span class="field-label">Idade</span><span class="field-value">${report.patient_age}</span></div><div class="divider"></div>` : ""}
    ${report.patient_bed ? `<div class="field"><span class="field-label">Leito</span><span class="field-value">${report.patient_bed}</span></div><div class="divider"></div>` : ""}
    ${sectorLabel ? `<div class="field"><span class="field-label">Setor</span><span class="field-value">${sectorLabel}</span></div><div class="divider"></div>` : ""}
    <div class="field"><span class="field-label">Emissão Original</span><span class="field-value">${originalDate}</span></div>
  </div>
  <div class="body-content">
    <div class="section-title">Conteúdo do Relatório</div>
    <div class="body-text">${escapedContent}</div>
  </div>
  <div class="footer">
    <div class="footer-accent"></div>
    <div class="footer-content">
      <div class="address">${whitelabel.institution.hospitalName}<br/>Rua Armando Vieira da Silva, S/N — Bairro Fátima, São Luís/MA — CEP 65.030-130</div>
      <div class="meta"><span class="brand">${whitelabel.credits.footerText}</span><br/>Reimpresso em ${dateStr} às ${timeStr}</div>
    </div>
  </div>
</div>
</body></html>`);
    printWindow.document.close();
    const images = printWindow.document.querySelectorAll("img");
    const imagePromises = Array.from(images).map((img) => {
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

  const filtered = reports.filter((r) =>
    r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.report_content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">Histórico de Relatórios</h1>
          <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando relatórios...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum relatório encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((report) => (
            <Card key={report.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {namesHidden ? maskName(report.patient_name, true) : report.patient_name}
                    </span>
                    {report.patient_age && <Badge variant="secondary" className="text-xs">{report.patient_age}</Badge>}
                    {report.patient_bed && <Badge variant="outline" className="text-xs">Leito {report.patient_bed}</Badge>}
                    {report.patient_sector && (
                      <Badge variant="outline" className="text-xs">
                        {sectorLabels[report.patient_sector] || report.patient_sector}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {report.created_by_email && (
                      <span className="ml-2">• {report.created_by_email}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{report.report_content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedReport(report)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleReprint(report)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  {role === "admin" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório Médico
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      {namesHidden ? maskName(selectedReport.patient_name, true) : selectedReport.patient_name}
                    </span>
                    {selectedReport.patient_age && <Badge variant="secondary">{selectedReport.patient_age}</Badge>}
                    {selectedReport.patient_bed && <Badge variant="outline">Leito {selectedReport.patient_bed}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emitido em {format(parseISO(selectedReport.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {selectedReport.created_by_email && ` por ${selectedReport.created_by_email}`}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{selectedReport.report_content}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleReprint(selectedReport)} className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" />
                    Reimprimir
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
