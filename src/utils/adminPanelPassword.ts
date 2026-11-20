import { supabase } from "@/integrations/supabase/client";

/** Confere a senha de coordenador do Painel Admin no servidor (a senha não fica no navegador). */
export async function verifyAdminPanelPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const { data, error } = await supabase.functions.invoke("verify-admin-panel-password", {
    body: { password },
  });
  if (error) return false;
  return data?.ok === true;
}
