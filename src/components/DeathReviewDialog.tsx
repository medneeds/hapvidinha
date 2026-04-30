import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skull, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DeathReview,
  DEATH_REVIEW_ITEMS,
  useDeathReviews,
  DeathReviewItem,
} from "@/hooks/useDeathReviews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DeathReviewDialogProps {
  review: DeathReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeathReviewDialog({
  review,
  open,
  onOpenChange,
}: DeathReviewDialogProps) {
  const { toggleItem } = useDeathReviews(review?.department);
  const [savingItem, setSavingItem] = useState<DeathReviewItem | null>(null);
  const [notes, setNotes] = useState("");

  if (!review) return null;

  const handleToggle = async (item: DeathReviewItem, currentlyDone: boolean) => {
    setSavingItem(item);
    const { data: userData } = await supabase.auth.getUser();
    const byName =
      (userData.user?.user_metadata?.full_name as string) ||
      (userData.user?.email as string) ||
      "USUÁRIO";
    await toggleItem(review, item, !currentlyDone, byName.toUpperCase());
    setSavingItem(null);
  };

  const completedCount = DEATH_REVIEW_ITEMS.filter(
    (it) => (review as any)[`${it.key}_done`]
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-900/10 flex items-center justify-center">
              <Skull className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <DialogTitle className="text-lg">REVISÃO PÓS-ÓBITO</DialogTitle>
              <DialogDescription className="text-xs">
                Confirme as pendências para encerrar a baixa do leito.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="font-medium">{review.patient_name}</div>
          <div className="text-xs text-muted-foreground">
            Leito {review.patient_bed}
            {review.patient_sector ? ` • ${review.patient_sector}` : ""} •{" "}
            Óbito registrado{" "}
            {format(new Date(review.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </div>
        </div>

        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>PENDÊNCIAS</span>
            <span>
              {completedCount}/{DEATH_REVIEW_ITEMS.length} concluídas
            </span>
          </div>
          <div className="space-y-2">
            {DEATH_REVIEW_ITEMS.map((item) => {
              const done = (review as any)[`${item.key}_done`] as boolean;
              const at = (review as any)[`${item.key}_at`] as string | null;
              const by = (review as any)[`${item.key}_by`] as string | null;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={savingItem === item.key}
                  onClick={() => handleToggle(item.key, done)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    "hover:bg-accent/40",
                    done
                      ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={done}
                      className="mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          done && "text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        {item.label}
                      </div>
                      {done && at && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          {by || "—"} •{" "}
                          {format(new Date(at), "dd/MM HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      )}
                      {!done && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          PENDENTE
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {completedCount === DEATH_REVIEW_ITEMS.length && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            ✅ Todas as pendências foram concluídas. O indicador será removido
            automaticamente.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
