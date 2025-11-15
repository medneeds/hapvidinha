import { useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotesTab from "@/components/resources/NotesTab";
import InternmentBankTab from "@/components/resources/InternmentBankTab";

const ResourcesPage = () => {
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 print:p-4 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground uppercase tracking-tight">
                {user?.user_metadata?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">
                {role === 'admin' ? 'Administrador' : 'Médico'}
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

        {/* Tabs */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 print:hidden">
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
