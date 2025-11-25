import { useState, useEffect } from "react";
import { ArrowLeft, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotesTab from "@/components/resources/NotesTab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  age: string | null;
}

const ResourcesPage = () => {
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const { currentDepartment } = useDepartment();
  const { toast } = useToast();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    destination: "",
  });

  useEffect(() => {
    loadPatients();
  }, [currentDepartment]);

  const loadPatients = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, bed_number, sector, age")
      .eq("department", currentDepartment)
      .order("sector", { ascending: true })
      .order("bed_number", { ascending: true });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao carregar pacientes:", error);
      }
      return;
    }

    setPatients(data || []);
  };

  const handleOpenSaveDialog = () => {
    setSelectedPatient("");
    setFormData({
      title: "",
      content: "",
      destination: "",
    });
    setIsSaveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      toast({
        title: "ERRO",
        description: "SELECIONE UM PACIENTE DO MAPA",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "ERRO",
        description: "TÍTULO DA SOLICITAÇÃO É OBRIGATÓRIO",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "ERRO",
        description: "CONTEÚDO DA SOLICITAÇÃO É OBRIGATÓRIO",
        variant: "destructive",
      });
      return;
    }

    if (!formData.destination) {
      toast({
        title: "ERRO",
        description: "SELECIONE O DESTINO DA INTERNAÇÃO",
        variant: "destructive",
      });
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({
        title: "ERRO",
        description: "USUÁRIO NÃO AUTENTICADO",
        variant: "destructive",
      });
      return;
    }

    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) {
      toast({
        title: "ERRO",
        description: "PACIENTE NÃO ENCONTRADO",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("internment_requests")
      .insert({
        patient_name: patient.name.toUpperCase(),
        patient_age: patient.age ? parseInt(patient.age) : null,
        patient_sex: null,
        patient_record: null,
        title: `${formData.title.toUpperCase()} - DESTINO: ${formData.destination}`,
        content: formData.content.toUpperCase(),
        created_by: currentUser.id,
      });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao salvar:", error);
      }
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL SALVAR A SOLICITAÇÃO",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "SALVO",
      description: "SOLICITAÇÃO SALVA COM SUCESSO NO BANCO",
    });

    setIsSaveDialogOpen(false);
  };

  const getSectorLabel = (sector: string) => {
    switch (sector) {
      case 'red': return 'SALA VERMELHA';
      case 'yellow': return 'OBSERVAÇÃO AMARELA';
      case 'blue': return 'OBSERVAÇÃO AZUL';
      case 'outside': return 'FORA DAS ALAS';
      default: return sector;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                SOLICITAÇÕES DE INTERNAÇÃO
              </h1>
              <p className="text-sm text-muted-foreground uppercase">
                {currentDepartment} • CRIAR E GERENCIAR SOLICITAÇÕES
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground uppercase tracking-tight">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">
                {role === 'admin' ? 'Coordenador' : 'Médico'}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Request Button */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold uppercase mb-1">NOVA SOLICITAÇÃO</h2>
              <p className="text-sm text-muted-foreground uppercase">
                Selecione um paciente do mapa e crie a solicitação de internação
              </p>
            </div>
            <Button
              onClick={handleOpenSaveDialog}
              className="gap-2 uppercase"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              CRIAR SOLICITAÇÃO
            </Button>
          </div>
        </Card>

        {/* Notes Tab */}
        <NotesTab />
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">NOVA SOLICITAÇÃO DE INTERNAÇÃO</DialogTitle>
            <DialogDescription className="uppercase">
              SELECIONE O PACIENTE E PREENCHA OS DADOS DA SOLICITAÇÃO
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient" className="uppercase">
                PACIENTE DO MAPA *
              </Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger className="uppercase">
                  <SelectValue placeholder="SELECIONE UM PACIENTE" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id} className="uppercase">
                      LEITO {patient.bed_number} - {patient.name} ({getSectorLabel(patient.sector)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination" className="uppercase">
                DESTINO DA INTERNAÇÃO *
              </Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => setFormData({ ...formData, destination: value })}
              >
                <SelectTrigger className="uppercase">
                  <SelectValue placeholder="SELECIONE O DESTINO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTI" className="uppercase">UTI</SelectItem>
                  <SelectItem value="ENFERMARIA" className="uppercase">ENFERMARIA</SelectItem>
                  <SelectItem value="POSTO INTERNAÇÃO" className="uppercase">POSTO INTERNAÇÃO</SelectItem>
                  <SelectItem value="CIRURGIA" className="uppercase">CIRURGIA</SelectItem>
                  <SelectItem value="HEMODINÂMICA" className="uppercase">HEMODINÂMICA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="uppercase">
                TÍTULO DA SOLICITAÇÃO *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                placeholder="EX: INTERNAÇÃO CARDIOLOGIA - IAM"
                className="uppercase"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content" className="uppercase">
                CONTEÚDO DA SOLICITAÇÃO *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value.toUpperCase() })}
                placeholder="DIGITE O CONTEÚDO DA SOLICITAÇÃO..."
                className="min-h-[300px] font-mono text-sm uppercase"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              className="uppercase"
            >
              CANCELAR
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="uppercase"
            >
              SALVAR NO BANCO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesPage;
