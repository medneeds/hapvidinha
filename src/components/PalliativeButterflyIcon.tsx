import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PalliativeButterflyIconProps {
  className?: string;
}

export function PalliativeButterflyIcon({ className }: PalliativeButterflyIconProps) {
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    // Periodically trigger the flying animation
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 6000; // 4-10s random interval
      return setTimeout(() => {
        setIsFlying(true);
        setTimeout(() => setIsFlying(false), 2000);
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, []);

  return (
    <div
      className={cn(
        "relative flex-shrink-0 print:hidden",
        className
      )}
      title="Cuidados Paliativos"
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "h-4 w-4 transition-all duration-700 ease-in-out",
          "butterfly-float",
          isFlying && "butterfly-fly"
        )}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left wings */}
        <path
          d="M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z"
          className="fill-sky-400/80 stroke-sky-500"
          strokeWidth="0.5"
        >
          <animate
            attributeName="d"
            dur="0.6s"
            repeatCount="indefinite"
            values="
              M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z;
              M12 12C10.5 9 8 6 5 7C2 8 3 10.5 5 12C3 13.5 2 16 5 17C8 18 10.5 15 12 12Z;
              M12 12C10 8 6 4 3 5C0 6 1 10 4 12C1 14 0 18 3 19C6 20 10 16 12 12Z
            "
          />
        </path>
        {/* Right wings */}
        <path
          d="M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z"
          className="fill-sky-400/80 stroke-sky-500"
          strokeWidth="0.5"
        >
          <animate
            attributeName="d"
            dur="0.6s"
            repeatCount="indefinite"
            values="
              M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z;
              M12 12C13.5 9 16 6 19 7C22 8 21 10.5 19 12C21 13.5 22 16 19 17C16 18 13.5 15 12 12Z;
              M12 12C14 8 18 4 21 5C24 6 23 10 20 12C23 14 24 18 21 19C18 20 14 16 12 12Z
            "
          />
        </path>
        {/* Body */}
        <ellipse cx="12" cy="12" rx="0.8" ry="3" className="fill-sky-600" />
        {/* Antennae */}
        <path d="M11.5 9.5C10.5 7.5 9 6.5 8.5 6" className="stroke-sky-600" strokeWidth="0.5" strokeLinecap="round" fill="none" />
        <path d="M12.5 9.5C13.5 7.5 15 6.5 15.5 6" className="stroke-sky-600" strokeWidth="0.5" strokeLinecap="round" fill="none" />
        {/* Wing details */}
        <circle cx="7" cy="9" r="1.2" className="fill-sky-300/50" />
        <circle cx="7" cy="15" r="1" className="fill-sky-300/50" />
        <circle cx="17" cy="9" r="1.2" className="fill-sky-300/50" />
        <circle cx="17" cy="15" r="1" className="fill-sky-300/50" />
      </svg>
    </div>
  );
}
