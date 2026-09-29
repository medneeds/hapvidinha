import { useEffect, useState } from "react";
import { Patient } from "@/types/patient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, FileEdit, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { whitelabel } from "@/config/whitelabel";
import { usePrivacy, maskName } from "@/contexts/PrivacyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";

interface Props {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientReportDialog({ patient, open, onOpenChange }: Props) {
  const [reportText, setReportText] = useState("");
  useEffect(() => { if (open) setReportText(""); }, [open]);
  const reportDialogOpen = open;
  const setReportDialogOpen = onOpenChange;
  const { namesHidden } = usePrivacy();
  const { user } = useAuth();
  const { currentState, currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();

  return (
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-primary" />
              Emitir Relatório
            </DialogTitle>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-sm font-semibold">{namesHidden ? maskName(patient.name, namesHidden) : patient.name}</Badge>
              {patient.age && <Badge variant="secondary" className="text-sm">{patient.age}</Badge>}
              <Badge variant="secondary" className="text-xs">Leito {patient.bedNumber}</Badge>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Conteúdo do Relatório</label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const admissionText = patient.admissionHistory || '';
                  if (!admissionText.trim()) {
                    toast.error('Nenhuma história admissional disponível');
                    return;
                  }
                  setReportText(prev => prev ? prev + '\n\n' + admissionText : admissionText);
                  toast.success('História admissional copiada para o relatório');
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Copy className="h-3 w-3" />
                Copiar História Admissional
              </Button>
            </div>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Digite ou cole o conteúdo do relatório aqui..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              style={{ minHeight: '200px', maxHeight: '60vh' }}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(reportText);
                  toast.success('Relatório copiado!');
                }}
                disabled={!reportText.trim()}
                className="flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReportDialogOpen(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                disabled={!reportText.trim()}
                onClick={() => {
                  const networkLogoUrl = new URL(whitelabel.logos.networkFull, window.location.origin).href;
                   const platformLogoUrl = new URL(whitelabel.logos.platform, window.location.origin).href;
                   const hospitalLogoUrl = new URL(whitelabel.logos.hospital, window.location.origin).href;
                  const now = new Date();
                  const dateStr = now.toLocaleDateString('pt-BR');
                  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const escapedContent = reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório - ${patient.name}</title>
<style>
  @page { size: A4 portrait; margin: 18mm 15mm 15mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; }
  .page { width: 100%; margin: 0 auto; position: relative; }

  .header {
    background: linear-gradient(135deg, #002b80 0%, #013ba6 40%, #0152d4 100%);
    padding: 20px 36px 16px; display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .header::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
  }
  .header .logo-main img { height: 48px; filter: brightness(0) invert(1); }

  .title-bar {
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    padding: 10px 36px; display: flex; align-items: center; justify-content: space-between;
  }
  .title-bar h1 { font-size: 10pt; font-weight: 700; color: #013ba6; text-transform: uppercase; letter-spacing: 2px; }
  .title-bar .hospital-name { font-size: 7.5pt; color: #64748b; font-weight: 500; }

  .patient-strip {
    background: #eef2ff; border-bottom: 1px solid #ddd6fe;
    padding: 10px 36px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  }
  .patient-strip .field { display: flex; flex-direction: column; }
  .patient-strip .field-label { font-size: 5.5pt; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
  .patient-strip .field-value { font-size: 8.5pt; color: #111827; font-weight: 600; margin-top: 1px; }
  .patient-strip .divider { width: 1px; height: 24px; background: #c7d2fe; }

  .body-content {
    padding: 24px 36px 20px; font-size: 9pt; line-height: 1.7; color: #334155;
  }
  .body-content .section-title {
    font-size: 7pt; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;
    color: #013ba6; margin-bottom: 10px; padding-bottom: 5px;
    border-bottom: 1.5px solid #dbeafe; display: flex; align-items: center; gap: 6px;
  }
  .body-content .section-title::before { content: ''; width: 3px; height: 12px; background: #013ba6; border-radius: 2px; }
  .body-text { text-align: justify; word-break: break-word; }

   .watermark {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg);
    opacity: 0.06; z-index: 0; pointer-events: none;
  }
  .watermark img { width: 320px; }

  .footer { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; }
  .footer-accent { height: 2px; background: linear-gradient(90deg, #013ba6, #0152d4, #38bdf8, #0152d4, #013ba6); }
  .footer-content { padding: 8px 36px; display: flex; align-items: center; justify-content: space-between; }
  .footer-content .address { font-size: 6pt; color: #94a3b8; line-height: 1.4; max-width: 55%; }
  .footer-content .meta { font-size: 6pt; color: #94a3b8; text-align: right; line-height: 1.4; }
  .footer-content .meta .brand { font-weight: 600; color: #cbd5e1; }

  @media print { html, body { margin: 0 !important; padding: 0 !important; } .page { margin: 0; width: 100%; } }
  @media screen { .page { box-shadow: 0 8px 32px rgba(0,0,0,0.10); margin: 20px auto; border-radius: 3px; max-width: 210mm; min-height: 297mm; } }
</style></head><body>
<div class="page">
  <div class="watermark"><img src="${networkLogoUrl}" alt="" /></div>
  <div class="header"><div class="logo-main"><img src="${networkLogoUrl}" alt="Hapvida NotreDame Intermédica" /></div></div>
  <div class="title-bar"><h1>Relatório Médico</h1><span class="hospital-name">${whitelabel.institution.hospitalName}</span></div>
  <div class="patient-strip">
    <div class="field"><span class="field-label">Paciente</span><span class="field-value">${patient.name}</span></div>
    <div class="divider"></div>
    ${patient.age ? `<div class="field"><span class="field-label">Idade</span><span class="field-value">${patient.age}</span></div><div class="divider"></div>` : ''}
    <div class="field"><span class="field-label">Leito</span><span class="field-value">${patient.bedNumber}</span></div>
    <div class="divider"></div>
    <div class="field"><span class="field-label">Setor</span><span class="field-value">${patient.sector === 'red' ? 'Vermelho' : patient.sector === 'yellow' ? 'Amarelo' : patient.sector === 'blue' ? 'Azul' : patient.sector}</span></div>
    <div class="divider"></div>
    <div class="field"><span class="field-label">Emissão</span><span class="field-value">${dateStr} às ${timeStr}</span></div>
  </div>
  <div class="body-content">
    <div class="section-title">Conteúdo do Relatório</div>
    <div class="body-text">${escapedContent}</div>
  </div>
  <div class="footer">
    <div class="footer-accent"></div>
    <div class="footer-content">
      <div class="address">${whitelabel.institution.hospitalName}<br/>Rua Armando Vieira da Silva, S/N — Bairro Fátima, São Luís/MA — CEP 65.030-130</div>
      <div class="meta"><span class="brand">${whitelabel.credits.footerText}</span><br/>${dateStr} às ${timeStr}</div>
    </div>
  </div>
</div>
</body></html>`);
                  printWindow.document.close();
                   // Save report to history
                   if (currentHospital && currentState) {
                     (supabase.from as any)('medical_reports').insert({
                       patient_id: patient.id,
                       patient_name: patient.name,
                       patient_age: patient.age || null,
                       patient_bed: patient.bedNumber,
                       patient_sector: patient.sector,
                       report_content: reportText,
                       created_by: user?.id || null,
                       created_by_email: user?.email || null,
                       hospital_unit_id: currentHospital.id,
                       state_id: currentState.id,
                       department: currentDepartment,
                     }).then(({ error: saveError }: any) => {
                       if (saveError) console.error('Erro ao salvar relatório:', saveError);
                     });
                   }
                   // Wait for all images to load before printing
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
                }}
                className="flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Relatório
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
