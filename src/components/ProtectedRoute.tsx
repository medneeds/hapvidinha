import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";
import { SessionTimeoutProvider } from "./SessionTimeoutProvider";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

// Logins genéricos que não precisam de aprovação (período de transição)
const LEGACY_GENERIC_USERS = [
  "medicoporta@sistema.local",
  "lider@sistema.local",
  "visitante@sistema.local",
  "medicouti@sistema.local",
  "liderped@sistema.local",
  "coordenador@sistema.local",
];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, status } = useAuth();
  const navigate = useNavigate();
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  // Verificar se é um usuário genérico legado (não precisa de aprovação)
  const isLegacyGenericUser = user?.email && LEGACY_GENERIC_USERS.includes(user.email.toLowerCase());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !hasShownLoading) {
      setShowLoadingScreen(true);
      setHasShownLoading(true);
    }
  }, [user, loading, navigate, hasShownLoading]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (showLoadingScreen) {
    return <LoadingScreen onComplete={() => setShowLoadingScreen(false)} />;
  }

  // Usuários genéricos legados têm acesso direto (período de transição)
  // Usuários individuais pendentes veem a tela de espera
  if (status === "pending" && !isLegacyGenericUser) {
    return <PendingApprovalScreen />;
  }

  // Envolver com SessionTimeoutProvider para ativar timeout LGPD/CFM
  return (
    <SessionTimeoutProvider>
      {children}
    </SessionTimeoutProvider>
  );
}
