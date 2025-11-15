import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, User, Lock } from "lucide-react";
import { z } from "zod";
import hapvidaLogo from "@/assets/hapvida-notredame-full-logo.png";

const loginSchema = z.object({
  username: z.string().trim().min(1, { message: "LOGIN OBRIGATÓRIO" }).max(50),
  password: z.string().min(1, { message: "SENHA OBRIGATÓRIA" }),
});

export default function AuthPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

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
      const { error } = await signIn(validated.username, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("LOGIN OU SENHA INCORRETOS");
        } else {
          toast.error("ERRO AO FAZER LOGIN: " + error.message.toUpperCase());
        }
      } else {
        toast.success("LOGIN REALIZADO COM SUCESSO");
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl animate-pulse [animation-delay:3s]" />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in-0 slide-in-from-bottom-8 duration-700">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-150">
          <div className="inline-block bg-white rounded-3xl p-6 shadow-2xl shadow-black/20 mb-6 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={hapvidaLogo} 
              alt="Hapvida NotreDame Intermédica" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Mapa de Pacientes
          </h1>
          <p className="text-white/80 text-sm uppercase tracking-wider font-medium">
            Hospital Guarás - Urgência e Emergência
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 border border-white/20">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#013ba6] to-[#0152d4] flex items-center justify-center shadow-lg">
                <LogIn className="h-5 w-5 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">
              Bem-vindo
            </h2>
            <p className="text-sm text-center text-gray-600 uppercase tracking-wide">
              Acesse sua conta
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label 
                htmlFor="login-username" 
                className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Login
              </Label>
              <div className="relative">
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Digite seu usuário"
                  className="h-12 bg-gray-50 border-gray-200 focus:border-[#013ba6] focus:ring-[#013ba6] rounded-xl transition-all duration-200 hover:border-gray-300 pl-4"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="login-password" 
                className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Digite sua senha"
                  className="h-12 bg-gray-50 border-gray-200 focus:border-[#013ba6] focus:ring-[#013ba6] rounded-xl transition-all duration-200 hover:border-gray-300 pl-4"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#013ba6] to-[#0152d4] hover:from-[#012d7a] hover:to-[#013ba6] text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-[#013ba6]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#013ba6]/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Entrar
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Sistema de gestão hospitalar protegido
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/60 text-xs">
          <p>© 2024 Hospital Guarás. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
