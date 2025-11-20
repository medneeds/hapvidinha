import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment, DEPARTMENTS, Department } from "@/contexts/DepartmentContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, User, Lock, Sparkles, Building2 } from "lucide-react";
import { z } from "zod";
import hapvidaLogo from "@/assets/hapvida-notredame-full-logo.png";
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
  const { user, signIn } = useAuth();
  const { setCurrentDepartment } = useDepartment();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>("URGÊNCIA E EMERGÊNCIA ADULTO");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse(loginData);
      const { error } = await signIn(validated.username, validated.password, isAdminLogin ? "admin" : "medico");

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("LOGIN OU SENHA INCORRETOS");
        } else {
          toast.error("ERRO AO FAZER LOGIN: " + error.message.toUpperCase());
        }
      } else {
        // Set department after successful login
        setCurrentDepartment(selectedDepartment);
        toast.success(isAdminLogin ? "LOGIN ADMINISTRADOR REALIZADO" : "LOGIN REALIZADO COM SUCESSO");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("ERRO AO VALIDAR DADOS");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements with enhanced effects */}
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

      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl animate-[float_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-gradient-radial from-white/8 to-transparent rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        {/* Logo Section with enhanced animation */}
        <div className="text-center mb-8 animate-in fade-in-0 slide-in-from-top-8 duration-1000">
          <div className="inline-block relative group">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-3xl blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-white rounded-3xl p-6 shadow-2xl shadow-black/30 mb-6 transform transition-all duration-500 group-hover:scale-110 group-hover:shadow-3xl group-hover:shadow-white/20">
              <img 
                src={hapvidaLogo} 
                alt="Hapvida NotreDame Intermédica" 
                className="h-16 w-auto transition-all duration-500 group-hover:brightness-110"
              />
              
              {/* Sparkle effect on hover */}
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-150">
            Mapa de Pacientes
          </h1>
          <p className="text-white/80 text-sm uppercase tracking-wider font-medium animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-300">
            Hospital Guarás - Urgência e Emergência
          </p>
        </div>

        {/* Login Card with enhanced glass morphism */}
        <div className="bg-white backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/30 p-10 border border-white/40 relative overflow-hidden animate-in fade-in-0 zoom-in-95 duration-1000 delay-500">
          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#013ba6]/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
          </div>
          <div className="mb-10 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#013ba6] to-[#0152d4] flex items-center justify-center shadow-lg shadow-[#013ba6]/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <LogIn className="h-7 w-7 text-white relative z-10 transform group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-300" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2 tracking-tight">
              Acesse sua conta
            </h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-3 group">
              <Label 
                htmlFor="login-username" 
                className="text-sm font-semibold text-gray-700 flex items-center gap-2 transition-colors duration-200 group-focus-within:text-[#013ba6] mb-2"
              >
                <div className="h-5 w-5 rounded-lg bg-gray-100 flex items-center justify-center group-focus-within:bg-[#013ba6]/10 transition-colors duration-200">
                  <User className="h-3 w-3 text-gray-600 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-[#013ba6]" />
                </div>
                Usuário
              </Label>
              <div className="relative">
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Digite seu usuário"
                  className="h-14 bg-gray-50 border-2 border-gray-300 focus:border-[#013ba6] focus:ring-4 focus:ring-[#013ba6]/10 rounded-2xl transition-all duration-300 hover:border-[#013ba6]/50 hover:bg-white pl-5 text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal hover:shadow-lg focus:shadow-xl focus:bg-white"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-3 group">
              <Label 
                htmlFor="login-password" 
                className="text-sm font-semibold text-gray-700 flex items-center gap-2 transition-colors duration-200 group-focus-within:text-[#013ba6] mb-2"
              >
                <div className="h-5 w-5 rounded-lg bg-gray-100 flex items-center justify-center group-focus-within:bg-[#013ba6]/10 transition-colors duration-200">
                  <Lock className="h-3 w-3 text-gray-600 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-[#013ba6]" />
                </div>
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Digite sua senha"
                  className="h-14 bg-gray-50 border-2 border-gray-300 focus:border-[#013ba6] focus:ring-4 focus:ring-[#013ba6]/10 rounded-2xl transition-all duration-300 hover:border-[#013ba6]/50 hover:bg-white pl-5 text-base font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal hover:shadow-lg focus:shadow-xl focus:bg-white"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Department Selection */}
            <div className="space-y-3 group">
              <Label 
                htmlFor="department-select" 
                className="text-sm font-semibold text-gray-700 flex items-center gap-2 transition-colors duration-200 group-focus-within:text-[#013ba6] mb-2"
              >
                <div className="h-5 w-5 rounded-lg bg-gray-100 flex items-center justify-center group-focus-within:bg-[#013ba6]/10 transition-colors duration-200">
                  <Building2 className="h-3 w-3 text-gray-600 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-[#013ba6]" />
                </div>
                Setor
              </Label>
              <Select
                value={selectedDepartment}
                onValueChange={(value: Department) => setSelectedDepartment(value)}
                disabled={loading}
              >
                <SelectTrigger 
                  id="department-select"
                  className="h-14 bg-gray-50 border-2 border-gray-300 focus:border-[#013ba6] focus:ring-4 focus:ring-[#013ba6]/10 rounded-2xl transition-all duration-300 hover:border-[#013ba6]/50 hover:bg-white text-base font-medium text-gray-900 hover:shadow-lg focus:shadow-xl"
                >
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem 
                      key={dept} 
                      value={dept}
                      className="text-base font-medium hover:bg-[#013ba6]/10 cursor-pointer transition-colors"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Admin Login Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl hover:border-orange-300 transition-all duration-300 hover:shadow-md group">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors duration-200">
                <Lock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <label 
                  htmlFor="admin-toggle" 
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    id="admin-toggle"
                    type="checkbox"
                    checked={isAdminLogin}
                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                    disabled={loading}
                    className="h-5 w-5 rounded border-2 border-orange-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-orange-900">
                      Login como Administrador
                    </div>
                    <div className="text-xs text-orange-600 mt-0.5">
                      Acesso total para gerenciar códigos e protocolos
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d7a] hover:to-[#013ba6] text-white font-bold text-base rounded-2xl shadow-xl shadow-[#013ba6]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[#013ba6]/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <div className="flex items-center gap-3 relative z-10">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 relative z-10">
                  <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>Entrar no Sistema</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t-2 border-gray-200 relative z-10">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
              <div className="h-6 w-6 rounded-lg bg-gray-100 flex items-center justify-center">
                <Lock className="h-3 w-3 text-gray-600" />
              </div>
              <span className="tracking-wide">Conexão segura e criptografada</span>
            </div>
          </div>
        </div>

        {/* Footer with animation */}
        <div className="text-center mt-6 text-white/60 text-xs animate-in fade-in-0 duration-1000 delay-700">
          <p>© 2024 Hospital Guarás. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
