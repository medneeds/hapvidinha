import { Patient } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #diet-document, #diet-document * {
              visibility: visible;
            }
            #diet-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 15mm 20mm;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* Screen Controls */}
      <div className="fixed inset-0 z-50 bg-background/95 overflow-auto">
        <div className="no-print sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Visualização - Autorização de Dieta</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="flex justify-center p-8">
          <div 
            id="diet-document"
            className="bg-white text-black w-[210mm] min-h-[297mm] shadow-2xl relative"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              padding: "15mm 20mm"
            }}
          >
            {/* Header with Logos */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-300">
              <img 
                src={hospitalGuarasLogo} 
                alt="Hospital Guarás" 
                className="h-16 w-auto object-contain"
              />
              <div className="text-center flex-1 px-4">
                <h1 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                  Autorização de Dieta
                </h1>
                <p className="text-sm text-gray-600 mt-1">Serviço de Nutrição</p>
              </div>
              <img 
                src={hapvidaLogo} 
                alt="Hapvida" 
                className="h-14 w-auto object-contain"
              />
            </div>

            {/* Patient Information */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Paciente</span>
                  <p className="font-semibold text-lg text-gray-800 uppercase">{patient.name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Leito</span>
                  <p className="font-semibold text-lg text-gray-800">{patient.bedNumber}</p>
                </div>
                {birthDate && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Data de Nascimento</span>
                    <p className="font-medium text-gray-800">{birthDate}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Data da Solicitação</span>
                  <p className="font-medium text-gray-800">{formattedDate} às {formattedTime}</p>
                </div>
              </div>
            </div>

            {/* Diet Authorization */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                LIBERADA DIETA:
              </h2>
              
              <div className="space-y-4 pl-4">
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px]">Via:</span>
                  <span className="text-gray-800 uppercase font-medium bg-blue-50 px-3 py-1 rounded">
                    {dietRoute === "oral" ? "Oral" : "Enteral"}
                  </span>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-700 min-w-[80px]">Tipo:</span>
                  <span className="text-gray-800 uppercase font-medium bg-green-50 px-3 py-1 rounded">
                    {dietType || "Não especificado"}
                  </span>
                </div>
                
                {restrictions.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-gray-700 min-w-[80px]">Restrições:</span>
                    <div className="flex flex-wrap gap-2">
                      {restrictions.map((restriction, index) => (
                        <span 
                          key={index}
                          className="text-gray-800 bg-amber-50 px-3 py-1 rounded text-sm border border-amber-200"
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
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Observações:</h3>
              <div className="border border-gray-300 rounded p-4 min-h-[80px] bg-gray-50">
                <p className="text-gray-400 text-sm italic">Espaço para anotações da nutrição</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-auto pt-8">
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="w-64 border-t-2 border-gray-800 pt-2 mb-1">
                    <p className="font-medium text-gray-800">
                      {doctorName || "________________________________"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Médico(a) Responsável</p>
                  {crm && <p className="text-sm text-gray-600 font-medium">{crm}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] text-center border-t pt-4">
              <p className="text-xs text-gray-500">
                Hospital Guarás - Rede Hapvida NotreDame Intermédica
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rua Armando Vieira da Silva, São Luís, MA, 65030-130
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
