import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skull } from "lucide-react";
import { DeathReview } from "@/hooks/useDeathReviews";
import { DeathReviewDialog } from "./DeathReviewDialog";
import { DEATH_REVIEW_ITEMS } from "@/hooks/useDeathReviews";

interface DeathReviewGhostCardProps {
  review: DeathReview;
}

/**
 * Lightweight placeholder card shown in a sector when a bed has a pending
 * post-death review but the patient was already cleared from the list.
 * Displays a diagonal "ÓBITO • REVISAR" ribbon and opens the review dialog
 * on click.
 */
export function DeathReviewGhostCard({ review }: DeathReviewGhostCardProps) {
  const [open, setOpen] = useState(false);

  const completed = DEATH_REVIEW_ITEMS.filter(
    (it) => (review as any)[`${it.key}_done`]
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-slate-300/70",
          "bg-slate-50/80 dark:bg-slate-900/30",
          "p-3 text-left transition-all hover:border-slate-400 hover:shadow-md",
          "print:border-slate-400 print:bg-white"
        )}
      >
        {/* Diagonal ribbon */}
        <div
          className={cn(
            "absolute top-3 -right-10 z-10 rotate-45 px-10 py-1",
            "bg-gradient-to-r from-slate-700 to-slate-900",
            "text-white text-[10px] font-bold tracking-[0.15em] uppercase shadow-md"
          )}
        >
          ÓBITO • REVISAR
        </div>

        <div className="flex items-start gap-3 pr-12">
          <div className="h-9 w-9 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Skull className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              LEITO {review.patient_bed}
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {review.patient_name}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {completed}/{DEATH_REVIEW_ITEMS.length} pendências concluídas •
              clique para revisar
            </div>
          </div>
        </div>
      </button>

      <DeathReviewDialog
        review={review}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
