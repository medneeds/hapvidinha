import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/contexts/HospitalContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface HospitalFile {
  id: string;
  hospital_unit_id: string;
  state_id: string;
  uploaded_by: string;
  uploaded_by_name: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useHospitalFiles() {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hospitalId = currentHospital?.id;
  const stateId = currentHospital?.state_id;

  const query = useQuery({
    queryKey: ["hospital-files", hospitalId, stateId],
    queryFn: async () => {
      if (!hospitalId || !stateId) return [];
      const { data, error } = await supabase
        .from("hospital_files")
        .select("*")
        .eq("hospital_unit_id", hospitalId)
        .eq("state_id", stateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HospitalFile[];
    },
    enabled: !!hospitalId && !!stateId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      description,
      tags,
    }: { file: File; description?: string; tags?: string[] }) => {
      if (!user || !hospitalId || !stateId) throw new Error("Sem hospital/usuário");
      if (file.size > 26214400) throw new Error("Arquivo excede 25 MB");

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${hospitalId}/${user.id}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("hospital-files")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("hospital_files").insert({
        hospital_unit_id: hospitalId,
        state_id: stateId,
        uploaded_by: user.id,
        uploaded_by_name: (user.user_metadata as any)?.full_name || user.email,
        storage_path: path,
        file_name: file.name.toUpperCase(),
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        description: description ? description.toUpperCase() : null,
        tags: tags?.map(t => t.toUpperCase()) || [],
      });
      if (insErr) {
        await supabase.storage.from("hospital-files").remove([path]);
        throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-files"] });
      toast.success("Arquivo enviado");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao enviar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: HospitalFile) => {
      const { error: sErr } = await supabase.storage
        .from("hospital-files")
        .remove([file.storage_path]);
      if (sErr) throw sErr;
      const { error } = await supabase.from("hospital_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-files"] });
      toast.success("Arquivo removido");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("hospital-files")
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    files: query.data || [],
    isLoading: query.isLoading,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    remove: deleteMutation.mutateAsync,
    getSignedUrl,
  };
}
