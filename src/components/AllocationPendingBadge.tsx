import { useState } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Patient } from "@/types/patient";
import { useBedAllocationRequests } from "@/hooks/useBedAllocationRequests";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AllocationPendingBadgeProps {
  patient: Patient;
}

export function AllocationPendingBadge({ patient }: AllocationPendingBadgeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { requests } = useBedAllocationRequests();
  
  // Find request for this patient
  const patientRequest = requests.find(r => r.patient_id === patient.id);
  
  const status = patient.allocationStatus || patientRequest?.status;
  
  if (!status || status === 'approved') return null;

  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Aguardando Aprovação",
      description: "Solicitação enviada, aguardando análise do líder",
      className: "bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30",
      iconClassName: "text-amber-500",
      pulseClassName: "animate-pulse",
    },
    discussing: {
      icon: MessageSquare,
      label: "Em Discussão",
      description: "O caso está sendo discutido pela equipe",
      className: "bg-sky-500/20 text-sky-500 border-sky-500/30 hover:bg-sky-500/30",
      iconClassName: "text-sky-500",
      pulseClassName: "",
    },
    rejected: {
      icon: XCircle,
      label: "Negado",
      description: "A solicitação foi negada",
      className: "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30",
      iconClassName: "text-red-500",
      pulseClassName: "",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-pointer transition-all ${config.className} ${config.pulseClassName} flex items-center gap-1.5 px-2 py-1`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
          >
            <Icon className={`h-3.5 w-3.5 ${config.iconClassName}`} />
            <span className="text-xs font-medium">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
          {patientRequest?.requested_sector && (
            <p className="text-xs text-muted-foreground mt-1">
              Setor solicitado: {patientRequest.requested_sector}
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.iconClassName}`} />
              Status da Solicitação
            </DialogTitle>
            <DialogDescription>
              Detalhes da solicitação de alocação de leito
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${config.className}`}>
                  <Icon className={`h-5 w-5 ${config.iconClassName}`} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{config.label}</p>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paciente:</span>
                <span className="font-medium">{patient.name || "Não informado"}</span>
              </div>
              
              {patientRequest?.requested_sector && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Setor solicitado:</span>
                  <span className="font-medium">{patientRequest.requested_sector}</span>
                </div>
              )}
              
              {patientRequest?.created_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data da solicitação:</span>
                  <span className="font-medium">
                    {format(new Date(patientRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
              
              {status === 'rejected' && patientRequest?.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mt-4">
                  <p className="text-sm font-medium text-red-500 mb-1">Motivo da negação:</p>
                  <p className="text-sm text-red-400">{patientRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}