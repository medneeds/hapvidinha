import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = "admin" | "medico" | "porta" | "visitante" | "prescritor" | "uti" | "recepcao" | "enfermagem" | "fisioterapia" | null;
type UserStatus = "pending" | "approved" | "rejected" | "suspended" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  status: UserStatus;
  allowedDepartments: string[];
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, password: string, fullName: string, role?: "admin" | "medico" | "porta" | "visitante" | "prescritor" | "uti" | "recepcao" | "enfermagem" | "fisioterapia") => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [status, setStatus] = useState<UserStatus>(null);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role and departments fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndDepartments(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setStatus(null);
          setAllowedDepartments([]);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserRoleAndDepartments(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndDepartments = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleError) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user role:", roleError);
        }
        setRole("medico");
      } else {
        setRole(roleData?.role as UserRole);
      }

      // Fetch user status from profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();

      if (profileError) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user status:", profileError);
        }
        setStatus("pending");
      } else {
        setStatus(profileData?.status as UserStatus);
      }

      // Fetch allowed departments
      const { data: deptData, error: deptError } = await supabase
        .from("user_departments")
        .select("department")
        .eq("user_id", userId);

      if (deptError) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user departments:", deptError);
        }
        setAllowedDepartments([]);
      } else {
        setAllowedDepartments(deptData?.map(d => d.department) || []);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching user data:", error);
      }
      setRole("medico");
      setStatus("pending");
      setAllowedDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserStatus = async () => {
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (!profileError && profileData) {
        setStatus(profileData.status as UserStatus);
      }
    }
  };

  const signIn = async (username: string, password: string) => {
    // Converter username para formato de email interno para Supabase
    const internalEmail = `${username.toLowerCase()}@sistema.local`;

    // Tentativas com backoff para sobreviver ao rate limit (HTTP 429) do
    // endpoint de token — comum quando várias máquinas do hospital
    // compartilham o mesmo IP público.
    const delays = [1200, 2500, 4000];
    let lastError: any = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      const { error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

      if (!error) {
        navigate("/");
        return { error: null };
      }

      lastError = error;
      const isRateLimited =
        (error as any)?.status === 429 ||
        /rate limit/i.test(error.message || "");

      if (!isRateLimited || attempt === delays.length) break;
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }

    if (
      (lastError as any)?.status === 429 ||
      /rate limit/i.test(lastError?.message || "")
    ) {
      lastError = {
        ...lastError,
        message:
          "MUITAS TENTATIVAS DE ACESSO NESTA REDE. AGUARDE ALGUNS SEGUNDOS E TENTE NOVAMENTE.",
      };
    }

    // Diagnóstico: relógio do computador desajustado faz o navegador
    // considerar o token sempre expirado e entrar em loop de renovação
    // (o que gera o rate limit e impede o acesso).
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
        method: "GET",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const serverDate = res.headers.get("date");
      if (serverDate) {
        const skewSec = Math.abs(Date.now() - new Date(serverDate).getTime()) / 1000;
        if (skewSec > 120) {
          lastError = {
            ...lastError,
            message:
              "O RELÓGIO DESTE COMPUTADOR ESTÁ DESAJUSTADO. CORRIJA A DATA/HORA DO SISTEMA PARA CONSEGUIR ACESSAR.",
          };
        }
      }
    } catch {
      /* diagnóstico opcional */
    }

    return { error: lastError };
  };



  const signUp = async (username: string, password: string, fullName: string, role: "admin" | "medico" | "porta" | "visitante" | "prescritor" | "uti" | "recepcao" | "enfermagem" = "medico") => {
    const redirectUrl = `${window.location.origin}/`;
    const internalEmail = `${username.toLowerCase()}@sistema.local`;
    
    const { error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: username,
          role: role, // Passar papel nos metadados para o trigger usar
        },
      },
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setStatus(null);
    setAllowedDepartments([]);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, status, allowedDepartments, loading, signIn, signUp, signOut, refreshUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
