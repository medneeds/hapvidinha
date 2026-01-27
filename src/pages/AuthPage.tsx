import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment, DEPARTMENTS, Department } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, User, Lock, Sparkles, Building2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import hapvidaLogo from "@/assets/hapvida-notredame-full-logo.png";
import { LoadingScreen } from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginSchema = z.object({
  username: z.string().trim().min(1, { message: "LOGIN OBRIGATÓRIO" }).max(50),
  password: z.string().min(1, { message: "SENHA OBRIGATÓRIA" }),
});

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const { setCurrentDepartment } = useDepartment();
  const { states, hospitals, setCurrentHospital, isLoading: hospitalLoading } = useHospital();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate selections
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate selections
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
      const { error } = await signUp(validated.username, validated.password, validated.username);

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("USUÁRIO JÁ CADASTRADO");
        } else {
          toast.error("ERRO AO CADASTRAR: " + error.message.toUpperCase());
        }
        setLoading(false);
      } else {
        // Set hospital and department after successful signup
        const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
        if (selectedHospital) {
          setCurrentHospital(selectedHospital);
        }
        setCurrentDepartment(selectedDepartment);
        toast.success("CADASTRO REALIZADO COM SUCESSO");
        
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

        {/* DESKTOP: Split-screen layout */}
        <div className="hidden lg:flex w-full h-screen relative z-10">
          {/* Left Panel - Branding */}
          <div className="w-1/2 flex flex-col items-center justify-center p-12 xl:p-16 relative">
            {/* Gradient orbs for left panel */}
            <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
            
            <div className="relative z-10 text-center max-w-lg animate-in fade-in-0 slide-in-from-left-8 duration-1000">
              {/* Logo */}
              <div className="inline-block relative group mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-3xl blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl px-6 py-4 shadow-2xl shadow-black/30 transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-white/20">
                  <img 
                    src={hapvidaLogo} 
                    alt="Hapvida NotreDame Intermédica" 
                    className="h-12 object-contain transition-all duration-500 group-hover:brightness-110"
                  />
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
                </div>
              </div>
              
              {/* Brand Name - Logo Style */}
              <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150 mb-4">
                <div className="inline-flex items-baseline gap-2">
                  <h1 className="text-5xl xl:text-6xl tracking-tighter inline-flex items-baseline">
                    <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                      Hap
                    </span>
                    <span className="font-light text-white/80 -ml-0.5">
                      Map
                    </span>
                  </h1>
                  <span className="text-[10px] font-medium text-white/40 tracking-wider border border-white/20 rounded-full px-2 py-0.5 self-start mt-2">
                    2.0
                  </span>
                </div>
                <div className="h-1 w-20 mx-auto mt-2 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
              </div>
              
              {/* Slogan */}
              <p className="text-white/60 text-base xl:text-lg font-light tracking-wide animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300 mb-12 italic">
                Tecnologia que valoriza seu tempo. Inteligência que salva vidas.
              </p>
              
              {/* Elegant divider */}
              <div className="flex items-center justify-center gap-4 mb-10 animate-in fade-in-0 duration-1000 delay-400">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
                <Sparkles className="h-4 w-4 text-white/40" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
              </div>
              
              {/* Feature highlights - more elegant */}
              <div className="space-y-5 text-left animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-500">
                <div className="flex items-center gap-4 text-white/60 hover:text-white/90 transition-colors duration-300 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-light tracking-wide">Gestão inteligente de leitos em tempo real</span>
                </div>
                <div className="flex items-center gap-4 text-white/60 hover:text-white/90 transition-colors duration-300 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-light tracking-wide">Visão completa do paciente em um clique</span>
                </div>
                <div className="flex items-center gap-4 text-white/60 hover:text-white/90 transition-colors duration-300 group">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-light tracking-wide">IA integrada para suporte à decisão clínica</span>
                </div>
              </div>
            </div>
            
            {/* Footer on left panel */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-[10px] text-white/30 italic">
                Desenvolvido por Artur Batista
              </p>
            </div>
          </div>
          
          {/* Right Panel - Form */}
          <div className="w-1/2 bg-white flex items-center justify-center p-8 xl:p-12 relative overflow-hidden">
            {/* Subtle background pattern for form panel */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #013ba6 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#013ba6]/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#013ba6]/5 to-transparent" />
            
            <div className="w-full max-w-md relative z-10 animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-300">
              {/* Form header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#013ba6] to-[#0152d4] shadow-lg shadow-[#013ba6]/30 mb-4">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 uppercase">Acesse sua conta</h2>
                <p className="text-gray-500 text-sm mt-1">Preencha os dados para continuar</p>
              </div>

              {/* Form content - same as mobile but styled for desktop */}
              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
                {/* Hierarchical Selection Section */}
                <div className="space-y-4 pb-5 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Localização</p>
                  
                  {/* State Selection */}
                  <div className="space-y-1.5 group">
                    <Label htmlFor="state-select-desktop" className="text-xs font-semibold text-gray-600 uppercase">
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
                        className="h-11 bg-gray-50 border border-gray-200 focus:border-[#013ba6] focus:ring-2 focus:ring-[#013ba6]/10 rounded-xl text-sm font-medium uppercase text-gray-900"
                      >
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl z-[200] rounded-xl">
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id} className="text-sm font-medium py-2.5 text-gray-900 hover:bg-gray-100">
                            {state.name} ({state.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hospital Unit Selection */}
                  <div className="space-y-1.5 group">
                    <Label htmlFor="hospital-select-desktop" className="text-xs font-semibold text-gray-600 uppercase">
                      Unidade Hospitalar
                    </Label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                      disabled={loading || hospitalLoading || !selectedState}
                    >
                      <SelectTrigger 
                        id="hospital-select-desktop"
                        className="h-11 bg-gray-50 border border-gray-200 focus:border-[#013ba6] focus:ring-2 focus:ring-[#013ba6]/10 rounded-xl text-sm font-medium uppercase text-gray-900 disabled:opacity-50"
                      >
                        <SelectValue placeholder={selectedState ? "Selecione a unidade" : "Primeiro selecione um estado"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl z-[200] rounded-xl">
                        {filteredHospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id} className="text-sm font-medium py-2.5 text-gray-900 hover:bg-gray-100">
                            {hospital.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Selection */}
                  <div className="space-y-1.5 group">
                    <Label htmlFor="department-select-desktop" className="text-xs font-semibold text-gray-600 uppercase">
                      Setor
                    </Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={(value: Department) => setSelectedDepartment(value)}
                      disabled={loading}
                    >
                      <SelectTrigger 
                        id="department-select-desktop"
                        className="h-11 bg-gray-50 border border-gray-200 focus:border-[#013ba6] focus:ring-2 focus:ring-[#013ba6]/10 rounded-xl text-sm font-medium uppercase text-gray-900"
                      >
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl z-[200] rounded-xl">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="text-sm font-medium py-2.5 text-gray-900 hover:bg-gray-100">
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Authentication Fields Section */}
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados de Acesso</p>
                  
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-username-desktop" className="text-xs font-semibold text-gray-600 uppercase">
                      Usuário
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-username-desktop"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => {
                          const newUsername = e.target.value;
                          setLoginData({ ...loginData, username: newUsername });
                          // Auto-select department based on username
                          if (newUsername.toUpperCase() === 'MEDICOUTI') {
                            setSelectedDepartment('UTI');
                          } else if (newUsername.toUpperCase() === 'MEDICOPORTA') {
                            setSelectedDepartment('URGÊNCIA E EMERGÊNCIA ADULTO');
                          }
                        }}
                        placeholder="Digite seu usuário"
                        className="h-11 pl-10 bg-gray-50 border border-gray-200 focus:border-[#013ba6] focus:ring-2 focus:ring-[#013ba6]/10 rounded-xl text-sm"
                        disabled={loading}
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password-desktop" className="text-xs font-semibold text-gray-600 uppercase">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password-desktop"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Digite sua senha"
                        className="h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 focus:border-[#013ba6] focus:ring-2 focus:ring-[#013ba6]/10 rounded-xl text-sm"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d80] hover:to-[#013ba6] text-white font-bold uppercase rounded-xl shadow-lg shadow-[#013ba6]/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {isSignUp ? "Criar Conta" : "Entrar no Sistema"}
                    </span>
                  )}
                </Button>

                {/* Toggle Sign Up / Sign In */}
                <div className="text-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#013ba6] hover:text-[#012d80] font-semibold text-sm uppercase hover:bg-[#013ba6]/5"
                  >
                    {isSignUp ? "Já tenho conta" : "Criar nova conta"}
                  </Button>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 pt-2 text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Conexão segura e criptografada</span>
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
                  src={hapvidaLogo} 
                  alt="Hapvida NotreDame Intermédica" 
                  className="h-8 object-contain transition-all duration-500 group-hover:brightness-110"
                />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
              </div>
            </div>
            
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150">
              <div className="inline-flex items-baseline gap-1">
                <h1 className="text-3xl tracking-tighter inline-flex items-baseline">
                  <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                    Hap
                  </span>
                  <span className="font-light text-white/80 -ml-0.5">
                    Map
                  </span>
                </h1>
                <span className="text-[7px] font-medium text-white/40 tracking-wider border border-white/20 rounded-full px-1 py-0.5 self-start">
                  2.0
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
                <p className="text-[10px] text-gray-500 italic">Tecnologia que valoriza seu tempo</p>
              </div>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-2.5 relative z-10">
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
                      className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900"
                    >
                      <SelectValue placeholder="SELECIONE O ESTADO" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200] rounded-lg">
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id} className="text-xs font-medium py-1.5 text-gray-900 hover:bg-gray-100">
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
                      className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900 disabled:opacity-50"
                    >
                      <SelectValue placeholder={selectedState ? "SELECIONE" : "SELECIONE ESTADO PRIMEIRO"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200] rounded-lg">
                      {filteredHospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id} className="text-xs font-medium py-1.5 text-gray-900 hover:bg-gray-100">
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
                      className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase text-gray-900"
                    >
                      <SelectValue placeholder="SELECIONE O SETOR" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-[200] rounded-lg">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-xs font-medium py-1.5 text-gray-900 hover:bg-gray-100">
                          {dept}
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
                    className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg text-xs font-medium uppercase"
                    value={loginData.username}
                    onChange={(e) => {
                      const newUsername = e.target.value;
                      setLoginData(prev => ({ ...prev, username: newUsername }));
                      if (newUsername.toUpperCase() === 'MEDICOUTI') {
                        setSelectedDepartment('UTI');
                      } else if (newUsername.toUpperCase() === 'MEDICOPORTA') {
                        setSelectedDepartment('URGÊNCIA E EMERGÊNCIA ADULTO');
                      }
                    }}
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-0.5">
                  <Label htmlFor="login-password-mobile" className="text-[10px] font-semibold text-gray-600 flex items-center gap-1 uppercase">
                    <Lock className="h-2.5 w-2.5 text-gray-500" />
                    SENHA
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password-mobile"
                      type={showPassword ? "text" : "password"}
                      placeholder="DIGITE SUA SENHA"
                      className="h-9 bg-gray-50 border border-gray-200 focus:border-[#013ba6] rounded-lg pr-9 text-xs font-medium"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={loading}
                      autoComplete="current-password"
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
                    <span>{isSignUp ? "CADASTRANDO..." : "ENTRANDO..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>{isSignUp ? "CADASTRAR" : "ENTRAR"}</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-3 pt-3 border-t border-gray-100 relative z-10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] text-[#013ba6] hover:text-[#012d7a] font-semibold uppercase"
              >
                {isSignUp ? "JÁ TENHO CONTA" : "CRIAR CONTA"}
              </button>
              <div className="flex items-center gap-1 text-[9px] text-gray-400">
                <Lock className="h-2.5 w-2.5" />
                <span>SEGURO</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-white/30 text-[9px] italic uppercase">DESENVOLVIDO POR ARTUR BATISTA</p>
          </div>
        </div>
      </div>
    </>
  );
}
