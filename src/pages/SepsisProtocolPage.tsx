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
    <div className="container mx-auto p-6 space-y-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">PROTOCOLO SEPSE ADULTO</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>DADOS DO PACIENTE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>NOME COMPLETO DO PACIENTE *</Label>
              <Input
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
                placeholder="NOME DO PACIENTE"
              />
            </div>
            <div>
              <Label>DATA DE NASCIMENTO</Label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div>
              <Label>ATENDIMENTO</Label>
              <Input
                value={formData.attendance_number}
                onChange={(e) => setFormData({ ...formData, attendance_number: e.target.value.toUpperCase() })}
                placeholder="NÚMERO DO ATENDIMENTO"
              />
            </div>
            <div>
              <Label>HOSPITAL</Label>
              <Input
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RESPONSÁVEL PELA ABERTURA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>NOME</Label>
              <Input
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value.toUpperCase() })}
                placeholder="NOME DO RESPONSÁVEL"
              />
            </div>
            <div>
              <Label>DATA</Label>
              <Input
                type="date"
                value={formData.opening_date}
                onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
              />
            </div>
            <div>
              <Label>HORA</Label>
              <Input
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CRITÉRIOS DE SIRS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_temp_high"
                checked={formData.sirs_temp_high}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_temp_high: checked as boolean })}
              />
              <Label htmlFor="sirs_temp_high">T.AX. &gt; 38,3°</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_temp_low"
                checked={formData.sirs_temp_low}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_temp_low: checked as boolean })}
              />
              <Label htmlFor="sirs_temp_low">T.AX. &lt; 36,0°</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_heart_rate"
                checked={formData.sirs_heart_rate}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_heart_rate: checked as boolean })}
              />
              <Label htmlFor="sirs_heart_rate">FC &gt; 90 BPM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_respiratory_rate"
                checked={formData.sirs_respiratory_rate}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_respiratory_rate: checked as boolean })}
              />
              <Label htmlFor="sirs_respiratory_rate">FR &gt; 20 RPM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_leukocytosis"
                checked={formData.sirs_leukocytosis}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_leukocytosis: checked as boolean })}
              />
              <Label htmlFor="sirs_leukocytosis">LEUCOCITOSE &gt; 12000/mm³</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_leukopenia"
                checked={formData.sirs_leukopenia}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_leukopenia: checked as boolean })}
              />
              <Label htmlFor="sirs_leukopenia">LEUCOPENIA &lt; 4000/mm³</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sirs_young_cells"
                checked={formData.sirs_young_cells}
                onCheckedChange={(checked) => setFormData({ ...formData, sirs_young_cells: checked as boolean })}
              />
              <Label htmlFor="sirs_young_cells">&gt; 10% DE CÉLULAS JOVENS</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRITÉRIOS DE DISFUNÇÃO ORGÂNICA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_hypotension"
                checked={formData.dysfunction_hypotension}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_hypotension: checked as boolean })}
              />
              <Label htmlFor="dysfunction_hypotension" className="text-xs">HIPOTENSÃO (PAS &lt; 90 mmHg)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_oliguria"
                checked={formData.dysfunction_oliguria}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_oliguria: checked as boolean })}
              />
              <Label htmlFor="dysfunction_oliguria" className="text-xs">OLIGÚRIA (≤ 0,5 mL/kg/h)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_pao2"
                checked={formData.dysfunction_pao2}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_pao2: checked as boolean })}
              />
              <Label htmlFor="dysfunction_pao2" className="text-xs">PaO2/FiO2 &lt; 300</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_platelets"
                checked={formData.dysfunction_platelets}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_platelets: checked as boolean })}
              />
              <Label htmlFor="dysfunction_platelets" className="text-xs">PLAQUETAS &lt; 100.000/mm³</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_acidosis"
                checked={formData.dysfunction_acidosis}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_acidosis: checked as boolean })}
              />
              <Label htmlFor="dysfunction_acidosis" className="text-xs">ACIDOSE METABÓLICA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_consciousness"
                checked={formData.dysfunction_consciousness}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_consciousness: checked as boolean })}
              />
              <Label htmlFor="dysfunction_consciousness" className="text-xs">REBAIXAMENTO DE CONSCIÊNCIA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dysfunction_bilirubin"
                checked={formData.dysfunction_bilirubin}
                onCheckedChange={(checked) => setFormData({ ...formData, dysfunction_bilirubin: checked as boolean })}
              />
              <Label htmlFor="dysfunction_bilirubin" className="text-xs">AUMENTO DE BILIRRUBINAS</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HÁ SUSPEITA OU CONFIRMAÇÃO DE INFECÇÃO?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.has_infection === null ? "" : formData.has_infection.toString()} 
            onValueChange={(value) => setFormData({ ...formData, has_infection: value === "true" })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="infection_yes" />
              <Label htmlFor="infection_yes">SIM</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="infection_no" />
              <Label htmlFor="infection_no">NÃO - EXCLUIR DO PROTOCOLO</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {formData.has_infection && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>COLETAS E ANTIBIÓTICO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>HEMOCULTURA - DATA</Label>
                  <Input
                    type="date"
                    value={formData.blood_culture_date}
                    onChange={(e) => setFormData({ ...formData, blood_culture_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>HEMOCULTURA - HORA</Label>
                  <Input
                    type="time"
                    value={formData.blood_culture_time}
                    onChange={(e) => setFormData({ ...formData, blood_culture_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>LACTATO - DATA</Label>
                  <Input
                    type="date"
                    value={formData.lactate_date}
                    onChange={(e) => setFormData({ ...formData, lactate_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>LACTATO - HORA</Label>
                  <Input
                    type="time"
                    value={formData.lactate_time}
                    onChange={(e) => setFormData({ ...formData, lactate_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ANTIBIÓTICO PRESCRIÇÃO - DATA</Label>
                  <Input
                    type="date"
                    value={formData.antibiotic_prescription_date}
                    onChange={(e) => setFormData({ ...formData, antibiotic_prescription_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ANTIBIÓTICO PRESCRIÇÃO - HORA</Label>
                  <Input
                    type="time"
                    value={formData.antibiotic_prescription_time}
                    onChange={(e) => setFormData({ ...formData, antibiotic_prescription_time: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FOCO INFECCIOSO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_pulmonary"
                  checked={formData.focus_pulmonary}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_pulmonary: checked as boolean })}
                />
                <Label htmlFor="focus_pulmonary">PULMONAR</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_urinary"
                  checked={formData.focus_urinary}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_urinary: checked as boolean })}
                />
                <Label htmlFor="focus_urinary">URINÁRIO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_abdominal"
                  checked={formData.focus_abdominal}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_abdominal: checked as boolean })}
                />
                <Label htmlFor="focus_abdominal">ABDOMINAL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_skin"
                  checked={formData.focus_skin}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_skin: checked as boolean })}
                />
                <Label htmlFor="focus_skin">CUTÂNEO</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="focus_neurological"
                  checked={formData.focus_neurological}
                  onCheckedChange={(checked) => setFormData({ ...formData, focus_neurological: checked as boolean })}
                />
                <Label htmlFor="focus_neurological">NEUROLÓGICO</Label>
              </div>
              <div>
                <Label>OUTROS</Label>
                <Input
                  value={formData.focus_other}
                  onChange={(e) => setFormData({ ...formData, focus_other: e.target.value.toUpperCase() })}
                  placeholder="ESPECIFICAR OUTRO FOCO"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HÁ DISFUNÇÃO ORGÂNICA APÓS O RESULTADO DO PACOTE SEPSE?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.has_organic_dysfunction === null ? "" : formData.has_organic_dysfunction.toString()} 
                onValueChange={(value) => setFormData({ ...formData, has_organic_dysfunction: value === "true" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="dysfunction_yes" />
                  <Label htmlFor="dysfunction_yes">SIM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="dysfunction_no" />
                  <Label htmlFor="dysfunction_no">NÃO - EXCLUIR PROTOCOLO DE SEPSE</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {formData.has_organic_dysfunction && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>REPOSIÇÃO VOLÊMICA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>PESO (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.patient_weight}
                        onChange={(e) => setFormData({ ...formData, patient_weight: e.target.value })}
                        placeholder="PESO DO PACIENTE"
                      />
                    </div>
                    <div>
                      <Label>VOLUME ADMINISTRADO (ML)</Label>
                      <Input
                        type="number"
                        value={formData.volume_administered}
                        onChange={(e) => setFormData({ ...formData, volume_administered: e.target.value })}
                        placeholder="VOLUME"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>DESTINO E DESFECHO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>DESTINO</Label>
                    <RadioGroup value={formData.destination} onValueChange={(value) => setFormData({ ...formData, destination: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UTI" id="dest_uti" />
                        <Label htmlFor="dest_uti">UTI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Internação" id="dest_intern" />
                        <Label htmlFor="dest_intern">INTERNAÇÃO</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>DATA</Label>
                      <Input
                        type="date"
                        value={formData.destination_date}
                        onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>HORA</Label>
                      <Input
                        type="time"
                        value={formData.destination_time}
                        onChange={(e) => setFormData({ ...formData, destination_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>DESFECHO</Label>
                    <RadioGroup value={formData.outcome} onValueChange={(value) => setFormData({ ...formData, outcome: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Alta" id="outcome_alta" />
                        <Label htmlFor="outcome_alta">ALTA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Óbito" id="outcome_obito" />
                        <Label htmlFor="outcome_obito">ÓBITO</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>DATA</Label>
                      <Input
                        type="date"
                        value={formData.outcome_date}
                        onChange={(e) => setFormData({ ...formData, outcome_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>HORA</Label>
                      <Input
                        type="time"
                        value={formData.outcome_time}
                        onChange={(e) => setFormData({ ...formData, outcome_time: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OBSERVAÇÕES</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value.toUpperCase() })}
                    placeholder="OBSERVAÇÕES ADICIONAIS"
                    rows={4}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
