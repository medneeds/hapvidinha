import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { Search, User, MapPin, ArrowRight, History, BedDouble } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface SearchPatient {
  id: string;
  name: string;
  bed_number: string;
  sector: string;
  department: string;
  diagnoses: string | null;
}

interface SearchMovement {
  id: string;
  patient_name: string;
  movement_type: string;
  destination: string | null;
  patient_sector: string | null;
  patient_bed: string | null;
  created_at: string;
}

const sectorLabel: Record<string, string> = {
  red: "Sala Vermelha",
  yellow: "Obs. Amarela",
  blue: "Obs. Azul",
  outside: "Fora das Alas",
};

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<SearchPatient[]>([]);
  const [movements, setMovements] = useState<SearchMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentHospital, currentState } = useHospital();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query.trim() || !currentHospital || !currentState) {
      setPatients([]);
      setMovements([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchTerm = `%${query.trim()}%`;

        // Search allocated patients
        const { data: pData } = await supabase
          .from("patients")
          .select("id, name, bed_number, sector, department, diagnoses")
          .eq("hospital_unit_id", currentHospital.id)
          .eq("state_id", currentState.id)
          .or(`name.ilike.${searchTerm},bed_number.ilike.${searchTerm},diagnoses.ilike.${searchTerm}`)
          .limit(8);

        // Search movement history
        const { data: mData } = await supabase
          .from("patient_movements")
          .select("id, patient_name, movement_type, destination, patient_sector, patient_bed, created_at")
          .eq("hospital_unit_id", currentHospital.id)
          .eq("state_id", currentState.id)
          .or(`patient_name.ilike.${searchTerm},destination.ilike.${searchTerm},patient_bed.ilike.${searchTerm}`)
          .order("created_at", { ascending: false })
          .limit(6);

        setPatients(
          (pData || []).filter((p) => p.name && p.name.trim() !== "")
        );
        setMovements(mData || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, currentHospital, currentState]);

  const handleSelectPatient = (patient: SearchPatient) => {
    setOpen(false);
    setQuery("");
    // Navigate to map then scroll to patient
    navigate("/");
    setTimeout(() => {
      const el = document.querySelector(`[data-patient-id="${patient.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 3000);
      }
    }, 300);
  };

  const handleSelectMovement = () => {
    setOpen(false);
    setQuery("");
    navigate("/movements");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const movementTypeLabel: Record<string, string> = {
    admission: "Admissão",
    discharge: "Alta",
    transfer: "Transferência",
    death: "Óbito",
    evasion: "Evasão",
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar paciente por nome, leito ou diagnóstico..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Buscando...
            </div>
          ) : query.trim() ? (
            "Nenhum resultado encontrado."
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Digite para buscar pacientes alocados e histórico de movimentações</p>
              <p className="text-xs mt-1 opacity-60">
                <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Ctrl</kbd>
                {" + "}
                <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">K</kbd>
                {" para abrir a qualquer momento"}
              </p>
            </div>
          )}
        </CommandEmpty>

        {patients.length > 0 && (
          <CommandGroup heading="Pacientes Alocados">
            {patients.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => handleSelectPatient(p)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <BedDouble className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                      {p.bed_number}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {sectorLabel[p.sector] || p.sector} • {p.department}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {patients.length > 0 && movements.length > 0 && <CommandSeparator />}

        {movements.length > 0 && (
          <CommandGroup heading="Histórico de Movimentações">
            {movements.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={handleSelectMovement}
                className="flex items-center gap-3 cursor-pointer"
              >
                <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{m.patient_name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                      {movementTypeLabel[m.movement_type] || m.movement_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.destination && `→ ${m.destination} • `}{formatDate(m.created_at)}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
