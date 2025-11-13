import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText, Download, Copy, Trash2, FileInput, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { internmentTemplate } from "@/data/internmentTemplate";
import { useNavigate } from "react-router-dom";

const NotesPage = () => {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImportTemplate = () => {
    setNotes(internmentTemplate);
    toast({
      title: "MODELO IMPORTADO",
      description: "TEMPLATE DE SOLICITAÇÃO DE INTERNAÇÃO CARREGADO COM SUCESSO",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      toast({
        title: "COPIADO",
        description: "TEXTO COPIADO PARA A ÁREA DE TRANSFERÊNCIA",
      });
    } catch (err) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL COPIAR O TEXTO",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ANAMNESE_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "DOWNLOAD REALIZADO",
      description: "ARQUIVO SALVO COM SUCESSO",
    });
  };

  const handleClear = () => {
    setNotes("");
    toast({
      title: "LIMPO",
      description: "TODO O TEXTO FOI REMOVIDO",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                  BLOCO DE NOTAS
                </h1>
                <p className="text-sm text-muted-foreground uppercase">
                  ANAMNESE E DOCUMENTAÇÃO MÉDICA
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportTemplate}
              className="gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/50 transition-all uppercase"
            >
              <FileInput className="h-4 w-4" />
              IMPORTAR MODELO PADRÃO
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-6 shadow-xl border-2">
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={handleChange}
              placeholder="DIGITE SUA ANAMNESE AQUI OU IMPORTE O MODELO PADRÃO..."
              className="min-h-[600px] font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground uppercase">
                {notes.length} CARACTERES
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!notes}
                  className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
                >
                  <Copy className="h-4 w-4" />
                  COPIAR TEXTO
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!notes}
                  className="gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all uppercase"
                >
                  <Download className="h-4 w-4" />
                  BAIXAR
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={!notes}
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all uppercase"
                >
                  <Trash2 className="h-4 w-4" />
                  LIMPAR TUDO
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotesPage;
