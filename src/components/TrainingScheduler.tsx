import { useEffect, useState } from "react";
import { useTrainingScheduler } from "@/hooks/useTrainingScheduler";
import { TrainingTourDialog } from "@/components/TrainingTourDialog";
import { TrainingCenterDialog } from "@/components/TrainingCenterDialog";

export function TrainingScheduler() {
  const {
    activeTour,
    open,
    setOpen,
    handleCompleted,
    handleDismissed,
    settings,
    updateSettings,
    state,
    startTourById,
    resetProgress,
  } = useTrainingScheduler();

  const [centerOpen, setCenterOpen] = useState(false);

  useEffect(() => {
    const onOpenCenter = () => setCenterOpen(true);
    window.addEventListener("hapmap:open-training-center", onOpenCenter);
    return () => window.removeEventListener("hapmap:open-training-center", onOpenCenter);
  }, []);

  return (
    <>
      <TrainingTourDialog
        tour={activeTour}
        open={open}
        onOpenChange={setOpen}
        onCompleted={handleCompleted}
        onDismissed={handleDismissed}
      />
      <TrainingCenterDialog
        open={centerOpen}
        onOpenChange={setCenterOpen}
        settings={settings}
        onUpdateSettings={updateSettings}
        completedIds={state.completed}
        dismissedIds={state.dismissed}
        onStartTour={(id) => {
          setCenterOpen(false);
          setTimeout(() => startTourById(id), 150);
        }}
        onResetProgress={resetProgress}
      />
    </>
  );
}
