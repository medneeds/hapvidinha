import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SadtPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const documents = [
    { file: "hapvida-guia-sp-sadt.pdf", title: "Guia SP-SADT Hapvida - Formato Retrato" },
    { file: "hapvida-guia-sp-sadt-paisagem.pdf", title: "Guia SP-SADT Hapvida - Formato Paisagem" },
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/documents/sadt/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/documents")}
            className="hover-scale"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SADT</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Serviço Auxiliar de Diagnóstico e Terapia
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-center text-muted-foreground">
                  {searchQuery
                    ? "Nenhum documento encontrado com esse termo"
                    : "Nenhum documento disponível"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc, index) => (
              <Card
                key={doc.file}
                className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => handleDownload(doc.file)}
                    className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Clique para fazer download
                      </p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer Info */}
        {filteredDocuments.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {filteredDocuments.length} {filteredDocuments.length === 1 ? "documento" : "documentos"} 
            {searchQuery && " encontrado(s)"}
          </p>
        )}
      </div>
    </div>
  );
}
