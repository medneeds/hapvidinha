import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StickyNote, Save } from "lucide-react";
import { useUnitSharedNotes } from "@/hooks/useUnitSharedNotes";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function QuickNotesDialog({ open, onOpenChange }: Props) {
  const { content, updatedAt, updatedByEmail, saveNote, isSaving } = useUnitSharedNotes();
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (open) setDraft(content);
  }, [open, content]);

  const dirty = draft !== content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Anotações da Unidade
          </DialogTitle>
          <DialogDescription>
            Bloco compartilhado de anotações da equipe (visível a todos).
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          placeholder="ESCREVA AQUI OBSERVAÇÕES GERAIS, RECADOS DE PASSAGEM, LEMBRETES..."
          className="min-h-[320px] font-mono text-sm uppercase"
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {updatedAt
              ? `Atualizado em ${new Date(updatedAt).toLocaleString("pt-BR")}${updatedByEmail ? ` por ${updatedByEmail}` : ""}`
              : "Nenhuma alteração salva ainda."}
          </div>
          <Button
            size="sm"
            onClick={() => saveNote(draft)}
            disabled={!dirty || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
