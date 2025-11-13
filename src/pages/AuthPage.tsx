import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { z } from "zod";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-border/50 relative z-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl h-20 w-20 flex items-center justify-center shadow-lg shadow-primary/30 transform group-hover:scale-105 transition-transform">
              <Stethoscope className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold uppercase tracking-tight bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text">
              Plataforma Médica
            </CardTitle>
            <CardDescription className="uppercase text-xs tracking-widest font-medium text-muted-foreground/80">
              Sistema de Controle de Leitos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login-username" className="uppercase text-xs font-semibold tracking-wide text-foreground/90">
                Login
              </Label>
              <Input
                id="login-username"
                type="text"
                placeholder="USUÁRIO"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value.toUpperCase() })}
                className="uppercase h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="uppercase text-xs font-semibold tracking-wide text-foreground/90">
                Senha
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full uppercase h-11 font-semibold tracking-wide shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all" 
              disabled={loading}
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

