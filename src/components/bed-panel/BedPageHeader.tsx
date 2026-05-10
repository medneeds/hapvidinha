import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BedPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  accent?: "blue" | "violet" | "emerald" | "amber";
}

const ACCENTS = {
  blue: {
    grad: "from-sky-500/15 via-primary/10 to-transparent",
    ring: "from-sky-400/40 via-primary/40 to-transparent",
    iconBg: "bg-sky-500/15 text-sky-600 ring-sky-400/30",
    chip: "bg-sky-500/10 text-sky-700 border-sky-400/30",
  },
  violet: {
    grad: "from-violet-500/15 via-primary/10 to-transparent",
    ring: "from-violet-400/40 via-primary/40 to-transparent",
    iconBg: "bg-violet-500/15 text-violet-600 ring-violet-400/30",
    chip: "bg-violet-500/10 text-violet-700 border-violet-400/30",
  },
  emerald: {
    grad: "from-emerald-500/15 via-primary/10 to-transparent",
    ring: "from-emerald-400/40 via-primary/40 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-600 ring-emerald-400/30",
    chip: "bg-emerald-500/10 text-emerald-700 border-emerald-400/30",
  },
  amber: {
    grad: "from-amber-500/15 via-primary/10 to-transparent",
    ring: "from-amber-400/40 via-primary/40 to-transparent",
    iconBg: "bg-amber-500/15 text-amber-600 ring-amber-400/30",
    chip: "bg-amber-500/10 text-amber-700 border-amber-400/30",
  },
};

export function BedPageHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  accent = "blue",
}: BedPageHeaderProps) {
  const a = ACCENTS[accent];
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60",
        "bg-gradient-to-br shadow-sm",
        a.grad
      )}
    >
      {/* Top accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r", a.ring)} />
      {/* Decorative blob */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl ring-1 shadow-sm flex-shrink-0",
              a.iconBg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase truncate">
                {title}
              </h1>
              {badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    a.chip
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </header>
  );
}
