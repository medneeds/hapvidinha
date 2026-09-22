import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment, DEPARTMENTS, Department, getDepartmentLabel } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Building2, Eye, EyeOff, FileCheck, Lock, Shield, User, UserPlus } from "lucide-react";
import { z } from "zod";
import { whitelabel } from "@/config/whitelabel";
import { LoadingScreen } from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { IndividualSignUpForm } from "@/components/IndividualSignUpForm";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validação: username só aceita letras maiúsculas (A-Z) e números
const loginSchema = z.object({
  username: z.string()
    .trim()
    .min(1, { message: "LOGIN OBRIGATÓRIO" })
    .max(50)
    .regex(/^[A-Z0-9.]+$/, { message: "APENAS LETRAS MAIÚSCULAS E NÚMEROS" }),
  password: z.string()
    .min(6, { message: "SENHA DEVE TER 6 CARACTERES" })
    .max(6, { message: "SENHA DEVE TER 6 CARACTERES" })
    .regex(/^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$/, { message: "SENHA: 6 CARACTERES COM LETRAS E NÚMEROS" }),
});

type AuthMode = "login" | "individual-signup" | "forgot-password";

export default function AuthPage() {
  const { user, signIn } = useAuth();
  const { setCurrentDepartment } = useDepartment();
  const { states, hospitals, setCurrentHospital, isLoading: hospitalLoading } = useHospital();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("URGÊNCIA E EMERGÊNCIA ADULTO");

  // Filter hospitals by selected state
  const filteredHospitals = selectedState 
    ? hospitals.filter(h => h.state_id === selectedState)
    : [];

  useEffect(() => {
    // Durante um login iniciado nesta tela, a animação conclui antes da
    // navegação. Este efeito permanece apenas para quem abre /auth já logado.
    if (user && !loading && !showLoadingScreen) {
      navigate("/");
    }
  }, [user, loading, showLoadingScreen, navigate]);

  // Fixar Estado (Maranhão) e Unidade (Hospital Guarás) automaticamente
  useEffect(() => {
    if (hospitalLoading || states.length === 0 || hospitals.length === 0) return;
    const ma = states.find(s => s.abbreviation === 'MA');
    if (ma && !selectedState) setSelectedState(ma.id);
    const guaras = hospitals.find(h =>
      h.name.toUpperCase().includes('GUARÁS') || h.name.toUpperCase().includes('GUARAS')
    );
    if (guaras && !selectedHospitalId) setSelectedHospitalId(guaras.id);
  }, [hospitalLoading, states, hospitals, selectedState, selectedHospitalId]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Resolve Estado/Unidade automaticamente (Maranhão / Hospital Guarás)
    let stateId = selectedState;
    let hospitalId = selectedHospitalId;
    if (!stateId) {
      const ma = states.find(s => s.abbreviation === 'MA');
      if (ma) { stateId = ma.id; setSelectedState(ma.id); }
    }
    if (!hospitalId) {
      const guaras = hospitals.find(h =>
        h.name.toUpperCase().includes('GUARÁS') || h.name.toUpperCase().includes('GUARAS')
      );
      if (guaras) { hospitalId = guaras.id; setSelectedHospitalId(guaras.id); }
    }

    if (!stateId || !hospitalId) {
      if (hospitalLoading) {
        toast.error("AGUARDE, CARREGANDO UNIDADE HOSPITALAR...");
      } else {
        toast.error("UNIDADE HOSPITALAR INDISPONÍVEL. RECARREGUE A PÁGINA.");
      }
      return;
    }

    setLoading(true);

    try {
      const validated = loginSchema.parse(loginData);
      const { error } = await signIn(validated.username, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("LOGIN OU SENHA INCORRETOS");
        } else {
          toast.error("ERRO AO FAZER LOGIN: " + error.message.toUpperCase());
        }
        setLoading(false);
      } else {
        // Set hospital and department after successful login
        const selectedHospital = hospitals.find(h => h.id === hospitalId);
        if (selectedHospital) {
          setCurrentHospital(selectedHospital);
        }
        setCurrentDepartment(selectedDepartment);
        toast.success("LOGIN REALIZADO COM SUCESSO");
        
        // Show loading screen before navigation
        setShowLoadingScreen(true);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("ERRO AO VALIDAR DADOS");
      }
      setLoading(false);
    }
  };

  const AuthBrand = () => (
    <div className="text-center">
      <div className="auth-brand-mark mx-auto mb-5 flex h-16 w-16 rotate-[42deg] items-center justify-center rounded-[22%]">
        <div
          aria-label="HapMap"
          className="h-11 w-11 -rotate-[42deg] bg-primary-foreground"
          style={{
            WebkitMaskImage: "url(/logo-hm.png)",
            maskImage: "url(/logo-hm.png)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      </div>
      <div className="flex items-start justify-center gap-2">
        <h1 className="auth-title text-5xl leading-none">HapMap</h1>
        <span className="mt-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[8px] font-semibold uppercase text-muted-foreground">
          {whitelabel.platform.version}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Gestão clínica com clareza e precisão.</p>
    </div>
  );

  if (authMode === "individual-signup") {
    return (
      <main className="auth-shell min-h-screen px-4 py-8 sm:px-6">
        <div className="mx-auto mb-8 max-w-md"><AuthBrand /></div>
        <div className="auth-card mx-auto w-full max-w-md rounded-2xl p-6 sm:p-8">
          <IndividualSignUpForm
            onBack={() => setAuthMode("login")}
            onSuccess={() => setAuthMode("login")}
            selectedState={selectedState}
            selectedHospitalId={selectedHospitalId}
            selectedDepartment={selectedDepartment}
            onStateChange={setSelectedState}
            onHospitalChange={setSelectedHospitalId}
            onDepartmentChange={setSelectedDepartment}
          />
        </div>
      </main>
    );
  }

  if (authMode === "forgot-password") {
    return (
      <main className="auth-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8"><AuthBrand /></div>
          <div className="auth-card rounded-2xl p-6 sm:p-8">
            <ForgotPasswordForm onBack={() => setAuthMode("login")} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {showLoadingScreen && (
        <LoadingScreen onComplete={() => navigate("/")} duration={2500} />
      )}

      <main
        className={cn(
          "auth-shell flex min-h-screen items-center justify-center px-4 py-8 transition-opacity duration-500 sm:px-6",
          showLoadingScreen && "opacity-0"
        )}
      >
        <div className="w-full max-w-[420px] animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
          <div className="mb-9"><AuthBrand /></div>

          <section className="auth-card rounded-2xl p-6 sm:p-8" aria-label="Acesso ao HapMap">
            <div className="mb-6 flex items-center justify-center gap-2 border-b border-border pb-5 text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase">Hospital Guarás · Maranhão</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="department-select" className="ml-1 text-xs font-medium text-foreground">Setor</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value: Department) => setSelectedDepartment(value)}
                  disabled={loading}
                >
                  <SelectTrigger id="department-select" className="auth-field h-[50px] rounded-xl px-4 text-sm font-medium uppercase focus:ring-0">
                    <SelectValue placeholder="SELECIONE O SETOR" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover text-popover-foreground shadow-lg">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-sm font-medium uppercase">
                        {getDepartmentLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="ml-1 text-xs font-medium text-foreground">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => {
                      const newUsername = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, "");
                      setLoginData((current) => ({ ...current, username: newUsername }));
                      if (newUsername === "MEDICOUTI") setSelectedDepartment("UTI");
                      if (newUsername === "MEDICOPORTA") setSelectedDepartment("URGÊNCIA E EMERGÊNCIA ADULTO");
                    }}
                    placeholder="DIGITE SEU USUÁRIO"
                    className="auth-field h-[50px] rounded-xl pl-11 text-sm font-medium uppercase placeholder:text-muted-foreground"
                    disabled={loading}
                    autoComplete="username"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="login-password" className="text-xs font-medium text-foreground">Senha</Label>
                  <Button type="button" variant="link" onClick={() => setAuthMode("forgot-password")} className="h-auto p-0 text-xs font-medium text-primary">
                    Esqueci a senha
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
                      setLoginData((current) => ({ ...current, password: newPassword }));
                    }}
                    placeholder="6 CARACTERES"
                    className="auth-field h-[50px] rounded-xl px-11 text-sm font-mono font-medium uppercase placeholder:font-sans placeholder:text-muted-foreground"
                    disabled={loading}
                    autoComplete="current-password"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || hospitalLoading}
                className="mt-2 h-[50px] w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,transform,box-shadow] duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Entrar no sistema <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </section>

          <div className="mt-7 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não possui acesso?{" "}
              <Button type="button" variant="link" onClick={() => setAuthMode("individual-signup")} className="h-auto p-0 text-sm font-semibold text-primary">
                <UserPlus className="mr-1 h-3.5 w-3.5" /> Solicitar credenciais
              </Button>
            </p>
          </div>

          <footer className="mt-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-auth-success" /> Conexão segura</span>
            <span aria-hidden="true" className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><FileCheck className="h-3 w-3" /> {whitelabel.compliance.complianceBadgeTitle}</span>
            <span aria-hidden="true" className="h-3 w-px bg-border" />
            <span>{whitelabel.credits.developerName}</span>
          </footer>
        </div>
      </main>
    </>
  );
}
