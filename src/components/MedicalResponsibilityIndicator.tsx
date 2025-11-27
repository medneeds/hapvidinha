import { DoorOpen, UserCheck, Users } from "lucide-react";
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
        return <DoorOpen className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'lider':
        return <UserCheck className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'conjunto':
        return <Users className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />;
      default:
        return null;
    }
  };

  const getText = () => {
    const parts: string[] = [];
    
    if (responsibility.type === 'porta' && responsibility.officeNumber) {
      parts.push(`Consultório ${responsibility.officeNumber}`);
    } else if (responsibility.type === 'lider' && responsibility.leaderNames) {
      parts.push(responsibility.leaderNames);
    } else if (responsibility.type === 'conjunto') {
      if (responsibility.officeNumber) {
        parts.push(`Cons. ${responsibility.officeNumber}`);
      }
      if (responsibility.leaderNames) {
        parts.push(responsibility.leaderNames);
      }
    }

    return parts.join(' • ');
  };

  const getLabel = () => {
    switch (responsibility.type) {
      case 'porta':
        return 'Com a Porta';
      case 'lider':
        return 'Líder 100%';
      case 'conjunto':
        return 'Seguimento Conjunto';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-all hover:opacity-80",
        compact ? "text-[10px]" : "text-xs"
      )}
      style={{
        backgroundColor: `${sectorColor}15`,
        color: sectorColor,
        border: `1px solid ${sectorColor}40`,
      }}
      onClick={onClick}
      title={getLabel()}
    >
      {getIcon()}
      <span className="font-medium">
        {getText() || getLabel()}
      </span>
    </div>
  );
};
