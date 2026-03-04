import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Check, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ClinikusAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (text: string) => void;
}

const CLINICUS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clinicus-ai`;

export function ClinikusAIDialog({ open, onOpenChange, onImport }: ClinikusAIDialogProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<"input" | "result">("input");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Cole o relato clínico antes de gerar.");
      return;
    }

    setIsLoading(true);
    setResult("");
    setPhase("result");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(CLINICUS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message: inputText }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let accumulated = "";

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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setResult(accumulated);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Clinicus error:", e);
        toast.error(e.message || "Erro ao processar com Clinicus IA");
        setPhase("input");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleImport = () => {
    onImport(result);
    toast.success("História clínica importada com sucesso!");
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setInputText("");
    setResult("");
    setPhase("input");
    if (abortRef.current) abortRef.current.abort();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Texto copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Clinicus IA — Estruturação Clínica
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cole o relato médico em texto livre e o Clinicus irá estruturar no modelo padrão de admissão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {phase === "input" && (
            <div className="space-y-3">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="COLE AQUI O RELATO CLÍNICO, ANOTAÇÕES DO PLANTÃO, TRANSCRIÇÃO DE ÁUDIO OU QUALQUER TEXTO LIVRE COM INFORMAÇÕES DO PACIENTE..."
                className="min-h-[300px] text-sm uppercase resize-y font-mono"
                autoFocus
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!inputText.trim()}
                  className="gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Estruturar com Clinicus
                </Button>
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="space-y-3">
              <div className="relative">
                <div className="bg-muted/30 border border-border rounded-lg p-4 min-h-[300px] max-h-[60vh] overflow-y-auto">
                  {isLoading && !result && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Clinicus está estruturando a história clínica...</span>
                    </div>
                  )}
                  <pre className="text-sm whitespace-pre-wrap font-mono uppercase leading-relaxed text-foreground">
                    {result}
                  </pre>
                  {isLoading && result && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Novo Relato
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={isLoading || !result}
                    className="gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={isLoading || !result}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Importar para História
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
