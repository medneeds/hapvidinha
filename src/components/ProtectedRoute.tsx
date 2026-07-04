import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { SessionTimeoutProvider } from "./SessionTimeoutProvider";
import { PendingApprovalScreen } from "./PendingApprovalScreen";
import { ConsentTermsDialog, CURRENT_TERMS_VERSION } from "./ConsentTermsDialog";
import { supabase } from "@/integrations/supabase/client";
import { usePatientsPrefetch } from "@/contexts/PatientsPrefetchContext";

// Logins genéricos que não precisam de aprovação (período de transição)
const LEGACY_GENERIC_USERS = [
  "medicoporta@sistema.local",
  "lider@sistema.local",
  "visitante@sistema.local",
  "medicouti@sistema.local",
  "liderped@sistema.local",
  "coordenador@sistema.local",
];

// Roles autorizadas a acessar a plataforma (apenas médicos com CRM + admin de gestão)
const ALLOWED_ROLES = new Set(["medico", "admin"]);

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, status, role, signOut } = useAuth();
  const { isReady: prefetchReady } = usePatientsPrefetch();
  const navigate = useNavigate();
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [checkingTerms, setCheckingTerms] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [roleBlocked, setRoleBlocked] = useState(false);

  // Verificar se é um usuário genérico legado (não precisa de aprovação nem termos)
  const isLegacyGenericUser = user?.email && LEGACY_GENERIC_USERS.includes(user.email.toLowerCase());

  // Verificar se usuário já aceitou os termos
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!user || isLegacyGenericUser) {
        setCheckingTerms(false);
        setTermsAccepted(true);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("terms_version, terms_accepted_at")
          .eq("id", user.id)
          .single();

        if (profile?.terms_version === CURRENT_TERMS_VERSION && profile?.terms_accepted_at) {
          setTermsAccepted(true);
        } else {
          setShowTermsDialog(true);
        }
      } catch (error) {
        console.error("Erro ao verificar termos:", error);
        setShowTermsDialog(true);
      } finally {
        setCheckingTerms(false);
      }
    };

    if (user && !loading) {
      checkTermsAcceptance();
    }
  }, [user, loading, isLegacyGenericUser]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Bloqueia acesso de qualquer role que não seja médico/admin
  useEffect(() => {
    if (!loading && user && role && !ALLOWED_ROLES.has(role) && !roleBlocked) {
      setRoleBlocked(true);
      (async () => {
        const { toast } = await import("sonner");
        toast.error("ACESSO RESTRITO A MÉDICOS COM CRM.");
        await signOut();
      })();
    }
  }, [loading, user, role, roleBlocked, signOut]);

  // Enquanto autentica ou verifica termos: mostrar LoadingScreen (evita flash branco)
  if (loading || checkingTerms) {
    return <LoadingScreen duration={1200} />;
  }

  if (!user) {
    return <LoadingScreen duration={1200} />;
  }

  // Mostrar diálogo de termos se ainda não aceitou
  if (showTermsDialog && !termsAccepted) {
    return (
      <ConsentTermsDialog
        open={true}
        userId={user.id}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTermsDialog(false);
        }}
      />
    );
  }

  // Usuários suspensos ou rejeitados são bloqueados (inclusive legados)
  if (status === "suspended" || status === "rejected") {
    return <PendingApprovalScreen status={status} isLegacyUser={!!isLegacyGenericUser} />;
  }

  // Usuários genéricos legados têm acesso direto (período de transição)
  // Usuários individuais pendentes veem a tela de espera
  if (status === "pending" && !isLegacyGenericUser) {
    return <PendingApprovalScreen status="pending" />;
  }

  // Envolver com SessionTimeoutProvider para ativar timeout LGPD/CFM
  return (
    <SessionTimeoutProvider>
      {children}
    </SessionTimeoutProvider>
  );
}
