import { useEffect, useState } from "react";
import { usePatientVersions } from "@/hooks/usePatientVersions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, Trash2, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { usePatients } from "@/hooks/usePatients";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/types/patient";
import { useDepartment } from "@/contexts/DepartmentContext";

export default function VersionsPage() {
  const { versions, isLoading, fetchVersions, deleteVersion } = usePatientVersions();
  const { currentDepartment } = useDepartment();
  const { patients, deletePatient, createPatient } = usePatients(currentDepartment);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<typeof versions[0] | null>(null);

  useEffect(() => {
    fetchVersions(currentDepartment);
  }, [currentDepartment]);

  const handleRestore = (versionId: string) => {
    setSelectedVersion(versionId);
    setRestoreDialogOpen(true);
  };

  const handlePreview = (version: typeof versions[0]) => {
    setPreviewVersion(version);
    setPreviewDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedVersion) return;

    const version = versions.find(v => v.id === selectedVersion);
    if (!version) return;

    try {
      // Deletar todos os pacientes atuais sem mostrar toast
      await Promise.all(
        patients.map(p => deletePatient(p.id, { showToast: false, updateLocalState: false }))
      );

      // Criar pacientes da versão salva
      await Promise.all(
        version.snapshot_data.map(p => createPatient({
          bedNumber: p.bedNumber,
          name: p.name,
          age: p.age,
          sector: p.sector,
          diagnoses: p.diagnoses,
          medicalHistory: p.medicalHistory,
          relevantExams: p.relevantExams,
          pendencies: p.pendencies,
          schedule: p.schedule,
          admissionHistory: p.admissionHistory,
          admissionDate: p.admissionDate,
        }))
      );

      toast({
        title: "Versão restaurada",
        description: `Mapa restaurado para ${version.description}`,
      });

      navigate("/");
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar a versão.",
        variant: "destructive",
      });
    }

    setRestoreDialogOpen(false);
    setSelectedVersion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Carregando versões...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Versões Salvas</h1>
          <p className="text-muted-foreground">
            Histórico de versões do mapa de pacientes
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma versão salva ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {version.description}
                    </CardTitle>
                    <CardDescription>
                      {version.snapshot_data.length} pacientes salvos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(version)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Prévia
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(version.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVersion(version.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá substituir todos os pacientes atuais pelos pacientes da versão selecionada. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia da Versão</DialogTitle>
            <DialogDescription>
              {previewVersion?.description} • {previewVersion?.snapshot_data.length} pacientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {previewVersion?.snapshot_data.map((patient, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        LEITO {patient.bedNumber} - {patient.name}
                        {patient.age && <span className="text-sm text-muted-foreground">({typeof patient.age === 'number' ? `${patient.age} ANOS` : patient.age})</span>}
                      </CardTitle>
                      <Badge variant="outline">{patient.sector}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.diagnoses && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">HIPÓTESES DIAGNÓSTICAS:</p>
                      <p className="text-sm">{patient.diagnoses}</p>
                    </div>
                  )}
                  {patient.medicalHistory && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">ANTECEDENTES:</p>
                      <p className="text-sm">{patient.medicalHistory}</p>
                    </div>
                  )}
                  {patient.relevantExams && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">EXAMES RELEVANTES:</p>
                      <p className="text-sm">{patient.relevantExams}</p>
                    </div>
                  )}
                  {patient.pendencies && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">PENDÊNCIAS:</p>
                      <p className="text-sm">{patient.pendencies}</p>
                    </div>
                  )}
                  {patient.schedule && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">PROGRAMAÇÃO:</p>
                      <p className="text-sm">{patient.schedule}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
