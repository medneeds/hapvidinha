import { Stethoscope, UserCog, UsersRound, Baby, Scissors, Bone } from "lucide-react";
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
      case 'obstetra':
        return <Baby className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
      case 'cirurgiao_geral':
        return <Scissors className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
      case 'traumatologista':
        return <Bone className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />;
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
    } else if (responsibility.type === 'obstetra') {
      if (responsibility.portaNames) {
        parts.push(responsibility.portaNames);
      }
      if (responsibility.officeNumber) {
        parts.push(`C${responsibility.officeNumber}`);
      }
      return parts.join(' • ') || 'Obstetra';
    } else if (responsibility.type === 'cirurgiao_geral') {
      if (responsibility.portaNames) {
        parts.push(responsibility.portaNames);
      }
      if (responsibility.officeNumber) {
        parts.push(`C${responsibility.officeNumber}`);
      }
      return parts.join(' • ') || 'Cirurgião Geral';
    } else if (responsibility.type === 'traumatologista') {
      if (responsibility.portaNames) {
        parts.push(responsibility.portaNames);
      }
      if (responsibility.officeNumber) {
        parts.push(`C${responsibility.officeNumber}`);
      }
      return parts.join(' • ') || 'Traumatologista';
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
      case 'obstetra':
        return 'Obstetra';
      case 'cirurgiao_geral':
        return 'Cirurgião Geral';
      case 'traumatologista':
        return 'Traumatologista';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md cursor-pointer transition-all duration-300 hover:scale-105 animate-fade-in backdrop-blur-sm",
        compact ? "text-[8.5px] px-1.5 py-1" : "text-[10px] px-2 py-1.5"
      )}
      style={{
        backgroundColor: `${sectorColor}15`,
        color: sectorColor,
        border: `1.5px solid ${sectorColor}40`,
      }}
      onClick={onClick}
      title={getLabel()}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${sectorColor}30`;
        e.currentTarget.style.borderColor = `${sectorColor}80`;
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${sectorColor}15`;
        e.currentTarget.style.borderColor = `${sectorColor}40`;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div 
        className={cn(
          "rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )}
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
