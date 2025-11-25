import { Patient } from "@/types/patient";
import { formatAgeDisplay } from "@/utils/ageDisplay";
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

const sectorColors = {
  red: {
    primary: '#ef4444',
    light: '#fee2e2',
    border: '#fca5a5',
    text: '#7f1d1d',
    dark: '#991b1b'
  },
  yellow: {
    primary: '#eab308',
    light: '#fef9c3',
    border: '#fde047',
    text: '#713f12',
    dark: '#854d0e'
  },
  blue: {
    primary: '#3b82f6',
    light: '#dbeafe',
    border: '#93c5fd',
    text: '#1e3a8a',
    dark: '#1e40af'
  },
  outside: {
    primary: '#6b7280',
    light: '#f3f4f6',
    border: '#d1d5db',
    text: '#1f2937',
    dark: '#374151'
  }
};

export function PrintPatientLayout({ patient }: PrintPatientLayoutProps) {
  const colors = sectorColors[patient.sector] || sectorColors.outside;
  
  const containerStyle: React.CSSProperties = {
    padding: '15mm 12mm',
    paddingTop: '20mm',
    fontSize: '10.5pt',
    lineHeight: '1.5',
    backgroundColor: '#ffffff',
    minHeight: '297mm',
    width: '210mm',
    color: '#000000',
    position: 'relative'
  };

  const pageStyle = `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Mobile Safari specific fixes */
      @supports (-webkit-touch-callout: none) {
        * {
          -webkit-print-color-adjust: exact !important;
        }
      }
    }
  `;

  return (
    <>
      <style>{pageStyle}</style>
      <div style={containerStyle}>
        {/* Logo as watermark */}
        <img 
          src={hapvidaFullLogo} 
          alt="Hapvida NotreDame Intermédica" 
          style={{ 
            position: 'absolute',
            top: '8mm',
            right: '12mm',
            height: '38px',
            width: 'auto',
            opacity: 0.3,
            zIndex: 0
          }}
        />
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginBottom: '14px', 
          paddingBottom: '10px', 
          borderBottom: '2px solid #d1d5db',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            height: '36px', 
            width: '36px', 
            backgroundColor: colors.primary,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ClipboardList style={{ height: '18px', width: '18px', color: '#ffffff' }} />
          </div>
          <h1 style={{ 
            fontSize: '18pt', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            margin: 0,
            color: '#000000',
            letterSpacing: '0.5px'
          }}>
            Caso Completo - Leito {patient.bedNumber}
          </h1>
        </div>
        
        {/* Metadata */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          fontSize: '9.5pt', 
          color: '#4b5563', 
          marginBottom: '16px', 
          paddingBottom: '10px', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          padding: '10px',
          borderRadius: '6px'
        }}>
          <div>
            <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
          </div>
          <div>
            <strong>Hora:</strong> {new Date().toLocaleTimeString('pt-BR')}
          </div>
          <div>
            <strong>Setor:</strong> {sectorLabels[patient.sector]}
          </div>
        </div>

        {/* Patient Information Card */}
        <div style={{ 
          backgroundColor: colors.light, 
          padding: '14px', 
          borderRadius: '8px',
          marginBottom: '18px',
          border: `2px solid ${colors.border}`
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr 1fr', 
            gap: '16px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '9pt', color: colors.dark, marginBottom: '4px', fontWeight: '600' }}>LEITO</div>
              <div style={{ fontSize: '16pt', fontWeight: 'bold', color: colors.text }}>{patient.bedNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '9pt', color: colors.dark, marginBottom: '4px', fontWeight: '600' }}>PACIENTE</div>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: colors.text, textTransform: 'uppercase' }}>{patient.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '9pt', color: colors.dark, marginBottom: '4px', fontWeight: '600' }}>IDADE</div>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', color: colors.text }}>{formatAgeDisplay(patient.age)}</div>
            </div>
          </div>
        </div>

        {/* Admission Date */}
        {patient.admissionDate && (
          <div style={{ 
            marginBottom: '16px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '8px',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#000000' }}>Data de Admissão:</div>
            <div style={{ fontSize: '10.5pt', color: '#374151' }}>{new Date(patient.admissionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        )}

        {/* Clinical Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          {/* Diagnoses */}
          {patient.diagnoses.length > 0 && (
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #fde047'
            }}>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#92400e', marginBottom: '8px', textTransform: 'uppercase' }}>
                Hipóteses Diagnósticas
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                {patient.diagnoses.map((diagnosis, idx) => (
                  <li key={idx} style={{ fontSize: '10pt', color: '#451a03', marginBottom: '3px', lineHeight: '1.4' }}>{diagnosis}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical History */}
          {patient.medicalHistory.length > 0 && (
            <div style={{ 
              backgroundColor: '#fce7f3', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #fbcfe8'
            }}>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#831843', marginBottom: '8px', textTransform: 'uppercase' }}>
                Antecedentes
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
                {patient.medicalHistory.map((history, idx) => (
                  <li key={idx} style={{ fontSize: '10pt', color: '#500724', marginBottom: '3px', lineHeight: '1.4' }}>{history}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Relevant Exams */}
        {patient.relevantExams.length > 0 && (
          <div style={{ 
            marginBottom: '16px',
            backgroundColor: '#dbeafe',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #93c5fd'
          }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px', textTransform: 'uppercase' }}>
              Exames Complementares
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'square' }}>
              {patient.relevantExams.map((exam, idx) => (
                <li key={idx} style={{ fontSize: '10pt', color: '#1e3a8a', marginBottom: '3px', lineHeight: '1.4' }}>{exam}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pendencies */}
        {patient.pendencies.length > 0 && (
          <div style={{ 
            marginBottom: '16px',
            backgroundColor: '#dcfce7',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #86efac'
          }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#166534', marginBottom: '8px', textTransform: 'uppercase' }}>
              Programações / Pendências
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'decimal' }}>
              {patient.pendencies.map((pendency, idx) => {
                const isHighlighted = patient.highlightedPendencies?.includes(idx);
                return (
                  <li 
                    key={idx} 
                    style={{ 
                      fontSize: '10pt', 
                      color: '#14532d', 
                      marginBottom: '3px', 
                      lineHeight: '1.4',
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      backgroundColor: isHighlighted ? '#fbbf24' : 'transparent',
                      padding: isHighlighted ? '3px 6px' : '0',
                      borderRadius: isHighlighted ? '3px' : '0'
                    }}
                  >
                    {pendency}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Admission History */}
        {patient.admissionHistory && (
          <div style={{ 
            marginBottom: '16px',
            backgroundColor: '#f5f5f4',
            padding: '14px',
            borderRadius: '6px',
            border: '1px solid #d6d3d1'
          }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1c1917', marginBottom: '10px', textTransform: 'uppercase' }}>
              História Admissional / Anamnese
            </div>
            <div style={{ 
              fontSize: '10pt', 
              color: '#292524', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              textAlign: 'justify'
            }}>
              {patient.admissionHistory}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          fontSize: '9pt', 
          textAlign: 'center', 
          color: '#6b7280', 
          marginTop: '20px', 
          paddingTop: '12px', 
          borderTop: '1px solid #e5e7eb' 
        }}>
          Urgência e Emergência - Documento gerado automaticamente • {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </>
  );
}
