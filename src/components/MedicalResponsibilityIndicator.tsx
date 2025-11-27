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
    
    if (responsibility.type === 'porta') {
      if (responsibility.portaNames) {
        parts.push(responsibility.portaNames);
      }
      if (responsibility.officeNumber) {
        parts.push(`C${responsibility.officeNumber}`);
      }
      return parts.join(' • ') || 'Porta';
    } else if (responsibility.type === 'lider' && responsibility.leaderNames) {
      return responsibility.leaderNames;
    } else if (responsibility.type === 'conjunto') {
      if (responsibility.portaNames) {
        parts.push(responsibility.portaNames);
      }
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
        "flex items-center gap-1 rounded-md cursor-pointer transition-all hover:scale-[1.02] animate-fade-in",
        compact ? "text-[8.5px] px-1.5 py-1" : "text-[10px] px-2 py-1.5"
      )}
      style={{
        backgroundColor: `${sectorColor}08`,
        color: sectorColor,
        border: `1px solid ${sectorColor}25`,
      }}
      onClick={onClick}
      title={getLabel()}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )}
        style={{
          backgroundColor: `${sectorColor}18`,
        }}
      >
        {getIcon()}
      </div>
      {getText() && (
        <span className="font-bold truncate leading-none" style={{ fontSize: compact ? '8px' : '9px' }}>
          {getText()}
        </span>
      )}
    </div>
  );
};
