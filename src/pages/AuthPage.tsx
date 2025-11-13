import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Stethoscope, Shield } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "EMAIL INVÁLIDO" }).max(255),
  password: z.string().min(6, { message: "SENHA DEVE TER NO MÍNIMO 6 CARACTERES" }),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(3, { message: "NOME COMPLETO DEVE TER NO MÍNIMO 3 CARACTERES" }).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "SENHAS NÃO CONFEREM",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
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
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("EMAIL OU SENHA INCORRETOS");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signupSchema.parse(signupData);
      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("EMAIL JÁ CADASTRADO");
        } else {
          toast.error("ERRO AO CRIAR CONTA: " + error.message.toUpperCase());
        }
      } else {
        toast.success("CONTA CRIADA COM SUCESSO");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl h-16 w-16 flex items-center justify-center shadow-lg shadow-primary/30">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold uppercase tracking-tight">
              Plataforma Médica
            </CardTitle>
            <CardDescription className="uppercase text-xs tracking-wide mt-2">
              Sistema de Controle de Leitos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="uppercase text-xs">
                <Stethoscope className="h-4 w-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="uppercase text-xs">
                <Shield className="h-4 w-4 mr-2" />
                Cadastro
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="uppercase text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="SEU@EMAIL.COM"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="uppercase text-xs font-semibold">
                    Senha
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full uppercase" disabled={loading}>
                  {loading ? "ENTRANDO..." : "ENTRAR"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="uppercase text-xs font-semibold">
                    Nome Completo
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="SEU NOME COMPLETO"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value.toUpperCase() })}
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="uppercase text-xs font-semibold">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="SEU@EMAIL.COM"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="uppercase text-xs font-semibold">
                    Senha
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="uppercase text-xs font-semibold">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full uppercase" disabled={loading}>
                  {loading ? "CRIANDO CONTA..." : "CRIAR CONTA"}
                </Button>
                <p className="text-xs text-muted-foreground text-center uppercase mt-4">
                  Novos usuários são cadastrados como médicos por padrão
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
