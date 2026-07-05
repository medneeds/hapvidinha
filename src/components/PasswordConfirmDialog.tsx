import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirmed: () => void | Promise<void>;
}

/**
 * Dupla confirmação com senha do próprio usuário para ações críticas
 * (ex.: exclusão definitiva de paciente). Deixa claro que a ação é
 * IRREVERSÍVEL e NÃO ficará registrada no histórico de movimentações.
 */
export function PasswordConfirmDialog({
  open,
  onOpenChange,
  title = "Confirmação de ação crítica",
  description,
  confirmLabel = "Excluir definitivamente",
  onConfirmed,
}: PasswordConfirmDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setIsVerifying(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Digite sua senha para confirmar a ação.",
        variant: "destructive",
      });
      return;
    }
    if (!user?.email) {
      toast({
        title: "Sessão inválida",
        description: "Não foi possível identificar o usuário logado.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) {
        toast({
          title: "Senha incorreta",
          description: "A senha informada não confere. Tente novamente.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      await onConfirmed();
      onOpenChange(false);
    } catch (e) {
      console.error("[PasswordConfirm] error:", e);
      toast({
        title: "Erro na confirmação",
        description: "Não foi possível validar a senha. Tente novamente.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <AlertDialogTitle className="dark:text-white text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-base dark:text-gray-300">
              <div>{description}</div>
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <div className="text-destructive dark:text-red-300">
                  <strong>Atenção:</strong> esta ação é <strong>irreversível</strong> e
                  <strong> NÃO ficará registrada</strong> no histórico de movimentações
                  do paciente (não é uma alta, transferência ou óbito).
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">
            Digite sua senha para confirmar
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isVerifying) handleConfirm();
            }}
            placeholder="Senha do usuário logado"
            disabled={isVerifying}
            autoFocus
          />
        </div>

        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isVerifying || !password.trim()}
          >
            {isVerifying ? "Validando..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
