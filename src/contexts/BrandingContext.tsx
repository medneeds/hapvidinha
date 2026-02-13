import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "./HospitalContext";

export interface InstitutionBranding {
  id: string;
  hospital_unit_id: string;
  abbreviation: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  secondary_color: string;
  tagline: string | null;
}

interface BrandingContextType {
  branding: InstitutionBranding | null;
  platformName: string;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_BRANDING: Omit<InstitutionBranding, 'id' | 'hospital_unit_id'> = {
  abbreviation: "Hap",
  logo_url: null,
  primary_color: "210 80% 42%",
  accent_color: "262 83% 58%",
  secondary_color: "210 40% 96%",
  tagline: "Tecnologia que valoriza seu tempo. Inteligência que salva vidas.",
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { currentHospital } = useHospital();
  const [branding, setBranding] = useState<InstitutionBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentHospital) {
      setBranding(null);
      // Reset CSS variables to defaults
      applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.accent_color, DEFAULT_BRANDING.secondary_color);
      return;
    }

    const fetchBranding = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("institution_branding")
          .select("*")
          .eq("hospital_unit_id", currentHospital.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching branding:", error);
          setBranding(null);
        } else if (data) {
          setBranding(data as InstitutionBranding);
          applyBrandingColors(data.primary_color, data.accent_color, data.secondary_color);
        } else {
          setBranding(null);
          applyBrandingColors(DEFAULT_BRANDING.primary_color, DEFAULT_BRANDING.accent_color, DEFAULT_BRANDING.secondary_color);
        }
      } catch (err) {
        console.error("Error fetching branding:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [currentHospital?.id]);

  const platformName = branding 
    ? `${branding.abbreviation}Map` 
    : DEFAULT_BRANDING.abbreviation + "Map";

  return (
    <BrandingContext.Provider value={{ branding, platformName, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

function applyBrandingColors(primary: string, accent: string, secondary: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty("--ring", primary);
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
