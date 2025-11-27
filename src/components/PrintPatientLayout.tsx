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
    padding: '12mm 10mm',
    paddingTop: '14mm',
    fontSize: '9pt',
    lineHeight: '1.4',
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

  const SectionCard = ({ title, children, bgColor, borderColor, textColor }: { 
    title: string; 
    children: React.ReactNode; 
    bgColor: string; 
    borderColor: string; 
    textColor: string; 
  }) => (
    <div style={{ 
      marginBottom: '10px',
      backgroundColor: bgColor,
      padding: '10px 12px',
      borderRadius: '5px',
      border: `1.5px solid ${borderColor}`
    }}>
      <div style={{ 
        fontSize: '8.5pt', 
        fontWeight: 'bold', 
        color: textColor, 
        marginBottom: '6px', 
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        paddingBottom: '4px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <style>{pageStyle}</style>
      <div style={containerStyle}>
        {/* Logo Watermark */}
        <img 
          src={hapvidaFullLogo} 
          alt="Hapvida NotreDame Intermédica" 
          style={{ 
            position: 'absolute',
            top: '6mm',
            right: '10mm',
            height: '32px',
            width: 'auto',
            opacity: 0.2,
            zIndex: 0
          }}
        />
        
        {/* Header with Sector Identity */}
        <div style={{ 
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
          padding: '10px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '6px'
          }}>
            <div style={{ 
              height: '32px', 
              width: '32px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ClipboardList style={{ height: '16px', width: '16px', color: '#ffffff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '13pt', 
                fontWeight: 'bold', 
                textTransform: 'uppercase',
                margin: 0,
                color: '#ffffff',
                letterSpacing: '0.5px'
              }}>
                Caso Clínico Completo
              </h1>
              <div style={{ 
                fontSize: '8pt', 
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '2px'
              }}>
                {sectorLabels[patient.sector]} • Leito {patient.bedNumber}
              </div>
            </div>
          </div>
          
          {/* Metadata Bar */}
          <div style={{ 
            display: 'flex',
            gap: '10px',
            fontSize: '7.5pt',
            color: 'rgba(255, 255, 255, 0.95)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            padding: '4px 8px',
            borderRadius: '3px'
          }}>
            <div>
              <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '10px' }}>
              <strong>Hora:</strong> {new Date().toLocaleTimeString('pt-BR')}
            </div>
            {patient.admissionDate && (
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '10px' }}>
                <strong>Admissão:</strong> {new Date(patient.admissionDate).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        {/* Patient Information Card with Sector Colors */}
        <div style={{ 
          backgroundColor: colors.light, 
          padding: '10px 12px', 
          borderRadius: '5px',
          marginBottom: '12px',
          border: `2px solid ${colors.primary}`
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: colors.primary,
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '4px',
              textAlign: 'center',
              minWidth: '50px'
            }}>
              <div style={{ fontSize: '7pt', marginBottom: '2px', opacity: 0.9, fontWeight: '600' }}>LEITO</div>
              <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>{patient.bedNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '7.5pt', color: colors.dark, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase' }}>
                Paciente
              </div>
              <div style={{ 
                fontSize: '11pt', 
                fontWeight: 'bold', 
                color: colors.text, 
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}>
                {patient.name}
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: `1.5px solid ${colors.border}`,
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <div style={{ fontSize: '7pt', color: colors.dark, marginBottom: '2px', fontWeight: '600' }}>IDADE</div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: colors.text }}>{formatAgeDisplay(patient.age)}</div>
            </div>
          </div>
        </div>

        {/* Clinical Sections */}
        {patient.diagnoses.length > 0 && (
          <SectionCard
            title="Hipóteses Diagnósticas"
            bgColor="#fffbeb"
            borderColor="#fbbf24"
            textColor="#92400e"
          >
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
              {patient.diagnoses.map((diagnosis, idx) => (
                <li key={idx} style={{ 
                  fontSize: '9pt', 
                  color: '#78350f', 
                  marginBottom: '4px', 
                  lineHeight: '1.4'
                }}>
                  {diagnosis}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {patient.medicalHistory.length > 0 && (
          <SectionCard
            title="Antecedentes Mórbidos Pessoais"
            bgColor="#fdf2f8"
            borderColor="#f472b6"
            textColor="#9f1239"
          >
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
              {patient.medicalHistory.map((history, idx) => (
                <li key={idx} style={{ 
                  fontSize: '9pt', 
                  color: '#831843', 
                  marginBottom: '4px', 
                  lineHeight: '1.4'
                }}>
                  {history}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {patient.relevantExams.length > 0 && (
          <SectionCard
            title="Exames Complementares Relevantes"
            bgColor="#eff6ff"
            borderColor="#60a5fa"
            textColor="#1e40af"
          >
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'square' }}>
              {patient.relevantExams.map((exam, idx) => (
                <li key={idx} style={{ 
                  fontSize: '9pt', 
                  color: '#1e3a8a', 
                  marginBottom: '4px', 
                  lineHeight: '1.4'
                }}>
                  {exam}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {patient.pendencies.length > 0 && (
          <SectionCard
            title="Programações e Pendências"
            bgColor="#f0fdf4"
            borderColor="#4ade80"
            textColor="#166534"
          >
            <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'decimal' }}>
              {patient.pendencies.map((pendency, idx) => {
                const isHighlighted = patient.highlightedPendencies?.includes(idx);
                return (
                  <li 
                    key={idx} 
                    style={{ 
                      fontSize: '9pt', 
                      color: '#14532d', 
                      marginBottom: '4px', 
                      lineHeight: '1.4',
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      backgroundColor: isHighlighted ? '#fef3c7' : 'transparent',
                      padding: isHighlighted ? '3px 6px' : '0',
                      marginLeft: isHighlighted ? '-6px' : '0',
                      borderRadius: isHighlighted ? '3px' : '0',
                      border: isHighlighted ? '1.5px solid #fbbf24' : 'none'
                    }}
                  >
                    {pendency}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {patient.admissionHistory && (
          <SectionCard
            title="História Admissional e Anamnese Completa"
            bgColor="#fafaf9"
            borderColor="#a8a29e"
            textColor="#292524"
          >
            <div style={{ 
              fontSize: '9pt', 
              color: '#1c1917', 
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              textAlign: 'justify'
            }}>
              {patient.admissionHistory}
            </div>
          </SectionCard>
        )}

        {/* Footer */}
        <div style={{ 
          fontSize: '7pt', 
          textAlign: 'center', 
          color: '#9ca3af', 
          marginTop: '16px', 
          paddingTop: '8px', 
          borderTop: '1px solid #e5e7eb',
          fontStyle: 'italic'
        }}>
          Hospital Guarás - Urgência e Emergência • Documento Confidencial<br/>
          {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </>
  );
}
