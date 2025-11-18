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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">HEMODERIVADOS</h1>
        </div>

        <div className="bg-card border rounded-lg p-8 space-y-6">
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Button 
                key={doc.file}
                size="lg"
                className="w-full h-16 text-lg"
                onClick={() => handleDownload(doc.file)}
              >
                <Download className="mr-2 h-5 w-5" />
                {doc.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
