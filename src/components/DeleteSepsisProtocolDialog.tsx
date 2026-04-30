import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteSepsisProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string | null;
  patientName?: string | null;
  isFinalized?: boolean;
  onDeleted?: () => void;
}

/**
 * Confirmação de exclusão de protocolo de sepse com motivo obrigatório.
 *
 * Regras (impostas via RLS):
 *  - Admin pode excluir qualquer protocolo (em curso ou finalizado)
 *  - Criador só pode excluir protocolos ainda em aberto (outcome IS NULL)
 *
 * O motivo é gravado em `deletion_reason` antes do DELETE para que o trigger
 * de auditoria capture-o em `audit_logs.old_data` (trilha imutável de 20 anos).
 */
export function DeleteSepsisProtocolDialog({
  open,
  onOpenChange,
  protocolId,
  patientName,
  isFinalized,
  onDeleted,
}: DeleteSepsisProtocolDialogProps) {
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const reasonValid = reason.trim().length >= 10;

  const handleDelete = async () => {
    if (!protocolId) return;
    if (!reasonValid) {
      toast({
        title: "MOTIVO OBRIGATÓRIO",
        description: "Descreva o motivo da exclusão (mínimo 10 caracteres).",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // 1) Stamp deletion reason so the audit trigger captures it
      const { error: updateError } = await supabase
        .from("sepsis_protocols")
        .update({
          deletion_reason: `${reason.trim().toUpperCase()} [POR ${
            user?.email || "DESCONHECIDO"
          }]`,
        })
        .eq("id", protocolId);
      if (updateError) throw updateError;

      // 2) Delete (RLS enforces who can do it)
      const { error: deleteError } = await supabase
        .from("sepsis_protocols")
        .delete()
        .eq("id", protocolId);
      if (deleteError) throw deleteError;

      toast({
        title: "PROTOCOLO EXCLUÍDO",
        description: "O protocolo de sepse foi removido e auditado.",
      });
      setReason("");
      onOpenChange(false);
      onDeleted?.();
    } catch (err: any) {
      console.error("Error deleting sepsis protocol:", err);
      toast({
        title: "ERRO AO EXCLUIR",
        description:
          err?.message?.includes("row-level security")
            ? "Você não tem permissão para excluir este protocolo."
            : err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isDeleting) {
          if (!v) setReason("");
          onOpenChange(v);
        }
      }}
    >
      <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700 max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            EXCLUIR PROTOCOLO DE SEPSE
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {patientName && (
                <p className="font-semibold text-foreground uppercase">
                  Paciente: {patientName}
                </p>
              )}
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive dark:text-red-400 text-xs leading-relaxed">
                  Esta ação <strong>não pode ser desfeita</strong>. A exclusão
                  ficará registrada no log de auditoria{" "}
                  {isFinalized ? "(protocolo já finalizado)" : "(protocolo em curso)"}.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="deletion-reason" className="text-xs font-bold uppercase">
            Motivo da exclusão <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="deletion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.toUpperCase())}
            placeholder="EX: PROTOCOLO ABERTO POR ENGANO NO PACIENTE ERRADO"
            className="uppercase min-h-[80px] text-sm"
            disabled={isDeleting}
            maxLength={500}
          />
          <p className="text-[10px] text-muted-foreground">
            Mínimo 10 caracteres — {reason.trim().length}/500
          </p>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isDeleting} className="dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">
            CANCELAR
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting || !reasonValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "EXCLUINDO..." : "EXCLUIR PROTOCOLO"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
