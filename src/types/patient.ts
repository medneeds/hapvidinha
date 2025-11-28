export type SectorType = 'red' | 'yellow' | 'blue' | 'outside';

export type MedicalResponsibilityType = 'porta' | 'lider' | 'conjunto' | null;

export interface MedicalResponsibility {
  type: MedicalResponsibilityType;
  officeNumber?: string;
  leaderNames?: string;
  portaNames?: string; // Nomes dos médicos porta
}

export interface Patient {
  id: string;
  bedNumber: string;
  name: string;
  age: string | number;
  sector: SectorType;
  diagnoses: string[];
  medicalHistory: string[];
  relevantExams: string[];
  pendencies: string[];
  highlightedPendencies?: number[]; // Índices dos itens destacados
  schedule: string[];
  admissionHistory: string;
  admissionDate: string;
  medicalResponsibility?: MedicalResponsibility;
  // UTI-specific fields
  utiAdmissionDate?: string;
  utiDischargePrediction?: string;
  utiAllergies?: string;
  utiAdmissionReason?: string;
  utiCurrentStatus?: string;
  utiDevices?: string;
  utiCulturesAntibiotics?: string;
  utiSpecialties?: string;
}
