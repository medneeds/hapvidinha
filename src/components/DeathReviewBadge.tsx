import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeathReviews, DeathReview } from "@/hooks/useDeathReviews";
import { DeathReviewDialog } from "./DeathReviewDialog";
import { Skull, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeathReviewBadgeProps {
  department?: string | null;
}

export function DeathReviewBadge({ department }: DeathReviewBadgeProps) {
  const { reviews, pendingCount } = useDeathReviews(department);
  const [selected, setSelected] = useState<DeathReview | null>(null);

  if (pendingCount === 0) return null;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-slate-400/50 bg-slate-100/80 text-slate-800 hover:bg-slate-200/80 dark:bg-slate-900/40 dark:text-slate-200 print:hidden"
          >
            <Skull className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {pendingCount} ÓBITO{pendingCount > 1 ? "S" : ""} AGUARDANDO REVISÃO
            </span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {pendingCount}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="end">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-semibold">Revisões pós-óbito</div>
            <div className="text-xs text-muted-foreground">
              Confirme as pendências de cada leito.
            </div>
          </div>
          <ScrollArea className="max-h-[320px]">
            <div className="divide-y">
              {reviews.map((r) => {
                const completed = [
                  r.death_certificate_done,
                  r.family_notified_done,
                  r.belongings_removal_done,
                  r.chart_finalized_done,
                ].filter(Boolean).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.patient_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Leito {r.patient_bed}
                        {r.patient_sector ? ` • ${r.patient_sector}` : ""}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {format(new Date(r.created_at), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}{" "}
                        • {completed}/4 concluídas
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <DeathReviewDialog
        review={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}
