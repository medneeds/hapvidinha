import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GoLayout } from "./GoLayout";

export function GoProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, status } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/go/auth" replace />;
  if (status === "suspended" || status === "rejected") {
    return <Navigate to="/auth" replace />;
  }

  return <GoLayout>{children}</GoLayout>;
}
