import { useEffect, useState } from "react";
import hapvidaLogo from "@/assets/hapvida-notredame-full-logo.png";

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2000 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl animate-pulse [animation-delay:3s]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo Container with scale animation */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl animate-pulse" />
          <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30">
            <img
              src={hapvidaLogo}
              alt="Hapvida Notre Dame"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain"
            />
          </div>
        </div>

        {/* Title with elegant animation */}
        <div className="flex flex-col items-center gap-3 animate-fade-in [animation-delay:300ms]">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-wider">
            <span className="inline-block animate-fade-in [animation-delay:400ms]">H</span>
            <span className="inline-block animate-fade-in [animation-delay:500ms]">a</span>
            <span className="inline-block animate-fade-in [animation-delay:600ms]">p</span>
            <span className="inline-block animate-fade-in [animation-delay:700ms]">M</span>
            <span className="inline-block animate-fade-in [animation-delay:800ms]">a</span>
            <span className="inline-block animate-fade-in [animation-delay:900ms]">p</span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-white to-transparent animate-fade-in [animation-delay:1000ms]" />
          <p className="text-sm sm:text-base text-white/80 font-medium tracking-wide animate-fade-in [animation-delay:1100ms]">
            Sistema de Gestão Hospitalar
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex flex-col items-center gap-3 animate-fade-in [animation-delay:1200ms]">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:200ms]" />
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:400ms]" />
          </div>
          <p className="text-xs text-white/60 font-medium">Carregando...</p>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-white/40 rounded-full animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-white/30 rounded-full animate-[float_8s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-white/50 rounded-full animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-white/35 rounded-full animate-[float_9s_ease-in-out_infinite_1.5s]" />
        <div className="absolute bottom-[20%] right-[15%] w-1.5 h-1.5 bg-white/45 rounded-full animate-[float_5s_ease-in-out_infinite_0.5s]" />
      </div>
    </div>
  );
}
