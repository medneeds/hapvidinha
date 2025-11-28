import { useState, useRef, useEffect } from "react";
import { Patient } from "@/types/patient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Edit, Trash2, Copy, Printer, Check, X, MoreVertical, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MedicalResponsibilityIndicator } from "./MedicalResponsibilityIndicator";
import { formatAgeDisplay } from "@/utils/ageDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PatientCardUTIProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onDelete?: (patientId: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (patientId: string) => void;
}

const sectorColorMap = {
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  outside: "#6b7280"
};

export function PatientCardUTI({ 
  patient, 
  onUpdate, 
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelection
}: PatientCardUTIProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast: toastHook } = useToast();

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const saveFieldEdit = () => {
    if (!editingField) return;

    const updates: Partial<Patient> = {};
    
    switch (editingField) {
      case "name":
        updates.name = editValue;
        break;
      case "age":
        updates.age = editValue;
        break;
      case "diagnoses":
        updates.diagnoses = editValue.split('\n').filter(d => d.trim());
        break;
      case "medicalHistory":
        updates.medicalHistory = editValue.split('\n').filter(h => h.trim());
        break;
      case "relevantExams":
        updates.relevantExams = editValue.split('\n').filter(e => e.trim());
        break;
      case "pendencies":
        updates.pendencies = editValue.split('\n').filter(p => p.trim());
        break;
      case "utiAdmissionDate":
        updates.utiAdmissionDate = editValue;
        break;
      case "utiDischargePrediction":
        updates.utiDischargePrediction = editValue;
        break;
      case "utiAllergies":
        updates.utiAllergies = editValue;
        break;
      case "utiAdmissionReason":
        updates.utiAdmissionReason = editValue;
        break;
      case "utiCurrentStatus":
        updates.utiCurrentStatus = editValue;
        break;
      case "utiDevices":
        updates.utiDevices = editValue;
        break;
      case "utiCulturesAntibiotics":
        updates.utiCulturesAntibiotics = editValue;
        break;
      case "utiSpecialties":
        updates.utiSpecialties = editValue;
        break;
    }

    onUpdate({ ...patient, ...updates });
    setEditingField(null);
    setEditValue("");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveFieldEdit();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const handleCopyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(patient.name);
      toastHook({
        title: "Nome copiado",
        description: `"${patient.name}" foi copiado para a área de transferência.`,
      });
    } catch (err) {
      toastHook({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o nome.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow border-l-4 border-l-critical">
      <div className="flex items-start justify-between gap-2">
        {/* Coluna de seleção e leito */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.(patient.id)}
              className="flex-shrink-0"
            />
          )}
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" style={{ color: sectorColorMap[patient.sector] }} />
            <Badge variant="outline" className="font-bold">
              {patient.bedNumber}
            </Badge>
          </div>
        </div>

        {/* Nome e idade */}
        <div className="flex-1 min-w-0">
          {editingField === "name" ? (
            <div className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm font-semibold uppercase"
              />
              <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-6 w-6">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-6 w-6">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="font-semibold text-sm cursor-pointer hover:bg-accent/50 rounded px-1"
              onClick={() => startEditing("name", patient.name)}
            >
              {patient.name || <span className="text-muted-foreground italic">Adicionar nome</span>}
            </div>
          )}
          
          {editingField === "age" ? (
            <div className="flex items-center gap-1 mt-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-6 text-xs"
                placeholder="Idade"
              />
              <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-5 w-5">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-5 w-5">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="text-xs text-muted-foreground mt-1 cursor-pointer hover:bg-accent/50 rounded px-1"
              onClick={() => startEditing("age", typeof patient.age === 'number' ? patient.age.toString() : patient.age)}
            >
              {patient.age ? formatAgeDisplay(patient.age) : <span className="italic">Adicionar idade</span>}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopyName}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Copiar nome"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete?.(patient.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir paciente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Campos UTI em modo compacto */}
      {!isExpanded && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-muted-foreground">Admissão UTI:</span>
              <p className="text-foreground">{patient.utiAdmissionDate ? new Date(patient.utiAdmissionDate).toLocaleString('pt-BR') : 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Previsão Alta:</span>
              <p className="text-foreground">{patient.utiDischargePrediction || 'Não informado'}</p>
            </div>
          </div>
          
          {patient.utiAllergies && (
            <div>
              <span className="font-medium text-muted-foreground">Alergias:</span>
              <p className="text-foreground whitespace-pre-wrap">{patient.utiAllergies}</p>
            </div>
          )}
          
          {patient.utiAdmissionReason && (
            <div>
              <span className="font-medium text-muted-foreground">Motivo Admissão:</span>
              <p className="text-foreground whitespace-pre-wrap line-clamp-2">{patient.utiAdmissionReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Campos expandidos */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Admissão na UTI */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Admissão na UTI
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiAdmissionDate", patient.utiAdmissionDate || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiAdmissionDate" ? (
              <div className="flex gap-1">
                <Input
                  ref={inputRef as any}
                  type="datetime-local"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs"
                />
                <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <p className="text-xs">{patient.utiAdmissionDate ? new Date(patient.utiAdmissionDate).toLocaleString('pt-BR') : 'Não informado'}</p>
            )}
          </div>

          {/* Previsão de Alta */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Previsão de Alta
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiDischargePrediction", patient.utiDischargePrediction || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiDischargePrediction" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[60px]"
                  placeholder="Ex: 3-5 dias"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiDischargePrediction || 'Não informado'}</p>
            )}
          </div>

          {/* Alergias */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Alergias
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiAllergies", patient.utiAllergies || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiAllergies" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[60px]"
                  placeholder="Alergias conhecidas"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiAllergies || 'Nenhuma alergia conhecida'}</p>
            )}
          </div>

          {/* Motivo da Admissão */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Motivo da Admissão
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiAdmissionReason", patient.utiAdmissionReason || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiAdmissionReason" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Descreva o motivo da admissão"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiAdmissionReason || 'Não informado'}</p>
            )}
          </div>

          {/* Quadro Atual */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Quadro Atual
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiCurrentStatus", patient.utiCurrentStatus || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiCurrentStatus" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Estado clínico atual do paciente"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiCurrentStatus || 'Não informado'}</p>
            )}
          </div>

          {/* Dispositivos e Data de Inserção */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Dispositivos e Data de Inserção
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiDevices", patient.utiDevices || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiDevices" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[100px]"
                  placeholder="Ex: VM (IOT em 26/11), CVC subclávia D (26/11), SVD (26/11)"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiDevices || 'Nenhum dispositivo registrado'}</p>
            )}
          </div>

          {/* Culturas e Antibióticos em Curso */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Culturas e Antibióticos em Curso
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiCulturesAntibiotics", patient.utiCulturesAntibiotics || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiCulturesAntibiotics" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[100px]"
                  placeholder="Culturas coletadas e antibióticos em uso"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiCulturesAntibiotics || 'Nenhuma cultura ou ATB registrado'}</p>
            )}
          </div>

          {/* Especialidades Envolvidas */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Especialidades Envolvidas
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("utiSpecialties", patient.utiSpecialties || "")}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "utiSpecialties" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[60px]"
                  placeholder="Ex: Pneumologia, Infectologia"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs whitespace-pre-wrap">{patient.utiSpecialties || 'Nenhuma especialidade registrada'}</p>
            )}
          </div>

          {/* Divisor entre campos UTI e campos padrão */}
          <div className="border-t pt-3 mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">CAMPOS PADRÃO DO PACIENTE</p>
          </div>

          {/* Hipóteses / Diagnósticos */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Hipóteses / Diagnósticos
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("diagnoses", (patient.diagnoses || []).join('\n'))}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "diagnoses" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Digite cada hipótese em uma linha separada"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs">
                {patient.diagnoses && patient.diagnoses.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patient.diagnoses.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">Nenhum diagnóstico registrado</p>
                )}
              </div>
            )}
          </div>

          {/* Antecedentes / Comorbidades */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Antecedentes / Comorbidades
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("medicalHistory", (patient.medicalHistory || []).join('\n'))}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "medicalHistory" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Digite cada antecedente em uma linha separada"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs">
                {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patient.medicalHistory.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">Nenhum antecedente registrado</p>
                )}
              </div>
            )}
          </div>

          {/* Exames */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Exames
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("relevantExams", (patient.relevantExams || []).join('\n'))}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "relevantExams" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Digite cada exame em uma linha separada"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs">
                {patient.relevantExams && patient.relevantExams.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {patient.relevantExams.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">Nenhum exame registrado</p>
                )}
              </div>
            )}
          </div>

          {/* Programações / Pendências */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
              Programações / Pendências
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startEditing("pendencies", (patient.pendencies || []).join('\n'))}
                className="h-4 w-4 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </label>
            {editingField === "pendencies" ? (
              <div className="flex gap-1">
                <Textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs min-h-[80px]"
                  placeholder="Digite cada pendência em uma linha separada"
                />
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={saveFieldEdit} className="h-8 w-8">
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs">
                {patient.pendencies && patient.pendencies.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {patient.pendencies.map((p, i) => (
                      <li key={i} className={patient.highlightedPendencies?.includes(i) ? "font-bold text-amber-600 dark:text-amber-400" : ""}>
                        {p}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground italic">Nenhuma pendência registrada</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}