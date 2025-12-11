import { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";

// Import logos
import hospitalGuarasLogo from "@/assets/hospital-guaras-logo.png";
import hapvidaLogo from "@/assets/hapvida-notredame-logo.png";

interface PrintableDietDocumentProps {
  patient: Patient;
  dietRoute: "oral" | "enteral";
  dietType: string;
  restrictions: string[];
  birthDate: string;
  doctorName: string;
  crm: string;
  onClose: () => void;
}

export function PrintableDietDocument({
  patient,
  dietRoute,
  dietType,
  restrictions,
  birthDate,
  doctorName,
  crm,
  onClose,
}: PrintableDietDocumentProps) {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(currentDate, "HH:mm");

  useEffect(() => {
    // Add print-specific class to body
    document.body.classList.add('diet-print-mode');
    return () => {
      document.body.classList.remove('diet-print-mode');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-100 dark:bg-slate-900 overflow-auto print:bg-white">
      {/* Print Styles - Global */}
      <style>
        {`
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            body * {
              visibility: hidden !important;
            }
            .diet-print-container, .diet-print-container * {
              visibility: visible !important;
            }
            .diet-print-container {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              margin: 0 !important;
              padding: 12mm 15mm !important;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
              visibility: hidden !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
          }
        `}
      </style>

      {/* Screen Controls - Hidden on Print */}
      <div className="no-print sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Visualização - Autorização de Dieta
        </h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Document Preview Container */}
      <div className="no-print flex justify-center py-8 px-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* The actual printable document */}
          <div 
            className="diet-print-container bg-white text-black"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              padding: '12mm 15mm',
              fontFamily: "'Georgia', 'Times New Roman', Times, serif",
            }}
          >
            {/* Header with Logos */}
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '2px solid #1e40af' }}>
              <img 
                src={hospitalGuarasLogo} 
                alt="Hospital Guarás" 
                style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
              />
              <div className="text-center flex-1 px-6">
                <h1 style={{ 
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  color: '#1e3a5f',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  Autorização de Dieta
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Serviço de Nutrição e Dietética
                </p>
              </div>
              <img 
                src={hapvidaLogo} 
                alt="Hapvida NotreDame Intermédica" 
                style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Patient Information Card */}
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    Paciente
                  </span>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', margin: '4px 0 0 0' }}>
                    {patient.name}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    Leito
                  </span>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '4px 0 0 0' }}>
                    {patient.bedNumber}
                  </p>
                </div>
                {birthDate && (
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                      Data de Nascimento
                    </span>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0 0' }}>
                      {birthDate}
                    </p>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    Data da Solicitação
                  </span>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0 0' }}>
                    {formattedDate} às {formattedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Diet Authorization Section */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#1e3a5f',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #cbd5e1'
              }}>
                LIBERADA DIETA:
              </h2>
              
              <div style={{ paddingLeft: '8px' }}>
                {/* Via */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px' }}>Via:</span>
                  <span style={{ 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af',
                    padding: '6px 16px', 
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}>
                    {dietRoute === "oral" ? "Oral" : "Enteral"}
                  </span>
                </div>
                
                {/* Tipo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px' }}>Tipo:</span>
                  <span style={{ 
                    backgroundColor: '#dcfce7', 
                    color: '#166534',
                    padding: '6px 16px', 
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}>
                    {dietType || "Não especificado"}
                  </span>
                </div>
                
                {/* Restrições */}
                {restrictions.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px', paddingTop: '6px' }}>Restrições:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {restrictions.map((restriction, index) => (
                        <span 
                          key={index}
                          style={{ 
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            padding: '6px 12px', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #fcd34d'
                          }}
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observations Area */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Observações da Nutrição:
              </h3>
              <div style={{ 
                border: '1px solid #cbd5e1', 
                borderRadius: '6px', 
                padding: '16px', 
                minHeight: '70px',
                backgroundColor: '#fafafa'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
                  Espaço reservado para anotações
                </p>
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: '40px', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '280px', 
                    borderTop: '2px solid #1e293b', 
                    paddingTop: '8px',
                    marginBottom: '4px'
                  }}>
                    <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, fontSize: '14px' }}>
                      {doctorName || ""}
                    </p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Médico(a) Responsável</p>
                  {crm && <p style={{ fontSize: '12px', color: '#475569', fontWeight: '600', margin: '2px 0 0 0' }}>{crm}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              position: 'absolute',
              bottom: '12mm',
              left: '15mm',
              right: '15mm',
              textAlign: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '12px'
            }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                Hospital Guarás - Rede Hapvida NotreDame Intermédica
              </p>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Rua Armando Vieira da Silva, São Luís, MA, 65030-130
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable version (exact same content but positioned for print) */}
      <div 
        className="diet-print-container hidden print:block bg-white text-black"
        style={{ 
          fontFamily: "'Georgia', 'Times New Roman', Times, serif",
        }}
      >
        {/* Header with Logos */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '2px solid #1e40af' }}>
          <img 
            src={hospitalGuarasLogo} 
            alt="Hospital Guarás" 
            style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
          />
          <div className="text-center flex-1 px-6">
            <h1 style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              color: '#1e3a5f',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Autorização de Dieta
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Serviço de Nutrição e Dietética
            </p>
          </div>
          <img 
            src={hapvidaLogo} 
            alt="Hapvida NotreDame Intermédica" 
            style={{ height: '50px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Patient Information Card */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Paciente
              </span>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase', margin: '4px 0 0 0' }}>
                {patient.name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Leito
              </span>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '4px 0 0 0' }}>
                {patient.bedNumber}
              </p>
            </div>
            {birthDate && (
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  Data de Nascimento
                </span>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0 0' }}>
                  {birthDate}
                </p>
              </div>
            )}
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                Data da Solicitação
              </span>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: '4px 0 0 0' }}>
                {formattedDate} às {formattedTime}
              </p>
            </div>
          </div>
        </div>

        {/* Diet Authorization Section */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#1e3a5f',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #cbd5e1'
          }}>
            LIBERADA DIETA:
          </h2>
          
          <div style={{ paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px' }}>Via:</span>
              <span style={{ 
                backgroundColor: '#dbeafe', 
                color: '#1e40af',
                padding: '6px 16px', 
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}>
                {dietRoute === "oral" ? "Oral" : "Enteral"}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px' }}>Tipo:</span>
              <span style={{ 
                backgroundColor: '#dcfce7', 
                color: '#166534',
                padding: '6px 16px', 
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                textTransform: 'uppercase'
              }}>
                {dietType || "Não especificado"}
              </span>
            </div>
            
            {restrictions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: '#475569', minWidth: '100px', fontSize: '14px', paddingTop: '6px' }}>Restrições:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {restrictions.map((restriction, index) => (
                    <span 
                      key={index}
                      style={{ 
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '6px 12px', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: '1px solid #fcd34d'
                      }}
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Observations Area */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
            Observações da Nutrição:
          </h3>
          <div style={{ 
            border: '1px solid #cbd5e1', 
            borderRadius: '6px', 
            padding: '16px', 
            minHeight: '70px',
            backgroundColor: '#fafafa'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
              Espaço reservado para anotações
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div style={{ marginTop: '40px', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '280px', 
                borderTop: '2px solid #1e293b', 
                paddingTop: '8px',
                marginBottom: '4px'
              }}>
                <p style={{ fontWeight: '500', color: '#1e293b', margin: 0, fontSize: '14px' }}>
                  {doctorName || ""}
                </p>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Médico(a) Responsável</p>
              {crm && <p style={{ fontSize: '12px', color: '#475569', fontWeight: '600', margin: '2px 0 0 0' }}>{crm}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '60px',
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px'
        }}>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            Hospital Guarás - Rede Hapvida NotreDame Intermédica
          </p>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
            Rua Armando Vieira da Silva, São Luís, MA, 65030-130
          </p>
        </div>
      </div>
    </div>
  );
}
