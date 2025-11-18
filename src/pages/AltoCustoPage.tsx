import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AltoCustoPage() {
  const navigate = useNavigate();

  const documents = [
    { title: "ALTEPLASE - AVEI", file: "alteplase-avei.odt" },
    { title: "ALTEPLASE - TROMBOSE DE PERMCATH", file: "alteplase-trombose-permcath.odt" },
    { title: "CICLOFOSFAMIDA", file: "ciclofosfamida.odt" },
    { title: "ERTAPENEM", file: "ertapenem.odt" },
    { title: "FILGRASTIM - GRANULOKINE", file: "filgrastim-granulokine.odt" },
    { title: "IMUNOGLOBULINA HUMANA", file: "imunoglobulina-humana.odt" },
    { title: "MICAFUNGINA", file: "micafungina.odt" },
    { title: "REVOLADE PTI", file: "revolade-pti.odt" },
    { title: "TEICOPLANINA", file: "teicoplanina.odt" },
    { title: "TERLIPRESSINA", file: "terlipressina.odt" },
  ];

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/documents/alto-custo/${fileName}`;
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
          <h1 className="text-2xl font-bold">ALTO CUSTO</h1>
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
