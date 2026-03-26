import { Stethoscope, UserCog, UsersRound, Baby, Bone, Scissors, Plus } from "lucide-react";
import { MedicalResponsibility, MedicalResponsibilityType } from "@/types/patient";
import { cn } from "@/lib/utils";

interface MedicalResponsibilityIndicatorProps {
  responsibility?: MedicalResponsibility;
  sectorColor: string;
  onClick?: () => void;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  porta: Stethoscope,
  lider: UserCog,
  conjunto: UsersRound,
  obstetra: Baby,
  cirurgiao_geral: Scissors,
  traumatologista: Bone,
};

const LABEL_MAP: Record<string, string> = {
  porta: 'PORTA',
  lider: 'LÍDER',
  conjunto: 'CONJUNTO',
  obstetra: 'OBS',
  cirurgiao_geral: 'CIRURG.',
  traumatologista: 'ORTOP',
};

const FULL_LABEL_MAP: Record<string, string> = {
  porta: 'Médico Porta',
  lider: 'Médico Líder',
  conjunto: 'Seguimento Conjunto',
  obstetra: 'Obstetra',
  cirurgiao_geral: 'Cirurgião Geral',
  traumatologista: 'Traumatologista',
};

function SinglePill({
  type,
  sectorColor,
  compact,
  officeNumber,
  onClick,
  title,
}: {
  type: MedicalResponsibilityType;
  sectorColor: string;
  compact?: boolean;
  officeNumber?: string;
  onClick?: () => void;
  title?: string;
}) {
  if (!type) return null;
  const Icon = ICON_MAP[type];
  const abbr = LABEL_MAP[type] || '';

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md cursor-pointer transition-all duration-300 hover:scale-105 animate-fade-in backdrop-blur-sm",
        compact ? "text-[8px] px-1.5 py-1" : "text-[9px] px-2 py-1.5"
      )}
      style={{
        backgroundColor: `${sectorColor}15`,
        color: sectorColor,
        border: `1.5px solid ${sectorColor}40`,
      }}
      onClick={onClick}
      title={title || FULL_LABEL_MAP[type] || ''}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${sectorColor}30`;
        e.currentTarget.style.borderColor = `${sectorColor}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${sectorColor}15`;
        e.currentTarget.style.borderColor = `${sectorColor}40`;
      }}
    >
      <span className="font-medium leading-none whitespace-nowrap" style={{ fontSize: compact ? '7px' : '8px', color: sectorColor }}>
        {abbr}
      </span>
      {officeNumber && (
        <span className="font-normal leading-none whitespace-nowrap" style={{ fontSize: compact ? '6.5px' : '7.5px', color: sectorColor }}>
          C{officeNumber}
        </span>
      )}
    </div>
  );
}

export const MedicalResponsibilityIndicator = ({
  responsibility,
  sectorColor,
  onClick,
  compact = false,
}: MedicalResponsibilityIndicatorProps) => {
  if (!responsibility?.type) return null;

  // For "conjunto", render stacked pills for each involved specialty separated by "+"
  if (responsibility.type === 'conjunto') {
    const involvedTypes: MedicalResponsibilityType[] = [];
    
    // Add the main specialties from conjuntoWith
    if (responsibility.conjuntoWith && responsibility.conjuntoWith.length > 0) {
      responsibility.conjuntoWith.forEach(s => {
        involvedTypes.push(s as MedicalResponsibilityType);
      });
    }

    // If no specialties defined, show a single conjunto pill
    if (involvedTypes.length === 0) {
      return (
        <SinglePill
          type="conjunto"
          sectorColor={sectorColor}
          compact={compact}
          officeNumber={responsibility.officeNumber}
          onClick={onClick}
          title="Seguimento Conjunto"
        />
      );
    }

    return (
      <div className="flex flex-col items-center gap-0" onClick={onClick}>
        {involvedTypes.map((specType, idx) => (
          <div key={specType} className="flex flex-col items-center">
            {idx > 0 && (
              <Plus
                className={cn(compact ? "h-2 w-2" : "h-2.5 w-2.5", "my-[-1px]")}
                style={{ color: sectorColor }}
                strokeWidth={3}
              />
            )}
            <SinglePill
              type={specType}
              sectorColor={sectorColor}
              compact={compact}
              officeNumber={idx === 0 ? responsibility.officeNumber : undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  // For all other types, render a single pill
  return (
    <SinglePill
      type={responsibility.type}
      sectorColor={sectorColor}
      compact={compact}
      officeNumber={responsibility.officeNumber}
      onClick={onClick}
      title={FULL_LABEL_MAP[responsibility.type]}
    />
  );
};
