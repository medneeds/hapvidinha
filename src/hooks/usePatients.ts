import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Patient } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('bed_number');

      if (error) throw error;

      const mappedPatients: Patient[] = (data || []).map(p => ({
        id: p.id,
        bedNumber: p.bed_number,
        name: p.name || '',
        age: p.age || 0,
        sector: p.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: p.diagnoses ? p.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: p.medical_history ? p.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: p.relevant_exams ? p.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: p.pendencies ? p.pendencies.split('\n').filter(Boolean) : [],
        schedule: p.schedule ? p.schedule.split('\n').filter(Boolean) : [],
        admissionHistory: p.admission_history || '',
        admissionDate: p.admission_date || '',
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
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.sector !== undefined) dbUpdates.sector = updates.sector;
      if (updates.diagnoses !== undefined) dbUpdates.diagnoses = updates.diagnoses.join('\n');
      if (updates.medicalHistory !== undefined) dbUpdates.medical_history = updates.medicalHistory.join('\n');
      if (updates.relevantExams !== undefined) dbUpdates.relevant_exams = updates.relevantExams.join('\n');
      if (updates.pendencies !== undefined) dbUpdates.pendencies = updates.pendencies.join('\n');
      if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule.join('\n');
      if (updates.admissionHistory !== undefined) dbUpdates.admission_history = updates.admissionHistory;
      if (updates.admissionDate !== undefined) dbUpdates.admission_date = updates.admissionDate;

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

  const createPatient = async (patient: Omit<Patient, 'id'>) => {
    try {
      const dbData = {
        bed_number: patient.bedNumber,
        name: patient.name,
        age: patient.age,
        sector: patient.sector,
        diagnoses: patient.diagnoses.join('\n'),
        medical_history: patient.medicalHistory.join('\n'),
        relevant_exams: patient.relevantExams.join('\n'),
        pendencies: patient.pendencies.join('\n'),
        schedule: patient.schedule.join('\n'),
        admission_history: patient.admissionHistory,
        admission_date: patient.admissionDate,
      };

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
        age: data.age || 0,
        sector: data.sector as 'red' | 'yellow' | 'blue' | 'outside',
        diagnoses: data.diagnoses ? data.diagnoses.split('\n').filter(Boolean) : [],
        medicalHistory: data.medical_history ? data.medical_history.split('\n').filter(Boolean) : [],
        relevantExams: data.relevant_exams ? data.relevant_exams.split('\n').filter(Boolean) : [],
        pendencies: data.pendencies ? data.pendencies.split('\n').filter(Boolean) : [],
        schedule: data.schedule ? data.schedule.split('\n').filter(Boolean) : [],
        admissionHistory: data.admission_history || '',
        admissionDate: data.admission_date || '',
      };

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

  const deletePatient = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== patientId));

      toast({
        title: "Leito deletado",
        description: "O leito foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível remover o leito.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPatients();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchPatients(); // Refetch all patients on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    patients,
    isLoading,
    updatePatient,
    createPatient,
    deletePatient,
    refetch: fetchPatients,
  };
}
