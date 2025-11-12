export type SectorType = 'red' | 'yellow' | 'blue';

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
  schedule: string[];
  admissionHistory: string;
  admissionDate: string;
}
