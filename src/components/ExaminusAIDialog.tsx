import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Check, X, Plus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExaminusAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExams: string[];
  onImportExams: (newExams: string[]) => void;
  sectorColor?: string;
}

export function ExaminusAIDialog({
  open,
  onOpenChange,
  currentExams,
  onImportExams,
  sectorColor = "hsl(var(--primary))"
}: ExaminusAIDialogProps) {
  const [inputText, setInputText] = useState("");
  const [extractedExams, setExtractedExams] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const processWithAI = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error("Cole o texto do exame antes de processar");
      return;
    }

    setIsProcessing(true);
    setIsStreaming(true);
    setStreamContent("");
    setExtractedExams([]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/examinus-chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Extraia e formate os exames do texto abaixo. Retorne CADA LINHA DE EXAME FORMATADA EM UMA LINHA SEPARADA (uma por linha). Use o formato padrão de formatação de exames laboratoriais e de imagem:\n\n${inputText}`
            }
          ]
        }),
      });

      if (response.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
        setIsProcessing(false);
        setIsStreaming(false);
        return;
      }

      if (response.status === 402) {
        toast.error("Créditos de IA esgotados.");
        setIsProcessing(false);
        setIsStreaming(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Falha ao processar com IA");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse the final content into lines
      const lines = fullContent
        .split("\n")
        .map(line => line.trim().toUpperCase())
        .filter(line => line.length > 0 && !line.startsWith("-") && line !== "");
      
      setExtractedExams(lines);
      setIsStreaming(false);
      setIsProcessing(false);
      
      if (lines.length > 0) {
        toast.success(`${lines.length} exame(s) extraído(s) com sucesso!`);
      } else {
        toast.warning("Nenhum exame identificado no texto");
      }
    } catch (error) {
      console.error("Erro ao processar:", error);
      toast.error("Erro ao processar exames com IA");
      setIsProcessing(false);
      setIsStreaming(false);
    }
  }, [inputText]);

  const handleRemoveExtracted = (index: number) => {
    setExtractedExams(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditExtracted = (index: number, value: string) => {
    setExtractedExams(prev => prev.map((item, i) => i === index ? value.toUpperCase() : item));
  };

  const handleConfirmImport = () => {
    if (extractedExams.length === 0) {
      toast.error("Nenhum exame para importar");
      return;
    }
    
    onImportExams([...currentExams, ...extractedExams]);
    toast.success(`${extractedExams.length} exame(s) adicionado(s)!`);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setInputText("");
    setExtractedExams([]);
    setStreamContent("");
    setIsStreaming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${sectorColor}20` }}
            >
              <Sparkles className="h-5 w-5" style={{ color: sectorColor }} />
            </div>
            <span>Examinus AI</span>
            <span className="text-xs font-normal text-muted-foreground ml-2">
              Importação inteligente de exames
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Input Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Cole o texto com os dados de exames
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cole aqui o texto com resultados de exames laboratoriais, gasometria, imagem, etc..."
              className="min-h-[120px] resize-none text-sm"
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <Button
                onClick={processWithAI}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1"
                style={{ 
                  backgroundColor: sectorColor,
                  color: 'white'
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Processar com IA
                  </>
                )}
              </Button>
              {(inputText || extractedExams.length > 0) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Streaming Preview */}
          {isStreaming && streamContent && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: sectorColor }} />
                <span className="text-xs font-medium text-muted-foreground">Extraindo exames...</span>
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                {streamContent}
              </pre>
            </div>
          )}

          {/* Results Section */}
          {extractedExams.length > 0 && !isStreaming && (
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Exames extraídos ({extractedExams.length})
                </label>
                <span className="text-xs text-muted-foreground">
                  Clique para editar, X para remover
                </span>
              </div>
              
              <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[200px]">
                <div className="space-y-1">
                  {extractedExams.map((exam, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded hover:bg-accent/50 group"
                    >
                      <span className="text-xs font-semibold text-muted-foreground flex-shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={exam}
                        onChange={(e) => handleEditExtracted(idx, e.target.value)}
                        className="flex-1 text-xs uppercase bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExtracted(idx)}
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  className="flex-1"
                  style={{ 
                    backgroundColor: sectorColor,
                    color: 'white'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar {extractedExams.length} exame(s)
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isStreaming && extractedExams.length === 0 && !isProcessing && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-8">
              <div className="space-y-2">
                <Sparkles className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-sm">
                  Cole o texto dos exames e clique em "Processar com IA"
                </p>
                <p className="text-xs">
                  A IA irá extrair e formatar automaticamente os dados
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
