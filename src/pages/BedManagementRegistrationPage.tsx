import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Plus, Trash2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import {
  useManagedBeds,
  BED_STATUS_LABELS,
  BED_STATUS_COLORS,
} from "@/hooks/useManagedBeds";
import { toast } from "sonner";
import { BedPageHeader } from "@/components/bed-panel/BedPageHeader";

export default function BedManagementRegistrationPage() {
  const { beds, loading, createBed, deleteBed } = useManagedBeds();
  const [sector, setSector] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [bedType, setBedType] = useState("enfermaria");
  const [bulkCount, setBulkCount] = useState("1");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!sector.trim() || !bedNumber.trim()) {
      toast.error("Informe setor e número do leito");
      return;
    }
    setSubmitting(true);
    await createBed({ sector, bed_number: bedNumber, bed_type: bedType });
    setBedNumber("");
    setSubmitting(false);
  };

  const handleBulk = async () => {
    const count = parseInt(bulkCount, 10);
    if (!sector.trim() || !bulkPrefix.trim() || isNaN(count) || count < 1) {
      toast.error("Preencha setor, prefixo e quantidade");
      return;
    }
    setSubmitting(true);
    for (let i = 1; i <= count; i++) {
      const num = `${bulkPrefix}${String(i).padStart(2, "0")}`;
      await createBed({ sector, bed_number: num, bed_type: bedType });
    }
    setSubmitting(false);
    setBulkPrefix("");
  };

  const grouped = beds.reduce<Record<string, typeof beds>>((acc, b) => {
    (acc[b.sector] = acc[b.sector] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6 max-w-[1600px]">
      <BedPageHeader
        icon={BedDouble}
        title="Cadastro de Leitos"
        subtitle="Cadastre individualmente ou em lote os leitos administrados pelo módulo de gestão"
        badge="Configuração"
        accent="emerald"
        actions={
          <Link to="/leitos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          </Link>
        }
      />

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase">Cadastro individual</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            placeholder="Setor (ex.: ENFERMARIA A)"
            value={sector}
            onChange={(e) => setSector(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="Nº leito (ex.: 101)"
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value.toUpperCase())}
          />
          <Select value={bedType} onValueChange={setBedType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="enfermaria">Enfermaria</SelectItem>
              <SelectItem value="uti">UTI</SelectItem>
              <SelectItem value="observacao">Observação</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="isolamento">Isolamento</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={submitting}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm uppercase">Cadastro em lote</h2>
        <p className="text-xs text-muted-foreground">
          Ex.: prefixo <code>L</code> + quantidade <code>10</code> cria L01, L02, ..., L10 no setor informado acima.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Prefixo (ex.: L)"
            value={bulkPrefix}
            onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
          />
          <Input
            type="number"
            min={1}
            placeholder="Quantidade"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
          <Button onClick={handleBulk} disabled={submitting} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Criar em lote
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Carregando...</Card>
        ) : beds.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum leito cadastrado ainda.
          </Card>
        ) : (
          Object.entries(grouped).map(([sec, list]) => (
            <Card key={sec} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase">{sec}</h3>
                <Badge variant="outline">{list.length} leitos</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {list.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2 rounded border text-xs ${BED_STATUS_COLORS[b.current_status]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{b.bed_number}</span>
                      <button
                        onClick={() => setToDelete(b.id)}
                        className="opacity-60 hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-[10px] mt-1">{BED_STATUS_LABELS[b.current_status]}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir leito?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o leito do cadastro. O histórico de eventos preservados não é afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await deleteBed(toDelete);
                setToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
