import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, BedDouble, Save } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS, DEPARTMENT_LABELS, Department } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useSectorBedCapacities } from "@/hooks/useSectorBedCapacities";
import { CONFIGURABLE_SECTORS, getBedPrefix, getSectorGroup, padBed } from "@/utils/bedCapacityStore";
import { supabase } from "@/integrations/supabase/client";


const SECTOR_LABELS: Record<string, string> = {
  red: "Sala de Cuidados Especiais (Vermelha)",
  yellow: "Observação Amarela",
  blue: "Observação Azul",
};

const UTI_SECTOR_LABELS: Record<string, string> = {
  blue: "UTI 1",
  yellow: "UTI 2",
};

export default function AdminBedsPage() {
  const { currentHospital } = useHospital();
  const { loading, saveCapacity, getCount } = useSectorBedCapacities();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const keyOf = (dept: string, sector: string) => `${dept}|${sector}`;

  const handleSave = async (dept: Department, sector: string) => {
    const k = keyOf(dept, sector);
    const raw = drafts[k];
    const value = raw === undefined ? getCount(dept, sector) : parseInt(raw, 10);
    if (Number.isNaN(value) || value < 0 || value > 60) {
      toast.error("Informe um número entre 0 e 60.");
      return;
    }
    setSaving(k);
    const ok = await saveCapacity(dept, sector, value);
    setSaving(null);
    if (ok) {
      toast.success("Quantitativo de leitos atualizado.");
      // Alerta sobre leitos OCUPADOS acima do novo quantitativo (não são removidos)
      try {
        const prefix = getBedPrefix(dept, sector);
        const { data } = await supabase
          .from("patients")
          .select("bed_number, is_vacant")
          .eq("department", dept)
          .eq("sector", sector)
          .eq("is_vacant", false);
        const blocked = (data || [])
          .map((p: any) => p.bed_number as string)
          .filter((bn) => {
            if (!bn?.startsWith(prefix)) return false;
            const n = parseInt(bn.slice(prefix.length), 10);
            return !Number.isNaN(n) && n > value;
          });
        if (blocked.length > 0) {
          toast.warning(
            `Leitos ocupados acima do novo limite permanecem no mapa: ${blocked.sort().join(", ")}. Eles serão removidos ao ficarem vagos.`,
            { duration: 8000 },
          );
        }
      } catch {
        /* aviso é opcional */
      }
      setDrafts((d) => {
        const next = { ...d };
        delete next[k];
        return next;
      });
    }

  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BedDouble className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quantitativo de Leitos Fixos</h1>
            <p className="text-sm text-muted-foreground">
              {currentHospital?.name ?? "Unidade atual"} — define quantos leitos fixos existem em
              cada setor. Leitos criados a mais são preservados; leitos faltantes são recriados
              automaticamente como vagos.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando configuração...
          </div>
        ) : (
          DEPARTMENTS.map((dept) => {
            const sectors = CONFIGURABLE_SECTORS[getSectorGroup(dept)];
            return (
              <Card key={dept}>
                <CardHeader>
                  <CardTitle className="text-lg">{DEPARTMENT_LABELS[dept]}</CardTitle>
                  <CardDescription>{dept}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectors.map((sector) => {
                    const k = keyOf(dept, sector);
                    const current = getCount(dept, sector);
                    const draft = drafts[k] ?? String(current);
                    const prefix = getBedPrefix(dept, sector);
                    const count = parseInt(draft, 10);
                    const preview =
                      Number.isNaN(count) || count <= 0
                        ? "Nenhum leito fixo"
                        : `${padBed(prefix, 1)} — ${padBed(prefix, count)}`;
                    const label =
                      dept === "UTI" ? UTI_SECTOR_LABELS[sector] : SECTOR_LABELS[sector];
                    return (
                      <div
                        key={sector}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-[220px]">
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            Prefixo <Badge variant="secondary">{prefix}</Badge> · {preview}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            className="w-24"
                            value={draft}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [k]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSave(dept, sector)}
                            disabled={saving === k || draft === String(current)}
                          >
                            {saving === k ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            <span className="ml-1">Salvar</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
