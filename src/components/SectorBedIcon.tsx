import { BedDouble } from "lucide-react";

interface SectorBedIconProps {
  sectorIcon: string;
  size?: "sm" | "md";
}

export function SectorBedIcon({ sectorIcon, size = "md" }: SectorBedIconProps) {
  const isMd = size === "md";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${isMd ? "h-8 w-8" : "h-6 w-6"} rounded-lg bg-muted/80 flex items-center justify-center`}>
        <BedDouble className={`${isMd ? "h-4 w-4" : "h-3 w-3"} text-muted-foreground/60`} />
      </div>
      <span className={`absolute ${isMd ? "-top-1 -right-1 text-sm" : "-top-0.5 -right-0.5 text-xs"} leading-none`}>{sectorIcon}</span>
    </div>
  );
}
