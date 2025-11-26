import { useState, useEffect } from "react";
import { Bell, X, Clock, CheckCircle2, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  content: string;
  type: "free_text" | "checklist_item";
  completed: boolean;
  scheduled_popup_time: string | null;
  is_active: boolean;
  created_at: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const { currentDepartment } = useDepartment();

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notes_reminders")
      .select("*")
      .eq("department", currentDepartment)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar notificações:", error);
      return;
    }

    setNotifications((data as Notification[]) || []);
    
    // Contar itens não completados de checklist
    const unread = (data || []).filter(n => n.type === "checklist_item" && !n.completed).length;
    setUnreadCount(unread);
  };

  useEffect(() => {
    fetchNotifications();

    // Verificar pop-ups agendados a cada minuto
    const intervalId = setInterval(checkScheduledPopups, 60000);
    checkScheduledPopups();

    // Realtime subscription
    const channel = supabase
      .channel("notes_reminders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes_reminders",
          filter: `department=eq.${currentDepartment}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [currentDepartment]);

  const checkScheduledPopups = async () => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("notes_reminders")
      .select("*")
      .eq("department", currentDepartment)
      .eq("is_active", true)
      .not("scheduled_popup_time", "is", null)
      .lte("scheduled_popup_time", now);

    if (error || !data || data.length === 0) return;

    data.forEach((notification) => {
      toast({
        title: "⏰ LEMBRETE PROGRAMADO",
        description: notification.content,
        duration: 10000,
      });

      // Desativar o pop-up após exibição
      supabase
        .from("notes_reminders")
        .update({ scheduled_popup_time: null })
        .eq("id", notification.id)
        .then();
    });
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("notes_reminders")
      .update({ completed: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL ATUALIZAR O ITEM",
        variant: "destructive",
      });
      return;
    }

    fetchNotifications();
    toast({
      title: currentStatus ? "ITEM REABERTO" : "ITEM CONCLUÍDO",
      description: "STATUS ATUALIZADO COM SUCESSO",
    });
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notes_reminders")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "ERRO",
        description: "NÃO FOI POSSÍVEL REMOVER O ITEM",
        variant: "destructive",
      });
      return;
    }

    fetchNotifications();
    toast({
      title: "REMOVIDO",
      description: "ITEM REMOVIDO COM SUCESSO",
    });
  };

  const checklistItems = notifications.filter(n => n.type === "checklist_item");
  const freeTextItems = notifications.filter(n => n.type === "free_text");
  const scheduledItems = notifications.filter(n => n.scheduled_popup_time);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all uppercase"
        >
          <Bell className="h-4 w-4" />
          CENTRAL
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="uppercase flex items-center gap-2">
            <Bell className="h-5 w-5" />
            CENTRAL DE NOTIFICAÇÕES
          </SheetTitle>
          <SheetDescription className="uppercase">
            LEMBRETES E ANOTAÇÕES - {currentDepartment}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Checklist Items */}
            {checklistItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  CHECKLIST ({checklistItems.filter(i => !i.completed).length} PENDENTES)
                </h3>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <Card key={item.id} className={cn("transition-all", item.completed && "opacity-60")}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComplete(item.id, item.completed)}
                          className="h-6 w-6 p-0 mt-1"
                        >
                          <CheckCircle2
                            className={cn(
                              "h-5 w-5",
                              item.completed ? "text-green-500 fill-green-500" : "text-muted-foreground"
                            )}
                          />
                        </Button>
                        <div className="flex-1 space-y-1">
                          <p className={cn("text-sm uppercase", item.completed && "line-through")}>
                            {item.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(item.id)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Popups */}
            {scheduledItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  LEMBRETES PROGRAMADOS ({scheduledItems.length})
                </h3>
                <div className="space-y-2">
                  {scheduledItems.map((item) => (
                    <Card key={item.id} className="border-amber-500/50 bg-amber-500/5">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm uppercase flex-1">{item.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(item.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.scheduled_popup_time!).toLocaleString("pt-BR")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Free Text Notes */}
            {freeTextItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  ANOTAÇÕES LIVRES ({freeTextItems.length})
                </h3>
                <div className="space-y-2">
                  {freeTextItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm uppercase flex-1 whitespace-pre-wrap">{item.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(item.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {notifications.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground uppercase">
                    NENHUMA NOTIFICAÇÃO ATIVA
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
