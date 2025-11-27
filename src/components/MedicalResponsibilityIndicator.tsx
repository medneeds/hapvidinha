import { Stethoscope, UserCog, UsersRound } from "lucide-react";
import { MedicalResponsibility } from "@/types/patient";
import { cn } from "@/lib/utils";

interface MedicalResponsibilityIndicatorProps {
  responsibility?: MedicalResponsibility;
  sectorColor: string;
  onClick?: () => void;
  compact?: boolean;
}

export const MedicalResponsibilityIndicator = ({
  responsibility,
  sectorColor,
  onClick,
  compact = false,
}: MedicalResponsibilityIndicatorProps) => {
  if (!responsibility?.type) return null;

  const getIcon = () => {
    switch (responsibility.type) {
      case 'porta':
        return <Stethoscope className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
      case 'lider':
        return <UserCog className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
      case 'conjunto':
        return <UsersRound className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
      default:
        return null;
    }
  };

  const getText = () => {
    const parts: string[] = [];
    
    if (responsibility.type === 'porta' && responsibility.officeNumber) {
      return `Cons. ${responsibility.officeNumber}`;
    } else if (responsibility.type === 'lider' && responsibility.leaderNames) {
      return responsibility.leaderNames;
    } else if (responsibility.type === 'conjunto') {
      if (responsibility.officeNumber) {
        parts.push(`C${responsibility.officeNumber}`);
      }
      if (responsibility.leaderNames) {
        parts.push(responsibility.leaderNames);
      }
      return parts.join(' • ');
    }

    return '';
  };

  const getLabel = () => {
    switch (responsibility.type) {
      case 'porta':
        return 'Médico Porta';
      case 'lider':
        return 'Médico Líder';
      case 'conjunto':
        return 'Seguimento Conjunto';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md cursor-pointer transition-all hover:shadow-sm group",
        compact ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2.5 py-1.5"
      )}
      style={{
        backgroundColor: `${sectorColor}10`,
        color: sectorColor,
        border: `1.5px solid ${sectorColor}35`,
      }}
      onClick={onClick}
      title={getLabel()}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center flex-shrink-0",
          compact ? "h-4 w-4" : "h-5 w-5"
        )}
        style={{
          backgroundColor: `${sectorColor}20`,
        }}
      >
        {getIcon()}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-bold text-[8px] uppercase tracking-wide opacity-70">
          {responsibility.type === 'porta' ? 'Porta' : responsibility.type === 'lider' ? 'Líder' : 'Conjunto'}
        </span>
        {getText() && (
          <span className="font-semibold truncate leading-tight">
            {getText()}
          </span>
        )}
      </div>
    </div>
  );
};
