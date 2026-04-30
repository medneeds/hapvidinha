import { useEffect, useRef, useState, ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skull, CheckCircle2, Clock, Sparkles } from "lucide-react";
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
import { usePalliativeFarewell } from "@/contexts/PalliativeFarewellContext";

type DeathReviewDoneKey = `${DeathReviewItem}_done`;
type DeathReviewAtKey = `${DeathReviewItem}_at`;
type DeathReviewByKey = `${DeathReviewItem}_by`;

interface DeathReviewDialogProps {
  review: DeathReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Optional element used to anchor the popover. If omitted, an invisible
   * anchor is rendered at the current cursor position via the parent's
   * own trigger handling. Most callers should pass a trigger.
   */
  trigger?: ReactNode;
}

export function DeathReviewDialog({
  review,
  open,
  onOpenChange,
  trigger,
}: DeathReviewDialogProps) {
  const { toggleItem, completeReview } = useDeathReviews(review?.department);
  const { triggerFarewell } = usePalliativeFarewell();
  const [savingItem, setSavingItem] = useState<DeathReviewItem | null>(null);
  const [localReview, setLocalReview] = useState<DeathReview | null>(review);
  const localReviewRef = useRef<DeathReview | null>(review);
  const [confirmFarewellOpen, setConfirmFarewellOpen] = useState(false);
  const farewellTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalReview(review);
    localReviewRef.current = review;
    if (!review) {
      setConfirmFarewellOpen(false);
    }
  }, [review]);

  useEffect(() => {
    if (!localReview) return;
    const allDone = DEATH_REVIEW_ITEMS.every(
      (it) => localReview[`${it.key}_done` as DeathReviewDoneKey]
    );
    if (allDone && farewellTriggeredRef.current !== localReview.id) {
      setConfirmFarewellOpen(true);
    }
  }, [localReview]);

  const handleToggle = async (item: DeathReviewItem, currentlyDone: boolean) => {
    const currentReview = localReviewRef.current;
    if (!currentReview || savingItem) return;
    setSavingItem(item);
    const done = !currentlyDone;
    const now = new Date().toISOString();
    const optimisticReview = {
      ...currentReview,
      [`${item}_done`]: done,
      [`${item}_at`]: done ? now : null,
      [`${item}_by`]: done ? "SALVANDO..." : null,
    } as DeathReview;
    localReviewRef.current = optimisticReview;
    setLocalReview(optimisticReview);

    const { data: userData } = await supabase.auth.getUser();
    const byName =
      (userData.user?.user_metadata?.full_name as string) ||
      (userData.user?.email as string) ||
      "USUÁRIO";
    try {
      const persistedReview = await toggleItem(
        currentReview,
        item,
        done,
        byName.toUpperCase()
      );
      if (persistedReview) {
        localReviewRef.current = persistedReview;
        setLocalReview(persistedReview);
      }
    } catch (error) {
      localReviewRef.current = currentReview;
      setLocalReview(currentReview);
      console.error("Failed to toggle death review item", error);
    } finally {
      setSavingItem(null);
    }
  };

  if (!localReview) {
    // Still render the trigger if provided so the layout is preserved.
    return trigger ? <>{trigger}</> : null;
  }

  const completedCount = DEATH_REVIEW_ITEMS.filter(
    (it) => localReview[`${it.key}_done` as DeathReviewDoneKey]
  ).length;

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-[380px] max-w-[92vw] p-0 overflow-hidden border-slate-300 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-slate-50/80 dark:bg-slate-900/40 p-3">
            <div className="h-9 w-9 rounded-full bg-slate-900/10 flex items-center justify-center">
              <Skull className="h-4 w-4 text-slate-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight">
                REVISÃO PÓS-ÓBITO
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {localReview.patient_name} • Leito {localReview.patient_bed}
              </div>
            </div>
          </div>

          {/* Sub info */}
          <div className="px-3 pt-2 text-[11px] text-muted-foreground">
            Óbito registrado{" "}
            {format(new Date(localReview.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </div>

          {/* Pendências */}
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-muted-foreground">
              <span>PENDÊNCIAS</span>
              <span>
                {completedCount}/{DEATH_REVIEW_ITEMS.length} concluídas
              </span>
            </div>
            <div className="space-y-1.5">
              {DEATH_REVIEW_ITEMS.map((item) => {
                const done =
                  localReview[`${item.key}_done` as DeathReviewDoneKey];
                const at = localReview[`${item.key}_at` as DeathReviewAtKey];
                const by = localReview[`${item.key}_by` as DeathReviewByKey];
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={savingItem === item.key}
                    onClick={() => handleToggle(item.key, done)}
                    className={cn(
                      "w-full text-left rounded-md border p-2 transition-colors",
                      "hover:bg-accent/40",
                      done
                        ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={done}
                        className="mt-0.5 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-[12px] font-medium leading-tight",
                            done && "text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {item.label}
                        </div>
                        {done && at ? (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            {by || "—"} •{" "}
                            {format(new Date(at), "dd/MM HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        ) : (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
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
            <div className="mx-3 mb-3 rounded-md border border-emerald-300 bg-emerald-50 p-2 text-[11px] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              ✅ Todas as pendências concluídas. Confirme abaixo para desalocar
              o leito.
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            {completedCount === DEATH_REVIEW_ITEMS.length && (
              <Button
                size="sm"
                onClick={() => setConfirmFarewellOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Desalocar
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={confirmFarewellOpen}
        onOpenChange={setConfirmFarewellOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              CONFIRMAR DESALOCAÇÃO
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Todas as pendências de{" "}
                <strong>{localReview.patient_name}</strong> foram concluídas.
              </span>
              <span className="block">
                Deseja{" "}
                <strong>
                  desalocar o leito {localReview.patient_bed}
                </strong>{" "}
                e iniciar a animação de despedida (borboleta)?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!localReview) return;
                farewellTriggeredRef.current = localReview.id;
                setConfirmFarewellOpen(false);
                onOpenChange(false);
                setTimeout(() => {
                  try {
                    triggerFarewell(localReview.patient_name);
                  } catch (e) {
                    console.error(
                      "[FAREWELL] trigger from review failed",
                      e
                    );
                  }
                }, 120);
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Sim, desalocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
