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
    refetch: fetchPatients,
  };
}
