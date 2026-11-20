// Confere a senha de coordenador do Painel Admin no servidor.
// A senha fica somente no cofre de segredos (ADMIN_PANEL_PASSWORD), nunca no código do navegador.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";

const BodySchema = z.object({ password: z.string().min(1).max(200) });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return json({ error: "Unauthorized" }, 401);

  // Somente profissionais aprovados podem tentar liberar o painel.
  const { data: approved } = await supabase.rpc("is_approved_user", { _user_id: userId });
  if (!approved) return json({ error: "Forbidden" }, 403);

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid body" }, 400);
  }
  if (!parsed.success) return json({ error: "Invalid body" }, 400);

  const expected = Deno.env.get("ADMIN_PANEL_PASSWORD");
  if (!expected) {
    console.error("ADMIN_PANEL_PASSWORD not configured");
    return json({ error: "Not configured" }, 500);
  }

  return json({ ok: parsed.data.password === expected });
});
