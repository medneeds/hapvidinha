import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookMarked, Copy, Plus, Search, Trash2 } from "lucide-react";
import { useMedicalCodes } from "@/hooks/useMedicalCodes";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const KNOWN_CATEGORIES = ["EXAMES", "PROCEDIMENTOS", "MATERIAIS", "MEDICAÇÕES"];

export function MedicalCodesDialog({ open, onOpenChange }: Props) {
  const { codes, addCustom, removeCustom, isLoading } = useMedicalCodes();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // New code form
  const [newCategory, setNewCategory] = useState<string>("EXAMES");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>(KNOWN_CATEGORIES);
    codes.forEach((c) => set.add(c.category.toUpperCase()));
    return Array.from(set);
  }, [codes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return codes.filter((c) => {
      if (activeTab !== "ALL" && c.category.toUpperCase() !== activeTab) return false;
      if (!term) return true;
      return (
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        (c.system_description ?? "").toLowerCase().includes(term)
      );
    });
  }, [codes, search, activeTab]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: text });
  };

  const submitNew = () => {
    if (!newCode.trim() || !newName.trim()) return;
    addCustom({
      category: newCategory,
      code: newCode,
      name: newName,
      system_description: newDesc,
    });
    setNewCode("");
    setNewName("");
    setNewDesc("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            Códigos e Procedimentos
          </DialogTitle>
          <DialogDescription>
            Base institucional + códigos personalizados da unidade. Clique em copiar para
            usar em prescrições.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="ALL">Todos ({codes.length})</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[300px] border rounded-md">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum código encontrado.
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((c) => (
                    <li key={`${c.source}-${c.id}`} className="flex items-start gap-3 p-2.5 group hover:bg-accent/40">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {c.code}
                          </code>
                          <span className="text-sm font-medium">{c.name}</span>
                          <Badge
                            variant={c.source === "custom" ? "secondary" : "outline"}
                            className="text-[9px] py-0"
                          >
                            {c.source === "custom" ? "PERSONALIZADO" : c.category}
                          </Badge>
                        </div>
                        {c.system_description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {c.system_description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => copy(`${c.code} - ${c.name}`)}
                        title="Copiar"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {c.source === "custom" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => removeCustom(c.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Formulário novo código personalizado */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Adicionar código personalizado
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[130px_120px_1fr] gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Código"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            />
            <Input
              placeholder="Nome"
              value={newName}
              onChange={(e) => setNewName(e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value.toUpperCase())}
            />
            <Button onClick={submitNew} disabled={!newCode.trim() || !newName.trim()} className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
