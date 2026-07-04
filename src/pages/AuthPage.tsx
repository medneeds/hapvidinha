import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment, DEPARTMENTS, Department, getDepartmentLabel } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, User, Lock, Sparkles, Building2, Eye, EyeOff, Shield, FileCheck, UserPlus, Users } from "lucide-react";
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
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  
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
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

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

    if (!selectedState) {
      toast.error("SELECIONE UM ESTADO");
      return;
    }
    if (!selectedHospitalId) {
      toast.error("SELECIONE UMA UNIDADE HOSPITALAR");
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
        const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
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

  // Render individual signup form if that mode is selected
  if (authMode === "individual-signup") {
    return (
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] flex items-center justify-center p-4 relative overflow-hidden",
        "lg:p-0"
      )}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 p-6 border border-white/40">
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
        </div>
      </div>
    );
  }

  // Render forgot password form if that mode is selected
  if (authMode === "forgot-password") {
    return (
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] flex items-center justify-center p-4 relative overflow-hidden",
        "lg:p-0"
      )}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 p-6 border border-white/40">
            <ForgotPasswordForm onBack={() => setAuthMode("login")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLoadingScreen && (
        <LoadingScreen 
          onComplete={() => navigate("/")} 
          duration={2500}
        />
      )}
      
      <div
        className={cn(
          "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-opacity duration-500",
          "lg:p-0",
          showLoadingScreen && "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(ellipse at center, #0152d4 0%, #0146bd 40%, #013ba6 75%, #01297a 100%)",
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl animate-pulse [animation-delay:3s]" />
          
          {/* Floating particles */}
          <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-white/40 rounded-full animate-[float_6s_ease-in-out_infinite]" />
          <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-white/30 rounded-full animate-[float_8s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-white/50 rounded-full animate-[float_7s_ease-in-out_infinite_2s]" />
          <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-white/35 rounded-full animate-[float_9s_ease-in-out_infinite_1.5s]" />
          <div className="absolute bottom-[20%] right-[15%] w-1.5 h-1.5 bg-white/45 rounded-full animate-[float_5s_ease-in-out_infinite_0.5s]" />
        </div>

        {/* Enhanced grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'drift 60s linear infinite'
          }}
        />

        {/* DESKTOP: Split-screen layout - only mounted when viewport >= lg */}
        {isDesktop && (
        <div className="hidden lg:flex w-full h-screen relative z-10">
          {/* Left Panel - Branding - more compact */}
          <div className="w-[45%] xl:w-1/2 flex flex-col items-center justify-center p-6 xl:p-10 relative">
            {/* Gradient orbs for left panel */}
            <div className="absolute top-[10%] left-[5%] w-48 h-48 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[15%] right-[10%] w-64 h-64 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
            
            <div className="relative z-10 text-center max-w-md animate-in fade-in-0 slide-in-from-left-8 duration-1000">
              {/* Logo da rede removida a pedido */}
              
              {/* Brand Name - Logo Style - smaller */}
              <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150 mb-3 flex items-center justify-center gap-4">
                <div
                  aria-label="HapMap"
                  className="w-20 h-20 xl:w-24 xl:h-24 bg-white flex items-center justify-center rounded-[28%] shrink-0"
                  style={{
                    transform: "rotate(42deg)",
                    boxShadow:
                      "0 20px 40px -12px rgba(0,0,0,0.35), inset 0 2px 8px rgba(1,59,166,0.08)",
                    animation: "logoEntrance 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both",
                  }}
                >
                  <div
                    className="w-[80%] h-[80%] bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]"
                    style={{
                      transform: "rotate(-42deg)",
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
                <div className="relative flex flex-col items-start leading-[0.85]">
                  <h1 className="font-brand text-5xl xl:text-6xl tracking-wide lowercase text-white/95 drop-shadow-lg font-black">
                    hap
                  </h1>
                  <h1 className="font-brand text-5xl xl:text-6xl tracking-[0.08em] lowercase text-white/95 drop-shadow-lg" style={{ fontWeight: 100 }}>
                    map
                  </h1>
                  <span className="absolute -top-1 -right-7 text-[9px] font-medium text-white/60 tracking-[0.15em] border border-white/25 rounded-full px-1.5 py-0.5 uppercase bg-white/5 backdrop-blur-sm">
                    {whitelabel.platform.version}
                  </span>
                </div>
              </div>

              
              {/* Slogan - smaller */}
              <p className="text-white/60 text-sm xl:text-base font-light tracking-wide animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300 mb-6 italic">
                {whitelabel.platform.slogan}
              </p>
              
              {/* Elegant divider - smaller */}
              <div className="flex items-center justify-center gap-3 mb-5 animate-in fade-in-0 duration-1000 delay-400">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
                <Sparkles className="h-3 w-3 text-white/40" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
              </div>
              
              {/* Feature highlights - more compact */}
              <div className="space-y-3 text-left animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-500">
                {whitelabel.loginFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/60 hover:text-white/90 transition-colors duration-300 group">
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                      {idx === 0 ? <Building2 className="h-4 w-4" /> : idx === 1 ? <User className="h-4 w-4" /> : idx === 2 ? <Sparkles className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </div>
                    <span className="text-xs font-light tracking-wide">{feature}</span>
                  </div>
                ))}
              </div>
              
            </div>

            {/* Unified footer: credits + LGPD compliance in one line */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4 animate-in fade-in-0 duration-1000 delay-700">
              <FileCheck className="h-3 w-3 text-green-400 shrink-0" />
              <p className="text-[9px] text-white/50 tracking-wide truncate">
                <span className="text-white/70 font-semibold">{whitelabel.compliance.complianceBadgeTitle}</span>
                <span className="mx-1.5 text-white/25">·</span>
                {whitelabel.compliance.legalReferences}
              </p>
              <span className="h-3 w-px bg-white/20 shrink-0" />
              <p className="text-[9px] text-white/40 tracking-wide shrink-0">
                <span className="uppercase tracking-[0.15em] text-white/30">{whitelabel.credits.developerLabel}</span>{" "}
                <span className="font-semibold text-white/60">{whitelabel.credits.developerName}</span>
              </p>
            </div>
          </div>
          
          {/* Right Panel - Form - perfectly centered with breathing room */}
          <div className="w-[55%] xl:w-1/2 bg-white flex items-center justify-center p-8 xl:p-12 relative">
            {/* Subtle background pattern for form panel */}
            <div className="absolute inset-0 opacity-[0.015]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #013ba6 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#013ba6]/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#013ba6]/5 to-transparent" />
            
            <div className="w-full max-w-[320px] relative z-10 animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-300">
              {/* Faixa: hospital ativo + acesso */}
              <div className="mb-3 -mx-2 rounded-md bg-gradient-to-r from-[#013ba6] to-[#0152d4] px-3 py-2 flex items-center justify-center gap-2 shadow-sm shadow-[#013ba6]/20">
                <LogIn className="h-3.5 w-3.5 text-white" />
                <span className="h-3 w-px bg-white/30" />
                <Building2 className="h-3 w-3 text-white/90" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Hospital Guarás · Maranhão
                </span>
              </div>



              {/* Form content - minimal spacing */}
              <form onSubmit={handleLogin} className="space-y-2">
                {/* Hierarchical Selection Section */}
                <div className="space-y-1.5 pb-2 border-b border-gray-100">
                  {/* State Selection */}
                  <div className="group hidden">

                    <Label htmlFor="state-select-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Estado
                    </Label>
                    <Select
                      value={selectedState}
                      onValueChange={(value) => {
                        setSelectedState(value);
                        setSelectedHospitalId("");
                      }}
                      disabled={loading || hospitalLoading}
                    >
                      <SelectTrigger 
                        id="state-select-desktop"
                        className="h-7 bg-gray-50/80 dark:bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] font-medium uppercase text-gray-900 dark:text-gray-900"
                      >
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-xl z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                            {state.name} ({state.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hospital Unit Selection */}
                  <div className="group hidden">

                    <Label htmlFor="hospital-select-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Unidade
                    </Label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                      disabled={loading || hospitalLoading || !selectedState}
                    >
                      <SelectTrigger 
                        id="hospital-select-desktop"
                        className="h-7 bg-gray-50/80 dark:bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-50"
                      >
                        <SelectValue placeholder={selectedState ? "Selecione a unidade" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-xl z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                        {filteredHospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Selection */}
                  <div className="group">
                    <Label htmlFor="department-select-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Setor
                    </Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={(value: Department) => setSelectedDepartment(value)}
                      disabled={loading}
                    >
                      <SelectTrigger 
                        id="department-select-desktop"
                        className="h-7 bg-gray-50/80 dark:bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-60"
                      >
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-xl z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                            {getDepartmentLabel(dept)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Authentication Fields Section */}
                <div className="space-y-1.5 pt-1.5">
                  {/* Username Field */}
                  <div>
                    <Label htmlFor="login-username-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Usuário
                    </Label>
                    <div className="relative">
                      <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <Input
                        id="login-username-desktop"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => {
                          const newUsername = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '');
                          setLoginData({ ...loginData, username: newUsername });
                          if (newUsername === 'MEDICOUTI') {
                            setSelectedDepartment('UTI');
                          } else if (newUsername === 'MEDICOPORTA') {
                            setSelectedDepartment('URGÊNCIA E EMERGÊNCIA ADULTO');
                          }
                        }}
                        placeholder="DIGITE SEU USUÁRIO"
                        className="h-7 pl-7 bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] uppercase font-medium text-gray-900 placeholder:text-[9px] placeholder:uppercase placeholder:font-normal placeholder:text-gray-500"
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  {/* Password Field */}
                  <div>
                    <Label htmlFor="login-password-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <Input
                        id="login-password-desktop"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => {
                          const newPassword = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                          setLoginData({ ...loginData, password: newPassword });
                        }}
                        placeholder="EX: ABC123"
                        className="h-7 pl-7 pr-7 bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] uppercase font-mono tracking-wider text-gray-900 placeholder:text-[9px] placeholder:uppercase placeholder:font-normal placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-500"
                        disabled={loading}
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-8 mt-1 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d80] hover:to-[#013ba6] text-white font-bold uppercase rounded text-[11px] shadow-md shadow-[#013ba6]/25 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <LogIn className="h-3.5 w-3.5" />
                      Entrar
                    </span>
                  )}
                </Button>

                {/* Actions row - inline */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot-password")}
                    className="text-[9px] text-gray-400 hover:text-[#013ba6] transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAuthMode("individual-signup")}
                    className="text-[#013ba6] hover:text-[#012d80] font-semibold text-[10px] uppercase hover:bg-[#013ba6]/5 gap-1 h-6 px-2"
                  >
                    <UserPlus className="h-3 w-3" />
                    Criar conta
                  </Button>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-1 pt-1 text-gray-300">
                  <Lock className="h-2 w-2" />
                  <span className="text-[7px] uppercase tracking-wider">Conexão criptografada</span>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        {/* MOBILE: Original centered layout - only mounted when viewport < lg */}
        {!isDesktop && (
        <div className="lg:hidden w-full max-w-[480px] relative z-10">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
          </div>

          {/* Logo Section */}
          <div className="text-center mb-4 animate-in fade-in-0 slide-in-from-top-8 duration-1000">
            {/* Logo da rede removida a pedido */}
            
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150 flex items-center justify-center gap-3">
              <div
                aria-label="HapMap"
                className="w-14 h-14 bg-white flex items-center justify-center rounded-[28%] shrink-0"
                style={{
                  transform: "rotate(42deg)",
                  boxShadow:
                    "0 16px 32px -12px rgba(0,0,0,0.35), inset 0 2px 6px rgba(1,59,166,0.08)",
                  animation: "logoEntrance 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both",
                }}
              >
                <div
                  className="w-[80%] h-[80%] bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]"
                  style={{
                    transform: "rotate(-42deg)",
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
              <div className="relative flex flex-col items-start leading-[0.85]">
                <h1 className="font-brand text-4xl tracking-wide lowercase text-white/95 drop-shadow-lg font-black">
                  hap
                </h1>
                <h1 className="font-brand text-4xl tracking-[0.08em] lowercase text-white/95 drop-shadow-lg" style={{ fontWeight: 100 }}>
                  map
                </h1>
                <span className="absolute -top-0.5 -right-6 text-[8px] font-medium text-white/60 tracking-[0.15em] border border-white/25 rounded-full px-1 py-0.5 uppercase bg-white/5 backdrop-blur-sm">
                  {whitelabel.platform.version}
                </span>
              </div>
            </div>

          </div>

          {/* Login Card */}
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 border border-white/40 relative overflow-hidden animate-in fade-in-0 zoom-in-95 duration-1000 delay-500">
            {/* Faixa: hospital ativo */}
            <div className="bg-gradient-to-r from-[#013ba6] to-[#0152d4] px-4 py-2 flex items-center justify-center gap-2 relative z-10">
              <Building2 className="h-3.5 w-3.5 text-white/90" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                Hospital Guarás · Maranhão
              </span>
            </div>
            <div className="p-5 relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#013ba6]/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
            </div>
            

            
            {/* Header inside card */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#013ba6] to-[#0152d4] flex items-center justify-center shadow-md shadow-[#013ba6]/40">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase">Acesse sua conta</h2>
                <p className="text-[10px] text-gray-500 italic">{whitelabel.platform.slogan.split('.')[0]}</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-2.5 relative z-10">
              {/* Hierarchical Selection Section */}
              <div className="space-y-2.5 pb-2.5 border-b border-gray-200">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">SETOR</p>
                
                {/* State Selection */}
                <div className="space-y-0.5 hidden">

                  <Label 
                    htmlFor="state-select-mobile" 
                    className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase"
                  >
                    <Building2 className="h-2.5 w-2.5 text-gray-500" />
                    ESTADO
                  </Label>
                  <Select
                    value={selectedState}
                    onValueChange={(value) => {
                      setSelectedState(value);
                      setSelectedHospitalId("");
                    }}
                    disabled={loading || hospitalLoading}
                  >
                    <SelectTrigger 
                      id="state-select-mobile"
                      className="h-11 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-xl text-xs font-medium uppercase text-gray-900 dark:text-gray-900"
                    >
                      <SelectValue placeholder="SELECIONE O ESTADO" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-lg z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          {state.name} ({state.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hospital Unit Selection */}
                <div className="space-y-0.5 hidden">

                  <Label 
                    htmlFor="hospital-select-mobile" 
                    className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase"
                  >
                    <Building2 className="h-2.5 w-2.5 text-gray-500" />
                    UNIDADE
                  </Label>
                  <Select
                    value={selectedHospitalId}
                    onValueChange={setSelectedHospitalId}
                    disabled={loading || hospitalLoading || !selectedState}
                  >
                    <SelectTrigger 
                      id="hospital-select-mobile"
                      className="h-11 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-xl text-xs font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-50"
                    >
                      <SelectValue placeholder={selectedState ? "SELECIONE" : "SELECIONE ESTADO PRIMEIRO"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-lg z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                      {filteredHospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Selection */}
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="department-select-mobile" 
                    className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase"
                  >
                    <Building2 className="h-2.5 w-2.5 text-gray-500" />
                    SETOR
                  </Label>
                  <Select
                    value={selectedDepartment}
                    onValueChange={(value: Department) => setSelectedDepartment(value)}
                    disabled={loading}
                  >
                    <SelectTrigger 
                      id="department-select-mobile"
                      className="h-11 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-xl text-xs font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-60"
                    >
                      <SelectValue placeholder="SELECIONE O SETOR" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-lg z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          {getDepartmentLabel(dept)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Authentication Fields Section */}
              <div className="space-y-2.5 pt-2">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">CREDENCIAIS</p>
                
                {/* Username Field */}
                <div className="space-y-0.5">
                  <Label htmlFor="login-username-mobile" className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase">
                    <User className="h-2.5 w-2.5 text-gray-500" />
                    USUÁRIO
                  </Label>
                  <Input
                    id="login-username-mobile"
                    type="text"
                    placeholder="DIGITE SEU USUÁRIO"
                    className="h-11 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-xl text-xs font-medium uppercase text-gray-900 placeholder:text-gray-500"
                    value={loginData.username}
                    onChange={(e) => {
                      // Forçar uppercase e só permitir A-Z, 0-9 e ponto
                      const newUsername = e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '');
                      setLoginData(prev => ({ ...prev, username: newUsername }));
                      if (newUsername === 'MEDICOUTI') {
                        setSelectedDepartment('UTI');
                      } else if (newUsername === 'MEDICOPORTA') {
                        setSelectedDepartment('URGÊNCIA E EMERGÊNCIA ADULTO');
                      }
                    }}
                    disabled={loading}
                    autoComplete="username"
                    maxLength={50}
                  />
                  <p className="text-[8px] text-gray-400">Apenas maiúsculas e números</p>
                </div>

                {/* Password Field */}
                <div className="space-y-0.5">
                  <Label htmlFor="login-password-mobile" className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase">
                    <Lock className="h-2.5 w-2.5 text-gray-500" />
                    SENHA (6 CARACTERES)
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password-mobile"
                      type={showPassword ? "text" : "password"}
                      placeholder="EX: ABC123"
                      className="h-11 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-xl pr-9 text-xs font-mono uppercase tracking-widest text-gray-900 placeholder:text-gray-500"
                      value={loginData.password}
                      onChange={(e) => {
                        // Forçar uppercase e só permitir A-Z e 0-9, max 6 caracteres
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#013ba6]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-400">{loginData.password.length}/6 • Letras e números</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d7a] hover:to-[#013ba6] text-white font-bold text-xs rounded-xl shadow-md shadow-[#013ba6]/30 mt-3 uppercase transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            <div className="mt-3 pt-3 border-t border-gray-100 relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAuthMode("individual-signup")}
                  className="text-[10px] text-[#013ba6] hover:text-[#012d7a] font-semibold uppercase flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  CRIAR CONTA
                </button>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                  <Shield className="h-2.5 w-2.5 text-green-600" />
                  <span className="text-green-600 font-medium">LGPD</span>
                  <span className="mx-1">•</span>
                  <Lock className="h-2.5 w-2.5" />
                  <span>SEGURO</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode("forgot-password")}
                className="text-[9px] text-gray-500 hover:text-[#013ba6] transition-colors text-center"
              >
                Esqueci minha senha
              </button>
            </div>
            </div>
          </div>
          

          
          {/* Unified footer: LGPD + credits in one compact line */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-3 px-3">
            <div className="flex items-center gap-1.5">
              <FileCheck className="h-3 w-3 text-green-400 shrink-0" />
              <p className="text-[9px] text-white/60">
                <span className="font-semibold text-white/80">{whitelabel.compliance.complianceBadgeTitle}</span>
                <span className="mx-1 text-white/25">·</span>
                <span className="text-white/50">{whitelabel.compliance.legalReferences}</span>
              </p>
            </div>
            <span className="h-3 w-px bg-white/20 hidden sm:inline-block" />
            <p className="text-[9px] text-white/40">
              <span className="uppercase tracking-[0.15em] text-white/30">{whitelabel.credits.developerLabel}</span>{" "}
              <span className="font-semibold text-white/60">{whitelabel.credits.developerName}</span>
            </p>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
