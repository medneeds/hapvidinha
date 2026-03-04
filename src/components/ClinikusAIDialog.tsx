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
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Loader2, Check, Copy, RotateCcw, AlertTriangle, ShieldAlert } from "lucide-react";
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
  const [phase, setPhase] = useState<"input" | "disclaimer-pre" | "result" | "review">("input");
  const [acknowledged, setAcknowledged] = useState(false);
  const [preAcknowledged, setPreAcknowledged] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleRequestGenerate = () => {
    if (!inputText.trim()) {
      toast.error("Cole o relato clínico antes de gerar.");
      return;
    }
    setPreAcknowledged(false);
    setPhase("disclaimer-pre");
  };

  const handleConfirmAndGenerate = async () => {
    if (!preAcknowledged) {
      toast.error("Você precisa declarar ciência antes de prosseguir.");
      return;
    }
    await handleGenerate();
  };

  const handleGenerate = async () => {

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

  const handleProceedToReview = () => {
    setPhase("review");
  };

  const handleImport = () => {
    if (!acknowledged) {
      toast.error("Você precisa declarar ciência antes de importar.");
      return;
    }
    onImport(result);
    toast.success("História clínica importada com sucesso!");
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setInputText("");
    setResult("");
    setPhase("input");
    setAcknowledged(false);
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
            {phase === "input" && "Cole o relato médico em texto livre e o Clinicus irá estruturar no modelo padrão de admissão."}
            {phase === "result" && "Acompanhe a geração do documento estruturado em tempo real."}
            {phase === "review" && "Revise o documento gerado e declare ciência antes de importar."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">

          {/* FASE 1: Input */}
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

          {/* FASE 2: Streaming result */}
          {phase === "result" && (
            <div className="space-y-3">
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

              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Novo Relato
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} disabled={isLoading || !result} className="gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button size="sm" onClick={handleProceedToReview} disabled={isLoading || !result} className="gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Revisar e Importar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* FASE 3: Review + Disclaimer */}
          {phase === "review" && (
            <div className="space-y-4">
              {/* Disclaimer box */}
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      AVISO IMPORTANTE — LEIA COM ATENÇÃO
                    </h3>
                    <div className="text-xs text-foreground/80 leading-relaxed space-y-2">
                      <p>
                        Este documento foi gerado pelo <strong className="text-foreground">Clinicus</strong>, um assistente de inteligência artificial desenvolvido para auxiliar na organização e estruturação de informações clínicas dentro do <strong className="text-foreground">HapMap</strong>.
                      </p>
                      <p>
                        O Clinicus é uma ferramenta de <strong className="text-foreground">apoio à documentação médica</strong> e <strong className="text-foreground">não substitui</strong>, em nenhuma hipótese, o raciocínio clínico, a análise crítica e a revisão detalhada do médico responsável pelo caso.
                      </p>
                      <p>
                        Podem ocorrer <strong className="text-foreground">erros, omissões ou inconsistências</strong> no texto gerado. O conteúdo deve ser integralmente revisado e ajustado pelo profissional antes de qualquer utilização clínica ou documental.
                      </p>
                      <p className="text-destructive/90 font-medium">
                        O HapMap e o Clinicus não se responsabilizam por eventuais incorreções. A responsabilidade técnica e legal permanece integralmente com o médico.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-destructive/20 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={acknowledged}
                      onCheckedChange={(v) => setAcknowledged(v === true)}
                      className="mt-0.5 border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                    <span className="text-xs leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
                      <strong>Declaro ciência</strong> de que revisei o conteúdo gerado pelo Clinicus, compreendo as limitações da ferramenta e assumo total responsabilidade pela utilização das informações no prontuário do paciente.
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview compacto */}
              <div className="bg-muted/20 border border-border rounded-lg p-3 max-h-[30vh] overflow-y-auto">
                <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Prévia do documento gerado</p>
                <pre className="text-xs whitespace-pre-wrap font-mono uppercase leading-relaxed text-foreground/80">
                  {result}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setPhase("result")} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={!acknowledged}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Importar para História Admissional
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
