import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { 
  CalendarIcon, Download, Users, FileText, UserCheck, 
  UserX, ArrowRightLeft, TrendingUp, Activity
} from "lucide-react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COLORS = ['#ef4444', '#eab308', '#3b82f6', '#6b7280', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("previous");
  
  // KPIs State
  const [kpis, setKpis] = useState({
    internmentRequests: 0,
    activePatients: 0,
    discharges: 0,
    deaths: 0,
    transfers: 0,
    comparison: {
      internmentRequests: 0,
      activePatients: 0,
      discharges: 0,
      deaths: 0,
      transfers: 0
    }
  });

  // Charts Data State
  const [movementsOverTime, setMovementsOverTime] = useState<any[]>([]);
  const [sectorDistribution, setSectorDistribution] = useState<any[]>([]);
  const [movementsByType, setMovementsByType] = useState<any[]>([]);
  const [bedOccupancy, setBedOccupancy] = useState<any[]>([]);
  const [requestsByDestination, setRequestsByDestination] = useState<any[]>([]);

  const departments = [
    { value: "all", label: "Todos os Setores" },
    { value: "URGÊNCIA E EMERGÊNCIA ADULTO", label: "Urgência Adulto" },
    { value: "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA", label: "Urgência Pediátrica" },
    { value: "UTI", label: "UTI" },
    { value: "POSTO INTERNAÇÃO", label: "Posto Internação" }
  ];

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time subscriptions
    const movementsChannel = supabase
      .channel('dashboard-movements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_movements' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('dashboard-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internment_requests' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const patientsChannel = supabase
      .channel('dashboard-patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(movementsChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(patientsChannel);
    };
  }, [dateRange, selectedDepartment, comparisonPeriod]);

  const fetchDashboardData = async () => {
    await Promise.all([
      fetchKPIs(),
      fetchMovementsOverTime(),
      fetchSectorDistribution(),
      fetchMovementsByType(),
      fetchBedOccupancy(),
      fetchRequestsByDestination()
    ]);
  };

  const fetchKPIs = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    // Current period
    const { data: requests } = await supabase
      .from('internment_requests')
      .select('*')
      .match(departmentFilter)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .match(departmentFilter);

    const { data: discharges } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'ALTA')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    const { data: deaths } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'ÓBITO')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    const { data: transfers } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'TRANSFERÊNCIA')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    // Comparison period
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const comparisonFrom = subDays(dateRange.from, daysDiff);
    const comparisonTo = dateRange.from;

    const { data: compRequests } = await supabase
      .from('internment_requests')
      .select('*')
      .match(departmentFilter)
      .gte('created_at', comparisonFrom.toISOString())
      .lte('created_at', comparisonTo.toISOString());

    const { data: compDischarges } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'ALTA')
      .gte('created_at', comparisonFrom.toISOString())
      .lte('created_at', comparisonTo.toISOString());

    const { data: compDeaths } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'ÓBITO')
      .gte('created_at', comparisonFrom.toISOString())
      .lte('created_at', comparisonTo.toISOString());

    const { data: compTransfers } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .eq('movement_type', 'TRANSFERÊNCIA')
      .gte('created_at', comparisonFrom.toISOString())
      .lte('created_at', comparisonTo.toISOString());

    setKpis({
      internmentRequests: requests?.length || 0,
      activePatients: patients?.length || 0,
      discharges: discharges?.length || 0,
      deaths: deaths?.length || 0,
      transfers: transfers?.length || 0,
      comparison: {
        internmentRequests: compRequests?.length || 0,
        activePatients: 0,
        discharges: compDischarges?.length || 0,
        deaths: compDeaths?.length || 0,
        transfers: compTransfers?.length || 0
      }
    });
  };

  const fetchMovementsOverTime = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    const { data } = await supabase
      .from('patient_movements')
      .select('*')
      .match(departmentFilter)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at');

    if (data) {
      const groupedByDate = data.reduce((acc: any, movement: any) => {
        const date = format(new Date(movement.created_at), 'dd/MM', { locale: ptBR });
        if (!acc[date]) {
          acc[date] = { date, ALTA: 0, ÓBITO: 0, TRANSFERÊNCIA: 0 };
        }
        acc[date][movement.movement_type]++;
        return acc;
      }, {});

      setMovementsOverTime(Object.values(groupedByDate));
    }
  };

  const fetchSectorDistribution = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    const { data } = await supabase
      .from('patients')
      .select('sector')
      .match(departmentFilter);

    if (data) {
      const sectorCounts = data.reduce((acc: any, patient: any) => {
        const sector = patient.sector === 'red' ? 'Cuidados Especiais' :
                      patient.sector === 'yellow' ? 'Observação Amarela' :
                      patient.sector === 'blue' ? 'Observação Azul' : 'Fora das Alas';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
      }, {});

      setSectorDistribution(
        Object.entries(sectorCounts).map(([name, value]) => ({ name, value }))
      );
    }
  };

  const fetchMovementsByType = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    const { data } = await supabase
      .from('patient_movements')
      .select('movement_type')
      .match(departmentFilter)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (data) {
      const typeCounts = data.reduce((acc: any, movement: any) => {
        acc[movement.movement_type] = (acc[movement.movement_type] || 0) + 1;
        return acc;
      }, {});

      setMovementsByType(
        Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
      );
    }
  };

  const fetchBedOccupancy = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    const { data } = await supabase
      .from('patients')
      .select('sector, created_at')
      .match(departmentFilter)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at');

    if (data) {
      const groupedByDate = data.reduce((acc: any, patient: any) => {
        const date = format(new Date(patient.created_at), 'dd/MM', { locale: ptBR });
        if (!acc[date]) {
          acc[date] = { date, ocupação: 0 };
        }
        acc[date].ocupação++;
        return acc;
      }, {});

      setBedOccupancy(Object.values(groupedByDate));
    }
  };

  const fetchRequestsByDestination = async () => {
    const departmentFilter = selectedDepartment === "all" ? {} : { department: selectedDepartment };
    
    const { data } = await supabase
      .from('patient_movements')
      .select('destination')
      .match(departmentFilter)
      .eq('movement_type', 'TRANSFERÊNCIA')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (data) {
      const destCounts = data.reduce((acc: any, movement: any) => {
        const dest = movement.destination || 'Não especificado';
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
      }, {});

      setRequestsByDestination(
        Object.entries(destCounts).map(([destination, count]) => ({ destination, count }))
      );
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "EXPORTAÇÃO EM DESENVOLVIMENTO",
      description: "Funcionalidade de exportação PDF será implementada em breve",
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "EXPORTAÇÃO EM DESENVOLVIMENTO",
      description: "Funcionalidade de exportação Excel será implementada em breve",
    });
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const KPICard = ({ 
    title, 
    value, 
    icon: Icon, 
    comparison 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    comparison: number;
  }) => {
    const change = calculatePercentageChange(value, comparison);
    const isPositive = change >= 0;

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{value}</div>
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            <TrendingUp className={cn("h-3 w-3", !isPositive && "rotate-180")} />
            {Math.abs(change)}% vs período anterior
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Dashboard de Gestão</h1>
          <p className="text-muted-foreground">Visão geral e indicadores de desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase">Setor</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium uppercase">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard 
          title="Pedidos de Internação" 
          value={kpis.internmentRequests} 
          icon={FileText}
          comparison={kpis.comparison.internmentRequests}
        />
        <KPICard 
          title="Pacientes Ativos" 
          value={kpis.activePatients} 
          icon={Users}
          comparison={kpis.comparison.activePatients}
        />
        <KPICard 
          title="Altas" 
          value={kpis.discharges} 
          icon={UserCheck}
          comparison={kpis.comparison.discharges}
        />
        <KPICard 
          title="Óbitos" 
          value={kpis.deaths} 
          icon={UserX}
          comparison={kpis.comparison.deaths}
        />
        <KPICard 
          title="Transferências" 
          value={kpis.transfers} 
          icon={ArrowRightLeft}
          comparison={kpis.comparison.transfers}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Movements Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase">Movimentações ao Longo do Tempo</CardTitle>
            <CardDescription>Altas, Óbitos e Transferências</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ALTA" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="ÓBITO" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="TRANSFERÊNCIA" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase">Distribuição por Setor</CardTitle>
            <CardDescription>Pacientes ativos por ala</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sectorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movements by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase">Movimentações por Tipo</CardTitle>
            <CardDescription>Comparação de volumes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={movementsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bed Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle className="uppercase">Ocupação de Leitos</CardTitle>
            <CardDescription>Evolução temporal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={bedOccupancy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="ocupação" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Requests by Destination */}
      <Card>
        <CardHeader>
          <CardTitle className="uppercase">Transferências por Destino</CardTitle>
          <CardDescription>Principais destinos de transferência</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={requestsByDestination} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="destination" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
