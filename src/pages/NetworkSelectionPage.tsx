import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHospital, State, HospitalUnit } from "@/contexts/HospitalContext";
import { useDepartment, DEPARTMENTS, Department } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, MapPin, ChevronRight, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function NetworkSelectionPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { states, hospitals, setCurrentHospital } = useHospital();
  const { setCurrentDepartment } = useDepartment();
  
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalUnit | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [step, setStep] = useState<"state" | "hospital" | "department">("state");

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const filteredHospitals = selectedState 
    ? hospitals.filter(h => h.state_id === selectedState.id) 
    : [];

  const handleStateSelect = (state: State) => {
    setSelectedState(state);
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setStep("hospital");
  };

  const handleHospitalSelect = (hospital: HospitalUnit) => {
    setSelectedHospital(hospital);
    setSelectedDepartment(null);
    setStep("department");
  };

  const handleDepartmentSelect = (dept: Department) => {
    setSelectedDepartment(dept);
    if (selectedHospital) {
      setCurrentHospital(selectedHospital);
    }
    setCurrentDepartment(dept);
    setShowLoading(true);
  };

  const handleBack = () => {
    if (step === "department") {
      setStep("hospital");
      setSelectedDepartment(null);
    } else if (step === "hospital") {
      setStep("state");
      setSelectedState(null);
      setSelectedHospital(null);
    }
  };

  if (showLoading) {
    return <LoadingScreen onComplete={() => navigate("/")} duration={2000} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        {step !== "state" ? (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-white/50 hover:text-white hover:bg-white/5 gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
        ) : <div />}
        <Button
          variant="ghost"
          onClick={signOut}
          className="text-white/30 hover:text-white/60 hover:bg-white/5 gap-1.5 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-1.5 mb-3">
            <span className="text-3xl font-black text-white tracking-tighter">Axius</span>
          </div>
          <p className="text-white/40 text-sm font-light">
            {step === "state" && "Selecione o estado para continuar"}
            {step === "hospital" && `${selectedState?.name} — Selecione a unidade`}
            {step === "department" && `${selectedHospital?.name} — Selecione o setor`}
          </p>
          
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] uppercase tracking-widest">
            <span className={cn("transition-colors", step === "state" ? "text-white/80" : "text-white/30")}>
              Estado
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className={cn("transition-colors", step === "hospital" ? "text-white/80" : "text-white/30")}>
              Unidade
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className={cn("transition-colors", step === "department" ? "text-white/80" : "text-white/30")}>
              Setor
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-2">
          {step === "state" && states.map((state) => (
            <button
              key={state.id}
              onClick={() => handleStateSelect(state)}
              className="w-full group flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
                <MapPin className="h-4 w-4 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                  {state.name}
                </p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">
                  {state.abbreviation}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </button>
          ))}

          {step === "hospital" && filteredHospitals.map((hospital) => (
            <button
              key={hospital.id}
              onClick={() => handleHospitalSelect(hospital)}
              className="w-full group flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
                <Building2 className="h-4 w-4 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                  {hospital.name}
                </p>
                {hospital.address && (
                  <p className="text-[10px] text-white/30 truncate max-w-[250px]">
                    {hospital.address}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </button>
          ))}

          {step === "department" && DEPARTMENTS.map((dept) => (
            <button
              key={dept}
              onClick={() => handleDepartmentSelect(dept)}
              className="w-full group flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] transition-all">
                <Building2 className="h-4 w-4 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors uppercase">
                  {dept}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center">
        <p className="text-[9px] text-white/20 uppercase tracking-widest">Powered by</p>
        <p className="text-[11px] text-white/40 font-semibold tracking-wide">Axius</p>
      </div>
    </div>
  );
}
