import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function GoAuthPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/go", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Preencha login e senha");
      return;
    }
    setLoading(true);
    const { error } = await signIn(username.trim().toUpperCase(), password);
    if (error) {
      toast.error("Credenciais inválidas");
      setLoading(false);
    } else {
      toast.success("Bem-vindo ao HAPMAP GO");
      navigate("/go", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao HAPMAP
        </Link>

        <Card className="p-8 border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg">
              <Activity className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              HAPMAP <span className="text-primary">GO</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Gestão Operacional Hospitalar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="go-username" className="text-xs uppercase tracking-wide font-semibold">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="go-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="USUARIO"
                  className="pl-10 uppercase font-mono"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="go-password" className="text-xs uppercase tracking-wide font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="go-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="pl-10 pr-10 font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold uppercase tracking-wide bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {loading ? "Entrando..." : "Entrar no GO"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
            Use as mesmas credenciais do HAPMAP.
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          HAPMAP GO • Sistema de Gestão Operacional
        </p>
      </div>
    </div>
  );
}
