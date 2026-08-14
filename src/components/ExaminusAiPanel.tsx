import { useEffect, useMemo, useState } from "react";
import { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Printer,
  Loader2,
  History,
  Plus,
  ShieldAlert,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useExaminusAi, extractSuggestedExams, ExaminusMode } from "@/hooks/useExaminusAi";
import { useHospital } from "@/contexts/HospitalContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { getPatientAgeDisplay } from "@/utils/ageDisplay";
import { PrintExaminusAiDialog } from "./PrintExaminusAiDialog";

interface ExaminusAiPanelProps {
  patient?: Patient;
  onAddExams?: (exams: string[]) => void;
}

const MODES: { id: ExaminusMode; label: string; hint: string; placeholder: string }[] = [
  {
    id: "sugerir",
    label: "Sugerir exames",
    hint: "Descreva um tema e receba os exames com a descrição do que avaliam.",
    placeholder: "Ex.: MARCADORES CANCERÍGENOS · PAINEL DE TIREOIDE · INVESTIGAÇÃO DE ANEMIA",
  },
  {
    id: "caso",
    label: "Caso clínico → exames",
    hint: "Envie o caso e receba exames obrigatórios, recomendados e complementares.",
    placeholder: "Ex.: HOMEM, 62 ANOS, DOR TORÁCICA EM APERTO HÁ 2H, HAS E DM2...",
  },
  {
    id: "contraindicacoes",
    label: "Contraindicações",
    hint: "Informe um exame ou procedimento e veja contraindicações e cuidados.",
    placeholder: "Ex.: ANGIOTOMOGRAFIA DE TÓRAX COM CONTRASTE · RESSONÂNCIA DE CRÂNIO",
  },
  {
    id: "entender",
    label: "Entender exame",
    hint: "Explicação objetiva de um exame ou procedimento médico.",
    placeholder: "Ex.: D-DÍMERO · PUNÇÃO LOMBAR · ECOCARDIOGRAMA TRANSESOFÁGICO",
  },
];

const MODE_LABELS: Record<string, string> = {
  sugerir: "Sugestão de exames",
  caso: "Caso clínico → exames",
  contraindicacoes: "Contraindicações",
  entender: "Entender exame",
};

/** Monta o contexto clínico SEM o nome do paciente (LGPD). */
function buildClinicalContext(patient?: Patient): string {
  if (!patient) return "";
  const lines: string[] = [];
  lines.push(`IDADE: ${getPatientAgeDisplay(patient)}`);
  if (patient.bedNumber) lines.push(`LEITO: ${patient.bedNumber}`);
  if (patient.diagnoses?.length) lines.push(`HIPÓTESES/DIAGNÓSTICOS: ${patient.diagnoses.join("; ")}`);
  if (patient.medicalHistory?.length) lines.push(`ANTECEDENTES: ${patient.medicalHistory.join("; ")}`);
  if (patient.relevantExams?.length) lines.push(`EXAMES JÁ LANÇADOS: ${patient.relevantExams.join("; ")}`);
  if (patient.pendencies?.length) lines.push(`PENDÊNCIAS: ${patient.pendencies.join("; ")}`);
  if (patient.admissionHistory?.trim()) lines.push(`HISTÓRIA ADMISSIONAL: ${patient.admissionHistory.trim()}`);
  return lines.join("\n");
}

