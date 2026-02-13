import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2500 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  
  let platformName = "HapMap";
  let tagline = "Tecnologia que valoriza seu tempo. Inteligência que salva vidas.";
  
  try {
    const branding = useBranding();
    platformName = branding.platformName;
    if (branding.branding?.tagline) tagline = branding.branding.tagline;
  } catch {
    // BrandingProvider may not be available during initial auth flow
  }

  // Split platform name into abbreviation and "Map"
  const abbreviation = platformName.replace("Map", "");

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 60);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 400);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] transition-all duration-400 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      }`}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite 1s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/15 rounded-full"
            style={{
              width: `${3 + Math.random() * 3}px`,
              height: `${3 + Math.random() * 3}px`,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite ${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Brand Name */}
        <div 
          className="flex flex-col items-center gap-4"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 0.2s forwards', opacity: 0 }}
        >
          <div className="inline-flex items-baseline gap-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-tighter inline-flex items-baseline">
              <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                {abbreviation}
              </span>
              <span className="font-light text-white/60 -ml-0.5">
                Map
              </span>
            </h1>
          </div>
          
          {/* Elegant divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
            <Sparkles className="h-3 w-3 text-white/30" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          
          {/* Slogan */}
          <p className="text-white/30 text-sm sm:text-base font-light tracking-wide italic text-center px-4">
            {tagline}
          </p>
        </div>

        {/* Loading Progress */}
        <div 
          className="flex flex-col items-center gap-4 w-64"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 0.4s forwards', opacity: 0 }}
        >
          <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white/30 via-white/60 to-white/30 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/20 font-light tracking-widest uppercase">
            Carregando
          </p>
        </div>

        {/* Powered by Axius */}
        <div 
          className="mt-6"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 0.6s forwards', opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] text-white/15 uppercase tracking-widest">Powered by</p>
            <p className="text-sm font-semibold text-white/30 tracking-wide">Axius</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-20px) translateX(3px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
