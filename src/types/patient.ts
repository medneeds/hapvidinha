export type SectorType = 'red' | 'yellow' | 'blue' | 'outside';

export interface Patient {
  id: string;
  bedNumber: string;
  name: string;
  age: number;
  sector: SectorType;
  diagnoses: string[];
  medicalHistory: string[];
  relevantExams: string[];
  pendencies: string[];
  highlightedPendencies?: number[]; // Índices dos itens destacados
  schedule: string[];
  admissionHistory: string;
  admissionDate: string;
}
