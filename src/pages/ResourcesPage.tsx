import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import NotesTab from "@/components/resources/NotesTab";
import InternmentBankTab from "@/components/resources/InternmentBankTab";

const ResourcesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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
              RECURSOS MÉDICOS
            </h1>
            <p className="text-sm text-muted-foreground uppercase">
              DOCUMENTAÇÃO E BANCO DE SOLICITAÇÕES
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notes" className="uppercase">
              BLOCO DE NOTAS
            </TabsTrigger>
            <TabsTrigger value="bank" className="uppercase">
              BANCO DE SOLICITAÇÕES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-6">
            <NotesTab />
          </TabsContent>

          <TabsContent value="bank" className="mt-6">
            <InternmentBankTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResourcesPage;
