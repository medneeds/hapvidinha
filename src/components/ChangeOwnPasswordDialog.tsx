import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface ChangeOwnPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeOwnPasswordDialog({
  open,
  onOpenChange,
}: ChangeOwnPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length !== 6) {
      toast.error("Senha deve ter exatamente 6 caracteres");
      return;
    }
    if (!/^[A-Z0-9]{6}$/.test(newPassword)) {
      toast.error("Senha: 6 caracteres com letras maiúsculas e números");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Senha alterada com sucesso!");

      setTimeout(() => {
        resetAndClose();
      }, 2000);
    } catch (err: any) {
      toast.error("Erro ao alterar senha: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Alterar Minha Senha
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha para sua conta
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Senha alterada com sucesso!</h3>
            <p className="text-sm text-muted-foreground mt-1">Use sua nova senha no próximo acesso.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  A nova senha deve ter <strong>exatamente 6 caracteres</strong> contendo
                  <strong> letras maiúsculas</strong> e <strong>números</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                    }
                    placeholder="EX: ABC123"
                    className="h-10 pr-10 uppercase font-mono tracking-widest"
                    disabled={loading}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground">{newPassword.length}/6 caracteres</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                    }
                    placeholder="REPITA A SENHA"
                    className="h-10 pr-10 uppercase font-mono tracking-widest"
                    disabled={loading}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={resetAndClose} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || newPassword.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Alterar Senha
                  </span>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Sua sessão atual será mantida após a alteração</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
