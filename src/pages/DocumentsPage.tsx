import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function DocumentsPage() {
  const navigate = useNavigate();

  const documents = [
    { id: "sepse", title: "Protocolo SEPSE", route: "/sepsis-protocol" },
    { id: "tomografias", title: "Tomografias", route: "/documents/tomografias" },
    { id: "opme", title: "Listas OPME", route: "/documents/opme" },
    { id: "hemoderivados", title: "Hemoderivados", route: "/documents/hemoderivados" },
    { id: "regulacoes", title: "Regulações SUS", route: "/documents/regulacoes" },
    { id: "alto-custo", title: "Alto Custo", route: "/documents/alto-custo" },
  ];

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
          <h1 className="text-3xl font-bold mb-2">DOCUMENTOS</h1>
          <p className="text-muted-foreground">
            Documentos médicos institucionais
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {doc.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(doc.route);
                }}
              >
                ACESSAR
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
