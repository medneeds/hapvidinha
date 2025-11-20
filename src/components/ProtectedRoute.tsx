import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !showLoadingScreen) {
      setShowLoadingScreen(true);
    }
  }, [user, loading, navigate, showLoadingScreen]);

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
