import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SepsisProtocolPage() {
  const navigate = useNavigate();
  const pdfUrl = "/documents/protocolo-sepse-adulto.pdf";

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'PROTOCOLO_SEPSE_ADULTO.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleOpenInNew = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">PROTOCOLO SEPSE ADULTO</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenInNew}>
            <ExternalLink className="mr-2 h-4 w-4" />
            ABRIR
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            IMPRIMIR
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            DOWNLOAD
          </Button>
        </div>
      </div>

      <div className="w-full h-[calc(100vh-73px)]">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="Protocolo SEPSE Adulto"
        />
      </div>
    </div>
  );
}
