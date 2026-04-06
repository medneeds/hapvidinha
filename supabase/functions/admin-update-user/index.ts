import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasAdmin } = await supabaseClient
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!hasAdmin) {
      return new Response(
        JSON.stringify({ error: "Acesso restrito a administradores" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, newEmail, newPassword, profileData } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle auth updates (email/password)
    const adminUpdate: Record<string, any> = {};

    if (newEmail) {
      const email = newEmail.includes("@")
        ? newEmail
        : `${newEmail}@sistema.local`;
      adminUpdate.email = email;
      adminUpdate.email_confirm = true;
    }

    if (newPassword) {
      if (!/^[A-Z0-9]{6}$/.test(newPassword)) {
        return new Response(
          JSON.stringify({
            error:
              "Senha deve ter exatamente 6 caracteres alfanuméricos em maiúsculas",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      adminUpdate.password = newPassword;
    }

    // Update auth if needed
    if (Object.keys(adminUpdate).length > 0) {
      const { error } = await supabaseClient.auth.admin.updateUserById(
        userId,
        adminUpdate
      );

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle profile updates
    const profileUpdate: Record<string, any> = {};

    if (newEmail) {
      const email = newEmail.includes("@")
        ? newEmail
        : `${newEmail}@sistema.local`;
      profileUpdate.email = email;
    }

    if (profileData) {
      if (profileData.full_name !== undefined) profileUpdate.full_name = profileData.full_name;
      if (profileData.crm !== undefined) profileUpdate.crm = profileData.crm;
      if (profileData.specialty !== undefined) profileUpdate.specialty = profileData.specialty;
      if (profileData.phone !== undefined) profileUpdate.phone = profileData.phone;
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) {
        return new Response(JSON.stringify({ error: "Erro ao atualizar perfil: " + profileError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const hasChanges = Object.keys(adminUpdate).length > 0 || Object.keys(profileUpdate).length > 0;

    if (!hasChanges) {
      return new Response(
        JSON.stringify({ error: "Nenhuma alteração informada" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário atualizado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno: " + err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
