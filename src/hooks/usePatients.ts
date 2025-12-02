import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Patient } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";
import { Department } from "@/contexts/DepartmentContext";
import { useHospital } from "@/contexts/HospitalContext";

export function usePatients(department?: Department) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentState, currentHospital } = useHospital();

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

      const mappedPatients: Patient[] = (data || []).map(p => ({
        id: p.id,
        bedNumber: p.bed_number,
        name: p.name || '',
        age: p.age || '',
        sector: p.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: p.diagnoses ? p.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: p.medical_history ? p.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: p.relevant_exams ? p.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: p.pendencies ? p.pendencies.split('\n').filter(Boolean) : [],
        highlightedPendencies: p.highlighted_pendencies || [],
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
        displayOrder: p.display_order ?? 0,
      }));

      setPatients(mappedPatients);
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
      const dbUpdates: any = {};
      
      if (updates.bedNumber !== undefined) dbUpdates.bed_number = updates.bedNumber;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.age !== undefined) dbUpdates.age = typeof updates.age === 'number' ? updates.age.toString() : updates.age;
      if (updates.sector !== undefined) dbUpdates.sector = updates.sector;
      if (updates.diagnoses !== undefined) dbUpdates.diagnoses = updates.diagnoses.join('\n');
      if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory.join('\n');
      if (updates.relevantExams !== undefined) dbUpdates.relevant_exams = updates.relevantExams.join('\n');
      if (updates.pendencies !== undefined) dbUpdates.pendencies = updates.pendencies.join('\n');
      if (updates.highlightedPendencies !== undefined) dbUpdates.highlighted_pendencies = updates.highlightedPendencies;
      if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule.join('\n');
      if (updates.admissionHistory !== undefined) dbUpdates.admission_history = updates.admissionHistory;
      if (updates.admissionDate !== undefined) dbUpdates.admission_date = updates.admissionDate;
      if (updates.medicalResponsibility !== undefined) dbUpdates.medical_responsibility = updates.medicalResponsibility;
      if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
      // UTI fields
      if (updates.utiAdmissionDate !== undefined) {
        // Convert DD/MM/YYYY format back to ISO format for database storage
        if (updates.utiAdmissionDate.length === 0) {
          dbUpdates.uti_admission_date = null;
        } else {
          dbUpdates.uti_admission_date = updates.utiAdmissionDate.map(date => {
            try {
              // Check if it's already in DD/MM/YYYY format
              const parts = date.split('/');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                const isoDate = new Date(`${year}-${month}-${day}`);
                if (!isNaN(isoDate.getTime())) {
                  return isoDate.toISOString();
                }
              }
            } catch (e) {
              // If parsing fails, return as is
            }
            return date;
          }).join('\n');
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
        sector: patient.sector,
        diagnoses: patient.diagnoses.join('\n'),
        medical_history: patient.medicalHistory.join('\n'),
        relevant_exams: patient.relevantExams.join('\n'),
        pendencies: patient.pendencies.join('\n'),
        highlighted_pendencies: patient.highlightedPendencies || [],
        schedule: patient.schedule.join('\n'),
        admission_history: patient.admissionHistory,
        admission_date: patient.admissionDate,
        department: departmentValue || department || 'URGÊNCIA E EMERGÊNCIA ADULTO',
        state_id: currentState.id,
        hospital_unit_id: currentHospital.id,
        medical_responsibility: patient.medicalResponsibility || null,
      };

      // Add UTI fields if they exist
      if (patient.utiAdmissionDate && patient.utiAdmissionDate.length > 0) {
        dbData.uti_admission_date = patient.utiAdmissionDate.map(date => {
          try {
            const parts = date.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              const isoDate = new Date(`${year}-${month}-${day}`);
              if (!isNaN(isoDate.getTime())) {
                return isoDate.toISOString();
              }
            }
          } catch (e) {
            // If parsing fails, return as is
          }
          return date;
        }).join('\n');
      }
      if (patient.utiDischargePrediction && patient.utiDischargePrediction.length > 0) dbData.uti_discharge_prediction = patient.utiDischargePrediction.join('\n');
      if (patient.utiAllergies && patient.utiAllergies.length > 0) dbData.uti_allergies = patient.utiAllergies.join('\n');
      if (patient.utiAdmissionReason && patient.utiAdmissionReason.length > 0) dbData.uti_admission_reason = patient.utiAdmissionReason.join('\n');
      if (patient.utiCurrentStatus && patient.utiCurrentStatus.length > 0) dbData.uti_current_status = patient.utiCurrentStatus.join('\n');
      if (patient.utiDevices && patient.utiDevices.length > 0) dbData.uti_devices = patient.utiDevices.join('\n');
      if (patient.utiCulturesAntibiotics && patient.utiCulturesAntibiotics.length > 0) dbData.uti_cultures_antibiotics = patient.utiCulturesAntibiotics.join('\n');
      if (patient.utiSpecialties && patient.utiSpecialties.length > 0) dbData.uti_specialties = patient.utiSpecialties.join('\n');
      if (patient.utiOriginSector && patient.utiOriginSector.length > 0) dbData.uti_origin_sector = patient.utiOriginSector.join('\n');

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
        sector: data.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: data.diagnoses ? data.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: data.medical_history ? data.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: data.relevant_exams ? data.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: data.pendencies ? data.pendencies.split('\n').filter(Boolean) : [],
        highlightedPendencies: data.highlighted_pendencies || [],
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
    try {
      // Update display_order for each patient based on new position
      const updates = reorderedPatients.map((patient, index) => ({
        id: patient.id,
        display_order: index,
      }));

      // Update all patients in batch
      for (const update of updates) {
        const { error } = await supabase
          .from('patients')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) {
          console.error('Error updating display_order:', error);
          throw error;
        }
      }

      // Update local state with new order
      setPatients(prev => {
        const updatedPatients = prev.map(p => {
          const orderUpdate = updates.find(u => u.id === p.id);
          return orderUpdate ? { ...p, displayOrder: orderUpdate.display_order } : p;
        });
        return updatedPatients.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      });

    } catch (error) {
      console.error('Error reordering patients:', error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível salvar a nova ordem.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!currentHospital || !currentState) return;

    fetchPatients();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patients',
          filter: department ? `department=eq.${department}&hospital_unit_id=eq.${currentHospital.id}` : `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log('Realtime INSERT:', payload);
          const newRecord = payload.new as any;
          const newPatient: Patient = {
            id: newRecord.id,
            bedNumber: newRecord.bed_number,
            name: newRecord.name || '',
            age: newRecord.age || '',
            sector: newRecord.sector as 'red' | 'yellow' | 'blue' | 'outside',
            diagnoses: newRecord.diagnoses ? newRecord.diagnoses.split('\n').filter(Boolean) : [],
            medicalHistory: newRecord.medical_history ? newRecord.medical_history.split('\n').filter(Boolean) : [],
            relevantExams: newRecord.relevant_exams ? newRecord.relevant_exams.split('\n').filter(Boolean) : [],
            pendencies: newRecord.pendencies ? newRecord.pendencies.split('\n').filter(Boolean) : [],
            highlightedPendencies: newRecord.highlighted_pendencies || [],
            schedule: newRecord.schedule ? newRecord.schedule.split('\n').filter(Boolean) : [],
            admissionHistory: newRecord.admission_history || '',
            admissionDate: newRecord.admission_date || '',
            medicalResponsibility: (newRecord.medical_responsibility as unknown) as Patient['medicalResponsibility'],
            // UTI fields
            utiAdmissionDate: newRecord.uti_admission_date ? newRecord.uti_admission_date.split('\n').filter(Boolean).map(date => {
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
            utiDischargePrediction: newRecord.uti_discharge_prediction ? newRecord.uti_discharge_prediction.split('\n').filter(Boolean) : [],
            utiAllergies: newRecord.uti_allergies ? newRecord.uti_allergies.split('\n').filter(Boolean) : [],
            utiAdmissionReason: newRecord.uti_admission_reason ? newRecord.uti_admission_reason.split('\n').filter(Boolean) : [],
            utiCurrentStatus: newRecord.uti_current_status ? newRecord.uti_current_status.split('\n').filter(Boolean) : [],
            utiDevices: newRecord.uti_devices ? newRecord.uti_devices.split('\n').filter(Boolean) : [],
            utiCulturesAntibiotics: newRecord.uti_cultures_antibiotics ? newRecord.uti_cultures_antibiotics.split('\n').filter(Boolean) : [],
            utiSpecialties: newRecord.uti_specialties ? newRecord.uti_specialties.split('\n').filter(Boolean) : [],
            utiOriginSector: newRecord.uti_origin_sector ? newRecord.uti_origin_sector.split('\n').filter(Boolean) : [],
          };
          setPatients(prev => {
            // Check if patient already exists (avoid duplicates)
            if (prev.some(p => p.id === newPatient.id)) {
              return prev;
            }
            return [...prev, newPatient].sort((a, b) => a.bedNumber.localeCompare(b.bedNumber));
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patients',
          filter: department ? `department=eq.${department}&hospital_unit_id=eq.${currentHospital.id}` : `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log('Realtime UPDATE:', payload);
          const updatedRecord = payload.new as any;
          const updatedPatient: Patient = {
            id: updatedRecord.id,
            bedNumber: updatedRecord.bed_number,
            name: updatedRecord.name || '',
            age: updatedRecord.age || '',
            sector: updatedRecord.sector as 'red' | 'yellow' | 'blue' | 'outside',
            diagnoses: updatedRecord.diagnoses ? updatedRecord.diagnoses.split('\n').filter(Boolean) : [],
            medicalHistory: updatedRecord.medical_history ? updatedRecord.medical_history.split('\n').filter(Boolean) : [],
            relevantExams: updatedRecord.relevant_exams ? updatedRecord.relevant_exams.split('\n').filter(Boolean) : [],
            pendencies: updatedRecord.pendencies ? updatedRecord.pendencies.split('\n').filter(Boolean) : [],
            highlightedPendencies: updatedRecord.highlighted_pendencies || [],
            schedule: updatedRecord.schedule ? updatedRecord.schedule.split('\n').filter(Boolean) : [],
            admissionHistory: updatedRecord.admission_history || '',
            admissionDate: updatedRecord.admission_date || '',
            medicalResponsibility: (updatedRecord.medical_responsibility as unknown) as Patient['medicalResponsibility'],
            // UTI fields
            utiAdmissionDate: updatedRecord.uti_admission_date ? updatedRecord.uti_admission_date.split('\n').filter(Boolean).map(date => {
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
            utiDischargePrediction: updatedRecord.uti_discharge_prediction ? updatedRecord.uti_discharge_prediction.split('\n').filter(Boolean) : [],
            utiAllergies: updatedRecord.uti_allergies ? updatedRecord.uti_allergies.split('\n').filter(Boolean) : [],
            utiAdmissionReason: updatedRecord.uti_admission_reason ? updatedRecord.uti_admission_reason.split('\n').filter(Boolean) : [],
            utiCurrentStatus: updatedRecord.uti_current_status ? updatedRecord.uti_current_status.split('\n').filter(Boolean) : [],
            utiDevices: updatedRecord.uti_devices ? updatedRecord.uti_devices.split('\n').filter(Boolean) : [],
            utiCulturesAntibiotics: updatedRecord.uti_cultures_antibiotics ? updatedRecord.uti_cultures_antibiotics.split('\n').filter(Boolean) : [],
            utiSpecialties: updatedRecord.uti_specialties ? updatedRecord.uti_specialties.split('\n').filter(Boolean) : [],
            utiOriginSector: updatedRecord.uti_origin_sector ? updatedRecord.uti_origin_sector.split('\n').filter(Boolean) : [],
          };
          setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'patients',
          filter: department ? `department=eq.${department}&hospital_unit_id=eq.${currentHospital.id}` : `hospital_unit_id=eq.${currentHospital.id}`,
        },
        (payload) => {
          console.log('Realtime DELETE:', payload);
          const deletedId = (payload.old as any).id;
          setPatients(prev => prev.filter(p => p.id !== deletedId));
        }
      )
      .subscribe();

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
