import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TomografiasPage() {
  const navigate = useNavigate();

  const documents = [
    { title: "QUESTIONÁRIO - CABEÇA E PESCOÇO", file: "questionario-cabeca-e-pescoco.pdf" },
    { title: "QUESTIONÁRIO - COLUNA", file: "questionario-coluna.pdf" },
    { title: "QUESTIONÁRIO - CRÂNIO", file: "questionario-cranio.pdf" },
    { title: "QUESTIONÁRIO - TÓRAX", file: "questionario-torax.pdf" },
    { title: "QUESTIONÁRIO - ABDOME E PELVE", file: "questionario-abdome-pelve.pdf" },
    { title: "QUESTIONÁRIO - MEMBROS", file: "questionario-membros.pdf" },
    { title: "QUESTIONÁRIO - ANGIOS", file: "questionario-angios.pdf" },
    { title: "TERMO DE CONSENTIMENTO - GESTANTE", file: "termo-consentimento-gestante.pdf" },
    { title: "TERMO DE CONSENTIMENTO - TC", file: "termo-consentimento-tc.pdf" },
    { title: "FICHA DE ACOMPANHAMENTO - TC", file: "ficha-acompanhamento-tc.pdf" },
  ];

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/documents/tomografias/${fileName}`;
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
          <h1 className="text-2xl font-bold">TOMOGRAFIAS</h1>
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
