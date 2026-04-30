import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeathReviews } from "@/hooks/useDeathReviews";
import { DeathReviewDialog } from "./DeathReviewDialog";

interface DeathReviewRibbonProps {
  bed: string;
  department: string;
  className?: string;
}

/**
 * Diagonal "ÓBITO • REVISAR" ribbon shown on the empty bed card whenever
 * there is a pending post-death review for that bed. Clicking opens a
 * popover anchored to the ribbon (in-place, within the patient's section).
 */
export function DeathReviewRibbon({
  bed,
  department,
  className,
}: DeathReviewRibbonProps) {
  const { getReviewForBed } = useDeathReviews(department);
  const review = getReviewForBed(bed, department);
  const [open, setOpen] = useState(false);

  if (!review) return null;

  return (
    <DeathReviewDialog
      review={review}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={cn(
            "absolute top-3 -right-10 z-20 rotate-45 px-10 py-1",
            "bg-gradient-to-r from-slate-700 to-slate-900",
            "text-white text-[10px] font-bold tracking-[0.15em] uppercase",
            "shadow-md cursor-pointer transition-transform hover:scale-105",
            "print:from-slate-600 print:to-slate-800",
            className
          )}
          title="Revisar pendências do óbito"
          aria-label="Revisar pendências do óbito"
        >
          ÓBITO • REVISAR
        </button>
      }
    />
  );
}
