import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePatients } from "@/hooks/usePatients";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SepsisProtocolPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId");
  const { patients } = usePatients();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    // Dados do paciente
    patient_name: "",
    birth_date: "",
    attendance_number: "",
    hospital: "HOSPITAL GUARÁS",
    
    // Responsável
    responsible_name: "",
    opening_date: new Date().toISOString().split('T')[0],
    opening_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    
    // SIRS
    sirs_temp_high: false,
    sirs_temp_low: false,
    sirs_heart_rate: false,
    sirs_respiratory_rate: false,
    sirs_leukocytosis: false,
    sirs_leukopenia: false,
    sirs_young_cells: false,
    
    // Disfunção orgânica
    dysfunction_hypotension: false,
    dysfunction_oliguria: false,
    dysfunction_pao2: false,
    dysfunction_platelets: false,
    dysfunction_acidosis: false,
    dysfunction_consciousness: false,
    dysfunction_bilirubin: false,
    
    // Infecção
    has_infection: null as boolean | null,
    
    // Coletas
    blood_culture_date: "",
    blood_culture_time: "",
    lactate_date: "",
    lactate_time: "",
    antibiotic_prescription_date: "",
    antibiotic_prescription_time: "",
    
    // Foco infeccioso
    focus_pulmonary: false,
    focus_urinary: false,
    focus_abdominal: false,
    focus_skin: false,
    focus_neurological: false,
    focus_other: "",
    
    // Disfunção orgânica após pacote
    has_organic_dysfunction: null as boolean | null,
    
    // Reposição volêmica
    patient_weight: "",
    volume_administered: "",
    
    // Destino
    destination: "",
    destination_date: "",
    destination_time: "",
    
    // Desfecho
    outcome: "",
    outcome_date: "",
    outcome_time: "",
    
    notes: "",
  });

  useEffect(() => {
    if (patientId) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patient_name: patient.name || "",
          birth_date: patient.admissionDate ? new Date(patient.admissionDate).toISOString().split('T')[0] : "",
        }));
      }
    }
  }, [patientId, patients]);

  const handleSave = async () => {
    try {
      const { error } = await supabase.from("sepsis_protocols").insert({
        ...formData,
        patient_id: patientId || null,
        created_by: user?.id,
        birth_date: formData.birth_date || null,
        patient_weight: formData.patient_weight ? parseFloat(formData.patient_weight) : null,
        volume_administered: formData.volume_administered ? parseFloat(formData.volume_administered) : null,
      });

      if (error) throw error;

      toast({
        title: "Protocolo salvo",
        description: "Protocolo de sepse salvo com sucesso",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error saving sepsis protocol:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o protocolo",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Botões de ação - escondidos na impressão */}
      <div className="flex items-center justify-between p-4 print:hidden border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">PROTOCOLO SEPSE ADULTO</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            SALVAR
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            IMPRIMIR
          </Button>
        </div>
      </div>

      {/* Formulário exatamente como no PDF original */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-8" style={{ fontSize: '10px' }}>
        {/* Linha 1 - Nome do Paciente */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="whitespace-nowrap">Nome completo do paciente:</span>
          <div className="flex-1 border-b border-black">
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
        </div>

        {/* Linha 2 - Data Nascimento, Atendimento, Hospital */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="whitespace-nowrap">Data de nascimento:</span>
          <div className="border-b border-black" style={{ width: '80px' }}>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
          <span className="whitespace-nowrap ml-2">Atendimento:</span>
          <div className="border-b border-black" style={{ width: '100px' }}>
            <input
              type="text"
              value={formData.attendance_number}
              onChange={(e) => setFormData({ ...formData, attendance_number: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
          <span className="whitespace-nowrap ml-2">Hospital:</span>
          <div className="flex-1 border-b border-black">
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
        </div>

        {/* Linha 3 - Responsável */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="whitespace-nowrap">Responsável pela abertura da ficha:</span>
          <div className="flex-1 border-b border-black">
            <input
              type="text"
              value={formData.responsible_name}
              onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
          <span className="whitespace-nowrap ml-2">Data:</span>
          <div className="border-b border-black" style={{ width: '80px' }}>
            <input
              type="date"
              value={formData.opening_date}
              onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
          <span className="whitespace-nowrap ml-2">Hora:</span>
          <div className="border-b border-black" style={{ width: '60px' }}>
            <input
              type="time"
              value={formData.opening_time}
              onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
              className="w-full bg-transparent border-none outline-none px-1 print:p-0"
              style={{ fontSize: '10px' }}
            />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-center font-bold mb-2" style={{ fontSize: '13px' }}>
          GERENCIAMENTO DO PROTOCOLO DE SEPSE ADULTO
        </h1>

        {/* Texto orientador */}
        <p className="text-[9px] italic mb-1">
          Marque com um X as opções dos critérios de alerta para SIRS.
        </p>

        {/* Tabela Principal */}
        <table className="w-full border-collapse border border-black mb-2" style={{ fontSize: '9px' }}>
          <thead>
            <tr>
              <th className="border border-black p-2 font-bold text-left w-1/2">Critérios sinais de SIRS</th>
              <th className="border border-black p-2 font-bold text-left w-1/2">Critérios de disfunção orgânica</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_temp_high}
                      onChange={(e) => setFormData({ ...formData, sirs_temp_high: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>T.ax. &gt; 38,3°</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_temp_low}
                      onChange={(e) => setFormData({ ...formData, sirs_temp_low: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>T.ax. &lt; 36,0°</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_heart_rate}
                      onChange={(e) => setFormData({ ...formData, sirs_heart_rate: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>FC &gt; 90 bpm</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_respiratory_rate}
                      onChange={(e) => setFormData({ ...formData, sirs_respiratory_rate: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>FR &gt; 20 rpm</span>
                  </label>
                  <div className="font-semibold mt-2 mb-1">Se exames disponíveis</div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_leukocytosis}
                      onChange={(e) => setFormData({ ...formData, sirs_leukocytosis: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Leucocitose &gt; 12000/mm3</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_leukopenia}
                      onChange={(e) => setFormData({ ...formData, sirs_leukopenia: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Leucopenia &lt; 4000/mm3</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sirs_young_cells}
                      onChange={(e) => setFormData({ ...formData, sirs_young_cells: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>&gt; 10% de células jovens</span>
                  </label>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_hypotension}
                      onChange={(e) => setFormData({ ...formData, dysfunction_hypotension: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Hipotensão (PAS &lt; 90 mmHg ou PAM &lt; 65 mmHg ou queda de PA &gt; 40 mmHg);</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_oliguria}
                      onChange={(e) => setFormData({ ...formData, dysfunction_oliguria: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Oligúria (≤ 0,5 mL/kg/h) ou elevação da creatinina (&gt; 2 mg/dL);</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_pao2}
                      onChange={(e) => setFormData({ ...formData, dysfunction_pao2: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Relação PaO2/FiO2 &lt; 300 ou necessidade de O2 para manter SpO2 &gt; 90%;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_platelets}
                      onChange={(e) => setFormData({ ...formData, dysfunction_platelets: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Contagem de plaquetas &lt; 100.000/mm³ ou redução de 50% no número de plaquetas em relação ao maior valor registrado nos últimos 3 dias;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_acidosis}
                      onChange={(e) => setFormData({ ...formData, dysfunction_acidosis: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Acidose metabólica inexplicável: déficit de bases ≤ 5,0 mEq/L e lactato acima do valor de referência;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_consciousness}
                      onChange={(e) => setFormData({ ...formData, dysfunction_consciousness: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Rebaixamento do nível de consciência, agitação, delirium;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dysfunction_bilirubin}
                      onChange={(e) => setFormData({ ...formData, dysfunction_bilirubin: e.target.checked })}
                      className="mt-0.5 print:appearance-none print:w-3 print:h-3 print:border print:border-black"
                    />
                    <span>Aumento significativo de bilirrubinas (&gt; 2x o valor de referência).</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Texto instrucional */}
        <p className="text-[9px] mb-2">
          Pelo menos dois critérios de SIRS e/ou critério de disfunção orgânica.<br/>
          Realizar a abertura do protocolo de sepse e comunicar ao médico imediatamente.
        </p>

        {/* Pergunta sobre infecção */}
        <div className="mb-2">
          <p className="font-semibold mb-1" style={{ fontSize: '10px' }}>
            Há suspeita ou confirmação da presença de infecção?
          </p>
          <table className="w-full border-collapse border border-black text-[9px]">
            <tbody>
              <tr>
                <td className="border border-black p-2 text-center font-semibold w-16">
                  <label className="cursor-pointer flex items-center justify-center gap-1">
                    <input
                      type="radio"
                      name="has_infection"
                      checked={formData.has_infection === false}
                      onChange={() => setFormData({ ...formData, has_infection: false })}
                      className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full"
                    />
                    Não
                  </label>
                </td>
                <td className="border border-black p-1 font-semibold">Excluir do protocolo</td>
                <td className="border border-black p-1">Seguir com o atendimento fora do protocolo de sepse</td>
              </tr>
            </tbody>
          </table>
          
          <div className="flex items-center gap-1 mt-1 mb-2">
            <label className="cursor-pointer flex items-center gap-1 font-semibold" style={{ fontSize: '10px' }}>
              <input
                type="radio"
                name="has_infection"
                checked={formData.has_infection === true}
                onChange={() => setFormData({ ...formData, has_infection: true })}
                className="print:appearance-none print:w-3 print:h-3 print:border print:border-black print:rounded-full"
              />
              Sim
            </label>
          </div>
        </div>

        {formData.has_infection && (
          <>
            {/* Coletas */}
            <div className="border border-black p-2 mb-2" style={{ fontSize: '9px' }}>
              <p className="font-semibold mb-1">Solicitar e coletar pacote sepse 1 hora</p>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span>Coleta hemocultura: data</span>
                  <input type="date" value={formData.blood_culture_date} onChange={(e) => setFormData({ ...formData, blood_culture_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />
                  <span>, às</span>
                  <input type="time" value={formData.blood_culture_time} onChange={(e) => setFormData({ ...formData, blood_culture_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span>Coleta lactato: data</span>
                  <input type="date" value={formData.lactate_date} onChange={(e) => setFormData({ ...formData, lactate_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />
                  <span>, às</span>
                  <input type="time" value={formData.lactate_time} onChange={(e) => setFormData({ ...formData, lactate_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span>Antibiótico: prescrição: data</span>
                  <input type="date" value={formData.antibiotic_prescription_date} onChange={(e) => setFormData({ ...formData, antibiotic_prescription_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />
                  <span>, às</span>
                  <input type="time" value={formData.antibiotic_prescription_time} onChange={(e) => setFormData({ ...formData, antibiotic_prescription_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" />
                </div>
              </div>
            </div>

            {/* Foco infeccioso */}
            <div className="border border-black p-2 mb-2" style={{ fontSize: '9px' }}>
              <p className="font-semibold mb-1">Definir foco infeccioso e prescrever antibioticoterapia</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer"><input type="checkbox" checked={formData.focus_pulmonary} onChange={(e) => setFormData({ ...formData, focus_pulmonary: e.target.checked })} /> ( ) pulmonar</label>
                <label className="cursor-pointer"><input type="checkbox" checked={formData.focus_urinary} onChange={(e) => setFormData({ ...formData, focus_urinary: e.target.checked })} /> ( ) urinário</label>
                <label className="cursor-pointer"><input type="checkbox" checked={formData.focus_abdominal} onChange={(e) => setFormData({ ...formData, focus_abdominal: e.target.checked })} /> ( ) abdominal</label>
                <label className="cursor-pointer"><input type="checkbox" checked={formData.focus_skin} onChange={(e) => setFormData({ ...formData, focus_skin: e.target.checked })} /> ( ) cutâneo</label>
                <label className="cursor-pointer"><input type="checkbox" checked={formData.focus_neurological} onChange={(e) => setFormData({ ...formData, focus_neurological: e.target.checked })} /> ( ) neurológico</label>
                <span>outros: <input type="text" value={formData.focus_other} onChange={(e) => setFormData({ ...formData, focus_other: e.target.value.toUpperCase() })} className="border-b border-black bg-transparent w-32 px-1" /></span>
              </div>
            </div>

            {/* Disfunção após pacote */}
            <div className="mb-2">
              <p className="font-semibold mb-1" style={{ fontSize: '10px' }}>
                Há disfunção orgânica após o resultado do pacote sepse?
              </p>
              <table className="w-full border-collapse border border-black text-[9px]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center font-semibold w-16">
                      <label className="cursor-pointer flex items-center justify-center gap-1">
                        <input
                          type="radio"
                          name="has_organic_dysfunction"
                          checked={formData.has_organic_dysfunction === false}
                          onChange={() => setFormData({ ...formData, has_organic_dysfunction: false })}
                        />
                        Não
                      </label>
                    </td>
                    <td className="border border-black p-1 font-semibold">Excluir protocolo de sepse</td>
                    <td className="border border-black p-1">Seguir com o atendimento fora do protocolo de sepse</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="flex items-center gap-1 mt-1 mb-2">
                <label className="cursor-pointer flex items-center gap-1 font-semibold" style={{ fontSize: '10px' }}>
                  <input
                    type="radio"
                    name="has_organic_dysfunction"
                    checked={formData.has_organic_dysfunction === true}
                    onChange={() => setFormData({ ...formData, has_organic_dysfunction: true })}
                  />
                  Sim
                </label>
              </div>
            </div>

            {formData.has_organic_dysfunction && (
              <>
                {/* Instruções */}
                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p>* Realizar reposição volêmica com 30 mL/kg de cristaloides e ajustar conforme janelas de perfusão (diurese, débito urinário e tempo de enchimento capilar)</p>
                  <p>* Monitorar o paciente de 1 em 1 hora.</p>
                  <p>* Monitorar débito urinário de 1 em 1 hora, passagem de sonda caso haja necessidade.</p>
                  <p>* Caso PAM estiver &lt; 65 mmHG, iniciar terapia com vasopressor indicado noradrenalina.</p>
                  <p>* Providenciar passagem de acesso central.</p>
                  <p>* Coleta de segunda amostra do lactado.</p>
                </div>

                {/* Reposição volêmica */}
                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p className="font-semibold mb-1">Reposição volêmica</p>
                  <div className="flex gap-4">
                    <span>Peso: <input type="number" value={formData.patient_weight} onChange={(e) => setFormData({ ...formData, patient_weight: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></span>
                    <span>Volume administrado: <input type="number" value={formData.volume_administered} onChange={(e) => setFormData({ ...formData, volume_administered: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" /></span>
                  </div>
                </div>

                {/* Destino */}
                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p className="font-semibold mb-1">Definir o destino do paciente para UTI ou Unidade de Internação.</p>
                  <div className="flex items-baseline gap-2">
                    <span>Destino:</span>
                    <label className="cursor-pointer"><input type="radio" name="destination" value="UTI" checked={formData.destination === "UTI"} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} /> ( ) UTI</label>
                    <label className="cursor-pointer"><input type="radio" name="destination" value="Internação" checked={formData.destination === "Internação"} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} /> ( ) Internação</label>
                    <span className="ml-auto">Data <input type="date" value={formData.destination_date} onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.destination_time} onChange={(e) => setFormData({ ...formData, destination_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></span>
                  </div>
                </div>

                {/* Desfecho */}
                <div className="border border-black p-2 mb-2 text-[9px]">
                  <div className="flex items-baseline gap-2">
                    <span>Desfecho:</span>
                    <label className="cursor-pointer"><input type="radio" name="outcome" value="Alta" checked={formData.outcome === "Alta"} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} /> ( ) Alta</label>
                    <label className="cursor-pointer"><input type="radio" name="outcome" value="Óbito" checked={formData.outcome === "Óbito"} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} /> ( ) Óbito</label>
                    <span className="ml-auto">Data <input type="date" value={formData.outcome_date} onChange={(e) => setFormData({ ...formData, outcome_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.outcome_time} onChange={(e) => setFormData({ ...formData, outcome_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

      {/* Cabeçalho do formulário */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium">NOME COMPLETO DO PACIENTE:</span>
            <Input
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
              className="flex-1 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className="font-medium">DATA NASCIMENTO:</span>
            <Input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-32 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className="font-medium">ATENDIMENTO:</span>
            <Input
              value={formData.attendance_number}
              onChange={(e) => setFormData({ ...formData, attendance_number: e.target.value.toUpperCase() })}
              className="w-32 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className="font-medium">HOSPITAL:</span>
            <Input
              value={formData.hospital}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value.toUpperCase() })}
              className="w-48 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-[1fr,auto,auto] gap-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium">RESPONSÁVEL PELA ABERTURA DA FICHA:</span>
            <Input
              value={formData.responsible_name}
              onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value.toUpperCase() })}
              className="flex-1 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className="font-medium">DATA:</span>
            <Input
              type="date"
              value={formData.opening_date}
              onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
              className="w-32 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className="font-medium">HORA:</span>
            <Input
              type="time"
              value={formData.opening_time}
              onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
              className="w-24 h-7 print:border-0 print:border-b print:rounded-none"
            />
          </div>
        </div>
      </div>

      {/* Título principal */}
      <div className="text-center py-2 print:py-1">
        <h2 className="text-xl font-bold print:text-lg">GERENCIAMENTO DO PROTOCOLO DE SEPSE ADULTO</h2>
      </div>

      {/* Tabela de critérios SIRS e Disfunção */}
      <div className="border rounded-lg print:rounded-none overflow-hidden">
        <div className="text-xs italic px-3 py-1 bg-muted">
          Marque com um X as opções dos critérios de alerta para SIRS.
        </div>
        <div className="grid grid-cols-2 divide-x">
          {/* Coluna SIRS */}
          <div className="p-3">
            <h3 className="font-bold text-sm mb-2">CRITÉRIOS SINAIS DE SIRS</h3>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_temp_high"
                  checked={formData.sirs_temp_high}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_temp_high: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_temp_high" className="text-xs">T.AX. &gt; 38,3°</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_temp_low"
                  checked={formData.sirs_temp_low}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_temp_low: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_temp_low" className="text-xs">T.AX. &lt; 36,0°</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_heart_rate"
                  checked={formData.sirs_heart_rate}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_heart_rate: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_heart_rate" className="text-xs">FC &gt; 90 BPM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_respiratory_rate"
                  checked={formData.sirs_respiratory_rate}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_respiratory_rate: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_respiratory_rate" className="text-xs">FR &gt; 20 RPM</Label>
              </div>
              <div className="text-xs font-semibold mt-2">SE EXAMES DISPONÍVEIS</div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_leukocytosis"
                  checked={formData.sirs_leukocytosis}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_leukocytosis: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_leukocytosis" className="text-xs">LEUCOCITOSE &gt; 12000/mm³</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_leukopenia"
                  checked={formData.sirs_leukopenia}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_leukopenia: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_leukopenia" className="text-xs">LEUCOPENIA &lt; 4000/mm³</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sirs_young_cells"
                  checked={formData.sirs_young_cells}
                  onCheckedChange={(checked) => setFormData({ ...formData, sirs_young_cells: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="sirs_young_cells" className="text-xs">&gt; 10% DE CÉLULAS JOVENS</Label>
              </div>
            </div>
          </div>

          {/* Coluna Disfunção */}
          <div className="p-3">
            <h3 className="font-bold text-sm mb-2">CRITÉRIOS DE DISFUNÇÃO ORGÂNICA</h3>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_hypotension"
                  checked={formData.dysfunction_hypotension}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_hypotension: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_hypotension" className="text-xs">HIPOTENSÃO (PAS &lt; 90 mmHg ou PAM &lt; 65 mmHg ou queda de PA &gt; 40 mmHg)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_oliguria"
                  checked={formData.dysfunction_oliguria}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_oliguria: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_oliguria" className="text-xs">OLIGÚRIA (≤ 0,5 mL/kg/h) ou elevação da creatinina (&gt; 2 mg/dL)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_pao2"
                  checked={formData.dysfunction_pao2}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_pao2: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_pao2" className="text-xs">Relação PaO2/FiO2 &lt; 300 ou necessidade de O2 para manter SpO2 &gt; 90%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_platelets"
                  checked={formData.dysfunction_platelets}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_platelets: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_platelets" className="text-xs">Contagem de plaquetas &lt; 100.000/mm³ ou redução de 50% nos últimos 3 dias</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_acidosis"
                  checked={formData.dysfunction_acidosis}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_acidosis: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_acidosis" className="text-xs">Acidose metabólica inexplicável: déficit de bases ≤ 5,0 mEq/L e lactato acima do valor de referência</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_consciousness"
                  checked={formData.dysfunction_consciousness}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_consciousness: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_consciousness" className="text-xs">Rebaixamento do nível de consciência, agitação, delirium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dysfunction_bilirubin"
                  checked={formData.dysfunction_bilirubin}
                  onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_bilirubin: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="dysfunction_bilirubin" className="text-xs">Aumento significativo de bilirrubinas (&gt; 2x o valor de referência)</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Texto orientador */}
      <div className="text-xs italic px-2">
        Pelo menos dois critérios de SIRS e/ou critério de disfunção orgânica.<br/>
        Realizar a abertura do protocolo de sepse e comunicar ao médico imediatamente.
      </div>

      {/* Pergunta sobre infecção */}
      <div className="border rounded-lg print:rounded-none p-3">
        <div className="font-bold text-sm mb-2">HÁ SUSPEITA OU CONFIRMAÇÃO DA PRESENÇA DE INFECÇÃO?</div>
        <RadioGroup 
          value={formData.has_infection === null ? "" : formData.has_infection.toString()} 
          onValueChange={(value) => setFormData({ ...formData, has_infection: value === "true" })}
          className="flex gap-8"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="infection_no" />
            <Label htmlFor="infection_no" className="text-sm font-semibold cursor-pointer">NÃO - EXCLUIR DO PROTOCOLO</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="infection_yes" />
            <Label htmlFor="infection_yes" className="text-sm font-semibold cursor-pointer">SIM</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.has_infection && (
        <>
          {/* Coletas */}
          <div className="border rounded-lg print:rounded-none p-3 space-y-2">
            <div className="font-bold text-sm">SOLICITAR E COLETAR PACOTE SEPSE 1 HORA</div>
            
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex gap-1 items-center">
                <span className="font-medium">COLETA HEMOCULTURA: DATA</span>
                <Input
                  type="date"
                  value={formData.blood_culture_date}
                  onChange={(e) => setFormData({ ...formData, blood_culture_date: e.target.value })}
                  className="h-7 print:border-0 print:border-b print:rounded-none"
                />
                <span className="font-medium">ÀS</span>
                <Input
                  type="time"
                  value={formData.blood_culture_time}
                  onChange={(e) => setFormData({ ...formData, blood_culture_time: e.target.value })}
                  className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                />
              </div>

              <div className="flex gap-1 items-center">
                <span className="font-medium">COLETA LACTATO: DATA</span>
                <Input
                  type="date"
                  value={formData.lactate_date}
                  onChange={(e) => setFormData({ ...formData, lactate_date: e.target.value })}
                  className="h-7 print:border-0 print:border-b print:rounded-none"
                />
                <span className="font-medium">ÀS</span>
                <Input
                  type="time"
                  value={formData.lactate_time}
                  onChange={(e) => setFormData({ ...formData, lactate_time: e.target.value })}
                  className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                />
              </div>

              <div className="flex gap-1 items-center">
                <span className="font-medium">ANTIBIÓTICO PRESCRIÇÃO: DATA</span>
                <Input
                  type="date"
                  value={formData.antibiotic_prescription_date}
                  onChange={(e) => setFormData({ ...formData, antibiotic_prescription_date: e.target.value })}
                  className="h-7 print:border-0 print:border-b print:rounded-none"
                />
                <span className="font-medium">ÀS</span>
                <Input
                  type="time"
                  value={formData.antibiotic_prescription_time}
                  onChange={(e) => setFormData({ ...formData, antibiotic_prescription_time: e.target.value })}
                  className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Foco infeccioso */}
          <div className="border rounded-lg print:rounded-none p-3">
            <div className="font-bold text-sm mb-2">DEFINIR FOCO INFECCIOSO E PRESCREVER ANTIBIOTICOTERAPIA</div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_pulmonary"
                  checked={formData.focus_pulmonary}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_pulmonary: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="focus_pulmonary">( ) PULMONAR</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_urinary"
                  checked={formData.focus_urinary}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_urinary: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="focus_urinary">( ) URINÁRIO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_abdominal"
                  checked={formData.focus_abdominal}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_abdominal: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="focus_abdominal">( ) ABDOMINAL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_skin"
                  checked={formData.focus_skin}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_skin: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="focus_skin">( ) CUTÂNEO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_neurological"
                  checked={formData.focus_neurological}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_neurological: checked as boolean })}
                  className="h-4 w-4"
                />
                <Label htmlFor="focus_neurological">( ) NEUROLÓGICO</Label>
              </div>
              <div className="flex gap-1 items-center">
                <span>OUTROS:</span>
                <Input
                  value={formData.focus_other}
                  onChange={(e) => setFormData({ ...formData, focus_other: e.target.value.toUpperCase() })}
                  className="h-7 w-48 print:border-0 print:border-b print:rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Disfunção orgânica após pacote */}
          <div className="border rounded-lg print:rounded-none p-3">
            <div className="font-bold text-sm mb-2">HÁ DISFUNÇÃO ORGÂNICA APÓS O RESULTADO DO PACOTE SEPSE?</div>
            <RadioGroup 
              value={formData.has_organic_dysfunction === null ? "" : formData.has_organic_dysfunction.toString()} 
              onValueChange={(value) => setFormData({ ...formData, has_organic_dysfunction: value === "true" })}
              className="flex gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="dysfunction_no" />
                <Label htmlFor="dysfunction_no" className="text-sm font-semibold cursor-pointer">NÃO - EXCLUIR PROTOCOLO DE SEPSE</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="dysfunction_yes" />
                <Label htmlFor="dysfunction_yes" className="text-sm font-semibold cursor-pointer">SIM</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.has_organic_dysfunction && (
            <>
              {/* Instruções de conduta */}
              <div className="border rounded-lg print:rounded-none p-3 text-xs space-y-1">
                <div>* Realizar reposição volêmica com 30 mL/kg de cristaloides e ajustar conforme janelas de perfusão (diurese, débito urinário e tempo de enchimento capilar)</div>
                <div>* Monitorar o paciente de 1 em 1 hora.</div>
                <div>* Monitorar débito urinário de 1 em 1 hora, passagem de sonda caso haja necessidade.</div>
                <div>* Caso PAM estiver &lt; 65 mmHG, iniciar terapia com vasopressor indicado noradrenalina.</div>
                <div>* Providenciar passagem de acesso central.</div>
                <div>* Coleta de segunda amostra do lactado.</div>
              </div>

              {/* Reposição volêmica */}
              <div className="border rounded-lg print:rounded-none p-3">
                <div className="font-bold text-sm mb-2">REPOSIÇÃO VOLÊMICA</div>
                <div className="flex gap-4 text-xs">
                  <div className="flex gap-1 items-center">
                    <span className="font-medium">PESO:</span>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.patient_weight}
                      onChange={(e) => setFormData({ ...formData, patient_weight: e.target.value })}
                      className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="font-medium">VOLUME ADMINISTRADO:</span>
                    <Input
                      type="number"
                      value={formData.volume_administered}
                      onChange={(e) => setFormData({ ...formData, volume_administered: e.target.value })}
                      className="h-7 w-24 print:border-0 print:border-b print:rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div className="border rounded-lg print:rounded-none p-3">
                <div className="font-bold text-sm mb-2">DEFINIR O DESTINO DO PACIENTE PARA UTI OU UNIDADE DE INTERNAÇÃO</div>
                <div className="space-y-2">
                  <div className="flex gap-4 items-center text-xs">
                    <span className="font-medium">DESTINO:</span>
                    <RadioGroup 
                      value={formData.destination} 
                      onValueChange={(value) => setFormData({ ...formData, destination: value })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UTI" id="dest_uti" />
                        <Label htmlFor="dest_uti" className="cursor-pointer">( ) UTI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Internação" id="dest_intern" />
                        <Label htmlFor="dest_intern" className="cursor-pointer">( ) INTERNAÇÃO</Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-1 items-center ml-auto">
                      <span className="font-medium">DATA:</span>
                      <Input
                        type="date"
                        value={formData.destination_date}
                        onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })}
                        className="h-7 w-32 print:border-0 print:border-b print:rounded-none"
                      />
                      <span className="font-medium">ÀS:</span>
                      <Input
                        type="time"
                        value={formData.destination_time}
                        onChange={(e) => setFormData({ ...formData, destination_time: e.target.value })}
                        className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desfecho */}
              <div className="border rounded-lg print:rounded-none p-3">
                <div className="space-y-2">
                  <div className="flex gap-4 items-center text-xs">
                    <span className="font-medium">DESFECHO:</span>
                    <RadioGroup 
                      value={formData.outcome} 
                      onValueChange={(value) => setFormData({ ...formData, outcome: value })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Alta" id="outcome_alta" />
                        <Label htmlFor="outcome_alta" className="cursor-pointer">( ) ALTA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Óbito" id="outcome_obito" />
                        <Label htmlFor="outcome_obito" className="cursor-pointer">( ) ÓBITO</Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-1 items-center ml-auto">
                      <span className="font-medium">DATA:</span>
                      <Input
                        type="date"
                        value={formData.outcome_date}
                        onChange={(e) => setFormData({ ...formData, outcome_date: e.target.value })}
                        className="h-7 w-32 print:border-0 print:border-b print:rounded-none"
                      />
                      <span className="font-medium">ÀS:</span>
                      <Input
                        type="time"
                        value={formData.outcome_time}
                        onChange={(e) => setFormData({ ...formData, outcome_time: e.target.value })}
                        className="h-7 w-20 print:border-0 print:border-b print:rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
