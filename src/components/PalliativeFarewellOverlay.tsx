import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PalliativeFarewellOverlayProps {
  open: boolean;
  patientName?: string;
  onClose: () => void;
}

const REFLECTIONS = [
  {
    text: "Quando a borboleta encontra seu voo, a lagarta cumpriu seu propósito. A vida não termina — apenas muda de forma.",
    author: "",
  },
  {
    text: "Há um tempo em que é preciso abandonar as roupas usadas, que já têm a forma do nosso corpo. É o tempo da travessia.",
    author: "Manoel de Barros",
  },
  {
    text: "Não se trata de prolongar a vida, nem de abreviá-la — mas de respeitar seu tempo natural. Partir em paz é também um ato de cuidado.",
    author: "",
  },
  {
    text: "Cuidar até o fim é reconhecer que existe dignidade em cada respiração — inclusive na última.",
    author: "",
  },
  {
    text: "A morte não é o oposto da vida, mas parte dela. E acompanhar quem parte é o gesto mais humano da medicina.",
    author: "",
  },
  {
    text: "Quando não se pode mais acrescentar dias à vida, resta acrescentar vida aos dias — e paz à despedida.",
    author: "Cicely Saunders",
  },
  {
    text: "Como a borboleta que pousa apenas o tempo necessário, há vidas que nos atravessam para nos ensinar sobre o tempo certo de partir.",
    author: "",
  },
];

export function PalliativeFarewellOverlay({
  open,
  patientName,
  onClose,
}: PalliativeFarewellOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "pause" | "exit" | "done">("enter");

  const reflection = useMemo(
    () => REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)],
    [open]
  );

  useEffect(() => {
    if (!open) return;
    setPhase("enter");
    const t1 = setTimeout(() => setPhase("pause"), 2500);
    const t2 = setTimeout(() => setPhase("exit"), 6500);
    const t3 = setTimeout(() => {
      setPhase("done");
      onClose();
    }, 9500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden",
        "bg-gradient-to-b from-sky-950/85 via-indigo-950/80 to-slate-950/90",
        "backdrop-blur-md transition-opacity duration-1000",
        phase === "exit" || phase === "done" ? "opacity-0" : "opacity-100"
      )}
      onClick={() => {
        setPhase("exit");
        setTimeout(onClose, 1000);
      }}
      role="dialog"
      aria-label="Homenagem de despedida"
    >
      {/* Subtle starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/60 animate-pulse"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Giant butterfly - flies in, pauses center, flies up and out */}
      <div
        className={cn(
          "absolute will-change-transform",
          phase === "enter" && "farewell-butterfly-enter",
          phase === "pause" && "farewell-butterfly-pause",
          (phase === "exit" || phase === "done") && "farewell-butterfly-exit"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-64 w-64 md:h-80 md:w-80 drop-shadow-[0_0_40px_rgba(186,230,253,0.6)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z"
            className="fill-sky-300/80 stroke-sky-200"
            strokeWidth="0.3"
          >
            <animate
              attributeName="d"
              dur="1.2s"
              repeatCount="indefinite"
              values="
                M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z;
                M12 12C10.5 9 8 6 5 7C2 8 3 10.5 5 12C3 13.5 2 16 5 17C8 18 10.5 15 12 12Z;
                M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z
              "
            />
          </path>
          <path
            d="M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z"
            className="fill-sky-300/80 stroke-sky-200"
            strokeWidth="0.3"
          >
            <animate
              attributeName="d"
              dur="1.2s"
              repeatCount="indefinite"
              values="
                M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z;
                M12 12C13.5 9 16 6 19 7C22 8 21 10.5 19 12C21 13.5 22 16 19 17C16 18 13.5 15 12 12Z;
                M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z
              "
            />
          </path>
          <ellipse cx="12" cy="12" rx="0.7" ry="3" className="fill-sky-100" />
          <path d="M11.5 9.5C10.5 7.5 9 6.5 8.5 6" className="stroke-sky-100" strokeWidth="0.4" strokeLinecap="round" fill="none" />
          <path d="M12.5 9.5C13.5 7.5 15 6.5 15.5 6" className="stroke-sky-100" strokeWidth="0.4" strokeLinecap="round" fill="none" />
          <circle cx="7" cy="9" r="1.2" className="fill-white/40" />
          <circle cx="7" cy="15" r="1" className="fill-white/40" />
          <circle cx="17" cy="9" r="1.2" className="fill-white/40" />
          <circle cx="17" cy="15" r="1" className="fill-white/40" />
        </svg>
      </div>

      {/* Reflection message */}
      <div
        className={cn(
          "relative z-10 max-w-2xl mx-auto px-8 text-center transition-all duration-1500",
          phase === "pause"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        )}
      >
        {patientName && (
          <p className="text-sky-200/80 text-xs md:text-sm tracking-[0.3em] uppercase mb-6 font-light">
            Em memória de
            <span className="block text-white/95 text-base md:text-lg tracking-wider mt-2 font-normal">
              {patientName}
            </span>
          </p>
        )}
        <p className="text-white/95 text-lg md:text-2xl font-light leading-relaxed italic">
          “{reflection.text}”
        </p>
        {reflection.author && (
          <p className="mt-4 text-sky-200/70 text-sm tracking-wide">
            — {reflection.author}
          </p>
        )}
        <p className="mt-10 text-sky-100/50 text-[10px] md:text-xs tracking-[0.4em] uppercase">
          Ortotanásia · Cuidado até o fim
        </p>
      </div>
    </div>,
    document.body
  );
}
