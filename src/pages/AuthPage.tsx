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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username" className="uppercase text-xs font-semibold">
                Login
              </Label>
              <Input
                id="login-username"
                type="text"
                placeholder="USUÁRIO"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value.toUpperCase() })}
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
        </CardContent>
      </Card>
    </div>
  );
}

