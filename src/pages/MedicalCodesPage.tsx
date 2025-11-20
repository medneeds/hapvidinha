import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MedicalCode = {
  id: string;
  code: string;
  name: string;
  system_description: string;
  category: string;
};

const categoryLabels = {
  EXAMES: "Exames",
  PROCEDIMENTOS: "Procedimentos",
  MATERIAIS: "Materiais",
  MEDICAÇÕES: "Medicações",
};

export default function MedicalCodesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const category = (searchParams.get("category") || "EXAMES").toUpperCase();
  const [codes, setCodes] = useState<MedicalCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<MedicalCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<MedicalCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    system_description: "",
  });

  useEffect(() => {
    fetchCodes();
  }, [category]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = codes.filter(
        (code) =>
          code.code.toUpperCase().includes(searchTerm.toUpperCase()) ||
          code.name.toUpperCase().includes(searchTerm.toUpperCase()) ||
          code.system_description.toUpperCase().includes(searchTerm.toUpperCase())
      );
      setFilteredCodes(filtered);
    } else {
      setFilteredCodes(codes);
    }
  }, [searchTerm, codes]);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("medical_codes")
      .select("*")
      .eq("category", category)
      .order("code", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar códigos");
      if (import.meta.env.DEV) {
        console.error(error);
      }
      return;
    }

    setCodes(data || []);
    setFilteredCodes(data || []);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.system_description) {
      toast.error("PREENCHA TODOS OS CAMPOS");
      return;
    }

    const dataToSave = {
      ...formData,
      code: formData.code.toUpperCase(),
      name: formData.name.toUpperCase(),
      system_description: formData.system_description.toUpperCase(),
      category,
    };

    if (editingCode) {
      const { error } = await supabase
        .from("medical_codes")
        .update(dataToSave)
        .eq("id", editingCode.id);

      if (error) {
        toast.error("ERRO AO ATUALIZAR CÓDIGO");
        if (import.meta.env.DEV) {
          console.error(error);
        }
        return;
      }

      toast.success("CÓDIGO ATUALIZADO COM SUCESSO");
    } else {
      const { error } = await supabase.from("medical_codes").insert(dataToSave);

      if (error) {
        toast.error("ERRO AO CRIAR CÓDIGO");
        if (import.meta.env.DEV) {
          console.error(error);
        }
        return;
      }

      toast.success("CÓDIGO CRIADO COM SUCESSO");
    }

    setIsDialogOpen(false);
    setEditingCode(null);
    setFormData({ code: "", name: "", system_description: "" });
    fetchCodes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("TEM CERTEZA QUE DESEJA DELETAR ESTE CÓDIGO?")) return;

    const { error } = await supabase.from("medical_codes").delete().eq("id", id);

    if (error) {
      toast.error("ERRO AO DELETAR CÓDIGO");
      if (import.meta.env.DEV) {
        console.error(error);
      }
      return;
    }

    toast.success("CÓDIGO DELETADO COM SUCESSO");
    fetchCodes();
  };

  const openDialog = (code?: MedicalCode) => {
    if (role !== 'admin') {
      toast.error("APENAS ADMINISTRADORES PODEM CRIAR OU EDITAR CÓDIGOS MÉDICOS");
      return;
    }

    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        name: code.name,
        system_description: code.system_description,
      });
    } else {
      setEditingCode(null);
      setFormData({ code: "", name: "", system_description: "" });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
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
              <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight mb-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Códigos e Descritivos do Sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground uppercase tracking-tight">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">
                {role === 'admin' ? 'Administrador' : 'Médico'}
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

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="BUSCAR POR CÓDIGO, NOME OU DESCRITIVO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="pl-10 uppercase"
            />
          </div>
          <Button 
            onClick={() => openDialog()} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            ADICIONAR
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border/50 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold uppercase w-32">Código</TableHead>
                <TableHead className="font-bold uppercase w-64">Nome</TableHead>
                <TableHead className="font-bold uppercase">Descritivo no Sistema</TableHead>
                <TableHead className="font-bold uppercase w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground uppercase">
                    Nenhum código cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow key={code.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-semibold text-primary uppercase">
                      {code.code}
                    </TableCell>
                    <TableCell className="font-medium uppercase">{code.name}</TableCell>
                    <TableCell className="text-muted-foreground uppercase">
                      {code.system_description}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(code)}
                          className="h-8 w-8"
                          disabled={role !== 'admin'}
                          title={role !== 'admin' ? 'APENAS ADMINISTRADORES' : ''}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(code.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={role !== 'admin'}
                          title={role !== 'admin' ? 'APENAS ADMINISTRADORES' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase">
              {editingCode ? "Editar Código" : "Adicionar Código"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code" className="uppercase text-xs font-semibold">
                Código
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="CÓDIGO"
                className="uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="uppercase text-xs font-semibold">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toUpperCase() })
                }
                placeholder="NOME DO EXAME/PROCEDIMENTO/MATERIAL/MEDICAÇÃO"
                className="uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="uppercase text-xs font-semibold">
                Descritivo no Sistema
              </Label>
              <Textarea
                id="description"
                value={formData.system_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    system_description: e.target.value.toUpperCase(),
                  })
                }
                placeholder="COMO É ESCRITO NO SISTEMA"
                className="uppercase min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCode(null);
                setFormData({ code: "", name: "", system_description: "" });
              }}
            >
              CANCELAR
            </Button>
            <Button onClick={handleSave}>SALVAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
