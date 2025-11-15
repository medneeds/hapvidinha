import { Patient } from "@/types/patient";
import { ClipboardList } from "lucide-react";
import { PrintableSectorSection } from "./PrintableSectorSection";
import hapvidaFullLogo from "@/assets/hapvida-notredame-full-logo.png";

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

  const isCompact = mode === 'compact';

  const containerStyle: React.CSSProperties = {
    maxWidth: isPreview ? '210mm' : 'none',
    margin: isPreview ? '0 auto' : '0',
    padding: isCompact ? '15mm 12mm' : '20mm 15mm',
    fontSize: isCompact ? '10pt' : '11pt',
    lineHeight: isCompact ? '1.3' : '1.4',
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
        justifyContent: 'space-between',
        marginBottom: isCompact ? '12px' : '16px', 
        paddingBottom: isCompact ? '6px' : '8px', 
        borderBottom: '2px solid #d1d5db' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            height: isCompact ? '28px' : '32px', 
            width: isCompact ? '28px' : '32px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ClipboardList style={{ height: isCompact ? '14px' : '16px', width: isCompact ? '14px' : '16px', color: '#ffffff' }} />
          </div>
          <h1 style={{ 
            fontSize: isCompact ? '18pt' : '20pt', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            margin: 0,
            color: '#000000'
          }}>
            Mapa de Pacientes - Hospital Guarás
          </h1>
        </div>
        <img 
          src={hapvidaFullLogo} 
          alt="Hapvida NotreDame Intermédica" 
          style={{ height: isCompact ? '35px' : '45px', width: 'auto' }}
        />
      </div>
      
      {/* Metadata */}
      <div style={{ 
        fontSize: isCompact ? '9pt' : '10pt', 
        color: '#4b5563', 
        marginBottom: isCompact ? '12px' : '16px', 
        paddingBottom: isCompact ? '6px' : '8px', 
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
        <PrintableSectorSection
          patients={redPatients}
          sectorName="Ala Vermelha"
          bgColor="#fef2f2"
          borderColor="#ef4444"
          textColor="#b91c1c"
          mode={mode}
        />
        <PrintableSectorSection
          patients={yellowPatients}
          sectorName="Ala Amarela"
          bgColor="#fefce8"
          borderColor="#eab308"
          textColor="#a16207"
          mode={mode}
        />
        <PrintableSectorSection
          patients={bluePatients}
          sectorName="Ala Azul"
          bgColor="#eff6ff"
          borderColor="#3b82f6"
          textColor="#1d4ed8"
          mode={mode}
        />
      </div>
      
      {/* Footer */}
      <div style={{ 
        fontSize: isCompact ? '9pt' : '10pt', 
        textAlign: 'center', 
        color: '#6b7280', 
        marginTop: isCompact ? '16px' : '24px', 
        paddingTop: isCompact ? '12px' : '16px', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        Urgência e Emergência - Documento gerado automaticamente
      </div>
    </div>
  );
}
