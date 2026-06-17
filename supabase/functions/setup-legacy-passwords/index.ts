import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Legacy users configuration
const LEGACY_USERS = [
  { name: "MEDICOPORTA", email: "medicoporta@sistema.local", role: "porta", department: "URGÊNCIA E EMERGÊNCIA ADULTO" },
  { name: "LIDER", email: "lider@sistema.local", role: "medico", department: "URGÊNCIA E EMERGÊNCIA ADULTO" },
  { name: "VISITANTE", email: "visitante@sistema.local", role: "visitante", department: null },
  { name: "MEDICOUTI", email: "medicouti@sistema.local", role: "medico", department: "UTI" },
  { name: "LIDERPED", email: "liderped@sistema.local", role: "medico", department: "URGÊNCIA E EMERGÊNCIA PEDIÁTRICA" },
  { name: "COORDENADOR", email: "coordenador@sistema.local", role: "admin", department: null },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Authentication & authorization guard ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller has admin role
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Require explicit password in body — no insecure default
    let newPassword: string | undefined;
    try {
      const body = await req.json();
      newPassword = body?.password;
    } catch {
      // ignore
    }

    const passwordRegex = /^[A-Z0-9]{6}$/;
    if (!newPassword || !passwordRegex.test(newPassword)) {
      return new Response(
        JSON.stringify({ error: "Senha obrigatória: 6 caracteres alfanuméricos maiúsculos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get default hospital unit
    const { data: hospitalUnit } = await supabaseAdmin
      .from("hospital_units")
      .select("id, state_id")
      .limit(1)
      .single();

    const results: { name: string; success: boolean; error?: string; action?: string }[] = [];

    for (const legacyUser of LEGACY_USERS) {
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .rpc("admin_update_user_password", {
          p_email: legacyUser.email,
          p_new_password: newPassword
        });

      if (updateError) {
        results.push({ name: legacyUser.name, success: false, error: "rpc_error", action: "rpc_error" });
        continue;
      }

      if (!updateResult?.success) {
        results.push({ name: legacyUser.name, success: false, error: "update_failed", action: "update_failed" });
        continue;
      }

      const userId = updateResult.user_id;

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, status: "approved", full_name: legacyUser.name }, { onConflict: "id" });

      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: legacyUser.role });

      await supabaseAdmin.from("user_departments").delete().eq("user_id", userId);
      if (legacyUser.department) {
        await supabaseAdmin.from("user_departments").insert({
          user_id: userId,
          department: legacyUser.department
        });
      }

      if (hospitalUnit) {
        await supabaseAdmin.from("user_hospital_assignments").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_hospital_assignments").insert({
          user_id: userId,
          hospital_unit_id: hospitalUnit.id
        });
      }

      results.push({ name: legacyUser.name, success: true, action: "password_updated" });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuários configurados: ${successCount} sucesso, ${failCount} falha`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
