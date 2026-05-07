import { useTrainingScheduler } from "@/hooks/useTrainingScheduler";
import { TrainingTourDialog } from "@/components/TrainingTourDialog";

export function TrainingScheduler() {
  const { activeTour, open, setOpen, handleCompleted, handleDismissed } = useTrainingScheduler();

  return (
    <TrainingTourDialog
      tour={activeTour}
      open={open}
      onOpenChange={setOpen}
      onCompleted={handleCompleted}
      onDismissed={handleDismissed}
    />
  );
}
