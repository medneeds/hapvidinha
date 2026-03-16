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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  Phone,
  Mail,
  Building2,
  UserPlus,
  Shield,
  Loader2,
  CheckCircle,
  DoorOpen,
} from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    crm: "",
    specialty: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    role: "medico" as string,
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      crm: "",
      specialty: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      role: "medico",
    });
    setSuccess(false);
    setCreatedUsername("");
    setShowPassword(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast.error("PREENCHA NOME, USUÁRIO E SENHA");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(formData.password)) {
      toast.error("SENHA: 6 CARACTERES, LETRAS MAIÚSCULAS E NÚMEROS");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          username: formData.username.toUpperCase(),
          password: formData.password.toUpperCase(),
          fullName: formData.fullName.toUpperCase(),
          crm: formData.crm || null,
          specialty: formData.specialty || null,
          phone: formData.phone || null,
          email: formData.email || null,
          role: formData.role,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setCreatedUsername(formData.username.toUpperCase());
      setSuccess(true);
      toast.success("Usuário criado com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const ROLE_OPTIONS = [
    { value: "medico", label: "Líder", icon: Stethoscope, description: "Edita livremente os pacientes do mapa", regLabel: "CRM" },
    { value: "porta", label: "Porta", icon: DoorOpen, description: "Edita apenas pacientes que solicitou leito", regLabel: "CRM" },
    { value: "prescritor", label: "Prescritor", icon: Stethoscope, description: "Acesso para prescrição médica", regLabel: "CRM" },
    { value: "uti", label: "UTI", icon: Stethoscope, description: "Acesso dedicado à UTI", regLabel: "CRM" },
    { value: "enfermagem", label: "Enfermagem", icon: User, description: "Acompanhamento + Documentos", regLabel: "COREN" },
    { value: "fisioterapia", label: "Fisioterapia", icon: User, description: "Reabilitação e fisioterapia", regLabel: "CREFITO" },
    { value: "recepcao", label: "Recepção", icon: Eye, description: "Acompanhamento — sem edição", regLabel: "" },
    { value: "admin", label: "Coordenador", icon: Shield, description: "Acesso administrativo", regLabel: "CRM" },
    { value: "visitante", label: "Visitante", icon: Eye, description: "Apenas visualização", regLabel: "" },
  ];

  const currentRegLabel = ROLE_OPTIONS.find(r => r.value === formData.role)?.regLabel || "CRM";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário diretamente — já será aprovado automaticamente
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 text-center py-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mx-auto">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Usuário Criado!</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 max-w-[200px] mx-auto">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Login</p>
                <p className="text-lg font-bold text-primary tracking-wide">{createdUsername}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                O usuário já está aprovado e pode acessar o sistema imediatamente.
              </p>
            </div>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categoria
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = formData.role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: opt.value })}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Professional Data */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Dados Profissionais
              </Label>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                    placeholder="NOME COMPLETO"
                    className="pl-10 uppercase"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">CRM</Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.crm}
                      onChange={(e) => setFormData({ ...formData, crm: e.target.value.replace(/\D/g, "") })}
                      placeholder="12345"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Especialidade</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value.toUpperCase() })}
                      placeholder="CLÍNICO"
                      className="pl-10 uppercase"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(99) 99999-9999"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Credenciais de Acesso
              </Label>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Login (Usuário) *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, "") })}
                    placeholder="USUARIO"
                    className="pl-10 uppercase font-mono"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) })}
                    placeholder="ABC123"
                    className="pl-10 pr-10 uppercase font-mono tracking-widest"
                    disabled={loading}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  6 caracteres: letras maiúsculas e números
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 rounded-lg p-2">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>O usuário será criado já aprovado e poderá acessar o sistema imediatamente.</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
