import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Truck, BedDouble, BarChart3, LogOut, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useHospital } from "@/contexts/HospitalContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/go", label: "Visão Geral", icon: Activity, exact: true },
  { to: "/go/conductors", label: "Condutores", icon: Truck },
  { to: "/go/beds", label: "Ciclo de Leitos", icon: BedDouble },
  { to: "/go/indicators", label: "Indicadores", icon: BarChart3 },
];

export function GoLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { currentHospital } = useHospital();

  const handleLogout = async () => {
    await signOut();
    navigate("/go/auth");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/go" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base">
                HAPMAP <span className="text-primary">GO</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Gestão Operacional
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col items-end leading-tight text-xs">
              <span className="font-semibold">{user?.email?.split("@")[0]?.toUpperCase()}</span>
              <span className="text-muted-foreground">{currentHospital?.name}</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">HAPMAP</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t flex overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 min-w-[80px] flex flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-wide",
                  active ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t bg-card py-3 text-center text-xs text-muted-foreground">
        HAPMAP GO • Módulo Operacional sincronizado com HAPMAP
      </footer>
    </div>
  );
}
