import { Patient } from "@/types/patient";

interface PrintablePatientCardProps {
  patient: Patient;
  mode: 'compact' | 'detailed';
}

export function PrintablePatientCard({ patient, mode }: PrintablePatientCardProps) {
  if (!patient.name) return null;
  
  return (
    <div 
      style={{ 
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '12px',
        backgroundColor: '#ffffff',
        fontSize: '10pt',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        opacity: 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000000' }}>
          {patient.bedNumber} - {patient.name}
        </span>
        {patient.age > 0 && (
          <span style={{ color: '#4b5563', fontSize: '11pt' }}>{patient.age}a</span>
        )}
      </div>
      
      {patient.diagnoses.length > 0 && (
        <div style={{ color: '#374151', marginBottom: '8px' }}>
          <strong>Diagnóstico:</strong> {patient.diagnoses.join(', ')}
        </div>
      )}
      
      {mode === 'detailed' && (
        <>
          {patient.medicalHistory.length > 0 && (
            <div style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>História:</strong> {patient.medicalHistory.join(', ')}
            </div>
          )}
          {patient.relevantExams.length > 0 && (
            <div style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>Exames:</strong> {patient.relevantExams.join(', ')}
            </div>
          )}
          {patient.pendencies.length > 0 && (
            <div style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>Pendências:</strong> {patient.pendencies.join(', ')}
            </div>
          )}
          {patient.schedule.length > 0 && (
            <div style={{ color: '#374151', marginBottom: '8px' }}>
              <strong>Agenda:</strong> {patient.schedule.join(', ')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
