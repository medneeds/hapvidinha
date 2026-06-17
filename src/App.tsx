import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { PalliativeFarewellProvider } from "@/contexts/PalliativeFarewellContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import HandoversPage from "./pages/HandoversPage";
import DocumentsPage from "./pages/DocumentsPage";
import SepsisProtocolPage from "./pages/SepsisProtocolPage";
import UltrassomProtocolPage from "./pages/UltrassomProtocolPage";
import TomografiasPage from "./pages/TomografiasPage";
import HemoderivadosPage from "./pages/HemoderivadosPage";
import RegulacoesPage from "./pages/RegulacoesPage";
import OpmePage from "./pages/OpmePage";
import AltoCustoPage from "./pages/AltoCustoPage";
import SadtPage from "./pages/SadtPage";
import MovementsPage from "./pages/MovementsPage";
import AuthPage from "./pages/AuthPage";

import DashboardPage from "./pages/DashboardPage";
import PriorizacaoCirurgicaPage from "./pages/PriorizacaoCirurgicaPage";
import ControleGlicemicoPage from "./pages/ControleGlicemicoPage";
import CuidadosPaliativosPage from "./pages/CuidadosPaliativosPage";
import FluxoPaliativacaoPage from "./pages/FluxoPaliativacaoPage";
import DhdDashboardPage from "./pages/DhdDashboardPage";
import DhdRegistrationPage from "./pages/DhdRegistrationPage";
import DhdHistoryPage from "./pages/DhdHistoryPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import UserManagementPage from "./pages/UserManagementPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdminStatesPage from "./pages/AdminStatesPage";
import AdminUnitsPage from "./pages/AdminUnitsPage";
import AdminCoordinatorsPage from "./pages/AdminCoordinatorsPage";

import ReportHistoryPage from "./pages/ReportHistoryPage";
import PresentationPage from "./pages/PresentationPage";
import SepsisProtocolsAdminPage from "./pages/SepsisProtocolsAdminPage";
import StrokeProtocolsAdminPage from "./pages/StrokeProtocolsAdminPage";
import ChestPainProtocolsAdminPage from "./pages/ChestPainProtocolsAdminPage";
import GoAuthPage from "./pages/go/GoAuthPage";
import { GoProtectedRoute } from "./pages/go/GoProtectedRoute";
import GoOverviewPage from "./pages/go/GoOverviewPage";
import GoConductorsPage from "./pages/go/GoConductorsPage";
import GoBedsPage from "./pages/go/GoBedsPage";
import GoIndicatorsPage from "./pages/go/GoIndicatorsPage";


const queryClient = new QueryClient();

const App = () => {
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  
  return (
    <QueryClientProvider client={queryClient}>
      <PrivacyProvider>
      <PalliativeFarewellProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
        <Route
          path="/handovers"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <HandoversPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DocumentsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sepsis-protocol"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SepsisProtocolPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/protocolo-us"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <UltrassomProtocolPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/controle-glicemico"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <ControleGlicemicoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/cuidados-paliativos"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <CuidadosPaliativosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/fluxo-paliativacao"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <FluxoPaliativacaoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/tomografias"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <TomografiasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/hemoderivados"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <HemoderivadosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/regulacoes"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <RegulacoesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/opme"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <OpmePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/alto-custo"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <AltoCustoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/sadt"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SadtPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/priorizacao-cirurgica"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <PriorizacaoCirurgicaPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <MovementsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdDashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd/cadastro"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdRegistrationPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dhd/historico"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <DhdHistoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <PrivacyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/states"
          element={
            <ProtectedRoute>
              <AdminStatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/units"
          element={
            <ProtectedRoute>
              <AdminUnitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coordinators"
          element={
            <ProtectedRoute>
              <AdminCoordinatorsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route
          path="/admin/sepsis-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <SepsisProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stroke-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <StrokeProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chest-pain-protocols"
          element={
            <ProtectedRoute>
              <MainLayout onOpenHandover={() => setIsHandoverOpen(true)}>
                <ChestPainProtocolsAdminPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* HAPMAP GO — Módulo Operacional */}
        <Route path="/go/auth" element={<GoAuthPage />} />
        <Route path="/go" element={<GoProtectedRoute><GoOverviewPage /></GoProtectedRoute>} />
        <Route path="/go/conductors" element={<GoProtectedRoute><GoConductorsPage /></GoProtectedRoute>} />
        <Route path="/go/beds" element={<GoProtectedRoute><GoBedsPage /></GoProtectedRoute>} />
        <Route path="/go/indicators" element={<GoProtectedRoute><GoIndicatorsPage /></GoProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
      </PalliativeFarewellProvider>
      </PrivacyProvider>
  </QueryClientProvider>
  );
};

export default App;
