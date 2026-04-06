import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Brain, Search, RefreshCw, Shield } from "lucide-react";

interface UserAccess {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  enabled: boolean;
}

export function ClinicusAccessPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [{ data: profiles }, { data: roles }, { data: access }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").eq("status", "approved"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("clinicus_access").select("user_id, enabled"),
      ]);

      const accessMap = new Map((access || []).map(a => [a.user_id, a.enabled]));
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      const list: UserAccess[] = (profiles || []).map(p => ({
        userId: p.id,
        fullName: p.full_name,
        email: p.email,
        role: roleMap.get(p.id) || null,
        enabled: accessMap.get(p.id) ?? false,
      }));

      setUsers(list.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")));
    } catch {
      toast.error("Erro ao carregar dados do Clinicus");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string, enabled: boolean) => {
    setToggling(userId);
    try {
      const { data: existing } = await supabase
        .from("clinicus_access")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("clinicus_access")
          .update({ enabled, enabled_by: user?.id })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clinicus_access")
          .insert({ user_id: userId, enabled, enabled_by: user?.id });
        if (error) throw error;
      }

      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, enabled } : u));
      toast.success(enabled ? "Clinicus habilitado" : "Clinicus desabilitado");
    } catch {
      toast.error("Erro ao atualizar acesso");
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.fullName || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  const enabledCount = users.filter(u => u.enabled).length;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground uppercase text-sm tracking-tight">
                Acesso ao Clinicus IA
              </h3>
              <p className="text-xs text-muted-foreground">
                Habilite ou desabilite o uso do Clinicus por usuário
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {enabledCount} habilitado{enabledCount !== 1 ? "s" : ""}
            </Badge>
            <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold uppercase text-xs">Usuário</TableHead>
              <TableHead className="font-bold uppercase text-xs">Papel</TableHead>
              <TableHead className="font-bold uppercase text-xs text-center">Clinicus IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(u => (
                <TableRow key={u.userId} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{u.fullName || "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.email?.replace("@sistema.local", "") || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground capitalize">{u.role || "—"}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.enabled}
                      onCheckedChange={val => handleToggle(u.userId, val)}
                      disabled={toggling === u.userId}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 border-t bg-muted/20 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Alterações são registradas na trilha de auditoria</span>
      </div>
    </div>
  );
}
