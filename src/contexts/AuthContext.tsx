import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = "admin" | "medico" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signIn: (username: string, password: string, desiredRole?: "admin" | "medico") => Promise<{ error: any }>;
  signUp: (username: string, password: string, fullName: string, role?: "admin" | "medico") => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
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
          fetchUserRole(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching user role:", error);
        }
        setRole("medico"); // Default role
      } else {
        setRole(data?.role as UserRole);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching user role:", error);
      }
      setRole("medico");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string, desiredRole?: "admin" | "medico") => {
    // Converter username para formato de email interno para Supabase
    const internalEmail = `${username.toLowerCase()}@sistema.local`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });
    
    if (!error && data.user && desiredRole) {
      // Atualizar ou criar papel do usuário ANTES de qualquer outra coisa
      try {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (existingRole) {
          // Atualizar papel existente
          await supabase
            .from("user_roles")
            .update({ role: desiredRole })
            .eq("user_id", data.user.id);
        } else {
          // Criar novo papel
          await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: desiredRole });
        }
        
        // Forçar atualização da role no estado
        setRole(desiredRole);
        
        // Aguardar um pouco para garantir que a atualização foi persistida
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (roleError) {
        if (import.meta.env.DEV) {
          console.error("Erro ao atribuir papel:", roleError);
        }
      }
    }
    
    if (!error) {
      // Fazer logout e login novamente para gerar novo JWT com role atualizada
      if (desiredRole && data.user) {
        await supabase.auth.signOut();
        const { error: reloginError } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });
        
        if (reloginError) {
          return { error: reloginError };
        }
      }
      
      navigate("/");
    }
    
    return { error };
  };

  const signUp = async (username: string, password: string, fullName: string, role: "admin" | "medico" = "medico") => {
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
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
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
