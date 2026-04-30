import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BedDouble, Sparkles, Loader2 } from "lucide-react";

interface PalliativeFarewellOverlayProps {
  open: boolean;
  patientName?: string;
  onClose: () => void;
  /**
   * Called when the user clicks "Desalocar leito e encerrar". The overlay
   * waits for this to resolve before starting the exit animation. If it
   * rejects, the overlay stays open so the user can retry.
   */
  onDeallocate?: () => Promise<void> | void;
}

const REFLECTIONS = [
  { text: "Quando a borboleta encontra seu voo, a lagarta cumpriu seu propósito. A vida não termina — apenas muda de forma.", author: "" },
  { text: "Há um tempo em que é preciso abandonar as roupas usadas, que já têm a forma do nosso corpo. É o tempo da travessia.", author: "Manoel de Barros" },
  { text: "Não se trata de prolongar a vida, nem de abreviá-la — mas de respeitar seu tempo natural. Partir em paz é também um ato de cuidado.", author: "" },
  { text: "Cuidar até o fim é reconhecer que existe dignidade em cada respiração — inclusive na última.", author: "" },
  { text: "A morte não é o oposto da vida, mas parte dela. E acompanhar quem parte é o gesto mais humano da medicina.", author: "" },
  { text: "Quando não se pode mais acrescentar dias à vida, resta acrescentar vida aos dias — e paz à despedida.", author: "Cicely Saunders" },
  { text: "Como a borboleta que pousa apenas o tempo necessário, há vidas que nos atravessam para nos ensinar sobre o tempo certo de partir.", author: "" },
];

type Phase = "enter" | "live" | "exit";

const ENTER_MS = 2800;
const SHOW_BUTTON_AFTER_MS = 4200; // botão "Desalocar leito" aparece depois de a borboleta pousar e respirar
const EXIT_FADE_MS = 1300;
const EXIT_TOTAL_MS = 3400;

