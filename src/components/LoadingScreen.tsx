import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { whitelabel } from "@/config/whitelabel";

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 1400 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [duration, onComplete]);

  // Circular progress ring math
  const ringSize = 168;
  const stroke = 2;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-400 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at center, #0152d4 0%, #0146bd 40%, #013ba6 75%, #01297a 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"
          style={{ animation: "pulse 4s ease-in-out infinite 1s" }}
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
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite ${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div
          className="flex flex-col items-center gap-6"
          style={{ animation: "fadeSlideUp 0.8s ease-out 0.2s forwards", opacity: 0 }}
        >
          <div className="flex items-center justify-center gap-5">
            {/* Logo losango with progress ring */}
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{
                width: ringSize,
                height: ringSize,
                animation: "logoEntrance 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both",
              }}
            >
              {/* Progress ring */}
              <svg
                width={ringSize}
                height={ringSize}
                className="absolute inset-0 -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={stroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 100ms linear" }}
                />
              </svg>

              {/* Losango */}
              <div
                aria-label="HapMap"
                className="w-[68%] h-[68%] bg-white flex items-center justify-center rounded-[28%]"
                style={{
                  transform: "rotate(42deg)",
                  boxShadow:
                    "0 20px 40px -12px rgba(0,0,0,0.35), inset 0 2px 8px rgba(1,59,166,0.08)",
                }}
              >
                <div
                  className="w-[80%] h-[80%] bg-gradient-to-br from-[#013ba6] via-[#0146bd] to-[#0152d4]"
                  style={{
                    transform: "rotate(-42deg)",
                    WebkitMaskImage: "url(/logo-hm.png)",
                    maskImage: "url(/logo-hm.png)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </div>
            </div>

            {/* Wordmark */}
            <div className="relative flex flex-col items-start leading-[0.85]">
              <h1 className="font-brand text-6xl sm:text-7xl md:text-8xl tracking-wide lowercase text-white/95 drop-shadow-lg font-black">
                hap
              </h1>
              <h1
                className="font-brand text-6xl sm:text-7xl md:text-8xl tracking-[0.08em] lowercase text-white/95 drop-shadow-lg"
                style={{ fontWeight: 100 }}
              >
                map
              </h1>
              {/* Version as superscript tag */}
              <span className="absolute -top-1 -right-8 text-[10px] font-medium text-white/60 tracking-[0.15em] border border-white/25 rounded-full px-1.5 py-0.5 uppercase bg-white/5 backdrop-blur-sm">
                {whitelabel.platform.version}
              </span>
            </div>
          </div>

          {/* Elegant divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/40" />
            <Sparkles className="h-3 w-3 text-white/50" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/40" />
          </div>

          {/* Slogan */}
          <p className="text-white/55 text-sm sm:text-base font-light tracking-wide italic text-center px-4 max-w-md">
            {whitelabel.platform.slogan}
          </p>
        </div>

        {/* Loading label (progress is now the ring) */}
        <p
          className="text-[10px] text-white/50 font-light tracking-[0.35em] uppercase"
          style={{ animation: "fadeSlideUp 0.8s ease-out 0.4s forwards", opacity: 0 }}
        >
          {whitelabel.platform.loadingText} · {progress}%
        </p>
      </div>

      {/* Unified footer: credits + compliance in one line */}
      <div
        className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3 px-4"
        style={{
          animation: "fadeSlideUp 0.8s ease-out 0.6s forwards",
          opacity: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-[10px] text-white/40 tracking-wide">
          <span className="uppercase tracking-[0.2em] text-white/30">
            {whitelabel.credits.developerLabel}
          </span>{" "}
          <span className="font-semibold text-white/60">{whitelabel.credits.developerName}</span>
        </p>
        <span className="h-3 w-px bg-white/20" />
        <p className="text-[10px] text-white/40 tracking-wide">
          {whitelabel.compliance.legalReferences}
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoEntrance {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
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
