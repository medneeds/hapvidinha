import { useState, useEffect } from "react";
import { ArrowLeft, LogOut, Search, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InternmentRequest {
  id: string;
  title: string;
  content: string;
  patient_name: string;
  patient_age: number | null;
  patient_sex: string | null;
  patient_record: string | null;
  created_at: string;
  updated_at: string;
}

const InternmentHistoryPage = () => {
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();
  const { currentDepartment } = useDepartment();
  const { toast } = useToast();
  const [requests, setRequests] = useState<InternmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<InternmentRequest[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InternmentRequest | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchName, searchDate, requests]);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("internment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao carregar solicitações:", error);
      }
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL CARREGAR AS SOLICITAÇÕES",
        variant: "destructive",
      });
      return;
    }

    setRequests(data || []);
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchName) {
      filtered = filtered.filter(req =>
        req.patient_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.created_at).toISOString().split('T')[0];
        return reqDate === searchDate;
      });
    }

    setFilteredRequests(filtered);
  };

  const handleView = (request: InternmentRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("internment_requests")
      .delete()
      .eq("id", id);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao excluir:", error);
      }
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL EXCLUIR A SOLICITAÇÃO",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "EXCLUÍDO",
      description: "SOLICITAÇÃO REMOVIDA DO BANCO",
    });

    loadRequests();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                HISTÓRICO DE SOLICITAÇÕES
              </h1>
              <p className="text-sm text-muted-foreground uppercase">
                {currentDepartment} • {filteredRequests.length} REGISTROS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground uppercase tracking-tight">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">
                {role === 'admin' ? 'Coordenador' : 'Médico'}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase">FILTROS DE BUSCA</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-name" className="uppercase text-xs">
                BUSCAR POR NOME DO PACIENTE
              </Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value.toUpperCase())}
                placeholder="DIGITE O NOME..."
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-date" className="uppercase text-xs">
                BUSCAR POR DATA
              </Label>
              <Input
                id="search-date"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase">NOME DO PACIENTE</TableHead>
                <TableHead className="uppercase">IDADE</TableHead>
                <TableHead className="uppercase">TÍTULO</TableHead>
                <TableHead className="uppercase">DATA</TableHead>
                <TableHead className="uppercase text-right">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground uppercase py-8">
                    NENHUMA SOLICITAÇÃO ENCONTRADA
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium uppercase">
                      {request.patient_name}
                    </TableCell>
                    <TableCell className="uppercase">
                      {request.patient_age || "-"}
                    </TableCell>
                    <TableCell className="uppercase max-w-xs truncate">
                      {request.title}
                    </TableCell>
                    <TableCell className="uppercase text-xs">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(request)}
                          className="gap-2 uppercase"
                        >
                          <Eye className="h-3 w-3" />
                          VER
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 uppercase"
                        >
                          <Trash2 className="h-3 w-3" />
                          EXCLUIR
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">DETALHES DA SOLICITAÇÃO</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/30">
                <h3 className="font-semibold uppercase mb-3 text-sm">DADOS DO PACIENTE</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground uppercase">NOME:</span>
                    <p className="font-medium uppercase">{selectedRequest.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase">IDADE:</span>
                    <p className="font-medium uppercase">{selectedRequest.patient_age || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase">SEXO:</span>
                    <p className="font-medium uppercase">{selectedRequest.patient_sex || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase">PRONTUÁRIO:</span>
                    <p className="font-medium uppercase">{selectedRequest.patient_record || "-"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold uppercase mb-2 text-sm">TÍTULO</h3>
                <p className="text-sm uppercase font-medium">{selectedRequest.title}</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold uppercase mb-2 text-sm">CONTEÚDO DA SOLICITAÇÃO</h3>
                <div className="bg-muted/20 p-3 rounded-md">
                  <pre className="whitespace-pre-wrap font-mono text-xs uppercase">
                    {selectedRequest.content}
                  </pre>
                </div>
              </Card>

              <Card className="p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground uppercase">DATA DE CRIAÇÃO:</span>
                    <p className="font-medium uppercase">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase">ÚLTIMA ATUALIZAÇÃO:</span>
                    <p className="font-medium uppercase">{formatDate(selectedRequest.updated_at)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternmentHistoryPage;
