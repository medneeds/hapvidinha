import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HemoderivadosPage() {
  const navigate = useNavigate();

  const documents = [
    { title: "HEMOC ATO - SADT", file: "hemoc-ato-sadt.pdf" },
    { title: "HEMOC CONCENTRADOS - SADT", file: "hemoc-concentrados-sadt.pdf" },
    { title: "HEMOC EXAMES - SADT", file: "hemoc-exames-sadt.pdf" },
    { title: "SOLICITAÇÃO DE HEMOCONCENTRADOS", file: "solicitacao-hemoconcentrados.pdf" },
    { title: "TERMO DE ESCLARECIMENTO - HEMOTRANSFUSÃO", file: "termo-esclarecimento-hemotransfusao.pdf" },
  ];

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/documents/hemoderivados/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">HEMODERIVADOS</h1>
        </div>

        <div className="bg-card border rounded-lg divide-y">
          {documents.map((doc) => (
            <div key={doc.file} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
              <span className="font-medium">{doc.title}</span>
              <Button onClick={() => handleDownload(doc.file)} size="sm">
                <Download className="mr-2 h-4 w-4" />
                DOWNLOAD
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
