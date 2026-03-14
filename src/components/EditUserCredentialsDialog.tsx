import { useState, useEffect } from "react";
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
  UserCog,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  KeyRound,
  Mail,
  User,
  Stethoscope,
  Phone,
  Building2,
  Save,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditUserCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  userCrm?: string;
  userSpecialty?: string;
  userPhone?: string;
  onSuccess: () => void;
}

export function EditUserCredentialsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  userCrm = "",
  userSpecialty = "",
  userPhone = "",
  onSuccess,
}: EditUserCredentialsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Profile data state
  const [fullName, setFullName] = useState(userName || "");
  const [crm, setCrm] = useState(userCrm || "");
  const [specialty, setSpecialty] = useState(userSpecialty || "");
  const [phone, setPhone] = useState(userPhone || "");

  // Login state
  const [newLogin, setNewLogin] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const currentLogin = userEmail?.replace("@sistema.local", "") || "";

  // Sync props when dialog opens
  useEffect(() => {
    if (open) {
      setFullName(userName || "");
      setCrm(userCrm || "");
      setSpecialty(userSpecialty || "");
      setPhone(userPhone || "");
      setNewLogin("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, userName, userCrm, userSpecialty, userPhone]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Nome completo é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: {
          userId,
          profileData: {
            full_name: fullName.trim(),
            crm: crm.trim() || null,
            specialty: specialty.trim() || null,
            phone: phone.trim() || null,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      setSuccessMessage("Dados do perfil atualizados com sucesso!");
      toast.success("Dados atualizados com sucesso");

      setTimeout(() => {
        resetAndClose();
        onSuccess();
      }, 2000);
    } catch (err: any) {
      toast.error("Erro ao atualizar dados: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLogin = async () => {
    if (!newLogin.trim()) {
      toast.error("Informe o novo login");
      return;
    }
    if (newLogin.trim().toUpperCase() === currentLogin.toUpperCase()) {
      toast.error("O novo login é igual ao atual");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: { userId, newEmail: newLogin.toUpperCase() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      setSuccessMessage("Login alterado com sucesso!");
      toast.success("Login alterado com sucesso");

      setTimeout(() => {
        resetAndClose();
        onSuccess();
      }, 2000);
    } catch (err: any) {
      toast.error("Erro ao alterar login: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
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
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: { userId, newPassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      setSuccessMessage("Senha redefinida com sucesso!");
      toast.success("Senha redefinida com sucesso");

      setTimeout(() => {
        resetAndClose();
        onSuccess();
      }, 2000);
    } catch (err: any) {
      toast.error("Erro ao redefinir senha: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setNewLogin("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccess(false);
    setSuccessMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Altere os dados cadastrais, login ou senha
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{successMessage}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Usuário</p>
              <p className="font-medium text-foreground">{userName || "—"}</p>
              <p className="text-xs text-muted-foreground">Login atual: <span className="font-mono font-bold">{currentLogin}</span></p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="gap-1 text-xs">
                  <User className="h-3.5 w-3.5" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="login" className="gap-1 text-xs">
                  <Mail className="h-3.5 w-3.5" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="password" className="gap-1 text-xs">
                  <KeyRound className="h-3.5 w-3.5" />
                  Senha
                </TabsTrigger>
              </TabsList>

              {/* PROFILE TAB */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <User className="h-3 w-3" /> Nome Completo *
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nome completo do usuário"
                      className="h-10"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> CRM
                      </Label>
                      <Input
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                        placeholder="Ex: 12345-MA"
                        className="h-10 font-mono"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Especialidade
                      </Label>
                      <Input
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Clínica Médica"
                        className="h-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (99) 99999-9999"
                      className="h-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={resetAndClose} className="flex-1" disabled={loading}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading || !fullName.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Dados
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Novo Login *</Label>
                  <Input
                    value={newLogin}
                    onChange={(e) => setNewLogin(e.target.value.toUpperCase().replace(/[^A-Z0-9._]/g, ""))}
                    placeholder="EX: JOAO.SILVA"
                    className="h-10 uppercase font-mono tracking-wider"
                    disabled={loading}
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Apenas letras maiúsculas, números, pontos e underscores
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Ao alterar o login, o usuário deverá utilizar o <strong>novo login</strong> para acessar o sistema.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={resetAndClose} className="flex-1" disabled={loading}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateLogin}
                    disabled={loading || !newLogin.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Alterar Login
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* PASSWORD TAB */}
              <TabsContent value="password" className="space-y-4 mt-4">
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
                    onClick={handleUpdatePassword}
                    disabled={loading || newPassword.length !== 6}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Redefinir Senha
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* LGPD Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Shield className="h-3 w-3" />
              <span>Esta ação será registrada na trilha de auditoria</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
