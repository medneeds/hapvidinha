import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ListChecks, Eraser } from "lucide-react";
import { useUnitChecklist } from "@/hooks/useUnitChecklist";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function QuickChecklistDialog({ open, onOpenChange }: Props) {
  const { items, addItem, toggleItem, removeItem, clearCompleted, isLoading } = useUnitChecklist();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addItem(text);
    setText("");
  };

  const pending = items.filter((i) => !i.completed).length;
  const done = items.filter((i) => i.completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Checklist da Unidade
          </DialogTitle>
          <DialogDescription>
            Lista compartilhada da equipe — visível a todos os plantonistas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Novo item..."
            className="uppercase"
          />
          <Button onClick={submit} size="icon" disabled={!text.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-2">
            <Badge variant="secondary">{pending} pendente(s)</Badge>
            <Badge variant="outline">{done} concluído(s)</Badge>
          </div>
          {done > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearCompleted()}
              className="h-7 gap-1 text-xs"
            >
              <Eraser className="h-3.5 w-3.5" /> Limpar concluídos
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px] pr-3 border rounded-md">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum item ainda. Adicione o primeiro acima.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-2.5 group">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item)}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        item.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {item.text}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.completed && item.completed_by_email
                        ? `✓ ${item.completed_by_email}`
                        : item.created_by_email
                          ? `+ ${item.created_by_email}`
                          : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
