import { useState, useEffect } from "react";
import { Bell, Check, Clock, X, User, Bed, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useBedAllocationRequests, BedAllocationRequest } from "@/hooks/useBedAllocationRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BedAllocationNotifications() {
  const { role } = useAuth();
  const { currentHospital } = useHospital();
  const { requests, pendingCount, approveRequest, setDiscussing, rejectRequest } = useBedAllocationRequests();
  const [selectedRequest, setSelectedRequest] = useState<BedAllocationRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

  // Apenas LIDER e COORDENADOR veem as notificações
  if (role === "porta") return null;

  // Realtime pop-up notification for new requests
  useEffect(() => {
    if (!currentHospital?.id) return;

    const channel = supabase
      .channel("new-allocation-popup")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bed_allocation_requests",
          filter: `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log("New allocation request:", payload);
          if (payload.new.id !== lastNotifiedId) {
            setLastNotifiedId(payload.new.id as string);
            setShowPopup(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHospital?.id, lastNotifiedId]);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const discussingRequests = requests.filter(r => r.status === "discussing");

  const handleApprove = async (request: BedAllocationRequest) => {
    const success = await approveRequest(request.id);
    if (success) {
      setSelectedRequest(null);
    }
  };

  const handleDiscussing = async (request: BedAllocationRequest) => {
    const success = await setDiscussing(request.id);
    if (success) {
      setSelectedRequest(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const success = await rejectRequest(selectedRequest.id, rejectReason);
    if (success) {
      setSelectedRequest(null);
      setShowRejectDialog(false);
      setRejectReason("");
    }
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "Cuidados Especiais":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "Observação Amarela":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "Observação Azul":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      {/* Pop-up notification for new requests */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <Bell className="h-5 w-5 animate-pulse" />
              Nova Solicitação de Alocação
            </DialogTitle>
            <DialogDescription>
              Um médico da porta solicitou alocação de paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => setShowPopup(false)}>
              Ver Solicitações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bell icon with counter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-amber-500 text-white text-xs animate-pulse"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Solicitações de Alocação</h3>
            <p className="text-sm text-muted-foreground">
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>
          <ScrollArea className="h-[400px]">
            {pendingRequests.length === 0 && discussingRequests.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma solicitação pendente
              </div>
            ) : (
              <div className="divide-y">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {request.patient?.name || "Paciente"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Bed className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Badge variant="outline" className={getSectorColor(request.requested_sector)}>
                            {request.requested_sector}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(request.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 shrink-0">
                        Pendente
                      </Badge>
                    </div>
                  </div>
                ))}
                {discussingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {request.patient?.name || "Paciente"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Bed className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Badge variant="outline" className={getSectorColor(request.requested_sector)}>
                            {request.requested_sector}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(request.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 shrink-0">
                        Em Discussão
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Request detail dialog */}
      <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitação de Alocação</DialogTitle>
            <DialogDescription>
              Revise os dados do paciente e decida sobre a alocação
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-lg">
                    {selectedRequest.patient?.name || "Paciente"}
                  </span>
                </div>
                
                {selectedRequest.patient?.age && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Idade:</span> {selectedRequest.patient.age}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Setor solicitado:</span>
                  <Badge variant="outline" className={getSectorColor(selectedRequest.requested_sector)}>
                    {selectedRequest.requested_sector}
                  </Badge>
                </div>

                {selectedRequest.patient?.diagnoses && (
                  <div>
                    <p className="text-sm font-medium mb-1">Hipóteses/Diagnósticos:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedRequest.patient.diagnoses}
                    </p>
                  </div>
                )}

                {selectedRequest.patient?.admission_history && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      História Admissional:
                    </p>
                    <ScrollArea className="h-32 rounded border p-2">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedRequest.patient.admission_history}
                      </p>
                    </ScrollArea>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Solicitado em: {format(new Date(selectedRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Negar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                  onClick={() => handleDiscussing(selectedRequest)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Aguardando Discussão
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedRequest)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar Alocação
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo da Negação</DialogTitle>
            <DialogDescription>
              Informe o motivo da negação (opcional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Paciente não atende critérios para observação..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmar Negação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
