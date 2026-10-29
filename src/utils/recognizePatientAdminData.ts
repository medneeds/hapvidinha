import { supabase } from "@/integrations/supabase/client";

export interface RecognizedAdminData {
  birthDate: string | null;
  medicalRecordNumber: string | null;
  attendanceNumber: string | null;
}

/** Envia texto colado e/ou print para a IA e devolve DN, prontuário e atendimento. */
export async function recognizePatientAdminData(input: { text?: string; image?: string | null }): Promise<RecognizedAdminData> {
  const { data, error } = await supabase.functions.invoke("extract-patient-admin-data", {
    body: { text: input.text?.slice(0, 20000) || null, image: input.image || null },
  });
  if (error) {
    let message = "Não foi possível reconhecer os dados. Tente novamente.";
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) message = body.error;
    } catch { /* mantém mensagem padrão */ }
    throw new Error(message);
  }
  return {
    birthDate: data?.birthDate ?? null,
    medicalRecordNumber: data?.medicalRecordNumber ?? null,
    attendanceNumber: data?.attendanceNumber ?? null,
  };
}

/** Lê uma imagem e reduz para no máximo 1600px (JPEG), para envio leve. */
export function imageFileToDataUrl(file: File, maxSide = 1600): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Selecione uma imagem."));
  if (file.size > 15 * 1024 * 1024) return Promise.reject(new Error("Imagem muito grande (máx. 15 MB)."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Não foi possível processar a imagem."));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
