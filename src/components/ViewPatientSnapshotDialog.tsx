import { Patient } from "@/types/patient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Bed, User, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatAgeDisplay } from "@/utils/ageDisplay";
import { whitelabel } from "@/config/whitelabel";

interface ViewPatientSnapshotDialogProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

const sectorNames = {
  red: "Sala de Cuidados Especiais",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
  outside: "Fora das Alas",
};

const sectorColors = {
  red: "bg-red-500/10 text-red-600 border-red-500/30",
  yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  outside: "bg-gray-500/10 text-gray-600 border-gray-500/30",
};

export function ViewPatientSnapshotDialog({
  patient,
  isOpen,
  onClose,
}: ViewPatientSnapshotDialogProps) {
  if (!patient) return null;

  const handlePrintCase = () => {
    const now = new Date();
    const dateStr = format(now, "dd/MM/yyyy", { locale: ptBR });
    const timeStr = format(now, "HH:mm", { locale: ptBR });

    const sectorLabel = sectorNames[patient.sector] || patient.sector;
    const admissionDateStr = patient.admissionDate
      ? format(new Date(patient.admissionDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      : "Não informada";

    const listItems = (items: string[] | undefined, fallback = "Não informado") => {
      if (!items || items.length === 0) return `<p style="color:#888;font-size:12px;">${fallback}</p>`;
      return `<ol style="margin:0;padding-left:18px;">${items.map(i => `<li style="font-size:12px;margin-bottom:3px;text-transform:uppercase;">${i}</li>`).join("")}</ol>`;
    };

    const hapmapLogoUrl = whitelabel.logos.platform;
    const networkLogoUrl = whitelabel.logos.networkFull;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Caso Clínico - ${patient.name}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #013ba6; padding-bottom: 12px; margin-bottom: 18px; }
          .header-left { display: flex; align-items: center; gap: 14px; }
          .header-left img { height: 40px; object-fit: contain; }
          .header-right img { height: 36px; object-fit: contain; }
          .title { font-size: 16px; font-weight: 700; color: #013ba6; text-transform: uppercase; }
          .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
          .patient-header { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; }
          .patient-name { font-size: 18px; font-weight: 700; text-transform: uppercase; color: #1e293b; }
          .patient-meta { display: flex; gap: 20px; margin-top: 6px; font-size: 12px; color: #475569; }
          .patient-meta span { font-weight: 600; color: #1e293b; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 13px; font-weight: 700; color: #013ba6; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          .anamnese-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; white-space: pre-wrap; text-transform: uppercase; }
          .footer { margin-top: 24px; padding-top: 10px; border-top: 2px solid #013ba6; display: flex; justify-content: space-between; font-size: 9px; color: #888; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="${hapmapLogoUrl}" alt="HapMap" />
            <div>
              <div class="title">Caso Clínico do Paciente</div>
              <div class="subtitle">${whitelabel.institution.hospitalName}</div>
            </div>
          </div>
          <div class="header-right">
            <img src="${networkLogoUrl}" alt="${whitelabel.institution.networkName}" />
          </div>
        </div>

        <div class="patient-header">
          <div class="patient-name">${patient.name}</div>
          <div class="patient-meta">
            <div>Leito: <span>${patient.bedNumber}</span></div>
            ${patient.age ? `<div>Idade: <span>${formatAgeDisplay(patient.age)}</span></div>` : ""}
            <div>Setor: <span>${sectorLabel}</span></div>
            <div>Admissão: <span>${admissionDateStr}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Hipóteses / Diagnósticos</div>
          ${listItems(patient.diagnoses)}
        </div>

        <div class="section">
          <div class="section-title">Antecedentes</div>
          ${listItems(patient.medicalHistory)}
        </div>

        <div class="section">
          <div class="section-title">Exames Relevantes</div>
          ${listItems(patient.relevantExams)}
        </div>

        <div class="section">
          <div class="section-title">Programações / Pendências</div>
          ${listItems(patient.pendencies)}
        </div>

        ${patient.admissionHistory ? `
        <div class="section">
          <div class="section-title">História Admissional / Anamnese</div>
          <div class="anamnese-box">${patient.admissionHistory}</div>
        </div>
        ` : ""}

        <div class="footer">
          <span>${whitelabel.print.confidentialityText} • ${whitelabel.print.systemLabel}</span>
          <span>${whitelabel.credits.authorSignature} • Gerado em ${dateStr} às ${timeStr}</span>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="text-2xl">Dados Históricos do Paciente</DialogTitle>
          <Button onClick={handlePrintCase} variant="outline" size="sm" className="gap-2 shrink-0 mr-6">
            <Printer className="h-4 w-4" />
            Imprimir Caso
          </Button>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-6">
            {/* Patient Header Info */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-xl font-bold uppercase">{patient.name}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>Leito: {patient.bedNumber}</span>
                  </div>
                  {patient.age && (
                    <span>Idade: {formatAgeDisplay(patient.age)}</span>
                  )}
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${sectorColors[patient.sector]} border`}
              >
                {sectorNames[patient.sector]}
              </Badge>
            </div>

            {/* Admission Info */}
            {patient.admissionDate && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Data de Admissão</span>
                </div>
                <p className="text-sm pl-6">
                  {format(new Date(patient.admissionDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            <Separator />

            {/* Diagnoses */}
            {patient.diagnoses && patient.diagnoses.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Hipóteses / Diagnósticos</h4>
                <ul className="list-decimal list-inside space-y-1 pl-2">
                  {patient.diagnoses.map((diagnosis, index) => (
                    <li key={index} className="text-sm uppercase">{diagnosis}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medical History */}
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Antecedentes</h4>
                <ul className="list-decimal list-inside space-y-1 pl-2">
                  {patient.medicalHistory.map((history, index) => (
                    <li key={index} className="text-sm uppercase">{history}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Relevant Exams */}
            {patient.relevantExams && patient.relevantExams.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Exames</h4>
                <ul className="list-decimal list-inside space-y-1 pl-2">
                  {patient.relevantExams.map((exam, index) => (
                    <li key={index} className="text-sm uppercase">{exam}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pendencies */}
            {patient.pendencies && patient.pendencies.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Programações / Pendências</h4>
                <ul className="list-decimal list-inside space-y-1 pl-2">
                  {patient.pendencies.map((pendency, index) => (
                    <li key={index} className="text-sm uppercase">{pendency}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Admission History */}
            {patient.admissionHistory && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">História Admissional / Anamnese</h4>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <p className="text-sm whitespace-pre-wrap uppercase">
                    {patient.admissionHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
