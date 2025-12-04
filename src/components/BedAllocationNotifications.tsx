import { useState, useEffect } from "react";
import { Bell, Check, Clock, X, User, Bed, FileText, Stethoscope, Building } from "lucide-react";
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Bed className="h-7 w-7 text-amber-500 animate-pulse" />
            </div>
            <DialogTitle className="text-lg">
              Nova Solicitação de Alocação
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* Where the patient is */}
            <div className="bg-gray-500/10 rounded-lg p-3 border border-gray-500/20">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <p className="text-sm">
                  Um médico da porta registrou um novo paciente. O paciente está atualmente na seção{" "}
                  <span className="font-semibold text-foreground">"Fora das Alas"</span>, aguardando sua aprovação para alocação.
                </p>
              </div>
            </div>

            {/* What the leader can do */}
            <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-sm">
                  Você pode <span className="font-semibold text-amber-600 dark:text-amber-400">aguardar a discussão do caso</span> antes de decidir, ou <span className="font-semibold text-green-600 dark:text-green-400">aprovar diretamente</span> a alocação para o setor solicitado.
                </p>
              </div>
            </div>

            {/* How to access */}
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bed className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm">
                  Para revisar, acesse{" "}
                  <span className="font-semibold text-primary">"Solicitações de Alocação"</span>{" "}
                  clicando no ícone de leito no cabeçalho.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => setShowPopup(false)} 
              className="w-full h-11"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bed allocation icon with counter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" title="Solicitações de Alocação">
            <Bed className="h-5 w-5" />
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
                        {request.requesting_doctor_name && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Stethoscope className="h-3 w-3" />
                            <span>{request.requesting_doctor_name}</span>
                            {request.requesting_office_number && (
                              <span className="text-muted-foreground">• Cons. {request.requesting_office_number}</span>
                            )}
                          </div>
                        )}
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
                        {request.requesting_doctor_name && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <Stethoscope className="h-3 w-3" />
                            <span>{request.requesting_doctor_name}</span>
                            {request.requesting_office_number && (
                              <span className="text-muted-foreground">• Cons. {request.requesting_office_number}</span>
                            )}
                          </div>
                        )}
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
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          {selectedRequest && (
            <>
              {/* Header with patient name and sector badge */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold truncate">
                          {selectedRequest.patient?.name || "Paciente"}
                        </h2>
                        {selectedRequest.patient?.age && (
                          <p className="text-sm text-muted-foreground">{selectedRequest.patient.age}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getSectorColor(selectedRequest.requested_sector)} text-sm px-3 py-1.5 shrink-0`}
                  >
                    <Bed className="h-3.5 w-3.5 mr-1.5" />
                    {selectedRequest.requested_sector}
                  </Badge>
                </div>
                
                {/* Requesting Doctor Info */}
                {(selectedRequest.requesting_doctor_name || selectedRequest.requesting_office_number) && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3 text-sm">
                      <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-muted-foreground">Solicitante:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {selectedRequest.requesting_doctor_name || "Não informado"}
                      </span>
                      {selectedRequest.requesting_office_number && (
                        <>
                          <span className="text-muted-foreground mx-1">|</span>
                          <Building className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-muted-foreground">Consultório:</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {selectedRequest.requesting_office_number}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  Solicitado em {format(new Date(selectedRequest.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Content area */}
              <div className="p-6 space-y-5">
                {/* Diagnoses */}
                {selectedRequest.patient?.diagnoses && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Hipóteses / Diagnósticos
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedRequest.patient.diagnoses}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admission History */}
                {selectedRequest.patient?.admission_history && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      História Admissional / Anamnese
                    </h3>
                    <ScrollArea className="h-40 rounded-lg border border-border/50 bg-muted/30">
                      <div className="p-3">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedRequest.patient.admission_history}
                        </p>
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Empty state if no clinical data */}
                {!selectedRequest.patient?.diagnoses && !selectedRequest.patient?.admission_history && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma informação clínica adicional disponível</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="border-t bg-muted/20 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Negar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/50"
                    onClick={() => handleDiscussing(selectedRequest)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Aguardando Discussão
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                    onClick={() => handleApprove(selectedRequest)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar Alocação
                  </Button>
                </div>
              </div>
            </>
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