export function ExaminusAiPanel({ patient, onAddExams }: ExaminusAiPanelProps) {
  const [mode, setMode] = useState<ExaminusMode>("sugerir");
  const [prompt, setPrompt] = useState("");
  const [useContext, setUseContext] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [printing, setPrinting] = useState<{ prompt: string; content: string } | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  const { currentHospital } = useHospital();
  const { currentDepartment } = useDepartment();
  const { answer, setAnswer, isStreaming, error, ask, stop, history, loadHistory, loadingHistory } =
    useExaminusAi(patient?.id);

  const clinicalContext = useMemo(() => buildClinicalContext(patient), [patient]);
  const activeMode = MODES.find((m) => m.id === mode)!;
  const suggested = useMemo(() => extractSuggestedExams(answer), [answer]);

  useEffect(() => {
    setSelectedExams([]);
  }, [answer]);

  useEffect(() => {
    if (showHistory) void loadHistory();
  }, [showHistory, loadHistory]);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || isStreaming) return;
    setLastPrompt(text);
    await ask({
      mode,
      prompt: text,
      clinicalContext: useContext && clinicalContext ? clinicalContext : null,
      patientId: patient?.id ?? null,
      patientBed: patient?.bedNumber ?? null,
      hospitalUnitId: currentHospital?.id ?? null,
      department: currentDepartment,
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    toast({ title: "Copiado", description: "Resposta copiada para a área de transferência." });
    setTimeout(() => setCopied(false), 1800);
  };

  const handleInsert = () => {
    if (!onAddExams || selectedExams.length === 0) return;
    onAddExams(selectedExams.map((e) => e.toUpperCase()));
    toast({
      title: "Exames adicionados",
      description: `${selectedExams.length} exame(s) inserido(s) no paciente.`,
    });
    setSelectedExams([]);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Modos */}
      <div className="px-6 pt-4 pb-3 border-b bg-muted/20">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                mode === m.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{activeMode.hint}</p>
      </div>

      {/* Conteúdo */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-6 py-4 space-y-4">
          {/* Contexto do paciente */}
          {patient && (
            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="examinus-context" className="text-xs font-semibold cursor-pointer">
                  Usar contexto clínico do paciente
                </Label>
                <Switch id="examinus-context" checked={useContext} onCheckedChange={setUseContext} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                O nome do paciente nunca é enviado à IA.
              </p>
              {useContext && clinicalContext && (
                <pre className="mt-2 text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans max-h-32 overflow-auto border-t pt-2">
                  {clinicalContext}
                </pre>
              )}
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resposta */}
          {(answer || isStreaming) && (
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {MODE_LABELS[mode]}
                  {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-1">
                  {isStreaming ? (
                    <Button size="sm" variant="ghost" onClick={stop} className="h-7 gap-1 text-[11px]">
                      <Square className="h-3 w-3" /> Parar
                    </Button>
                  ) : (
                    answer && (
                      <>
                        <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 gap-1 text-[11px]">
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copiar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrinting({ prompt: lastPrompt, content: answer })}
                          className="h-7 gap-1 text-[11px]"
                        >
                          <Printer className="h-3 w-3" /> PDF
                        </Button>
                      </>
                    )
                  )}
                </div>
              </div>

              <div className="p-3 text-[12px] leading-relaxed whitespace-pre-wrap">
                {answer || "Consultando a inteligência artificial..."}
              </div>

              {/* Seleção de exames */}
              {!isStreaming && suggested.length > 0 && onAddExams && (
                <div className="border-t p-3 space-y-2 bg-muted/20">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    Inserir nos exames do paciente
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-auto">
                    {suggested.map((exam) => (
                      <label
                        key={exam}
                        className="flex items-start gap-2 text-[11px] cursor-pointer hover:text-primary"
                      >
                        <Checkbox
                          checked={selectedExams.includes(exam)}
                          onCheckedChange={(checked) =>
                            setSelectedExams((prev) =>
                              checked ? [...prev, exam] : prev.filter((e) => e !== exam)
                            )
                          }
                          className="h-4 w-4 mt-0.5"
                        />
                        <span className="leading-snug">{exam}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleInsert}
                    disabled={selectedExams.length === 0}
                    className="w-full h-8 gap-2 text-[11px]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar {selectedExams.length > 0 && `(${selectedExams.length})`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Histórico */}
          <div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory((v) => !v)}
              className="h-7 gap-2 text-[11px] text-muted-foreground"
            >
              <History className="h-3.5 w-3.5" />
              {showHistory ? "Ocultar histórico" : "Histórico de consultas"}
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {loadingHistory && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                  </div>
                )}
                {!loadingHistory && history.length === 0 && (
                  <div className="text-[11px] text-muted-foreground">Nenhuma consulta registrada.</div>
                )}
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setAnswer(h.response);
                      setLastPrompt(h.prompt);
                      setShowHistory(false);
                    }}
                    className="w-full text-left rounded-lg border bg-card p-2.5 hover:border-primary/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {MODE_LABELS[h.mode] || h.mode}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-[11px] line-clamp-2">{h.prompt}</div>
                    {h.created_by_name && (
                      <div className="text-[9px] text-muted-foreground mt-1">{h.created_by_name}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t p-3 space-y-2 bg-muted/20">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={activeMode.placeholder}
          className="min-h-[70px] max-h-40 text-xs resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] text-muted-foreground leading-tight">
            Apoio à decisão clínica — não substitui o julgamento médico.
          </span>
          <Button
            onClick={handleSend}
            disabled={!prompt.trim() || isStreaming}
            size="sm"
            className="gap-2 h-8"
          >
            {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Consultar
          </Button>
        </div>
      </div>

      {printing && (
        <PrintExaminusAiDialog
          title={`EXAMINUS IA · ${MODE_LABELS[mode]}`}
          prompt={printing.prompt}
          content={printing.content}
          patientLabel={
            patient ? `LEITO ${patient.bedNumber} · ${getPatientAgeDisplay(patient)}` : undefined
          }
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}
