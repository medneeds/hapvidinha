import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { whitelabel } from "@/config/whitelabel";

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2500 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4] transition-all duration-400 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      }`}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite 1s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/3 rounded-full blur-3xl"
          style={{ animation: 'pulse 5s ease-in-out infinite 2s' }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/30 rounded-full"
            style={{
              width: `${4 + Math.random() * 4}px`,
              height: `${4 + Math.random() * 4}px`,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite ${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Logo da rede removida a pedido */}

        {/* Brand Name - HapMap 2.0 */}
        <div 
          className="flex flex-col items-center gap-4"
          style={{ 
            animation: 'fadeSlideUp 0.8s ease-out 0.2s forwards',
            opacity: 0
          }}
        >
          <div className="inline-flex items-baseline gap-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl tracking-tighter inline-flex items-baseline">
              <span className="font-black bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-lg">
                {whitelabel.platform.name.slice(0, 3)}
              </span>
              <span className="font-light text-white/80 -ml-0.5">
                {whitelabel.platform.name.slice(3)}
              </span>
            </h1>
            <span className="text-[10px] font-medium text-white/40 tracking-wider border border-white/20 rounded-full px-2 py-0.5 self-start mt-2">
              {whitelabel.platform.version}
            </span>
          </div>
          
          {/* Elegant divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/40" />
            <Sparkles className="h-3 w-3 text-white/50" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/40" />
          </div>
          
          {/* Slogan */}
          <p className="text-white/50 text-sm sm:text-base font-light tracking-wide italic text-center px-4">
            {whitelabel.platform.slogan}
          </p>
        </div>

        {/* Loading Progress */}
        <div 
          className="flex flex-col items-center gap-4 w-64"
          style={{ 
            animation: 'fadeSlideUp 0.8s ease-out 0.4s forwards',
            opacity: 0
          }}
        >
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white/60 via-white to-white/60 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Loading text */}
          <p className="text-xs text-white/40 font-light tracking-widest uppercase">
            {whitelabel.platform.loadingText}
          </p>
        </div>

        {/* Developer Badge */}
        <div 
          className="mt-6"
          style={{ 
            animation: 'fadeSlideUp 0.8s ease-out 0.6s forwards',
            opacity: 0
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{whitelabel.credits.developerLabel}</p>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
              <p className="text-sm font-semibold text-white/70 tracking-wide">
                {whitelabel.credits.developerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-15px) translateX(5px);
          }
          50% {
            transform: translateY(-5px) translateX(-5px);
          }
          75% {
            transform: translateY(-20px) translateX(3px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
