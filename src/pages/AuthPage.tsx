import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, User, Lock, Sparkles, Eye, EyeOff, Shield, FileCheck, UserPlus } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { IndividualSignUpForm } from "@/components/IndividualSignUpForm";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/select-network");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("LOGIN REALIZADO COM SUCESSO");
        navigate("/select-network");
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

  // Render individual signup form
  if (authMode === "individual-signup") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 p-6 border border-white/10">
            <IndividualSignUpForm
              onBack={() => setAuthMode("login")}
              onSuccess={() => setAuthMode("login")}
              selectedState=""
              selectedHospitalId=""
              selectedDepartment="URGÊNCIA E EMERGÊNCIA ADULTO"
              onStateChange={() => {}}
              onHospitalChange={() => {}}
              onDepartmentChange={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render forgot password form
  if (authMode === "forgot-password") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50 p-6 border border-white/10">
            <ForgotPasswordForm onBack={() => setAuthMode("login")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] rounded-full blur-3xl animate-pulse [animation-delay:4s]" />
        
        {/* Floating particles */}
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 bg-white/20 rounded-full animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] right-[20%] w-1 h-1 bg-white/15 rounded-full animate-[float_8s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-white/25 rounded-full animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[60%] right-[30%] w-1.5 h-1.5 bg-white/15 rounded-full animate-[float_9s_ease-in-out_infinite_1.5s]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* DESKTOP: Split-screen layout */}
      <div className="hidden lg:flex w-full h-screen relative z-10">
        {/* Left Panel - Axius Branding */}
        <div className="w-[45%] xl:w-1/2 flex flex-col items-center justify-center p-6 xl:p-10 relative">
          <div className="absolute top-[10%] left-[5%] w-48 h-48 bg-gradient-radial from-white/[0.03] to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
          <div className="absolute bottom-[15%] right-[10%] w-64 h-64 bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
          
          <div className="relative z-10 text-center max-w-md animate-in fade-in-0 slide-in-from-left-8 duration-1000">
            {/* Axius Brand Name */}
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150 mb-4">
              <h1 className="text-5xl xl:text-6xl font-black text-white tracking-tighter mb-2">
                Axius
              </h1>
              <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
            </div>
            
            {/* Slogan */}
            <p className="text-white/40 text-sm xl:text-base font-light tracking-wide animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300 mb-8 italic">
              Tecnologia que valoriza seu tempo.<br />Inteligência que salva vidas.
            </p>
            
            {/* Elegant divider */}
            <div className="flex items-center justify-center gap-3 mb-6 animate-in fade-in-0 duration-1000 delay-400">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
              <Sparkles className="h-3 w-3 text-white/30" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>
            
            {/* Feature highlights */}
            <div className="space-y-3 text-left animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-500">
              {[
                { icon: Shield, text: "Plataforma multi-institucional de gestão de leitos" },
                { icon: User, text: "Visão completa do paciente em um clique" },
                { icon: Sparkles, text: "IA integrada para suporte à decisão clínica" },
                { icon: FileCheck, text: "Conformidade LGPD e CFM 1.821/2007" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-white/40 hover:text-white/70 transition-colors duration-300 group">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.06] transition-all duration-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-light tracking-wide">{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer on left panel */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[9px] text-white/15 uppercase tracking-widest">Health Tech Platform</p>
          </div>
        </div>
        
        {/* Right Panel - Login Form */}
        <div className="w-[55%] xl:w-1/2 flex items-center justify-center p-8 xl:p-12 relative">
          {/* Subtle border between panels */}
          <div className="absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
          
          <div className="w-full max-w-[340px] relative z-10 animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-300">
            {/* Form card */}
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6">
              {/* Form header */}
              <div className="mb-5 text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.1] mb-2">
                  <LogIn className="h-4 w-4 text-white/70" />
                </div>
                <h2 className="text-sm font-bold text-white/90 uppercase tracking-wide">Acesse sua conta</h2>
                <p className="text-[10px] text-white/30 mt-0.5">Insira suas credenciais</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                {/* Username Field */}
                <div>
                  <Label htmlFor="login-username-desktop" className="text-[9px] font-semibold text-white/40 uppercase mb-1 block tracking-wider">
                    Usuário
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                    <Input
                      id="login-username-desktop"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => {
                        const newUsername = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '');
                        setLoginData({ ...loginData, username: newUsername });
                      }}
                      placeholder="DIGITE SEU USUÁRIO"
                      className="h-9 pl-8 bg-white/[0.04] border border-white/[0.08] focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg text-xs uppercase font-medium text-white placeholder:text-[9px] placeholder:uppercase placeholder:text-white/20"
                      disabled={loading}
                      maxLength={50}
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div>
                  <Label htmlFor="login-password-desktop" className="text-[9px] font-semibold text-white/40 uppercase mb-1 block tracking-wider">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                    <Input
                      id="login-password-desktop"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => {
                        const newPassword = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                        setLoginData({ ...loginData, password: newPassword });
                      }}
                      placeholder="EX: ABC123"
                      className="h-9 pl-8 pr-8 bg-white/[0.04] border border-white/[0.08] focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg text-xs uppercase font-mono tracking-wider text-white placeholder:text-[9px] placeholder:uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/20"
                      disabled={loading}
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 text-white/20 hover:text-white/50 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 mt-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.2] text-white font-bold uppercase rounded-lg text-[11px] transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <LogIn className="h-3.5 w-3.5" />
                      Entrar
                    </span>
                  )}
                </Button>

                {/* Actions row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot-password")}
                    className="text-[9px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAuthMode("individual-signup")}
                    className="text-white/40 hover:text-white/70 font-semibold text-[10px] uppercase hover:bg-white/[0.04] gap-1 h-6 px-2"
                  >
                    <UserPlus className="h-3 w-3" />
                    Criar conta
                  </Button>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-1 pt-1 text-white/15">
                  <Lock className="h-2 w-2" />
                  <span className="text-[7px] uppercase tracking-wider">Conexão criptografada</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: Centered layout */}
      <div className="lg:hidden w-full max-w-[480px] relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-5 animate-in fade-in-0 slide-in-from-top-8 duration-1000">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-1">
            Axius
          </h1>
          <p className="text-white/30 text-xs font-light italic">
            Tecnologia que valoriza seu tempo
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-5 relative overflow-hidden animate-in fade-in-0 zoom-in-95 duration-1000 delay-500">
          {/* Header inside card */}
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
              <LogIn className="h-5 w-5 text-white/70" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/90 uppercase">Acesse sua conta</h2>
              <p className="text-[10px] text-white/30">Insira suas credenciais</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 relative z-10">
            {/* Username Field */}
            <div className="space-y-0.5">
              <Label htmlFor="login-username-mobile" className="text-[10px] font-semibold text-white/40 flex items-center gap-1 uppercase tracking-wider">
                <User className="h-2.5 w-2.5 text-white/30" />
                Usuário
              </Label>
              <Input
                id="login-username-mobile"
                type="text"
                placeholder="DIGITE SEU USUÁRIO"
                className="h-9 bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-lg text-xs font-medium uppercase text-white placeholder:text-white/20"
                value={loginData.username}
                onChange={(e) => {
                  const newUsername = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '');
                  setLoginData(prev => ({ ...prev, username: newUsername }));
                }}
                disabled={loading}
                autoComplete="username"
                maxLength={50}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-0.5">
              <Label htmlFor="login-password-mobile" className="text-[10px] font-semibold text-white/40 flex items-center gap-1 uppercase tracking-wider">
                <Lock className="h-2.5 w-2.5 text-white/30" />
                Senha (6 caracteres)
              </Label>
              <div className="relative">
                <Input
                  id="login-password-mobile"
                  type={showPassword ? "text" : "password"}
                  placeholder="EX: ABC123"
                  className="h-9 bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-lg pr-9 text-xs font-mono uppercase tracking-widest text-white placeholder:text-white/20"
                  value={loginData.password}
                  onChange={(e) => {
                    const newPassword = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setLoginData(prev => ({ ...prev, password: newPassword }));
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.2] text-white font-bold text-xs rounded-lg mt-2 uppercase transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                  <span>ENTRANDO...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>ENTRAR</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-3 pt-3 border-t border-white/[0.06] relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAuthMode("individual-signup")}
                className="text-[10px] text-white/40 hover:text-white/60 font-semibold uppercase flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                CRIAR CONTA
              </button>
              <div className="flex items-center gap-1.5 text-[9px] text-white/20">
                <Shield className="h-2.5 w-2.5 text-green-500/50" />
                <span className="text-green-500/50 font-medium">LGPD</span>
                <span className="mx-1">•</span>
                <Lock className="h-2.5 w-2.5" />
                <span>SEGURO</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAuthMode("forgot-password")}
              className="text-[9px] text-white/25 hover:text-white/50 transition-colors text-center"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-[9px] text-white/15 uppercase tracking-widest">Powered by</p>
          <p className="text-[11px] text-white/30 font-semibold tracking-wide">Axius</p>
        </div>
      </div>
    </div>
  );
}
