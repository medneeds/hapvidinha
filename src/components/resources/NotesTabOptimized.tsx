import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Copy,
  Trash2,
  FileInput,
  Save,
  FolderOpen,
  Printer,
  Plus,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { internmentTemplate } from "@/data/internmentTemplate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const NotesTabOptimized = () => {
  const [notes, setNotes] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [scheduledContent, setScheduledContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const { toast } = useToast();
  const { currentDepartment } = useDepartment();

  useEffect(() => {
    const stored = localStorage.getItem("customTemplates");
    if (stored) {
      setSavedTemplates(JSON.parse(stored));
    }
    
    loadChecklistFromDB();
  }, [currentDepartment]);

  const loadChecklistFromDB = async () => {
    const { data, error } = await supabase
      .from("notes_reminders")
      .select("*")
      .eq("department", currentDepartment)
      .eq("type", "checklist_item")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar checklist:", error);
      return;
    }

    setChecklistItems(
      (data || []).map((item) => ({
        id: item.id,
        text: item.content,
        completed: item.completed,
      }))
    );
  };

  const saveTemplatesToStorage = (templates: SavedTemplate[]) => {
    localStorage.setItem("customTemplates", JSON.stringify(templates));
    setSavedTemplates(templates);
  };

  const handleImportTemplate = () => {
    setNotes(internmentTemplate);
    toast({
      title: "MODELO IMPORTADO",
      description: "TEMPLATE DE SOLICITAÇÃO DE INTERNAÇÃO CARREGADO COM SUCESSO",
    });
  };

  const handleSaveFreeText = async () => {
    if (!notes.trim()) {
      toast({
        title: "ERRO",
        description: "NÃO HÁ CONTEÚDO PARA SALVAR",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("notes_reminders").insert({
      department: currentDepartment,
      content: notes,
      type: "free_text",
      is_active: true,
    });

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL SALVAR A ANOTAÇÃO",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "SALVO",
      description: "ANOTAÇÃO SALVA NA CENTRAL DE NOTIFICAÇÕES",
    });
    
    setNotes("");
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;

    const { error } = await supabase.from("notes_reminders").insert({
      department: currentDepartment,
      content: newChecklistItem.toUpperCase(),
      type: "checklist_item",
      completed: false,
      is_active: true,
    });

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL ADICIONAR O ITEM",
        variant: "destructive",
      });
      return;
    }

    setNewChecklistItem("");
    loadChecklistFromDB();
    
    toast({
      title: "ADICIONADO",
      description: "ITEM ADICIONADO AO CHECKLIST",
    });
  };

  const toggleChecklistItem = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("notes_reminders")
      .update({ completed: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL ATUALIZAR O ITEM",
        variant: "destructive",
      });
      return;
    }

    loadChecklistFromDB();
  };

  const deleteChecklistItem = async (id: string) => {
    const { error } = await supabase
      .from("notes_reminders")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL REMOVER O ITEM",
        variant: "destructive",
      });
      return;
    }

    loadChecklistFromDB();
    toast({
      title: "REMOVIDO",
      description: "ITEM REMOVIDO DO CHECKLIST",
    });
  };

  const handleSchedulePopup = async () => {
    if (!scheduledContent.trim() || !scheduledDate || !scheduledTime) {
      toast({
        title: "ERRO",
        description: "PREENCHA TODOS OS CAMPOS",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;

    const { error } = await supabase.from("notes_reminders").insert({
      department: currentDepartment,
      content: scheduledContent.toUpperCase(),
      type: "free_text",
      scheduled_popup_time: scheduledDateTime,
      is_active: true,
    });

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL AGENDAR O LEMBRETE",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "AGENDADO",
      description: `LEMBRETE PROGRAMADO PARA ${new Date(scheduledDateTime).toLocaleString("pt-BR")}`,
    });

    setScheduledContent("");
    setScheduledDate("");
    setScheduledTime("");
    setIsScheduleDialogOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      toast({
        title: "COPIADO",
        description: "TEXTO COPIADO PARA A ÁREA DE TRANSFERÊNCIA",
      });
    } catch (err) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL COPIAR O TEXTO",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ANAMNESE_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "DOWNLOAD REALIZADO",
      description: "ARQUIVO SALVO COM SUCESSO",
    });
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "IMPRESSÃO INICIADA",
      description: "PREPARANDO DOCUMENTO PARA IMPRESSÃO",
    });
  };

  const handleClear = () => {
    setNotes("");
    toast({
      title: "LIMPO",
      description: "TODO O TEXTO FOI REMOVIDO",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value.toUpperCase());
  };

  const handleOpenSaveDialog = () => {
    if (!notes.trim()) {
      toast({
        title: "ERRO",
        description: "NÃO HÁ CONTEÚDO PARA SALVAR",
        variant: "destructive",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "ERRO",
        description: "DIGITE UM NOME PARA O MODELO",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName.toUpperCase(),
      content: notes,
      createdAt: new Date().toISOString(),
    };

    const updatedTemplates = [...savedTemplates, newTemplate];
    saveTemplatesToStorage(updatedTemplates);

    toast({
      title: "MODELO SALVO",
      description: `MODELO "${templateName.toUpperCase()}" SALVO COM SUCESSO`,
    });

    setTemplateName("");
    setIsSaveDialogOpen(false);
  };

  const handleLoadTemplate = (template: SavedTemplate) => {
    setNotes(template.content);
    toast({
      title: "MODELO CARREGADO",
      description: `MODELO "${template.name}" CARREGADO COM SUCESSO`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = savedTemplates.filter((t) => t.id !== templateId);
    saveTemplatesToStorage(updatedTemplates);
    toast({
      title: "MODELO EXCLUÍDO",
      description: "MODELO REMOVIDO COM SUCESSO",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="uppercase">
            ANOTAÇÕES LIVRES
          </TabsTrigger>
          <TabsTrigger value="checklist" className="uppercase">
            CHECKLIST
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex items-center justify-between print:hidden flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportTemplate}
                className="gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/50 transition-all uppercase"
              >
                <FileInput className="h-4 w-4" />
                IMPORTAR MODELO
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                disabled={!notes}
                className="gap-2 hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50 transition-all uppercase"
              >
                <Save className="h-4 w-4" />
                SALVAR COMO MODELO
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveFreeText}
                disabled={!notes}
                className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
              >
                <Save className="h-4 w-4" />
                SALVAR NA CENTRAL
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleDialogOpen(true)}
                className="gap-2 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/50 transition-all uppercase"
              >
                <Clock className="h-4 w-4" />
                PROGRAMAR LEMBRETE
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savedTemplates.length === 0}
                    className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
                  >
                    <FolderOpen className="h-4 w-4" />
                    MEUS MODELOS ({savedTemplates.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="uppercase">MODELOS SALVOS</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      className="flex items-center justify-between group uppercase"
                    >
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="flex-1 text-left uppercase"
                      >
                        {template.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold uppercase text-center">ANOTAÇÕES MÉDICAS</h1>
            <p className="text-sm text-center mt-2">
              Data: {new Date().toLocaleDateString("pt-BR")} -{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
            <hr className="my-4 border-t-2 border-gray-300" />
          </div>

          <Card className="p-6 shadow-xl border-2 print:border-0 print:shadow-none print:p-0">
            <div className="space-y-4 print:space-y-0">
              <Textarea
                value={notes}
                onChange={handleChange}
                placeholder="DIGITE SUA ANAMNESE AQUI OU IMPORTE O MODELO PADRÃO..."
                className="min-h-[600px] font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase print:min-h-0 print:border-0 print:focus:ring-0 print:p-0"
              />

              <div className="flex items-center justify-between print:hidden">
                <div className="text-xs text-muted-foreground uppercase">
                  {notes.length} CARACTERES
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!notes}
                    className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
                  >
                    <Copy className="h-4 w-4" />
                    COPIAR
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!notes}
                    className="gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all uppercase"
                  >
                    <Download className="h-4 w-4" />
                    BAIXAR
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    disabled={!notes}
                    className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
                  >
                    <Printer className="h-4 w-4" />
                    IMPRIMIR
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={!notes}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all uppercase"
                  >
                    <Trash2 className="h-4 w-4" />
                    LIMPAR
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value.toUpperCase())}
              placeholder="ADICIONAR NOVO ITEM..."
              className="uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddChecklistItem();
                }
              }}
            />
            <Button
              onClick={handleAddChecklistItem}
              disabled={!newChecklistItem.trim()}
              className="gap-2 uppercase"
            >
              <Plus className="h-4 w-4" />
              ADICIONAR
            </Button>
          </div>

          <Card className="p-6">
            <div className="space-y-3">
              {checklistItems.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm uppercase py-8">
                  NENHUM ITEM NO CHECKLIST
                </p>
              ) : (
                checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all group"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id, item.completed)}
                      className="h-5 w-5"
                    />
                    <span
                      className={`flex-1 uppercase text-sm ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChecklistItem(item.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Template Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase">SALVAR MODELO</DialogTitle>
            <DialogDescription className="uppercase">
              DIGITE UM NOME PARA ESTE MODELO
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name" className="uppercase">
                NOME DO MODELO
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value.toUpperCase())}
                placeholder="EX: MODELO CARDIOLOGIA"
                className="uppercase"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false);
                setTemplateName("");
              }}
              className="uppercase"
            >
              CANCELAR
            </Button>
            <Button type="button" onClick={handleSaveTemplate} className="uppercase">
              SALVAR MODELO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Popup Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase flex items-center gap-2">
              <Clock className="h-5 w-5" />
              PROGRAMAR LEMBRETE
            </DialogTitle>
            <DialogDescription className="uppercase">
              DEFINA DATA, HORA E MENSAGEM DO LEMBRETE
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scheduled-content" className="uppercase">
                MENSAGEM DO LEMBRETE
              </Label>
              <Textarea
                id="scheduled-content"
                value={scheduledContent}
                onChange={(e) => setScheduledContent(e.target.value.toUpperCase())}
                placeholder="DIGITE A MENSAGEM..."
                className="uppercase"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled-date" className="uppercase">
                  DATA
                </Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scheduled-time" className="uppercase">
                  HORA
                </Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsScheduleDialogOpen(false);
                setScheduledContent("");
                setScheduledDate("");
                setScheduledTime("");
              }}
              className="uppercase"
            >
              CANCELAR
            </Button>
            <Button type="button" onClick={handleSchedulePopup} className="uppercase">
              <Clock className="h-4 w-4 mr-2" />
              AGENDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesTabOptimized;
