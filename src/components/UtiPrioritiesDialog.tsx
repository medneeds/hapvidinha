import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Patient } from "@/types/patient";
import { useUtiPriorities } from "@/hooks/useUtiPriorities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Printer,
  Search,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { PrintUtiPrioritiesPreviewDialog } from "./PrintUtiPrioritiesPreviewDialog";

interface UtiPrioritiesDialogProps {
  open: boolean;
  onClose: () => void;
  allPatients: Patient[];
}

const UTI_STATUSES: Patient["internmentStatus"][] = [
  "SOLICITACAO_PENDENTE",
  "PSM_FAVORAVEL",
  "AGUARDANDO_VAGA",
  "IR_PARA_UTI",
];

const sectorLabels: Record<string, string> = {
  red: "Vermelha",
  yellow: "Amarela",
  blue: "Azul",
  outside: "Fora das Alas",
};

interface SortableRowProps {
  id: string;
  index: number;
  patient?: Patient;
  onRemove: () => void;
}

function SortableRow({ id, index, patient, onRemove }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  if (!patient) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-2 border rounded-md bg-muted/40"
      >
        <span className="text-xs text-muted-foreground italic">
          Paciente removido ou não disponível
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="ml-auto h-7 w-7"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md bg-card hover:bg-accent/40 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold uppercase truncate">
          {patient.name || "—"}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          Leito {patient.bedNumber} · {sectorLabels[patient.sector] ?? patient.sector}
          {patient.diagnoses?.[0] ? ` · ${patient.diagnoses[0]}` : ""}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="h-7 w-7"
        title="Remover da lista"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

export function UtiPrioritiesDialog({
  open,
  onClose,
  allPatients,
}: UtiPrioritiesDialogProps) {
  const { priorities, addPriority, removePriority, reorder } =
    useUtiPriorities();
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const priorityIds = useMemo(() => priorities.map((p) => p.id), [priorities]);
  const priorityPatientIds = useMemo(
    () => new Set(priorities.map((p) => p.patient_id)),
    [priorities],
  );

  const orderedPatients = useMemo(
    () =>
      priorities
        .map((pr) => allPatients.find((pt) => pt.id === pr.patient_id))
        .filter((p): p is Patient => !!p),
    [priorities, allPatients],
  );

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sectorRank: Record<string, number> = { red: 0, yellow: 1, blue: 2, outside: 3 };
    return allPatients
      .filter(
        (p) =>
          p.name?.trim() &&
          !p.isVacant &&
          !priorityPatientIds.has(p.id),
      )
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.bedNumber.toLowerCase().includes(term) ||
          (p.diagnoses?.[0] ?? "").toLowerCase().includes(term),
      )
      .sort((a, b) => {
        const aUti = a.internmentStatus && UTI_STATUSES.includes(a.internmentStatus) ? 0 : 1;
        const bUti = b.internmentStatus && UTI_STATUSES.includes(b.internmentStatus) ? 0 : 1;
        if (aUti !== bUti) return aUti - bUti;
        const sa = sectorRank[a.sector] ?? 99;
        const sb = sectorRank[b.sector] ?? 99;
        if (sa !== sb) return sa - sb;
        return a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true });
      });
  }, [allPatients, priorityPatientIds, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = priorityIds.indexOf(String(active.id));
      const newIdx = priorityIds.indexOf(String(over.id));
      const newOrder = arrayMove(priorityIds, oldIdx, newIdx);
      reorder(newOrder);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                Prioridades UTI
                <Badge variant="secondary">{priorities.length}</Badge>
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowPreview(true)}
                disabled={orderedPatients.length === 0}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            </DialogTitle>
            <DialogDescription>
              Fila priorizada de pacientes candidatos a leito de UTI. Arraste
              para reorganizar. A lista persiste até que o paciente seja
              movimentado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Coluna esquerda: candidatos */}
            <div className="flex flex-col min-h-0 border rounded-lg">
              <div className="p-3 border-b">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Candidatos (status UTI ativo)
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou leito..."
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1.5">
                  {candidates.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 justify-center">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Nenhum paciente com status UTI disponível.
                    </div>
                  )}
                  {candidates.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 border rounded-md hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold uppercase truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          Leito {p.bedNumber} ·{" "}
                          {sectorLabels[p.sector] ?? p.sector} ·{" "}
                          {p.internmentStatus?.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addPriority(p.id)}
                        className="h-7 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Coluna direita: fila priorizada */}
            <div className="flex flex-col min-h-0 border rounded-lg">
              <div className="p-3 border-b">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Fila priorizada
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Arraste pelo ícone <GripVertical className="inline h-3 w-3" />{" "}
                  para reordenar.
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {priorities.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-6 text-center">
                      Nenhum paciente priorizado ainda. Adicione candidatos da
                      lista ao lado.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={priorityIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1.5">
                          {priorities.map((pr, idx) => {
                            const patient = allPatients.find(
                              (p) => p.id === pr.patient_id,
                            );
                            return (
                              <SortableRow
                                key={pr.id}
                                id={pr.id}
                                index={idx}
                                patient={patient}
                                onRemove={() => removePriority(pr.id)}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showPreview && (
        <PrintUtiPrioritiesPreviewDialog
          patients={orderedPatients}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
