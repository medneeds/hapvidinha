import { Patient } from "@/types/patient";
import { PrintablePatientCard } from "./PrintablePatientCard";

interface PrintableSectorSectionProps {
  patients: Patient[];
  sectorName: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  mode: 'compact' | 'detailed';
}

export function PrintableSectorSection({
  patients,
  sectorName,
  bgColor,
  borderColor,
  textColor,
  mode
}: PrintableSectorSectionProps) {
  if (patients.length === 0) return null;
  
  const isCompact = mode === 'compact';
  
  return (
    <div 
      style={{ 
        marginBottom: isCompact ? '16px' : '24px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <div 
        style={{ 
          backgroundColor: bgColor,
          borderLeft: `4px solid ${borderColor}`,
          padding: isCompact ? '8px' : '12px',
          marginBottom: isCompact ? '8px' : '12px',
          pageBreakAfter: 'avoid',
          breakAfter: 'avoid'
        }}
      >
        <h2 style={{ 
          fontSize: isCompact ? '11pt' : '12pt', 
          fontWeight: 'bold', 
          textTransform: 'uppercase',
          color: textColor,
          margin: 0
        }}>
          {sectorName} ({patients.length})
        </h2>
      </div>
      <div>
        {patients.map(patient => (
          <PrintablePatientCard 
            key={patient.id} 
            patient={patient} 
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}
