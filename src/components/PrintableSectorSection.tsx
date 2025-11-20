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
        marginBottom: isCompact ? '10px' : '20px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <div 
        style={{ 
          backgroundColor: bgColor,
          borderLeft: `5px solid ${borderColor}`,
          padding: isCompact ? '8px 10px' : '10px',
          marginBottom: isCompact ? '6px' : '10px',
          pageBreakAfter: 'avoid',
          breakAfter: 'avoid'
        }}
      >
        <h2 style={{ 
          fontSize: isCompact ? '11.5pt' : '12pt', 
          fontWeight: 'bold', 
          textTransform: 'uppercase',
          color: textColor,
          margin: 0,
          letterSpacing: '0.3px'
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
            bedColor={borderColor}
          />
        ))}
      </div>
    </div>
  );
}
