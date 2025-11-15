import { Patient } from "@/types/patient";
import { ClipboardList } from "lucide-react";
import hapvidaFullLogo from "@/assets/hapvida-notredame-full-logo.png";

interface PrintPatientLayoutProps {
  patient: Patient;
}

const sectorLabels = {
  red: "Sala Vermelha",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
  outside: "Fora das Alas"
};

export function PrintPatientLayout({ patient }: PrintPatientLayoutProps) {
  const containerStyle: React.CSSProperties = {
    padding: '20mm 15mm',
    fontSize: '11pt',
    lineHeight: '1.4',
    backgroundColor: '#ffffff',
    minHeight: '297mm',
    color: '#000000',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      {/* Logo as watermark */}
      <img 
        src={hapvidaFullLogo} 
        alt="Hapvida NotreDame Intermédica" 
        style={{ 
          position: 'absolute',
          top: '10mm',
          right: '10mm',
          height: '50px',
          width: 'auto',
          opacity: 0.4,
          zIndex: 0
        }}
      />
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px', 
        paddingBottom: '8px', 
        borderBottom: '2px solid #d1d5db',
        position: 'relative',
        zIndex: 1
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
          Caso Completo - {patient.bedNumber}
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
          <span>Setor: {sectorLabels[patient.sector]}</span>
        </div>
      </div>

      {/* Patient Information */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>LEITO</div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#000000' }}>{patient.bedNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>IDADE</div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#000000' }}>{patient.age} anos</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>PACIENTE</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#000000', textTransform: 'uppercase' }}>{patient.name}</div>
          </div>
        </div>

        {/* Admission Date */}
        {patient.admissionDate && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>Data de Admissão</div>
            <div style={{ fontSize: '11pt', color: '#374151' }}>{new Date(patient.admissionDate).toLocaleDateString('pt-BR')}</div>
          </div>
        )}

        {/* Diagnoses */}
        {patient.diagnoses.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Hipóteses Diagnósticas (HD)</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {patient.diagnoses.map((diagnosis, idx) => (
                <li key={idx} style={{ fontSize: '11pt', color: '#374151', marginBottom: '4px' }}>{diagnosis}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Medical History */}
        {patient.medicalHistory.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Antecedentes</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {patient.medicalHistory.map((history, idx) => (
                <li key={idx} style={{ fontSize: '11pt', color: '#374151', marginBottom: '4px' }}>{history}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Relevant Exams */}
        {patient.relevantExams.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Exames Relevantes</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {patient.relevantExams.map((exam, idx) => (
                <li key={idx} style={{ fontSize: '11pt', color: '#374151', marginBottom: '4px' }}>{exam}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pendencies */}
        {patient.pendencies.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Atualizações</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {patient.pendencies.map((pendency, idx) => (
                <li key={idx} style={{ fontSize: '11pt', color: '#374151', marginBottom: '4px' }}>{pendency}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Schedule */}
        {patient.schedule.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>Programação</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {patient.schedule.map((item, idx) => (
                <li key={idx} style={{ fontSize: '11pt', color: '#374151', marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Admission History */}
        {patient.admissionHistory && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000', marginBottom: '8px' }}>História Admissional</div>
            <div style={{ 
              fontSize: '11pt', 
              color: '#374151', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {patient.admissionHistory}
            </div>
          </div>
        )}
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
        Urgência e Emergência - Documento gerado automaticamente
      </div>
    </div>
  );
}
