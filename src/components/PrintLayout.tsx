import { Patient } from "@/types/patient";
import { ClipboardList } from "lucide-react";

interface PrintLayoutProps {
  redPatients: Patient[];
  yellowPatients: Patient[];
  bluePatients: Patient[];
  mode: 'compact' | 'detailed';
  isPreview?: boolean;
}

export function PrintLayout({ 
  redPatients, 
  yellowPatients, 
  bluePatients, 
  mode,
  isPreview = false 
}: PrintLayoutProps) {
  const renderPatientCard = (patient: Patient) => {
    if (!patient.name) return null;
    
    return (
      <div 
        key={patient.id} 
        style={{ 
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '12px',
          backgroundColor: '#ffffff',
          fontSize: '10pt',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
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
  };

  const renderSector = (
    patients: Patient[], 
    sectorName: string, 
    bgColor: string,
    borderColor: string,
    textColor: string
  ) => {
    if (patients.length === 0) return null;
    
    return (
      <div 
        style={{ 
          marginBottom: '24px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div 
          style={{ 
            backgroundColor: bgColor,
            borderLeft: `4px solid ${borderColor}`,
            padding: '12px',
            marginBottom: '12px',
            pageBreakAfter: 'avoid',
            breakAfter: 'avoid'
          }}
        >
          <h2 style={{ 
            fontSize: '12pt', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            color: textColor,
            margin: 0
          }}>
            {sectorName} ({patients.length})
          </h2>
        </div>
        <div>
          {patients.map(renderPatientCard)}
        </div>
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: isPreview ? '210mm' : 'none',
    margin: isPreview ? '0 auto' : '0',
    padding: '20mm 15mm',
    fontSize: '11pt',
    lineHeight: '1.4',
    backgroundColor: '#ffffff',
    minHeight: '297mm',
    boxShadow: isPreview ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px', 
        paddingBottom: '8px', 
        borderBottom: '2px solid #d1d5db' 
      }}>
        <div style={{ 
          height: '32px', 
          width: '32px', 
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ClipboardList style={{ height: '16px', width: '16px', color: '#ffffff' }} />
        </div>
        <h1 style={{ 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          textTransform: 'uppercase',
          margin: 0,
          color: '#000000'
        }}>
          Mapa de Pacientes
        </h1>
      </div>
      
      {/* Metadata */}
      <div style={{ 
        fontSize: '10pt', 
        color: '#4b5563', 
        marginBottom: '16px', 
        paddingBottom: '8px', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
          <span>Hora: {new Date().toLocaleTimeString('pt-BR')}</span>
          <span>Modo: {mode === 'compact' ? 'Retraído' : 'Detalhado'}</span>
        </div>
      </div>
      
      {/* Sectors */}
      <div>
        {renderSector(redPatients, 'Ala Vermelha', '#fef2f2', '#ef4444', '#b91c1c')}
        {renderSector(yellowPatients, 'Ala Amarela', '#fefce8', '#eab308', '#a16207')}
        {renderSector(bluePatients, 'Ala Azul', '#eff6ff', '#3b82f6', '#1d4ed8')}
      </div>
      
      {/* Footer */}
      <div style={{ 
        fontSize: '10pt', 
        textAlign: 'center', 
        color: '#6b7280', 
        marginTop: '24px', 
        paddingTop: '16px', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        Sistema de Gestão Hospitalar - Documento gerado automaticamente
      </div>
    </div>
  );
}
