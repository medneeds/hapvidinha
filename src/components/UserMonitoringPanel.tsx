import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUserPresence, OnlineUser } from "@/hooks/useUserPresence";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Activity,
  Clock,
  Shield,
  UserCheck,
  Building2,
  TrendingUp,
  Eye,
  AlertCircle,
  Wifi,
  WifiOff,
  Stethoscope,
  DoorOpen,
  User,
  BarChart3,
  History,
  LogIn,
  LogOut,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  user_email: string | null;
  action: string;
  table_name: string;
  created_at: string;
}

interface LoginStats {
  todayLogins: number;
  weekLogins: number;
  uniqueUsersToday: number;
  peakHour: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { 
    label: "Coordenador", 
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: <Shield className="h-3 w-3" />
  },
  medico: { 
    label: "Médico", 
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Stethoscope className="h-3 w-3" />
  },
  porta: { 
    label: "Porta", 
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    icon: <DoorOpen className="h-3 w-3" />
  },
  visitante: { 
    label: "Visitante", 
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: <User className="h-3 w-3" />
  },
};

export function UserMonitoringPanel() {
  const { onlineUsers, isTracking, onlineCount } = useUserPresence();
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [loginStats, setLoginStats] = useState<LoginStats>({
    todayLogins: 0,
    weekLogins: 0,
    uniqueUsersToday: 0,
    peakHour: "—",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    
    // Refresh every minute
    const interval = setInterval(fetchMonitoringData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      // Fetch recent activity logs
      const { data: activityLogs } = await supabase
        .from("audit_logs")
        .select("id, user_email, action, table_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      setRecentActivity(activityLogs || []);

      // Fetch login statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Today's logins
      const { count: todayCount } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "LOGIN")
        .gte("created_at", today.toISOString());

      // Week's logins
      const { count: weekCount } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "LOGIN")
        .gte("created_at", weekAgo.toISOString());

      // Unique users today
      const { data: uniqueUsers } = await supabase
        .from("audit_logs")
        .select("user_id")
        .eq("action", "LOGIN")
        .gte("created_at", today.toISOString());

      const uniqueUserIds = new Set(uniqueUsers?.map((u) => u.user_id) || []);

      // Peak hour calculation (simplified)
      const { data: hourlyLogins } = await supabase
        .from("audit_logs")
        .select("created_at")
        .eq("action", "LOGIN")
        .gte("created_at", today.toISOString());

      let peakHour = "—";
      if (hourlyLogins && hourlyLogins.length > 0) {
        const hourCounts: Record<number, number> = {};
        hourlyLogins.forEach((log) => {
          const hour = new Date(log.created_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const maxHour = Object.entries(hourCounts).reduce(
          (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
          { hour: 0, count: 0 }
        );

        if (maxHour.count > 0) {
          peakHour = `${maxHour.hour}h - ${maxHour.hour + 1}h`;
        }
      }

      setLoginStats({
        todayLogins: todayCount || 0,
        weekLogins: weekCount || 0,
        uniqueUsersToday: uniqueUserIds.size,
        peakHour,
      });
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group online users by role
  const usersByRole = onlineUsers.reduce((acc, user) => {
    const role = user.role || "unknown";
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, OnlineUser[]>);

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      INSERT: { label: "Criou", color: "text-green-600" },
      UPDATE: { label: "Editou", color: "text-blue-600" },
      DELETE: { label: "Excluiu", color: "text-red-600" },
      SELECT: { label: "Visualizou", color: "text-gray-600" },
      LOGIN: { label: "Login", color: "text-purple-600" },
      LOGOUT: { label: "Logout", color: "text-orange-600" },
    };
    return labels[action] || { label: action, color: "text-gray-600" };
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      patients: "Paciente",
      patient_movements: "Movimentação",
      shift_handovers: "Passagem Plantão",
      sepsis_protocols: "Protocolo Sepse",
      bed_allocation_requests: "Solicitação Leito",
      internment_requests: "Solicitação Internação",
      profiles: "Perfil",
      user_roles: "Papel Usuário",
    };
    return labels[tableName] || tableName;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Monitoramento em Tempo Real
                {isTracking ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                    <Wifi className="h-3 w-3" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                    <WifiOff className="h-3 w-3" />
                    Desconectado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Acompanhe usuários online e atividade do sistema
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{onlineCount}</span>
            <span className="text-sm text-green-600">online</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="online" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="online" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários Online
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" />
              Atividade Recente
            </TabsTrigger>
          </TabsList>

          {/* Online Users Tab */}
          <TabsContent value="online" className="space-y-4">
            {/* Users by Role Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                const count = usersByRole[role]?.length || 0;
                return (
                  <div
                    key={role}
                    className={`p-3 rounded-lg border ${config.color} flex items-center gap-3`}
                  >
                    <div className="p-2 rounded-full bg-background">
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs">{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Online Users List */}
            <ScrollArea className="h-[300px] rounded-lg border">
              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhum usuário online no momento</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {onlineUsers.map((user) => {
                    const roleConfig = user.role ? ROLE_CONFIG[user.role] : null;
                    const lastActivity = user.last_activity
                      ? formatDistanceToNow(new Date(user.last_activity), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : "—";

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.full_name || user.email?.replace("@sistema.local", "") || "Usuário"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {user.department && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {user.department}
                                </span>
                              )}
                              {user.current_route && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {user.current_route === "/" ? "Dashboard" : user.current_route}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs text-muted-foreground">
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lastActivity}
                            </p>
                          </div>
                          {roleConfig && (
                            <Badge variant="outline" className={`${roleConfig.color} gap-1`}>
                              {roleConfig.icon}
                              {roleConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <LogIn className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{loginStats.todayLogins}</p>
                      <p className="text-xs text-muted-foreground">Logins hoje</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-3xl font-bold text-purple-600">{loginStats.uniqueUsersToday}</p>
                      <p className="text-xs text-muted-foreground">Usuários únicos hoje</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-3xl font-bold text-green-600">{loginStats.weekLogins}</p>
                      <p className="text-xs text-muted-foreground">Logins na semana</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-xl font-bold text-orange-600">{loginStats.peakHour}</p>
                      <p className="text-xs text-muted-foreground">Horário de pico</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Sobre as estatísticas</p>
                <p>
                  Os dados são calculados com base nos logs de auditoria do sistema. 
                  Logins são rastreados automaticamente quando usuários acessam a plataforma.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <ScrollArea className="h-[350px] rounded-lg border">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <History className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {recentActivity.map((log) => {
                    const actionConfig = getActionLabel(log.action);
                    
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-background ${actionConfig.color}`}>
                            {log.action === "LOGIN" ? (
                              <LogIn className="h-4 w-4" />
                            ) : log.action === "LOGOUT" ? (
                              <LogOut className="h-4 w-4" />
                            ) : (
                              <Activity className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">
                                {log.user_email?.replace("@sistema.local", "") || "Sistema"}
                              </span>
                              {" "}
                              <span className={actionConfig.color}>{actionConfig.label}</span>
                              {" "}
                              <span className="text-muted-foreground">
                                {getTableLabel(log.table_name)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
