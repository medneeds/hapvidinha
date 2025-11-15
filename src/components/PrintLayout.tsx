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
        className="border border-gray-300 rounded p-3 text-xs break-inside-avoid mb-3"
        style={{ 
          pageBreakInside: 'avoid',
          marginBottom: '12px',
          padding: '12px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          opacity: 1
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold text-sm" style={{ color: '#000000' }}>{patient.bedNumber} - {patient.name}</span>
          {patient.age > 0 && <span className="text-gray-600 text-sm" style={{ color: '#4b5563' }}>{patient.age}a</span>}
        </div>
        {patient.diagnoses.length > 0 && (
          <div className="text-gray-700 mb-2" style={{ color: '#374151' }}>
            <strong>Diagnóstico:</strong> {patient.diagnoses.join(', ')}
          </div>
        )}
        {mode === 'detailed' && (
          <>
            {patient.medicalHistory.length > 0 && (
              <div className="text-gray-700 mb-2" style={{ color: '#374151' }}>
                <strong>História:</strong> {patient.medicalHistory.join(', ')}
              </div>
            )}
            {patient.relevantExams.length > 0 && (
              <div className="text-gray-700 mb-2" style={{ color: '#374151' }}>
                <strong>Exames:</strong> {patient.relevantExams.join(', ')}
              </div>
            )}
            {patient.pendencies.length > 0 && (
              <div className="text-gray-700 mb-2" style={{ color: '#374151' }}>
                <strong>Pendências:</strong> {patient.pendencies.join(', ')}
              </div>
            )}
            {patient.schedule.length > 0 && (
              <div className="text-gray-700 mb-2" style={{ color: '#374151' }}>
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
    borderColor: string, 
    bgColor: string,
    textColor: string
  ) => {
    if (patients.length === 0) return null;
    
    return (
      <div 
        className="break-inside-avoid mb-6" 
        style={{ 
          pageBreakInside: 'avoid',
          pageBreakAfter: 'avoid',
          marginBottom: '24px'
        }}
      >
        <div 
          className={`${bgColor} border-l-4 ${borderColor} p-3 mb-3`}
          style={{ 
            pageBreakAfter: 'avoid',
            padding: '12px',
            marginBottom: '12px'
          }}
        >
          <h2 className={`text-base font-bold uppercase ${textColor}`}>
            {sectorName} ({patients.length})
          </h2>
        </div>
        <div className="space-y-2">
          {patients.map(renderPatientCard)}
        </div>
      </div>
    );
  };

  // Estilos IDÊNTICOS para preview e impressão
  const containerStyle = {
    padding: '20mm 15mm',
    fontSize: '11pt',
    lineHeight: '1.4',
    backgroundColor: '#ffffff',
    minHeight: '297mm'
  };

  return (
    <div 
      className={isPreview ? "max-w-[210mm] mx-auto shadow-lg" : ""}
      style={containerStyle}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-300">
        <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
          <ClipboardList className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-xl font-bold uppercase">Mapa de Pacientes</h1>
      </div>
      
      {/* Metadata */}
      <div className="text-xs text-gray-600 mb-4 pb-2 border-b border-gray-200">
        <div className="flex justify-between">
          <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
          <span>Hora: {new Date().toLocaleTimeString('pt-BR')}</span>
          <span>Modo: {mode === 'compact' ? 'Retraído' : 'Detalhado'}</span>
        </div>
      </div>
      
      {/* Sectors */}
      <div className="space-y-3">
        {renderSector(redPatients, 'Ala Vermelha', 'border-red-500', 'bg-red-50', 'text-red-700')}
        {renderSector(yellowPatients, 'Ala Amarela', 'border-yellow-500', 'bg-yellow-50', 'text-yellow-700')}
        {renderSector(bluePatients, 'Ala Azul', 'border-blue-500', 'bg-blue-50', 'text-blue-700')}
      </div>
      
      {/* Footer */}
      <div className="text-xs text-center text-gray-500 mt-6 pt-4 border-t border-gray-200">
        Sistema de Gestão Hospitalar - Documento gerado automaticamente
      </div>
    </div>
  );
}
