import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SepsisProtocolPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    patient_name: "",
    birth_date: "",
    attendance_number: "",
    hospital: "HOSPITAL GUARÁS",
    responsible_name: "",
    opening_date: new Date().toISOString().split('T')[0],
    opening_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    sirs_temp_high: false,
    sirs_temp_low: false,
    sirs_heart_rate: false,
    sirs_respiratory_rate: false,
    sirs_leukocytosis: false,
    sirs_leukopenia: false,
    sirs_young_cells: false,
    dysfunction_hypotension: false,
    dysfunction_oliguria: false,
    dysfunction_pao2: false,
    dysfunction_platelets: false,
    dysfunction_acidosis: false,
    dysfunction_consciousness: false,
    dysfunction_bilirubin: false,
    has_infection: null as boolean | null,
    blood_culture_date: "",
    blood_culture_time: "",
    lactate_date: "",
    lactate_time: "",
    antibiotic_prescription_date: "",
    antibiotic_prescription_time: "",
    focus_pulmonary: false,
    focus_urinary: false,
    focus_abdominal: false,
    focus_skin: false,
    focus_neurological: false,
    focus_other: "",
    has_organic_dysfunction: null as boolean | null,
    patient_weight: "",
    volume_administered: "",
    destination: "",
    destination_date: "",
    destination_time: "",
    outcome: "",
    outcome_date: "",
    outcome_time: "",
    notes: "",
  });


  const handleSave = async () => {
    try {
      const { error } = await supabase.from("sepsis_protocols").insert({
        ...formData,
        patient_id: null,
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
    } catch (error) {
      console.error("Error saving sepsis protocol:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o protocolo",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/documents/protocolo-sepse-adulto.pdf';
    link.download = 'PROTOCOLO_SEPSE_ADULTO.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
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
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            DOWNLOAD
          </Button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-8" style={{ fontSize: '10px' }}>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="whitespace-nowrap">Nome completo do paciente:</span>
          <div className="flex-1 border-b border-black">
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
              className="w-full bg-transparent border-none outline-none px-1"
              style={{ fontSize: '10px' }}
            />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="whitespace-nowrap">Data de nascimento:</span>
          <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="border-b border-black bg-transparent px-1" style={{ width: '80px', fontSize: '10px' }} />
          <span className="whitespace-nowrap ml-2">Atendimento:</span>
          <input type="text" value={formData.attendance_number} onChange={(e) => setFormData({ ...formData, attendance_number: e.target.value.toUpperCase() })} className="border-b border-black bg-transparent px-1" style={{ width: '100px', fontSize: '10px' }} />
          <span className="whitespace-nowrap ml-2">Hospital:</span>
          <input type="text" value={formData.hospital} onChange={(e) => setFormData({ ...formData, hospital: e.target.value.toUpperCase() })} className="flex-1 border-b border-black bg-transparent px-1" style={{ fontSize: '10px' }} />
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="whitespace-nowrap">Responsável pela abertura da ficha:</span>
          <input type="text" value={formData.responsible_name} onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value.toUpperCase() })} className="flex-1 border-b border-black bg-transparent px-1" style={{ fontSize: '10px' }} />
          <span className="whitespace-nowrap ml-2">Data:</span>
          <input type="date" value={formData.opening_date} onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })} className="border-b border-black bg-transparent px-1" style={{ width: '80px', fontSize: '10px' }} />
          <span className="whitespace-nowrap ml-2">Hora:</span>
          <input type="time" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} className="border-b border-black bg-transparent px-1" style={{ width: '60px', fontSize: '10px' }} />
        </div>

        <h1 className="text-center font-bold mb-2" style={{ fontSize: '13px' }}>GERENCIAMENTO DO PROTOCOLO DE SEPSE ADULTO</h1>
        <p className="text-[9px] italic mb-1">Marque com um X as opções dos critérios de alerta para SIRS.</p>

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
                    <input type="checkbox" checked={formData.sirs_temp_high} onChange={(e) => setFormData({ ...formData, sirs_temp_high: e.target.checked })} className="mt-0.5" />
                    <span>T.ax. &gt; 38,3°</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_temp_low} onChange={(e) => setFormData({ ...formData, sirs_temp_low: e.target.checked })} className="mt-0.5" />
                    <span>T.ax. &lt; 36,0°</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_heart_rate} onChange={(e) => setFormData({ ...formData, sirs_heart_rate: e.target.checked })} className="mt-0.5" />
                    <span>FC &gt; 90 bpm</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_respiratory_rate} onChange={(e) => setFormData({ ...formData, sirs_respiratory_rate: e.target.checked })} className="mt-0.5" />
                    <span>FR &gt; 20 rpm</span>
                  </label>
                  <div className="font-semibold mt-2 mb-1">Se exames disponíveis</div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_leukocytosis} onChange={(e) => setFormData({ ...formData, sirs_leukocytosis: e.target.checked })} className="mt-0.5" />
                    <span>Leucocitose &gt; 12000/mm3</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_leukopenia} onChange={(e) => setFormData({ ...formData, sirs_leukopenia: e.target.checked })} className="mt-0.5" />
                    <span>Leucopenia &lt; 4000/mm3</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.sirs_young_cells} onChange={(e) => setFormData({ ...formData, sirs_young_cells: e.target.checked })} className="mt-0.5" />
                    <span>&gt; 10% de células jovens</span>
                  </label>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <div className="space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_hypotension} onChange={(e) => setFormData({ ...formData, dysfunction_hypotension: e.target.checked })} className="mt-0.5" />
                    <span>Hipotensão (PAS &lt; 90 mmHg ou PAM &lt; 65 mmHg ou queda de PA &gt; 40 mmHg);</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_oliguria} onChange={(e) => setFormData({ ...formData, dysfunction_oliguria: e.target.checked })} className="mt-0.5" />
                    <span>Oligúria (≤ 0,5 mL/kg/h) ou elevação da creatinina (&gt; 2 mg/dL);</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_pao2} onChange={(e) => setFormData({ ...formData, dysfunction_pao2: e.target.checked })} className="mt-0.5" />
                    <span>Relação PaO2/FiO2 &lt; 300 ou necessidade de O2 para manter SpO2 &gt; 90%;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_platelets} onChange={(e) => setFormData({ ...formData, dysfunction_platelets: e.target.checked })} className="mt-0.5" />
                    <span>Contagem de plaquetas &lt; 100.000/mm³ ou redução de 50% no número de plaquetas em relação ao maior valor registrado nos últimos 3 dias;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_acidosis} onChange={(e) => setFormData({ ...formData, dysfunction_acidosis: e.target.checked })} className="mt-0.5" />
                    <span>Acidose metabólica inexplicável: déficit de bases ≤ 5,0 mEq/L e lactato acima do valor de referência;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_consciousness} onChange={(e) => setFormData({ ...formData, dysfunction_consciousness: e.target.checked })} className="mt-0.5" />
                    <span>Rebaixamento do nível de consciência, agitação, delirium;</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.dysfunction_bilirubin} onChange={(e) => setFormData({ ...formData, dysfunction_bilirubin: e.target.checked })} className="mt-0.5" />
                    <span>Aumento significativo de bilirrubinas (&gt; 2x o valor de referência).</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-[9px] mb-2">Pelo menos dois critérios de SIRS e/ou critério de disfunção orgânica.<br/>Realizar a abertura do protocolo de sepse e comunicar ao médico imediatamente.</p>

        <div className="mb-2">
          <p className="font-semibold mb-1" style={{ fontSize: '10px' }}>Há suspeita ou confirmação da presença de infecção?</p>
          <table className="w-full border-collapse border border-black text-[9px]">
            <tbody>
              <tr>
                <td className="border border-black p-2 text-center font-semibold w-16">
                  <label className="cursor-pointer flex items-center justify-center gap-1">
                    <input type="radio" name="has_infection" checked={formData.has_infection === false} onChange={() => setFormData({ ...formData, has_infection: false })} />
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
              <input type="radio" name="has_infection" checked={formData.has_infection === true} onChange={() => setFormData({ ...formData, has_infection: true })} />
              Sim
            </label>
          </div>
        </div>

        {formData.has_infection && (
          <>
            <div className="border border-black p-2 mb-2" style={{ fontSize: '9px' }}>
              <p className="font-semibold mb-1">Solicitar e coletar pacote sepse 1 hora</p>
              <div className="space-y-1">
                <div>Coleta hemocultura: data <input type="date" value={formData.blood_culture_date} onChange={(e) => setFormData({ ...formData, blood_culture_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.blood_culture_time} onChange={(e) => setFormData({ ...formData, blood_culture_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></div>
                <div>Coleta lactato: data <input type="date" value={formData.lactate_date} onChange={(e) => setFormData({ ...formData, lactate_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.lactate_time} onChange={(e) => setFormData({ ...formData, lactate_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></div>
                <div>Antibiótico: prescrição: data <input type="date" value={formData.antibiotic_prescription_date} onChange={(e) => setFormData({ ...formData, antibiotic_prescription_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.antibiotic_prescription_time} onChange={(e) => setFormData({ ...formData, antibiotic_prescription_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></div>
              </div>
            </div>

            <div className="border border-black p-2 mb-2" style={{ fontSize: '9px' }}>
              <p className="font-semibold mb-1">Definir foco infeccioso e prescrever antibioticoterapia</p>
              <div className="flex flex-wrap gap-2">
                <label><input type="checkbox" checked={formData.focus_pulmonary} onChange={(e) => setFormData({ ...formData, focus_pulmonary: e.target.checked })} /> ( ) pulmonar</label>
                <label><input type="checkbox" checked={formData.focus_urinary} onChange={(e) => setFormData({ ...formData, focus_urinary: e.target.checked })} /> ( ) urinário</label>
                <label><input type="checkbox" checked={formData.focus_abdominal} onChange={(e) => setFormData({ ...formData, focus_abdominal: e.target.checked })} /> ( ) abdominal</label>
                <label><input type="checkbox" checked={formData.focus_skin} onChange={(e) => setFormData({ ...formData, focus_skin: e.target.checked })} /> ( ) cutâneo</label>
                <label><input type="checkbox" checked={formData.focus_neurological} onChange={(e) => setFormData({ ...formData, focus_neurological: e.target.checked })} /> ( ) neurológico</label>
                <span>outros: <input type="text" value={formData.focus_other} onChange={(e) => setFormData({ ...formData, focus_other: e.target.value.toUpperCase() })} className="border-b border-black bg-transparent w-32 px-1" /></span>
              </div>
            </div>

            <div className="mb-2">
              <p className="font-semibold mb-1" style={{ fontSize: '10px' }}>Há disfunção orgânica após o resultado do pacote sepse?</p>
              <table className="w-full border-collapse border border-black text-[9px]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center font-semibold w-16">
                      <label className="cursor-pointer flex items-center justify-center gap-1">
                        <input type="radio" name="has_organic_dysfunction" checked={formData.has_organic_dysfunction === false} onChange={() => setFormData({ ...formData, has_organic_dysfunction: false })} />
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
                  <input type="radio" name="has_organic_dysfunction" checked={formData.has_organic_dysfunction === true} onChange={() => setFormData({ ...formData, has_organic_dysfunction: true })} />
                  Sim
                </label>
              </div>
            </div>

            {formData.has_organic_dysfunction && (
              <>
                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p>* Realizar reposição volêmica com 30 mL/kg de cristaloides e ajustar conforme janelas de perfusão (diurese, débito urinário e tempo de enchimento capilar)</p>
                  <p>* Monitorar o paciente de 1 em 1 hora.</p>
                  <p>* Monitorar débito urinário de 1 em 1 hora, passagem de sonda caso haja necessidade.</p>
                  <p>* Caso PAM estiver &lt; 65 mmHG, iniciar terapia com vasopressor indicado noradrenalina.</p>
                  <p>* Providenciar passagem de acesso central.</p>
                  <p>* Coleta de segunda amostra do lactado.</p>
                </div>

                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p className="font-semibold mb-1">Reposição volêmica</p>
                  <div className="flex gap-4">
                    <span>Peso: <input type="number" value={formData.patient_weight} onChange={(e) => setFormData({ ...formData, patient_weight: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></span>
                    <span>Volume administrado: <input type="number" value={formData.volume_administered} onChange={(e) => setFormData({ ...formData, volume_administered: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" /></span>
                  </div>
                </div>

                <div className="border border-black p-2 mb-2 text-[9px]">
                  <p className="font-semibold mb-1">Definir o destino do paciente para UTI ou Unidade de Internação.</p>
                  <div className="flex items-baseline gap-2">
                    <span>Destino:</span>
                    <label><input type="radio" name="destination" value="UTI" checked={formData.destination === "UTI"} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} /> ( ) UTI</label>
                    <label><input type="radio" name="destination" value="Internação" checked={formData.destination === "Internação"} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} /> ( ) Internação</label>
                    <span className="ml-auto">Data <input type="date" value={formData.destination_date} onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })} className="border-b border-black bg-transparent w-20 px-1" />, às <input type="time" value={formData.destination_time} onChange={(e) => setFormData({ ...formData, destination_time: e.target.value })} className="border-b border-black bg-transparent w-16 px-1" /></span>
                  </div>
                </div>

                <div className="border border-black p-2 text-[9px]">
                  <div className="flex items-baseline gap-2">
                    <span>Desfecho:</span>
                    <label><input type="radio" name="outcome" value="Alta" checked={formData.outcome === "Alta"} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} /> ( ) Alta</label>
                    <label><input type="radio" name="outcome" value="Óbito" checked={formData.outcome === "Óbito"} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} /> ( ) Óbito</label>
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
