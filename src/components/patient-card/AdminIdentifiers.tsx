import type { Patient } from "@/types/patient";

/**
 * PRONT. / ATEND. — linha discreta logo após a idade, clique para copiar.
 * Compartilhada entre os cartões da UE e da UTI.
 */
export function AdminIdentifiers({ patient, onCopy }: { patient: Patient; onCopy: (text: string, label: string) => void }) {
  if (!patient.medicalRecordNumber && !patient.attendanceNumber) return null;
  return (
    <div className="shrink-0 flex items-center gap-2 text-[10px] italic text-muted-foreground/80">
      {patient.medicalRecordNumber && (
        <button type="button" className="hover:text-primary transition-colors" title="Copiar prontuário" onClick={() => onCopy(patient.medicalRecordNumber!, "Prontuário")}>
          <span className="font-semibold not-italic">PRONT.</span> {patient.medicalRecordNumber}
        </button>
      )}
      {patient.attendanceNumber && (
        <button type="button" className="hover:text-primary transition-colors" title="Copiar atendimento" onClick={() => onCopy(patient.attendanceNumber!, "Atendimento")}>
          <span className="font-semibold not-italic">ATEND.</span> {patient.attendanceNumber}
        </button>
      )}
    </div>
  );
}
