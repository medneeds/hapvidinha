import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  const loadedUserIdRef = useRef<string | null>(null);
  const signInPromiseRef = useRef<ReturnType<typeof supabase.auth.signInWithPassword> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        if (loadedUserIdRef.current !== nextSession.user.id) {
          loadedUserIdRef.current = nextSession.user.id;
          void fetchUserRoleAndDepartments(nextSession.user.id);
        }
      } else {
        loadedUserIdRef.current = null;
        setRole(null);
        setStatus(null);
        setAllowedDepartments([]);
        setLoading(false);
      }
    };

    const initializeAuth = async () => {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        (_event, nextSession) => applySession(nextSession)
      );
      subscription = authSubscription;

      const { data: { session: existingSession }, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        applySession(null);
        return;
      }

      applySession(existingSession);
    };

    void initializeAuth();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
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

    // Uma única tentativa evita ampliar o bloqueio por IP quando a rede do
    // hospital já está próxima do limite de autenticação.
    if (!signInPromiseRef.current) {
      signInPromiseRef.current = supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });
    }

    const { error: signInError } = await signInPromiseRef.current.finally(() => {
      signInPromiseRef.current = null;
    });

    if (!signInError) {
      navigate("/");
      return { error: null };
    }

    let lastError: any = signInError;

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
