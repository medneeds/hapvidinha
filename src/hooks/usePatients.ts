import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Patient } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";
import { Department } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBirthDateDisplay, birthDateToISO } from "@/utils/calculateDetailedAge";
import { vacantPatientSlotPayload } from "@/utils/patientSlotPayload";

const UTI_FIXED_BEDS = Array.from({ length: 10 }, (_, index) => `U${String(index + 1).padStart(2, '0')}`);
const isFixedUtiBed = (sector?: string, bedNumber?: string) =>
  (sector === 'blue' || sector === 'yellow') && !!bedNumber && /^U(0[1-9]|10)$/.test(bedNumber);

export function usePatients(department?: Department) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentState, currentHospital } = useHospital();
  const { user } = useAuth();

  const fetchPatients = async () => {
    try {
      if (!currentHospital || !currentState) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('patients')
        .select('*')
        .eq('hospital_unit_id', currentHospital.id)
        .eq('state_id', currentState.id);
      
      // Filter by department if provided
      if (department) {
        query = query.eq('department', department);
      }
      
      const { data, error } = await query.order('display_order').order('bed_number');

      if (error) throw error;

      // Self-heal: garante que todos os leitos fixos da Urgência Adulto existam.
      // Se algum leito V01-V07 / A01-A06 / Z01-Z06 estiver ausente, recria como vago.
      if (department === 'URGÊNCIA E EMERGÊNCIA ADULTO') {
        const FIXED_BEDS: { bed_number: string; sector: string }[] = [
          ...['V01','V02','V03','V04','V05','V06','V07'].map(b => ({ bed_number: b, sector: 'red' })),
          ...['A01','A02','A03','A04','A05','A06'].map(b => ({ bed_number: b, sector: 'yellow' })),
          ...['Z01','Z02','Z03','Z04','Z05','Z06'].map(b => ({ bed_number: b, sector: 'blue' })),
        ];
        const existingKeys = new Set((data || []).map((p: any) => `${p.sector}:${p.bed_number}`));
        const missing = FIXED_BEDS.filter(b => !existingKeys.has(`${b.sector}:${b.bed_number}`));
        if (missing.length > 0) {
          console.warn('[usePatients] Restaurando leitos fixos ausentes:', missing.map(m => m.bed_number));
          try {
            await supabase.from('patients').insert(
              missing.map(m => ({
                bed_number: m.bed_number,
                sector: m.sector,
                name: '',
                is_vacant: true,
                bed_status: 'available',
                department: 'URGÊNCIA E EMERGÊNCIA ADULTO',
                state_id: currentState.id,
                hospital_unit_id: currentHospital.id,
              })) as any
            );
            // Re-fetch após restauração (builder novo)
            const { data: refreshed } = await supabase
              .from('patients')
              .select('*')
              .eq('hospital_unit_id', currentHospital.id)
              .eq('state_id', currentState.id)
              .eq('department', 'URGÊNCIA E EMERGÊNCIA ADULTO')
              .order('display_order')
              .order('bed_number');
            if (refreshed) {
              (data as any).length = 0;
              (data as any).push(...refreshed);
            }
          } catch (healErr) {
            console.error('[usePatients] Falha ao restaurar leitos fixos:', healErr);
          }
        }
      }

      // Self-heal: UTI 1 (blue) and UTI 2 (yellow) are fixed capacity units.
      // U01-U10 must always exist in both units and must never be physically deleted.
      if (department === 'UTI') {
        const FIXED_UTI_BEDS: { bed_number: string; sector: string; display_order: number }[] = [
          ...UTI_FIXED_BEDS.map((b, index) => ({ bed_number: b, sector: 'blue', display_order: index + 1 })),
          ...UTI_FIXED_BEDS.map((b, index) => ({ bed_number: b, sector: 'yellow', display_order: index + 1 })),
        ];
        const existingKeys = new Set((data || []).map((p: any) => `${p.sector}:${p.bed_number}`));
        const missing = FIXED_UTI_BEDS.filter(b => !existingKeys.has(`${b.sector}:${b.bed_number}`));
        if (missing.length > 0) {
          console.warn('[usePatients] Restaurando leitos fixos da UTI ausentes:', missing.map(m => `${m.sector}:${m.bed_number}`));
          try {
            await supabase.from('patients').insert(
              missing.map(m => ({
                bed_number: m.bed_number,
                sector: m.sector,
                name: '',
                is_vacant: true,
                bed_status: 'available',
                display_order: m.display_order,
                department: 'UTI',
                state_id: currentState.id,
                hospital_unit_id: currentHospital.id,
              })) as any
            );
            const { data: refreshed } = await supabase
              .from('patients')
              .select('*')
              .eq('hospital_unit_id', currentHospital.id)
              .eq('state_id', currentState.id)
              .eq('department', 'UTI')
              .order('display_order')
              .order('bed_number');
            if (refreshed) {
              (data as any).length = 0;
              (data as any).push(...refreshed);
            }
          } catch (healErr) {
            console.error('[usePatients] Falha ao restaurar leitos fixos da UTI:', healErr);
          }
        }
      }

      const visibleData = department === 'UTI'
        ? (data || []).filter((p: any) => isFixedUtiBed(p.sector, p.bed_number))
        : (data || []);

      const mappedPatients: Patient[] = visibleData.map(p => ({
        id: p.id,
        bedNumber: p.bed_number,
        name: p.name || '',
        age: p.age || '',
        birthDate: formatBirthDateDisplay((p as any).birth_date),
        sector: p.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: p.diagnoses ? p.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: p.medical_history ? p.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: p.relevant_exams ? p.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: p.pendencies ? p.pendencies.split('\n').filter(Boolean) : [],
        highlightedPendencies: p.highlighted_pendencies || [],
        highlightedDiagnoses: (p as any).highlighted_diagnoses || [],
        highlightedMedicalHistory: (p as any).highlighted_medical_history || [],
        highlightedConducts: (p as any).highlighted_conducts || [],
        schedule: p.schedule ? p.schedule.split('\n').filter(Boolean) : [],
        admissionHistory: p.admission_history || '',
        admissionDate: p.admission_date || '',
        medicalResponsibility: (p.medical_responsibility as unknown) as Patient['medicalResponsibility'],
        // UTI fields
        utiAdmissionDate: p.uti_admission_date ? p.uti_admission_date.split('\n').filter(Boolean).map(date => {
          // Convert ISO timestamp to DD/MM/YYYY format if needed
          try {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const year = parsedDate.getFullYear();
              return `${day}/${month}/${year}`;
            }
          } catch (e) {
            // If parsing fails, return as is
          }
          return date;
        }) : [],
        utiDischargePrediction: p.uti_discharge_prediction ? p.uti_discharge_prediction.split('\n').filter(Boolean) : [],
        utiAllergies: p.uti_allergies ? p.uti_allergies.split('\n').filter(Boolean) : [],
        utiAdmissionReason: p.uti_admission_reason ? p.uti_admission_reason.split('\n').filter(Boolean) : [],
        utiCurrentStatus: p.uti_current_status ? p.uti_current_status.split('\n').filter(Boolean) : [],
        utiDevices: p.uti_devices ? p.uti_devices.split('\n').filter(Boolean) : [],
        utiCulturesAntibiotics: p.uti_cultures_antibiotics ? p.uti_cultures_antibiotics.split('\n').filter(Boolean) : [],
        utiSpecialties: p.uti_specialties ? p.uti_specialties.split('\n').filter(Boolean) : [],
        utiOriginSector: p.uti_origin_sector ? p.uti_origin_sector.split('\n').filter(Boolean) : [],
        utiDailyConducts: (p as any).uti_daily_conducts ? (p as any).uti_daily_conducts.split('\n').filter(Boolean) : [],
        displayOrder: p.display_order ?? 0,
        isDoorPatient: p.is_door_patient ?? false,
        allocationStatus: p.allocation_status as Patient['allocationStatus'],
        createdBy: p.created_by || undefined,
        psmStatus: p.psm_status as Patient['psmStatus'],
        clinicalStatus: (p as any).clinical_status as Patient['clinicalStatus'],
        isVacant: (p as any).is_vacant ?? false,
        bedStatus: ((p as any).bed_status || 'available') as Patient['bedStatus'],
        bedMaintenanceReason: (p as any).bed_maintenance_reason || null,
        bedMaintenanceStartedAt: (p as any).bed_maintenance_started_at || null,
        bedMaintenanceStartedBy: (p as any).bed_maintenance_started_by || null,
        patientCategory: (p as any).patient_category as Patient['patientCategory'],
        medicalRecordNumber: (p as any).medical_record_number || null,
        attendanceNumber: (p as any).attendance_number || null,
        cpf: (p as any).cpf || null,
        motherName: (p as any).mother_name || null,
        insuranceCompany: (p as any).insurance_company || null,
        insurancePlan: (p as any).insurance_plan || null,
        insurancePlanType: (p as any).insurance_plan_type || null,
        insuranceCardNumber: (p as any).insurance_card_number || null,
        insuranceDuration: (p as any).insurance_duration || null,
      }));

      // Sort by display_order first, then by bed_number as tiebreaker
      const sortedPatients = mappedPatients.sort((a, b) => {
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        // Tiebreaker: sort by bed number numerically
        const extractNumber = (bedNumber: string) => {
          const match = bedNumber.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return extractNumber(a.bedNumber) - extractNumber(b.bedNumber);
      });

      setPatients(sortedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Não foi possível carregar os dados dos pacientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
    try {
      const currentPatient = patients.find(p => p.id === patientId);
      const isProtectedUtiSlot = department === 'UTI' && isFixedUtiBed(currentPatient?.sector, currentPatient?.bedNumber);
      const dbUpdates: any = {};
      
      if (updates.bedNumber !== undefined && !isProtectedUtiSlot) dbUpdates.bed_number = updates.bedNumber;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.age !== undefined) dbUpdates.age = typeof updates.age === 'number' ? updates.age.toString() : updates.age;
      if (updates.birthDate !== undefined) dbUpdates.birth_date = birthDateToISO(updates.birthDate);
      if (updates.sector !== undefined && !isProtectedUtiSlot) dbUpdates.sector = updates.sector;
      if (updates.diagnoses !== undefined) dbUpdates.diagnoses = updates.diagnoses.join('\n');
      if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory.join('\n');
      if (updates.relevantExams !== undefined) dbUpdates.relevant_exams = updates.relevantExams.join('\n');
      if (updates.pendencies !== undefined) dbUpdates.pendencies = updates.pendencies.join('\n');
      if (updates.highlightedPendencies !== undefined) dbUpdates.highlighted_pendencies = updates.highlightedPendencies;
      if (updates.highlightedDiagnoses !== undefined) dbUpdates.highlighted_diagnoses = updates.highlightedDiagnoses;
      if (updates.highlightedMedicalHistory !== undefined) dbUpdates.highlighted_medical_history = updates.highlightedMedicalHistory;
      if (updates.highlightedConducts !== undefined) dbUpdates.highlighted_conducts = updates.highlightedConducts;
      if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule.join('\n');
      if (updates.admissionHistory !== undefined) dbUpdates.admission_history = updates.admissionHistory || null;
      if (updates.admissionDate !== undefined) dbUpdates.admission_date = updates.admissionDate && updates.admissionDate !== '' ? updates.admissionDate : null;
      if (updates.medicalResponsibility !== undefined) dbUpdates.medical_responsibility = updates.medicalResponsibility;
      if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
      if (updates.internmentStatus !== undefined) dbUpdates.internment_status = updates.internmentStatus || null;
      if (updates.internmentNotes !== undefined) dbUpdates.internment_notes = updates.internmentNotes || null;
      if (updates.isDoorPatient !== undefined) dbUpdates.is_door_patient = updates.isDoorPatient;
      if (updates.allocationStatus !== undefined) dbUpdates.allocation_status = updates.allocationStatus || null;
      // UTI fields
      if (updates.utiAdmissionDate !== undefined) {
        // Persist as DD/MM/YYYY text to avoid UTC timezone drift
        // (previously toISOString shifted the date by -1 day in UTC-3)
        if (updates.utiAdmissionDate.length === 0) {
          dbUpdates.uti_admission_date = null;
        } else {
          dbUpdates.uti_admission_date = updates.utiAdmissionDate
            .map(d => (d || '').trim())
            .filter(Boolean)
            .join('\n');
        }
      }
      if (updates.utiDischargePrediction !== undefined) dbUpdates.uti_discharge_prediction = updates.utiDischargePrediction.length > 0 ? updates.utiDischargePrediction.join('\n') : null;
      if (updates.utiAllergies !== undefined) dbUpdates.uti_allergies = updates.utiAllergies.length > 0 ? updates.utiAllergies.join('\n') : null;
      if (updates.utiAdmissionReason !== undefined) dbUpdates.uti_admission_reason = updates.utiAdmissionReason.length > 0 ? updates.utiAdmissionReason.join('\n') : null;
      if (updates.utiCurrentStatus !== undefined) dbUpdates.uti_current_status = updates.utiCurrentStatus.length > 0 ? updates.utiCurrentStatus.join('\n') : null;
      if (updates.utiDevices !== undefined) dbUpdates.uti_devices = updates.utiDevices.length > 0 ? updates.utiDevices.join('\n') : null;
      if (updates.utiCulturesAntibiotics !== undefined) dbUpdates.uti_cultures_antibiotics = updates.utiCulturesAntibiotics.length > 0 ? updates.utiCulturesAntibiotics.join('\n') : null;
      if (updates.utiSpecialties !== undefined) dbUpdates.uti_specialties = updates.utiSpecialties.length > 0 ? updates.utiSpecialties.join('\n') : null;
      if (updates.utiOriginSector !== undefined) dbUpdates.uti_origin_sector = updates.utiOriginSector.length > 0 ? updates.utiOriginSector.join('\n') : null;
      if (updates.utiDailyConducts !== undefined) dbUpdates.uti_daily_conducts = updates.utiDailyConducts.length > 0 ? updates.utiDailyConducts.join('\n') : null;
      if (updates.psmStatus !== undefined) dbUpdates.psm_status = updates.psmStatus;
      if (updates.clinicalStatus !== undefined) dbUpdates.clinical_status = updates.clinicalStatus;
      if (updates.isVacant !== undefined) dbUpdates.is_vacant = updates.isVacant;
      if (updates.bedStatus !== undefined) dbUpdates.bed_status = updates.bedStatus;
      if (updates.bedMaintenanceReason !== undefined) dbUpdates.bed_maintenance_reason = updates.bedMaintenanceReason;
      if (updates.bedMaintenanceStartedAt !== undefined) dbUpdates.bed_maintenance_started_at = updates.bedMaintenanceStartedAt;
      if (updates.bedMaintenanceStartedBy !== undefined) dbUpdates.bed_maintenance_started_by = updates.bedMaintenanceStartedBy;
      if (updates.patientCategory !== undefined) dbUpdates.patient_category = updates.patientCategory;
      if (updates.medicalRecordNumber !== undefined) dbUpdates.medical_record_number = updates.medicalRecordNumber;
      if (updates.attendanceNumber !== undefined) dbUpdates.attendance_number = updates.attendanceNumber;
      if (updates.cpf !== undefined) dbUpdates.cpf = updates.cpf;
      if (updates.motherName !== undefined) dbUpdates.mother_name = updates.motherName;
      if (updates.insuranceCompany !== undefined) dbUpdates.insurance_company = updates.insuranceCompany;
      if (updates.insurancePlan !== undefined) dbUpdates.insurance_plan = updates.insurancePlan;
      if (updates.insurancePlanType !== undefined) dbUpdates.insurance_plan_type = updates.insurancePlanType;
      if (updates.insuranceCardNumber !== undefined) dbUpdates.insurance_card_number = updates.insuranceCardNumber;
      if (updates.insuranceDuration !== undefined) dbUpdates.insurance_duration = updates.insuranceDuration;

      console.log('Updating patient:', patientId, 'with data:', dbUpdates);

      const { error } = await supabase
        .from('patients')
        .update(dbUpdates)
        .eq('id', patientId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Update local state
      setPatients(prev => prev.map(p => 
        p.id === patientId ? { ...p, ...updates } : p
      ));

      toast({
        title: "Paciente atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createPatient = async (patient: Omit<Patient, 'id'>, departmentValue?: Department) => {
    try {
      if (!currentHospital || !currentState) {
        throw new Error('Hospital unit and state must be selected');
      }

      const dbData: any = {
        bed_number: patient.bedNumber,
        name: patient.name,
        age: typeof patient.age === 'number' ? patient.age.toString() : patient.age,
        birth_date: birthDateToISO(patient.birthDate),
        sector: patient.sector,
        diagnoses: patient.diagnoses.join('\n'),
        medical_history: patient.medicalHistory.join('\n'),
        relevant_exams: patient.relevantExams.join('\n'),
        pendencies: patient.pendencies.join('\n'),
        highlighted_pendencies: patient.highlightedPendencies || [],
        highlighted_diagnoses: patient.highlightedDiagnoses || [],
        highlighted_medical_history: patient.highlightedMedicalHistory || [],
        highlighted_conducts: patient.highlightedConducts || [],
        schedule: patient.schedule.join('\n'),
        admission_history: patient.admissionHistory,
        admission_date: patient.admissionDate,
        department: departmentValue || department || 'URGÊNCIA E EMERGÊNCIA ADULTO',
        state_id: currentState.id,
        hospital_unit_id: currentHospital.id,
        medical_responsibility: patient.medicalResponsibility || null,
        created_by: user?.id || null,
        patient_category: patient.patientCategory || null,
        internment_status: patient.internmentStatus || null,
        internment_notes: patient.internmentNotes || null,
        is_door_patient: patient.isDoorPatient ?? patient.sector === 'outside',
        allocation_status: patient.allocationStatus || null,
        psm_status: patient.psmStatus || null,
        clinical_status: patient.clinicalStatus || null,
        medical_record_number: patient.medicalRecordNumber || null,
        attendance_number: patient.attendanceNumber || null,
        cpf: patient.cpf || null,
        mother_name: patient.motherName || null,
        insurance_company: patient.insuranceCompany || null,
        insurance_plan: patient.insurancePlan || null,
        insurance_plan_type: patient.insurancePlanType || null,
        insurance_card_number: patient.insuranceCardNumber || null,
        insurance_duration: patient.insuranceDuration || null,
        is_vacant: patient.isVacant ?? false,
        bed_status: patient.bedStatus || 'available',
        bed_maintenance_reason: patient.bedMaintenanceReason || null,
        bed_maintenance_started_at: patient.bedMaintenanceStartedAt || null,
        bed_maintenance_started_by: patient.bedMaintenanceStartedBy || null,
      };

      // Add UTI fields if they exist
      if (patient.utiAdmissionDate && patient.utiAdmissionDate.length > 0) {
        dbData.uti_admission_date = patient.utiAdmissionDate
          .map(d => (d || '').trim())
          .filter(Boolean)
          .join('\n');
      }
      if (patient.utiDischargePrediction && patient.utiDischargePrediction.length > 0) dbData.uti_discharge_prediction = patient.utiDischargePrediction.join('\n');
      if (patient.utiAllergies && patient.utiAllergies.length > 0) dbData.uti_allergies = patient.utiAllergies.join('\n');
      if (patient.utiAdmissionReason && patient.utiAdmissionReason.length > 0) dbData.uti_admission_reason = patient.utiAdmissionReason.join('\n');
      if (patient.utiCurrentStatus && patient.utiCurrentStatus.length > 0) dbData.uti_current_status = patient.utiCurrentStatus.join('\n');
      if (patient.utiDevices && patient.utiDevices.length > 0) dbData.uti_devices = patient.utiDevices.join('\n');
      if (patient.utiCulturesAntibiotics && patient.utiCulturesAntibiotics.length > 0) dbData.uti_cultures_antibiotics = patient.utiCulturesAntibiotics.join('\n');
      if (patient.utiSpecialties && patient.utiSpecialties.length > 0) dbData.uti_specialties = patient.utiSpecialties.join('\n');
      if (patient.utiOriginSector && patient.utiOriginSector.length > 0) dbData.uti_origin_sector = patient.utiOriginSector.join('\n');
      if (patient.utiDailyConducts && patient.utiDailyConducts.length > 0) dbData.uti_daily_conducts = patient.utiDailyConducts.join('\n');

      const { data, error } = await supabase
        .from('patients')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      const newPatient: Patient = {
        id: data.id,
        bedNumber: data.bed_number,
        name: data.name || '',
        age: data.age || '',
        birthDate: formatBirthDateDisplay((data as any).birth_date),
        sector: data.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: data.diagnoses ? data.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: data.medical_history ? data.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: data.relevant_exams ? data.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: data.pendencies ? data.pendencies.split('\n').filter(Boolean) : [],
        highlightedPendencies: data.highlighted_pendencies || [],
        highlightedDiagnoses: (data as any).highlighted_diagnoses || [],
        highlightedMedicalHistory: (data as any).highlighted_medical_history || [],
        highlightedConducts: (data as any).highlighted_conducts || [],
        schedule: data.schedule ? data.schedule.split('\n').filter(Boolean) : [],
        admissionHistory: data.admission_history || '',
        admissionDate: data.admission_date || '',
        medicalResponsibility: (data.medical_responsibility as unknown) as Patient['medicalResponsibility'],
        // UTI fields
        utiAdmissionDate: data.uti_admission_date ? data.uti_admission_date.split('\n').filter(Boolean).map(date => {
          try {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const year = parsedDate.getFullYear();
              return `${day}/${month}/${year}`;
            }
          } catch (e) {
            // If parsing fails, return as is
          }
          return date;
        }) : [],
        utiDischargePrediction: data.uti_discharge_prediction ? data.uti_discharge_prediction.split('\n').filter(Boolean) : [],
        utiAllergies: data.uti_allergies ? data.uti_allergies.split('\n').filter(Boolean) : [],
        utiAdmissionReason: data.uti_admission_reason ? data.uti_admission_reason.split('\n').filter(Boolean) : [],
        utiCurrentStatus: data.uti_current_status ? data.uti_current_status.split('\n').filter(Boolean) : [],
        utiDevices: data.uti_devices ? data.uti_devices.split('\n').filter(Boolean) : [],
        utiCulturesAntibiotics: data.uti_cultures_antibiotics ? data.uti_cultures_antibiotics.split('\n').filter(Boolean) : [],
        utiSpecialties: data.uti_specialties ? data.uti_specialties.split('\n').filter(Boolean) : [],
        utiOriginSector: data.uti_origin_sector ? data.uti_origin_sector.split('\n').filter(Boolean) : [],
        utiDailyConducts: (data as any).uti_daily_conducts ? (data as any).uti_daily_conducts.split('\n').filter(Boolean) : [],
        createdBy: data.created_by || undefined,
        isVacant: (data as any).is_vacant ?? false,
        bedStatus: ((data as any).bed_status || 'available') as Patient['bedStatus'],
        bedMaintenanceReason: (data as any).bed_maintenance_reason || null,
        bedMaintenanceStartedAt: (data as any).bed_maintenance_started_at || null,
        bedMaintenanceStartedBy: (data as any).bed_maintenance_started_by || null,
        patientCategory: data.patient_category as Patient['patientCategory'],
        internmentStatus: data.internment_status as Patient['internmentStatus'],
        internmentNotes: data.internment_notes || null,
        isDoorPatient: data.is_door_patient ?? false,
        allocationStatus: data.allocation_status as Patient['allocationStatus'],
        psmStatus: data.psm_status as Patient['psmStatus'],
        clinicalStatus: (data as any).clinical_status as Patient['clinicalStatus'],
        medicalRecordNumber: (data as any).medical_record_number || null,
        attendanceNumber: (data as any).attendance_number || null,
        cpf: (data as any).cpf || null,
        motherName: (data as any).mother_name || null,
        insuranceCompany: (data as any).insurance_company || null,
        insurancePlan: (data as any).insurance_plan || null,
        insurancePlanType: (data as any).insurance_plan_type || null,
        insuranceCardNumber: (data as any).insurance_card_number || null,
        insuranceDuration: (data as any).insurance_duration || null,
      };

      // Add to local state immediately for instant UI update
      setPatients(prev => [...prev, newPatient]);

      toast({
        title: "Leito criado",
        description: `Leito ${newPatient.bedNumber} adicionado com sucesso.`,
      });

      return newPatient;
    } catch (error) {
      console.error('Error creating patient:', error);
      toast({
        title: "Erro ao criar leito",
        description: "Não foi possível adicionar o leito.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePatient = async (patientId: string, options = { showToast: true, updateLocalState: true }) => {
    try {
      // Determine if this is a fixed bed — V/A/Z (Urgência) or U01-U10 (UTI).
      // Fixed beds must be PRESERVED as vacant slots, never physically removed.
      const target = patients.find(p => p.id === patientId);
      const isFixedEmergencyBed =
        target &&
        target.sector !== 'outside' &&
        ['red', 'yellow', 'blue'].includes(target.sector) &&
        /^[VAZ]\d{2}$/.test(target.bedNumber); // V01-V07, A01-A06, Z01-Z06
      const isFixedUtiBed =
        target &&
        department === 'UTI' &&
        /^U(0[1-9]|10)$/.test(target.bedNumber); // U01-U10 (UTI 1 & UTI 2)

      if (isFixedEmergencyBed || isFixedUtiBed) {
        console.log('Vacating fixed bed (preserving slot):', target.bedNumber);

        const { error } = await supabase
          .from('patients')
          .update(vacantPatientSlotPayload as any)
          .eq('id', patientId);

        if (error) {
          console.error('Supabase vacate error:', error);
          throw error;
        }

        if (options.updateLocalState) {
          setPatients(prev => prev.map(p => p.id === patientId ? {
            ...p,
            name: '',
            age: '',
            birthDate: '',
            diagnoses: [],
            medicalHistory: [],
            relevantExams: [],
            pendencies: [],
            isVacant: true,
            bedStatus: 'available',
            bedMaintenanceReason: null,
            bedMaintenanceStartedAt: null,
            bedMaintenanceStartedBy: null,
          } : p));
        }

        if (options.showToast) {
          toast({
            title: "Leito liberado",
            description: `Leito ${target.bedNumber} agora está disponível.`,
          });
        }
        return;
      }

      console.log('Deleting patient:', patientId);

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Patient deleted successfully from database');

      if (options.updateLocalState) {
        setPatients(prev => {
          const filtered = prev.filter(p => p.id !== patientId);
          console.log('Local state updated, patients count:', filtered.length);
          return filtered;
        });
      }

      if (options.showToast) {
        toast({
          title: "Leito deletado",
          description: "O leito foi removido com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      if (options.showToast) {
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível remover o leito.",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const reorderPatients = async (reorderedPatients: Patient[]) => {
    // Update display_order for each patient based on new position
    const updates = reorderedPatients.map((patient, index) => ({
      id: patient.id,
      display_order: index,
    }));

    // Update local state IMMEDIATELY (optimistic update)
    setPatients(prev => {
      const updatedPatients = prev.map(p => {
        const orderUpdate = updates.find(u => u.id === p.id);
        return orderUpdate ? { ...p, displayOrder: orderUpdate.display_order } : p;
      });
      return updatedPatients.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    });

    // Persist to database in parallel (background)
    try {
      await Promise.all(
        updates.map(update =>
          supabase
            .from('patients')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
        )
      );
    } catch (error) {
      console.error('Error persisting reorder:', error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível salvar a nova ordem.",
        variant: "destructive",
      });
    }
  };

  // Helper function to map database record to Patient object
  const mapRecordToPatient = (record: any): Patient => ({
    id: record.id,
    bedNumber: record.bed_number,
    name: record.name || '',
    age: record.age || '',
    birthDate: formatBirthDateDisplay(record.birth_date),
    sector: record.sector as 'red' | 'yellow' | 'blue' | 'outside',
    diagnoses: record.diagnoses ? record.diagnoses.split('\n').filter(Boolean) : [],
    medicalHistory: record.medical_history ? record.medical_history.split('\n').filter(Boolean) : [],
    relevantExams: record.relevant_exams ? record.relevant_exams.split('\n').filter(Boolean) : [],
    pendencies: record.pendencies ? record.pendencies.split('\n').filter(Boolean) : [],
    highlightedPendencies: record.highlighted_pendencies || [],
    highlightedDiagnoses: record.highlighted_diagnoses || [],
    highlightedMedicalHistory: record.highlighted_medical_history || [],
    highlightedConducts: record.highlighted_conducts || [],
    schedule: record.schedule ? record.schedule.split('\n').filter(Boolean) : [],
    admissionHistory: record.admission_history || '',
    admissionDate: record.admission_date || '',
    medicalResponsibility: (record.medical_responsibility as unknown) as Patient['medicalResponsibility'],
    utiAdmissionDate: record.uti_admission_date ? record.uti_admission_date.split('\n').filter(Boolean).map((date: string) => {
      try {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          const day = String(parsedDate.getDate()).padStart(2, '0');
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const year = parsedDate.getFullYear();
          return `${day}/${month}/${year}`;
        }
      } catch (e) {}
      return date;
    }) : [],
    utiDischargePrediction: record.uti_discharge_prediction ? record.uti_discharge_prediction.split('\n').filter(Boolean) : [],
    utiAllergies: record.uti_allergies ? record.uti_allergies.split('\n').filter(Boolean) : [],
    utiAdmissionReason: record.uti_admission_reason ? record.uti_admission_reason.split('\n').filter(Boolean) : [],
    utiCurrentStatus: record.uti_current_status ? record.uti_current_status.split('\n').filter(Boolean) : [],
    utiDevices: record.uti_devices ? record.uti_devices.split('\n').filter(Boolean) : [],
    utiCulturesAntibiotics: record.uti_cultures_antibiotics ? record.uti_cultures_antibiotics.split('\n').filter(Boolean) : [],
    utiSpecialties: record.uti_specialties ? record.uti_specialties.split('\n').filter(Boolean) : [],
    utiOriginSector: record.uti_origin_sector ? record.uti_origin_sector.split('\n').filter(Boolean) : [],
    utiDailyConducts: record.uti_daily_conducts ? record.uti_daily_conducts.split('\n').filter(Boolean) : [],
    displayOrder: record.display_order ?? 0,
    isDoorPatient: record.is_door_patient ?? false,
    allocationStatus: record.allocation_status as Patient['allocationStatus'],
    createdBy: record.created_by || undefined,
    psmStatus: record.psm_status as Patient['psmStatus'],
    clinicalStatus: record.clinical_status as Patient['clinicalStatus'],
    isVacant: record.is_vacant ?? false,
    bedStatus: (record.bed_status || 'available') as Patient['bedStatus'],
    bedMaintenanceReason: record.bed_maintenance_reason || null,
    bedMaintenanceStartedAt: record.bed_maintenance_started_at || null,
    bedMaintenanceStartedBy: record.bed_maintenance_started_by || null,
    patientCategory: record.patient_category as Patient['patientCategory'],
    medicalRecordNumber: record.medical_record_number || null,
    attendanceNumber: record.attendance_number || null,
    cpf: record.cpf || null,
    motherName: record.mother_name || null,
    insuranceCompany: record.insurance_company || null,
    insurancePlan: record.insurance_plan || null,
    insurancePlanType: record.insurance_plan_type || null,
    insuranceCardNumber: record.insurance_card_number || null,
    insuranceDuration: record.insurance_duration || null,
  });

  useEffect(() => {
    if (!currentHospital || !currentState) return;

    fetchPatients();

    // Subscribe to realtime changes with simplified filter
    const channelName = `patients-changes-${currentHospital.id}-${department || 'all'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log('Realtime patient change:', payload.eventType, payload);
          
          const eventType = payload.eventType;
          
          if (eventType === 'INSERT') {
            const newRecord = payload.new as any;
            // Filter by department if needed
            if (department && newRecord.department !== department) return;
            
            const newPatient = mapRecordToPatient(newRecord);
            setPatients(prev => {
              if (prev.some(p => p.id === newPatient.id)) return prev;
              return [...prev, newPatient].sort((a, b) => {
                const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
                if (orderDiff !== 0) return orderDiff;
                const extractNum = (bn: string) => { const m = bn.match(/\d+/); return m ? parseInt(m[0], 10) : 0; };
                return extractNum(a.bedNumber) - extractNum(b.bedNumber);
              });
            });
          } else if (eventType === 'UPDATE') {
            const updatedRecord = payload.new as any;
            // Filter by department if needed
            if (department && updatedRecord.department !== department) {
              // Patient was moved to another department, remove from list
              setPatients(prev => prev.filter(p => p.id !== updatedRecord.id));
              return;
            }
            
            const updatedPatient = mapRecordToPatient(updatedRecord);
            setPatients(prev => {
              // Check if patient exists in current list
              const exists = prev.some(p => p.id === updatedPatient.id);
              if (exists) {
                // Update in-place without re-sorting to preserve current position
                return prev.map(p => p.id === updatedPatient.id ? updatedPatient : p);
              } else {
                // Patient was moved to this department, add to list and sort
                const sortFn = (a: Patient, b: Patient) => {
                  const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
                  if (orderDiff !== 0) return orderDiff;
                  const extractNum = (bn: string) => { const m = bn.match(/\d+/); return m ? parseInt(m[0], 10) : 0; };
                  return extractNum(a.bedNumber) - extractNum(b.bedNumber);
                };
                return [...prev, updatedPatient].sort(sortFn);
              }
            });
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setPatients(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log('Patients realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department, currentHospital, currentState]);

  return {
    patients,
    isLoading,
    updatePatient,
    createPatient,
    deletePatient,
    reorderPatients,
    refetch: fetchPatients,
  };
}
