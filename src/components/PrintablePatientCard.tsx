import { Patient } from "@/types/patient";

interface PrintablePatientCardProps {
  patient: Patient;
  mode: 'compact' | 'detailed';
}

export function PrintablePatientCard({ patient, mode }: PrintablePatientCardProps) {
  if (!patient.name) return null;
  
  const isCompact = mode === 'compact';
  
  // Modo compacto idêntico ao painel visual
  if (isCompact) {
    return (
      <div 
        style={{ 
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '6px',
          marginBottom: '6px',
          backgroundColor: '#ffffff',
          fontSize: '8pt',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '60px 1fr 1fr 1fr 2fr',
          gap: '8px',
          alignItems: 'start'
        }}>
          {/* Leito */}
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase' }}>Leito</div>
            <div style={{ 
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '8pt',
              fontWeight: 'bold',
              display: 'inline-block'
            }}>
              {patient.bedNumber}
            </div>
          </div>

          {/* Paciente */}
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase' }}>Paciente</div>
            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#000000', marginBottom: '1px' }}>
              {patient.name || 'SEM NOME'}
            </div>
            <div style={{ fontSize: '7pt', color: '#6b7280' }}>
              {patient.age ? `${patient.age} ANOS` : 'IDADE NÃO INFORMADA'}
            </div>
          </div>

          {/* Hipóteses / Diagnósticos */}
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase' }}>
              Hipóteses / Diagnósticos
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {patient.diagnoses.length > 0 ? (
                patient.diagnoses.map((diagnosis, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      backgroundColor: '#f3f4f6',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '7pt',
                      color: '#374151'
                    }}
                  >
                    {diagnosis}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '7pt', color: '#9ca3af' }}>-</span>
              )}
            </div>
          </div>

          {/* Exames Complementares */}
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase' }}>
              Exames Complementares
            </div>
            <div style={{ fontSize: '7pt', color: '#374151', lineHeight: '1.4' }}>
              {patient.relevantExams.length > 0 ? (
                patient.relevantExams.map((exam, idx) => (
                  <div key={idx} style={{ marginBottom: '1px' }}>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>{idx + 1}.</span> {exam}
                  </div>
                ))
              ) : (
                <span style={{ color: '#9ca3af' }}>-</span>
              )}
            </div>
          </div>

          {/* Programações / Pendências */}
          <div>
            <div style={{ fontSize: '7pt', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase' }}>
              Programações / Pendências
            </div>
            <div style={{ fontSize: '7pt', color: '#374151', lineHeight: '1.4' }}>
              {patient.pendencies.length > 0 ? (
                patient.pendencies.map((pendency, idx) => (
                  <div key={idx} style={{ marginBottom: '1px' }}>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>{idx + 1}.</span> {pendency}
                  </div>
                ))
              ) : (
                <span style={{ color: '#9ca3af' }}>-</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Modo detalhado mantém formato atual
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
        <div style={{ color: '#374151', marginBottom: '8px', fontSize: '10pt' }}>
          <strong>Hipóteses / Diagnósticos:</strong> {patient.diagnoses.join(', ')}
        </div>
      )}
      
      {patient.pendencies.length > 0 && (
        <div style={{ color: '#374151', marginBottom: '8px', fontSize: '10pt' }}>
          <strong>Programações / Pendências:</strong> {patient.pendencies.join(', ')}
        </div>
      )}
      
      {patient.medicalHistory.length > 0 && (
        <div style={{ color: '#374151', marginBottom: '8px' }}>
          <strong>Antecedentes:</strong> {patient.medicalHistory.join(', ')}
        </div>
      )}
      {patient.relevantExams.length > 0 && (
        <div style={{ color: '#374151', marginBottom: '8px' }}>
          <strong>Exames:</strong> {patient.relevantExams.join(', ')}
        </div>
      )}
      {patient.schedule.length > 0 && (
        <div style={{ color: '#374151', marginBottom: '8px' }}>
          <strong>Agenda:</strong> {patient.schedule.join(', ')}
        </div>
      )}
    </div>
  );
}
