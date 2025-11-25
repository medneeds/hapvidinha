import { useState, useEffect } from "react";
import { Plus, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

interface Patient {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  age: string | null;
}

const ResourcesPage = () => {
  const { user } = useAuth();
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
    <div className="p-6 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">
              Solicitações de Internação
            </h1>
            <p className="text-muted-foreground uppercase text-sm">
              {currentDepartment} • Criar e gerenciar solicitações
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Nueva Solicitação Section */}
      <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle className="uppercase text-xl">Nova Solicitação</CardTitle>
              </div>
              <CardDescription className="uppercase text-xs">
                Selecione um paciente do mapa atual e crie a solicitação de internação
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenSaveDialog}
              size="lg"
              className="gap-2 uppercase shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Criar Solicitação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase">Pacientes Disponíveis</p>
                <p className="text-2xl font-bold text-primary">{patients.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase">Banco de Dados</p>
                <p className="text-xs text-muted-foreground uppercase">Solicitações Salvas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase">Templates</p>
                <p className="text-xs text-muted-foreground uppercase">Modelos Personalizados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Notes Section */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="uppercase text-xl">Bloco de Notas & Templates</CardTitle>
          </div>
          <CardDescription className="uppercase text-xs">
            Utilize templates padrão ou crie modelos personalizados para suas solicitações
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <NotesTab />
        </CardContent>
      </Card>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Nova Solicitação de Internação
            </DialogTitle>
            <DialogDescription className="uppercase">
              Selecione o paciente e preencha os dados da solicitação
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="patient" className="uppercase font-semibold text-sm">
                Paciente do Mapa *
              </Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger className="uppercase h-12">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id} className="uppercase">
                      Leito {patient.bed_number} - {patient.name} ({getSectorLabel(patient.sector)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="destination" className="uppercase font-semibold text-sm">
                Destino da Internação *
              </Label>
              <Select
                value={formData.destination}
                onValueChange={(value) => setFormData({ ...formData, destination: value })}
              >
                <SelectTrigger className="uppercase h-12">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTI" className="uppercase">UTI - Unidade de Terapia Intensiva</SelectItem>
                  <SelectItem value="ENFERMARIA" className="uppercase">Enfermaria</SelectItem>
                  <SelectItem value="POSTO INTERNAÇÃO" className="uppercase">Posto Internação</SelectItem>
                  <SelectItem value="CIRURGIA" className="uppercase">Centro Cirúrgico</SelectItem>
                  <SelectItem value="HEMODINÂMICA" className="uppercase">Hemodinâmica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid gap-3">
              <Label htmlFor="title" className="uppercase font-semibold text-sm">
                Título da Solicitação *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                placeholder="Ex: Internação Cardiologia - IAM"
                className="uppercase h-12"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="content" className="uppercase font-semibold text-sm">
                Conteúdo da Solicitação *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value.toUpperCase() })}
                placeholder="Digite o conteúdo detalhado da solicitação..."
                className="min-h-[300px] font-mono text-sm uppercase resize-none"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              className="uppercase"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="uppercase gap-2"
            >
              <Database className="h-4 w-4" />
              Salvar no Banco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesPage;
