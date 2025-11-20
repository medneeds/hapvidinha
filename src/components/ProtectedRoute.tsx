import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [hasShownLoading, setHasShownLoading] = useState(false);

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

  return <>{children}</>;
}
