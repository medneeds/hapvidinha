import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface BedPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Show a small pulsing dot inside the badge to indicate live status. */
  badgePulse?: boolean;
  actions?: ReactNode;
  /** Visual accent — defaults to "blue" matching the main MAPA. */
  accent?: "blue" | "violet" | "emerald" | "amber";
}

/**
 * Unified page header for the Bed Management flow (Mapa de Leitos,
 * Painel de Solicitações, Cadastro de Leitos).
 *
 * Mirrors the aesthetic of the main MAPA header (DynamicHeader in
 * src/pages/Index.tsx): full-width fixed bar, dark gradient, white text,
 * embedded SidebarTrigger, accent chip and shadow.
 */
const ACCENTS: Record<string, { gradient: string; shadow: string; chipBg: string }> = {
  blue: {
    gradient: "from-[#011d54] via-[#013ba6] to-[#0256d4]",
    shadow: "shadow-[0_4px_20px_-4px_rgba(1,59,166,0.5)]",
    chipBg: "bg-white/15 border-white/25 text-white",
  },
  violet: {
    gradient: "from-[#2a0a5e] via-[#4c1d95] to-[#6d28d9]",
    shadow: "shadow-[0_4px_20px_-4px_rgba(76,29,149,0.55)]",
    chipBg: "bg-white/15 border-white/25 text-white",
  },
  emerald: {
    gradient: "from-[#022c22] via-[#065f46] to-[#059669]",
    shadow: "shadow-[0_4px_20px_-4px_rgba(6,95,70,0.55)]",
    chipBg: "bg-white/15 border-white/25 text-white",
  },
  amber: {
    gradient: "from-[#451a03] via-[#92400e] to-[#d97706]",
    shadow: "shadow-[0_4px_20px_-4px_rgba(146,64,14,0.55)]",
    chipBg: "bg-white/15 border-white/25 text-white",
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
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const a = ACCENTS[accent];

  return (
    <>
      {/* Fixed full-width gradient bar — mirrors DynamicHeader on the MAPA */}
      <header
        className={cn(
          "border-b border-white/10 backdrop-blur-xl fixed top-0 right-0 z-40",
          "bg-gradient-to-r transition-[left] duration-200 ease-linear",
          a.gradient,
          a.shadow
        )}
        style={{
          left: isMobile
            ? 0
            : state === "collapsed"
            ? "var(--sidebar-width-icon)"
            : "var(--sidebar-width)",
        }}
      >
        {/* Bottom hairline highlight */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="container mx-auto px-3 sm:px-5 py-2.5 sm:py-3 max-w-[1600px]">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <SidebarTrigger
                className={cn(
                  "flex-shrink-0 text-white hover:text-white hover:bg-white/25",
                  "border-white/30 hover:border-white/50",
                  "data-[state=open]:bg-white/25 transition-all duration-200"
                )}
              />

              <div
                className={cn(
                  "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl flex-shrink-0",
                  "bg-white/10 ring-1 ring-white/20 backdrop-blur-sm"
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-2xl font-bold text-white uppercase tracking-tight truncate">
                    {title}
                  </h1>
                  {badge && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm",
                        a.chipBg
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {actions && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer so page content doesn't go under the fixed header */}
      <div aria-hidden className="h-[60px] sm:h-[68px]" />
    </>
  );
}
