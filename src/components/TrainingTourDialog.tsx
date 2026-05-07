import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, PartyPopper, Sparkles, Lightbulb, Trophy } from "lucide-react";
import { Tour } from "@/data/trainingTours";
import { cn } from "@/lib/utils";

interface Props {
  tour: Tour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: (tourId: string) => void;
  onDismissed?: (tourId: string) => void;
}

export function TrainingTourDialog({ tour, open, onOpenChange, onCompleted, onDismissed }: Props) {
  const [stage, setStage] = useState<"teaser" | "slides" | "celebrate">("teaser");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStage("teaser");
      setIndex(0);
    }
  }, [open, tour?.id]);

  if (!tour) return null;

  const slide = tour.slides[index];
  const progress = ((index + 1) / tour.slides.length) * 100;

  const handleClose = (skipDismiss = false) => {
    if (!skipDismiss && stage !== "celebrate") {
      onDismissed?.(tour.id);
    }
    onOpenChange(false);
  };

  const handleNext = () => {
    if (index < tour.slides.length - 1) {
      setIndex(index + 1);
    } else {
      setStage("celebrate");
      onCompleted?.(tour.id);
    }
  };

  const handlePrev = () => index > 0 && setIndex(index - 1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {stage === "teaser" && (
            <motion.div
              key="teaser"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative rounded-2xl bg-gradient-to-br from-background via-background to-muted/40 border border-border/60 shadow-2xl p-8 backdrop-blur-xl"
            >
              <button
                onClick={() => handleClose()}
                className="absolute right-4 top-4 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>

              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 px-3 py-1 mb-4"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-[11px] font-semibold tracking-wider text-violet-600 dark:text-violet-400">
                  {tour.badge}
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-bold tracking-tight mb-3 leading-tight"
              >
                {tour.hook}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-muted-foreground mb-6"
              >
                Treinamento rápido de <strong className="text-foreground">{tour.estimatedSeconds}s</strong> sobre{" "}
                <strong className="text-foreground">{tour.title}</strong>. Aprenda agora ou continue trabalhando.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex gap-2"
              >
                <Button variant="ghost" onClick={() => handleClose()} className="flex-1">
                  Agora não
                </Button>
                <Button
                  onClick={() => setStage("slides")}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/25 group"
                >
                  Vamos lá
                  <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {stage === "slides" && slide && (
            <motion.div
              key={`slide-${index}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="relative rounded-2xl bg-background border border-border/60 shadow-2xl overflow-hidden"
            >
              {/* Header gradient */}
              <div className={cn("relative h-32 bg-gradient-to-br", slide.accent)}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_60%)] opacity-20" />
                <button
                  onClick={() => handleClose()}
                  className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors z-10"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute -bottom-8 left-8 h-16 w-16 rounded-2xl bg-white/95 dark:bg-background shadow-xl flex items-center justify-center"
                >
                  <slide.icon className={cn("h-8 w-8 bg-gradient-to-br bg-clip-text text-transparent", slide.accent)} 
                    style={{ color: 'currentColor' }}
                  />
                </motion.div>
              </div>

              <div className="p-8 pt-12">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground mb-3">
                  <span>{tour.badge}</span>
                  <span>•</span>
                  <span>{index + 1} / {tour.slides.length}</span>
                </div>

                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold mb-3 leading-tight"
                >
                  {slide.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground leading-relaxed mb-4"
                >
                  {slide.description}
                </motion.p>

                {slide.tip && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-6"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 dark:text-amber-200">{slide.tip}</p>
                  </motion.div>
                )}

                <Progress value={progress} className="h-1 mb-4" />

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={index === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0"
                  >
                    {index === tour.slides.length - 1 ? "Concluir" : "Próximo"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "celebrate" && (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-0 shadow-2xl p-10 text-center text-white overflow-hidden"
            >
              {/* Confetti dots */}
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: 0, opacity: 0 }}
                  animate={{
                    y: [0, 200],
                    x: [0, (i % 2 ? 1 : -1) * (20 + i * 8)],
                    opacity: [1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 1.6, delay: i * 0.05, ease: "easeOut" }}
                  className={cn(
                    "absolute top-4 left-1/2 h-2 w-2 rounded-sm",
                    i % 4 === 0 ? "bg-yellow-300" : i % 4 === 1 ? "bg-pink-300" : i % 4 === 2 ? "bg-white" : "bg-violet-300"
                  )}
                />
              ))}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4 ring-4 ring-white/10"
              >
                <Trophy className="h-10 w-10" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-3xl font-bold mb-2 flex items-center justify-center gap-2"
              >
                Parabéns! <PartyPopper className="h-7 w-7" />
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 mb-6"
              >
                Você concluiu o treinamento <strong>{tour.title}</strong>. Mais uma funcionalidade dominada no HAPMAP.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Button
                  onClick={() => handleClose(true)}
                  className="bg-white text-emerald-700 hover:bg-white/90 font-semibold"
                >
                  Continuar trabalhando
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
