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
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("URGÊNCIA E EMERGÊNCIA ADULTO");
  const [selectedUserType, setSelectedUserType] = useState<string>("");

  // Filter hospitals by selected state
  const filteredHospitals = selectedState 
    ? hospitals.filter(h => h.state_id === selectedState)
    : [];

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate selections
    if (!selectedUserType) {
      toast.error("SELECIONE A CATEGORIA DE USUÁRIO");
      return;
    }
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
      
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] flex items-center justify-center p-4 relative overflow-hidden transition-opacity duration-500",
        "lg:p-0",
        showLoadingScreen && "opacity-0"
      )}>
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

        {/* DESKTOP: Split-screen layout - more compact */}
        <div className="hidden lg:flex w-full h-screen relative z-10">
          {/* Left Panel - Branding - more compact */}
          <div className="w-[45%] xl:w-1/2 flex flex-col items-center justify-center p-6 xl:p-10 relative">
            {/* Gradient orbs for left panel */}
            <div className="absolute top-[10%] left-[5%] w-48 h-48 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[15%] right-[10%] w-64 h-64 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
            
            <div className="relative z-10 text-center max-w-md animate-in fade-in-0 slide-in-from-left-8 duration-1000">
              {/* Logo */}
              <div className="inline-block relative group mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-2xl blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-xl px-4 py-3 shadow-xl shadow-black/30 transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-white/20">
                  <img 
                    src={whitelabel.logos.networkFull} 
                    alt={whitelabel.institution.networkLogoAlt} 
                    className="h-9 xl:h-10 object-contain transition-all duration-500 group-hover:brightness-110"
                  />
                  <Sparkles className="absolute -top-1.5 -right-1.5 h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
                </div>
              </div>
              
              {/* Brand Name - Logo Style - smaller */}
              <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150 mb-3">
                <div className="inline-flex items-baseline gap-1.5">
                  <h1 className="text-4xl xl:text-5xl tracking-tighter inline-flex items-baseline">
                    <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                      {whitelabel.platform.name.slice(0, 3)}
                    </span>
                    <span className="font-light text-white/80 -ml-0.5">
                      {whitelabel.platform.name.slice(3)}
                    </span>
                  </h1>
                  <span className="text-[9px] font-medium text-white/40 tracking-wider border border-white/20 rounded-full px-1.5 py-0.5 self-start mt-1.5">
                    {whitelabel.platform.version}
                  </span>
                </div>
                <div className="h-0.5 w-16 mx-auto mt-1.5 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
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
              
              {/* LGPD Compliance Badge - smaller */}
              <div className="mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-700">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 flex items-center justify-center">
                    <FileCheck className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-white/90 uppercase tracking-wide">{whitelabel.compliance.complianceBadgeTitle}</p>
                    <p className="text-[9px] text-white/50">{whitelabel.compliance.legalReferences}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer on left panel - smaller */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">{whitelabel.credits.developerLabel}</p>
              <p className="text-[10px] text-white/50 font-semibold mt-0.5">{whitelabel.credits.developerName}</p>
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
              {/* Form header - minimal */}
              <div className="mb-3 text-center">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-[#013ba6] to-[#0152d4] shadow-md shadow-[#013ba6]/25 mb-1.5">
                  <LogIn className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900 uppercase">Acesse sua conta</h2>
              </div>

              {/* Form content - minimal spacing */}
              <form onSubmit={handleLogin} className="space-y-2">
                {/* Hierarchical Selection Section */}
                <div className="space-y-1.5 pb-2 border-b border-gray-100">
                  {/* State Selection */}
                  <div className="group">
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
                  <div className="group">
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

                  {/* User Type Selection */}
                  <div className="group">
                    <Label htmlFor="usertype-select-desktop" className="text-[8px] font-semibold text-gray-500 uppercase mb-0.5 block">
                      Categoria de Usuário
                    </Label>
                    <Select
                      value={selectedUserType}
                      onValueChange={setSelectedUserType}
                      disabled={loading}
                    >
                      <SelectTrigger 
                        id="usertype-select-desktop"
                        className="h-7 bg-gray-50/80 dark:bg-gray-50/80 border border-gray-200 focus:border-[#013ba6] focus:ring-1 focus:ring-[#013ba6]/10 rounded text-[10px] font-medium uppercase text-gray-900 dark:text-gray-900"
                      >
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-xl z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                        <SelectItem value="medicina" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          MEDICINA
                        </SelectItem>
                        <SelectItem value="enfermagem" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          ENFERMAGEM
                        </SelectItem>
                        <SelectItem value="fisioterapia" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          FISIOTERAPIA
                        </SelectItem>
                        <SelectItem value="administrativo" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          ADMINISTRATIVO
                        </SelectItem>
                        <SelectItem value="gestao" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          GESTÃO
                        </SelectItem>
                        <SelectItem value="hotelaria" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          HOTELARIA
                        </SelectItem>
                        <SelectItem value="condutor" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                          CONDUTOR
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Selection - oculto para categorias de acesso amplo/operacional */}
                  {selectedUserType !== "administrativo" && selectedUserType !== "gestao" && selectedUserType !== "hotelaria" && selectedUserType !== "condutor" && (
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
                  )}
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
                  className="w-full h-8 mt-1 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d80] hover:to-[#013ba6] text-white font-bold uppercase rounded text-[11px] shadow-md shadow-[#013ba6]/25 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
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

        {/* MOBILE: Original centered layout */}
        <div className="lg:hidden w-full max-w-[480px] relative z-10">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
          </div>

          {/* Logo Section */}
          <div className="text-center mb-4 animate-in fade-in-0 slide-in-from-top-8 duration-1000">
            <div className="inline-block relative group mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-xl blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white rounded-xl px-4 py-2 shadow-2xl shadow-black/30 transform transition-all duration-500 group-hover:scale-105">
                <img 
                  src={whitelabel.logos.networkFull} 
                  alt={whitelabel.institution.networkLogoAlt} 
                  className="h-8 object-contain transition-all duration-500 group-hover:brightness-110"
                />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
              </div>
            </div>
            
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150">
              <div className="inline-flex items-baseline gap-1">
                <h1 className="text-3xl tracking-tighter inline-flex items-baseline">
                  <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                    {whitelabel.platform.name.slice(0, 3)}
                  </span>
                  <span className="font-light text-white/80 -ml-0.5">
                    {whitelabel.platform.name.slice(3)}
                  </span>
                </h1>
                <span className="text-[7px] font-medium text-white/40 tracking-wider border border-white/20 rounded-full px-1 py-0.5 self-start">
                  {whitelabel.platform.version}
                </span>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 p-5 border border-white/40 relative overflow-hidden animate-in fade-in-0 zoom-in-95 duration-1000 delay-500">
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
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">LOCALIZAÇÃO</p>
                
                {/* State Selection */}
                <div className="space-y-0.5">
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
                      className="h-9 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 dark:text-gray-900"
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
                <div className="space-y-0.5">
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
                      className="h-9 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-50"
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

                {/* User Type Selection */}
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="usertype-select-mobile" 
                    className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase"
                  >
                    <Users className="h-2.5 w-2.5 text-gray-500" />
                    CATEGORIA DE USUÁRIO
                  </Label>
                  <Select
                    value={selectedUserType}
                    onValueChange={setSelectedUserType}
                    disabled={loading}
                  >
                    <SelectTrigger 
                      id="usertype-select-mobile"
                      className="h-9 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 dark:text-gray-900"
                    >
                      <SelectValue placeholder="SELECIONE A CATEGORIA" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-white border border-gray-200 shadow-lg z-[9999] rounded-lg text-gray-900 dark:text-gray-900">
                      <SelectItem value="medicina" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        MEDICINA
                      </SelectItem>
                      <SelectItem value="enfermagem" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        ENFERMAGEM
                      </SelectItem>
                      <SelectItem value="fisioterapia" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        FISIOTERAPIA
                      </SelectItem>
                      <SelectItem value="administrativo" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        ADMINISTRATIVO
                      </SelectItem>
                      <SelectItem value="gestao" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        GESTÃO
                      </SelectItem>
                      <SelectItem value="hotelaria" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        HOTELARIA
                      </SelectItem>
                      <SelectItem value="condutor" className="text-xs font-medium py-1.5 text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-100 focus:text-gray-900 dark:focus:text-gray-900">
                        CONDUTOR
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Selection - oculto para categorias de acesso amplo/operacional */}
                {selectedUserType !== "administrativo" && selectedUserType !== "gestao" && selectedUserType !== "hotelaria" && selectedUserType !== "condutor" && (
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
                      className="h-9 bg-gray-50 dark:bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 dark:text-gray-900 disabled:opacity-60"
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
                )}
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
                    className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 placeholder:text-gray-500"
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
                      className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg pr-9 text-xs font-mono uppercase tracking-widest text-gray-900 placeholder:text-gray-500"
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
                className="w-full h-10 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d7a] hover:to-[#013ba6] text-white font-bold text-xs rounded-lg shadow-md shadow-[#013ba6]/30 mt-3 uppercase"
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
          
          {/* LGPD Compliance Badge - Mobile */}
          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mx-auto">
            <FileCheck className="h-3.5 w-3.5 text-green-400" />
            <div className="text-center">
              <p className="text-[9px] font-medium text-white/80">{whitelabel.compliance.complianceBadgeTitle}</p>
              <p className="text-[8px] text-white/40">{whitelabel.compliance.legalReferences}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-3">
            <p className="text-white/30 text-[9px] uppercase tracking-widest">{whitelabel.credits.developerLabel}</p>
            <p className="text-white/50 text-[10px] font-semibold mt-0.5">{whitelabel.credits.developerName}</p>
          </div>
        </div>
      </div>
    </>
  );
}
