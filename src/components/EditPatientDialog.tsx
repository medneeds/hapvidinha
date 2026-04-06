import { useState, useEffect } from "react";
import { ClinikusAIDialog } from "@/components/ClinikusAIDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Patient, PatientCategory } from "@/types/patient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, FileText, AlertTriangle, Activity, Pill, Stethoscope, Plus, Trash2, Scissors, Brain, LayoutList, FileDown } from "lucide-react";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

interface EditPatientDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedPatient: Patient) => void;
}

// Helper component for array field editing
interface ArrayFieldEditorProps {
  items: string[];
  onUpdate: (items: string[]) => void;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

function ArrayFieldEditor({ items, onUpdate, label, placeholder, icon, accentColor }: ArrayFieldEditorProps) {
  const addItem = () => {
    onUpdate([...items, ""]);
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onUpdate(updated);
  };

  const finalizeItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value.toUpperCase();
    onUpdate(updated);
  };

  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className={cn("text-sm font-semibold flex items-center gap-2", accentColor)}>
          {icon}
          {label}
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addItem}
          className="h-7 px-2 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </Button>
      </div>
      <div className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">Nenhum item cadastrado</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex gap-1.5">
              <Input
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                onBlur={(e) => finalizeItem(idx, e.target.value)}
                placeholder={`${placeholder} ${idx + 1}`}
                className={cn("h-9 text-sm uppercase", accentColor && "border-red-200/50")}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeItem(idx)}
                className="h-9 w-9 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
  onSave,
}: EditPatientDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(patient);
  const [admissionHistoryLocal, setAdmissionHistoryLocal] = useState("");
  const { currentDepartment } = useDepartment();
  const isUti = currentDepartment === "UTI";
  const [clinikusOpen, setClinikusOpen] = useState(false);
  const [clinicusEnabled, setClinicusEnabled] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      supabase
        .from("clinicus_access")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setClinicusEnabled(data?.enabled ?? false);
        });
    }
  }, [open, user?.id]);

  // Reset form data when patient changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData(patient);
      setAdmissionHistoryLocal(patient.admissionHistory || "");
    }
  }, [open, patient]);

  const handleSave = () => {
    const finalFormData = {
      ...formData,
      admissionHistory: admissionHistoryLocal.toUpperCase()
    };
    onSave(finalFormData);
    onOpenChange(false);
  };

  const clearAllFields = () => {
    setFormData({
      ...patient,
      name: "",
      age: "",
      diagnoses: [],
      medicalHistory: [],
      relevantExams: [],
      pendencies: [],
      schedule: [],
      admissionHistory: "",
      admissionDate: new Date().toISOString().slice(0, 16).replace("T", " "),
      utiDevices: [],
      utiAllergies: [],
      utiCulturesAntibiotics: [],
      utiSpecialties: [],
      utiCurrentStatus: [],
      utiDailyConducts: [],
      utiOriginSector: [],
      utiAdmissionDate: [],
      utiDischargePrediction: [],
      utiAdmissionReason: [],
    });
    setAdmissionHistoryLocal("");
  };

  const sectorLabel = patient.sector === 'outside' ? 'Fora das Alas' : 
                        patient.sector === 'red' ? 'Sala Vermelha' :
                        patient.sector === 'yellow' ? 'Observação Amarela' : 'Observação Azul';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg truncate flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Edição Avançada - Leito {patient.bedNumber}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {patient.name} • {sectorLabel}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearAllFields}
              className="flex-shrink-0 h-8 px-3 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Tudo
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1">
          <div className="space-y-4 py-3">
            
            {/* Seção Principal: História Admissional */}
            <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <FileText className="h-4 w-4" />
                  História Admissional / Anamnese
                </Label>
                <div className="flex items-center gap-1">
                  {clinicusEnabled && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setClinikusOpen(true)}
                      className="h-6 px-2 text-xs gap-1 border-primary/50 bg-primary/5 text-primary hover:bg-primary/15 font-semibold"
                    >
                      <Brain className="h-3 w-3" />
                      Clinicus IA
                    </Button>
                  )
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date().toLocaleDateString('pt-BR');
                      const template = `# MEDICINA DE EMERGÊNCIA\n\n- ADMISSÃO: ${today}\n\n\n\n# HISTÓRIA DA DOENÇA ATUAL (HDA):\n\n\n\n# ANTECEDENTES MÓRBIDOS PESSOAIS (AMP):\n\n\n\n# MEDICAMENTOS DE USO CONTÍNUO (MUC):\n\n\n# ALERGIA MEDICAMENTOSA:\n\n\n\n# ANTROPOMETRIA: PESO KG / ESTATURA M\n\n\n\n# DISPOSITIVOS:\n\n\n\n# SSVV ADMISSIONAIS:\n\n> PA: MMHG | FC: BPM | FR: IRPM | SATO2: % | TAX °C | DX MG/DL\n\n\n# EXAME FÍSICO:\n\n- ESTADO GERAL:\n\n- CARDIOVASCULAR:\n\n- RESPIRATÓRIO:\n\n- ABDOMINAL:\n\n- EXTREMIDADES:\n\n\n# EXAMES LABORATORIAIS:\n\n> LAB (${today}):\n\n\n\n\n# EXAMES DE IMAGEM:\n\n> TC DE TÓRAX (${today}):\n\n\n# PARECERES/AVALIAÇÕES:\n\n> PARECER DA TELE CARDIOLOGIA (${today} – DRA BELTRANA):\n\n\n# EVOLUÇÃO/IMPRESSÃO CLÍNICA:\n\n\n# PLANO DE CUIDADOS:\n\n- MONITORIZAÇÃO MULTIPARAMÉTRICA CONTÍNUA\n\n- SUPORTE CLINICO E MULTIPROFISSIONAL\n\n- ADMISSÃO E PRESCRIÇÃO MÉDICAS\n\n- EXPANSÃO VOLÊMICA SF0,9% 30ML/KG\n\n- SOLICITO HEMOCULTURAS E UROCULTURA\n\n- ANTIBIOTICOTERAPIA ENDOVENOSA (INICIAR APÓS COLETA DE CULTURAS)\n\n- SOLICITO TC DE ABDOME TOTAL COM CONTRASTE\n\n- ACOMPANHAMENTO CONJUNTO A CIRURGIA GERAL\n\n- SOLICITO INTERNAÇÃO HOSPITALAR\n\n- ACOLHIMENTO DE PACIENTE E ACOMPANHANTES, EXPLICO SOBRE O QUADRO CLÍNICO E TERAPÊUTICA INICIAL\n\n\n# METAS TERAPÊUTICAS`;
                      setAdmissionHistoryLocal(template);
                    }}
                    className="h-6 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <FileDown className="h-3 w-3" />
                    Importar Modelo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setAdmissionHistoryLocal("")}
                    className="h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <Textarea
                value={admissionHistoryLocal}
                onChange={(e) => setAdmissionHistoryLocal(e.target.value)}
                onBlur={(e) => setAdmissionHistoryLocal(e.target.value.toUpperCase())}
                rows={14}
                placeholder="HISTÓRIA CLÍNICA DETALHADA, QUEIXA PRINCIPAL, HDA, EXAME FÍSICO ADMISSIONAL..."
                className="text-sm resize-y uppercase min-h-[320px]"
              />
              <p className="text-[10px] text-muted-foreground">
                Este campo é ideal para textos longos. Os demais campos clínicos (Diagnósticos, Antecedentes, Pendências) são editáveis diretamente no card do paciente.
              </p>
            </div>

            {/* Categoria do Paciente - Emergência */}
            {!isUti && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Categoria do Paciente
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: 'clinica_medica' as PatientCategory, label: 'Clínica Médica', icon: Stethoscope },
                    { value: 'cirurgico' as PatientCategory, label: 'Cirurgia', icon: Scissors },
                    { value: 'psiquiatrico' as PatientCategory, label: 'Psiquiátrica', icon: Brain },
                    { value: 'custom' as PatientCategory, label: 'Outros', icon: LayoutList },
                  ] as const).map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, patientCategory: cat.value as PatientCategory })}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left",
                        formData.patientCategory === cat.value || (!formData.patientCategory && cat.value === 'clinica_medica')
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <cat.icon className={cn(
                        "h-4 w-4",
                        (formData.patientCategory === cat.value || (!formData.patientCategory && cat.value === 'clinica_medica')) ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        (formData.patientCategory === cat.value || (!formData.patientCategory && cat.value === 'clinica_medica')) && "font-semibold text-primary"
                      )}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campos UTI Específicos - Apenas para UTI */}
            {isUti && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground border-b pb-2">
                  <Activity className="h-4 w-4" />
                  Campos Específicos UTI
                </div>

                {/* Dados Administrativos UTI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Setor de Origem</Label>
                    <Input
                      value={(formData.utiOriginSector || [])[0] || ""}
                      onChange={(e) => setFormData({ ...formData, utiOriginSector: [e.target.value] })}
                      onBlur={(e) => setFormData({ ...formData, utiOriginSector: [e.target.value.toUpperCase()] })}
                      placeholder="Ex: EMERGÊNCIA"
                      className="h-9 text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Admissão UTI</Label>
                    <Input
                      value={(formData.utiAdmissionDate || [])[0] || ""}
                      onChange={(e) => setFormData({ ...formData, utiAdmissionDate: [e.target.value] })}
                      onBlur={(e) => setFormData({ ...formData, utiAdmissionDate: [e.target.value.toUpperCase()] })}
                      placeholder="DD/MM/AAAA"
                      className="h-9 text-sm uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Previsão de Alta</Label>
                    <Input
                      value={(formData.utiDischargePrediction || [])[0] || ""}
                      onChange={(e) => setFormData({ ...formData, utiDischargePrediction: [e.target.value] })}
                      onBlur={(e) => setFormData({ ...formData, utiDischargePrediction: [e.target.value.toUpperCase()] })}
                      placeholder="DD/MM/AAAA"
                      className="h-9 text-sm uppercase"
                    />
                  </div>
                </div>

                {/* Motivo da Admissão */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Motivo da Admissão UTI
                  </Label>
                  <Textarea
                    value={(formData.utiAdmissionReason || [])[0] || ""}
                    onChange={(e) => setFormData({ ...formData, utiAdmissionReason: [e.target.value] })}
                    onBlur={(e) => setFormData({ ...formData, utiAdmissionReason: [e.target.value.toUpperCase()] })}
                    placeholder="MOTIVO DA ADMISSÃO NA UTI..."
                    className="h-20 text-sm uppercase resize-none"
                  />
                </div>

                {/* Campos Críticos - Grid 2 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 col-span-full">
                    <AlertTriangle className="h-4 w-4" />
                    Campos Críticos
                  </div>
                  
                  <ArrayFieldEditor
                    items={formData.utiDevices || []}
                    onUpdate={(items) => setFormData({ ...formData, utiDevices: items })}
                    label="Dispositivos"
                    placeholder="Dispositivo"
                    accentColor="text-red-600 dark:text-red-400"
                  />

                  <ArrayFieldEditor
                    items={formData.utiAllergies || []}
                    onUpdate={(items) => setFormData({ ...formData, utiAllergies: items })}
                    label="Alergias"
                    placeholder="Alergia"
                    accentColor="text-red-600 dark:text-red-400"
                  />

                  <ArrayFieldEditor
                    items={formData.utiCulturesAntibiotics || []}
                    onUpdate={(items) => setFormData({ ...formData, utiCulturesAntibiotics: items })}
                    label="Culturas / ATB"
                    placeholder="Cultura/ATB"
                    icon={<Pill className="h-3.5 w-3.5" />}
                    accentColor="text-red-600 dark:text-red-400"
                  />

                  <ArrayFieldEditor
                    items={formData.utiSpecialties || []}
                    onUpdate={(items) => setFormData({ ...formData, utiSpecialties: items })}
                    label="Especialidades"
                    placeholder="Especialidade"
                  />
                </div>

                {/* Quadro Atual */}
                <ArrayFieldEditor
                  items={formData.utiCurrentStatus || []}
                  onUpdate={(items) => setFormData({ ...formData, utiCurrentStatus: items })}
                  label="Quadro Atual"
                  placeholder="Status"
                  icon={<Activity className="h-3.5 w-3.5 text-primary" />}
                />
              </div>
            )}

            {/* Informação sobre edição inline */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">💡 Dica:</strong> Os campos de rotina clínica 
                (Diagnósticos, Antecedentes, Plano Terapêutico, Pendências) são editáveis diretamente 
                no card do paciente para agilizar o fluxo de trabalho durante os rounds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0 bg-background/95 backdrop-blur-sm">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="h-9">Salvar Alterações</Button>
        </div>
      </DialogContent>

      <ClinikusAIDialog
        open={clinikusOpen}
        onOpenChange={setClinikusOpen}
        onImport={(text) => setAdmissionHistoryLocal(text)}
      />
    </Dialog>
  );
}