export function PalliativeFarewellOverlay({
  open,
  patientName,
  onClose,
  onDeallocate,
}: PalliativeFarewellOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");
  const [activeName, setActiveName] = useState<string | undefined>(undefined);
  const [showAction, setShowAction] = useState(false);
  const [isDeallocating, setIsDeallocating] = useState(false);
  const [deallocError, setDeallocError] = useState<string | null>(null);

  const timersRef = useRef<number[]>([]);
  const closedRef = useRef(false);
  const onDeallocateRef = useRef(onDeallocate);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const schedule = (cb: () => void, delay: number) => {
    const t = window.setTimeout(cb, delay);
    timersRef.current.push(t);
  };

  // Sequência: enter → live (loop infinito de voo dinâmico) → exit (apenas via botão)
  useEffect(() => {
    if (!open) return;

    console.log("[FAREWELL] overlay sequence starting", { patientName });
    clearTimers();
    closedRef.current = false;
    setActiveName(patientName);
    setMounted(true);
    setPhase("enter");
    setShowAction(false);

    schedule(() => {
      console.log("[FAREWELL] phase → live (looping flight)");
      setPhase("live");
    }, ENTER_MS);

    schedule(() => {
      console.log("[FAREWELL] revealing dealloc action button");
      setShowAction(true);
    }, SHOW_BUTTON_AFTER_MS);

    return () => {
      // Only clear on real unmount of the provider, not on prop churn.
    };
  }, [open, patientName]);

  useEffect(() => () => clearTimers(), []);

  const reflection = useMemo(
    () => REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)],
    [activeName]
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        width: `${1 + Math.random() * 2.2}px`,
        height: `${1 + Math.random() * 2.2}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${2 + Math.random() * 4}s`,
        opacity: 0.35 + Math.random() * 0.55,
      })),
    [activeName]
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `${-10 - Math.random() * 20}%`,
        size: `${2 + Math.random() * 4}px`,
        drift: `${(Math.random() - 0.5) * 200}px`,
        life: `${7 + Math.random() * 8}s`,
        delay: `${Math.random() * 9}s`,
        hue: Math.random() > 0.5 ? "bg-sky-200/70" : "bg-amber-100/60",
      })),
    [activeName]
  );

  const handleConfirmDealloc = () => {
    if (phase === "exit") return;
    console.log("[FAREWELL] user confirmed dealloc — starting exit");
    clearTimers();
    setShowAction(false);
    setPhase("exit");
    schedule(() => {
      if (closedRef.current) return;
      closedRef.current = true;
      onCloseRef.current();
    }, EXIT_FADE_MS);
    schedule(() => setMounted(false), EXIT_TOTAL_MS);
  };

  if (!mounted) return null;

  const isExiting = phase === "exit";

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] overflow-hidden farewell-scene",
        "bg-gradient-to-br from-slate-950 via-indigo-950/95 to-sky-950/90",
        "backdrop-blur-md",
        isExiting ? "farewell-backdrop-exit" : "farewell-backdrop"
      )}
      role="dialog"
      aria-label="Homenagem de despedida"
    >
      {/* Slowly rotating light rays — sacred, ethereal background */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 farewell-rays"
        style={{
          width: "180vmax",
          height: "180vmax",
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(186,230,253,0.08) 18deg, transparent 36deg, transparent 90deg, rgba(255,237,213,0.06) 108deg, transparent 126deg, transparent 180deg, rgba(186,230,253,0.07) 198deg, transparent 216deg, transparent 270deg, rgba(255,237,213,0.05) 288deg, transparent 306deg)",
          mixBlendMode: "screen",
        }}
      />

      {/* Breathing radial vignette */}
      <div
        className="pointer-events-none absolute inset-0 farewell-vignette"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(186,230,253,0.18) 0%, rgba(15,23,42,0) 55%)",
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: s.width,
              height: s.height,
              top: s.top,
              left: s.left,
              opacity: s.opacity,
              animationDelay: s.animationDelay,
              animationDuration: s.animationDuration,
              boxShadow: "0 0 6px rgba(255,255,255,0.6)",
            }}
          />
        ))}
      </div>

      {/* Floating light particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className={cn("absolute rounded-full farewell-particle", p.hue)}
            style={
              {
                left: p.left,
                bottom: p.bottom,
                width: p.size,
                height: p.size,
                boxShadow: "0 0 8px rgba(186,230,253,0.7)",
                "--drift": p.drift,
                "--life": p.life,
                "--delay": p.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* TOP BAND — Patient name (4% – 14%) */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 text-center",
          "top-[4%] md:top-[5%]",
          "transition-all duration-1000 ease-out",
          phase !== "enter"
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        )}
      >
        {activeName && (
          <p className="text-sky-200/80 text-[10px] md:text-xs tracking-[0.4em] uppercase font-light">
            Em memória de
            <span className="block text-white/95 text-base md:text-xl tracking-[0.15em] mt-2 font-normal">
              {activeName}
            </span>
          </p>
        )}
      </div>

      {/* GLASS LANDING ZONE — anchored to butterfly position (28%) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2"
        style={{ width: "min(60vmin, 420px)", height: "min(60vmin, 420px)" }}
      >
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-full",
            phase !== "enter" ? "opacity-0" : "opacity-100"
          )}
        >
          <div
            className="absolute inset-y-0 -inset-x-1/2 farewell-glass-sheen"
            style={{
              background:
                "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
              mixBlendMode: "screen",
            }}
          />
        </div>

        {phase === "enter" && (
          <>
            <span
              className="absolute left-1/2 top-1/2 farewell-ripple rounded-full border border-sky-200/50"
              style={{
                width: "60%",
                height: "60%",
                boxShadow: "0 0 40px rgba(186,230,253,0.3)",
              }}
            />
            <span
              className="absolute left-1/2 top-1/2 farewell-ripple-2 rounded-full border border-sky-100/30"
              style={{ width: "40%", height: "40%" }}
            />
          </>
        )}

        <div
          className={cn(
            "absolute left-1/2 bottom-[8%]",
            phase === "enter" && "farewell-shadow-land",
            phase === "live" && "farewell-shadow-pause",
            phase === "exit" && "farewell-shadow-exit"
          )}
          style={{
            width: "65%",
            height: "10%",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 75%)",
            transformOrigin: "center",
          }}
        />
      </div>

      {/* MIDDLE BAND — Butterfly with luminous aura (centered around 28%) */}
      <div
        className={cn(
          "absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2",
          phase === "enter" && "farewell-butterfly-enter",
          phase === "live" && "farewell-butterfly-live",
          phase === "exit" && "farewell-butterfly-exit"
        )}
      >
        <div className="relative h-40 w-40 md:h-56 md:w-56 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full farewell-aura pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(186,230,253,0.55) 0%, rgba(186,230,253,0.15) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <div
            className="absolute inset-8 rounded-full farewell-aura pointer-events-none"
            style={{
              animationDelay: "0.6s",
              background:
                "radial-gradient(circle, rgba(255,237,213,0.4) 0%, transparent 65%)",
              filter: "blur(14px)",
            }}
          />

          <svg
            viewBox="0 0 24 24"
            className="relative h-full w-full drop-shadow-[0_0_50px_rgba(186,230,253,0.7)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z"
              className="fill-sky-200/85 stroke-sky-100"
              strokeWidth="0.3"
            >
              <animate
                attributeName="d"
                dur="0.9s"
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
              className="fill-sky-200/85 stroke-sky-100"
              strokeWidth="0.3"
            >
              <animate
                attributeName="d"
                dur="0.9s"
                repeatCount="indefinite"
                values="
                  M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z;
                  M12 12C13.5 9 16 6 19 7C22 8 21 10.5 19 12C21 13.5 22 16 19 17C16 18 13.5 15 12 12Z;
                  M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z
                "
              />
            </path>
            <ellipse cx="12" cy="12" rx="0.7" ry="3" className="fill-white" />
            <path
              d="M11.5 9.5C10.5 7.5 9 6.5 8.5 6"
              className="stroke-white"
              strokeWidth="0.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12.5 9.5C13.5 7.5 15 6.5 15.5 6"
              className="stroke-white"
              strokeWidth="0.4"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="7" cy="9" r="1.2" className="fill-white/55" />
            <circle cx="7" cy="15" r="1" className="fill-white/55" />
            <circle cx="17" cy="9" r="1.2" className="fill-white/55" />
            <circle cx="17" cy="15" r="1" className="fill-white/55" />
            <circle cx="6" cy="9" r="0.35" className="fill-amber-100" />
            <circle cx="18" cy="9" r="0.35" className="fill-amber-100" />
          </svg>
        </div>
      </div>

      {/* REFLECTION TEXT — well below the butterfly to avoid overlap (52%–80%) */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 text-center farewell-reflection",
          "top-[52%]",
          phase === "live"
            ? "opacity-100 translate-y-0 farewell-reflection-active"
            : "opacity-0 translate-y-6"
        )}
      >
        <p className="text-white/95 text-base md:text-2xl font-light leading-relaxed italic">
          "{reflection.text}"
        </p>
        {reflection.author && (
          <p className="mt-3 text-sky-200/70 text-xs md:text-sm tracking-wide">
            — {reflection.author}
          </p>
        )}
      </div>

      {/* DEALLOC ACTION BUTTON — only way to close the overlay */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-[12%] flex flex-col items-center gap-3",
          "transition-all duration-1000 ease-out",
          showAction
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 pointer-events-none"
        )}
      >
        <Button
          size="lg"
          onClick={handleConfirmDealloc}
          className={cn(
            "gap-2 px-8 py-6 text-base font-medium tracking-wide",
            "bg-white/95 text-slate-900 hover:bg-white",
            "shadow-[0_0_40px_rgba(186,230,253,0.5)]",
            "border border-sky-200/40"
          )}
        >
          <BedDouble className="h-5 w-5" />
          Desalocar leito e encerrar
          <Sparkles className="h-4 w-4 text-amber-500" />
        </Button>
        <p className="text-sky-100/60 text-[10px] md:text-xs tracking-[0.3em] uppercase">
          Ortotanásia · Cuidado até o fim
        </p>
      </div>
    </div>,
    document.body
  );
}
