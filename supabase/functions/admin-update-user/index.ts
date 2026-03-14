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

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user: caller },
    } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));

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

    const { userId, newEmail, newPassword } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updatePayload: Record<string, string> = {};

    if (newEmail) {
      // Ensure @sistema.local format
      const email = newEmail.includes("@")
        ? newEmail
        : `${newEmail}@sistema.local`;
      updatePayload.email = email;
      updatePayload.email_confirm = "true";
    }

    if (newPassword) {
      // Validate: 6 chars, uppercase + numbers
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
      updatePayload.password = newPassword;
    }

    if (Object.keys(updatePayload).length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma alteração informada" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build admin update payload
    const adminUpdate: Record<string, any> = {};
    if (updatePayload.password) adminUpdate.password = updatePayload.password;
    if (updatePayload.email) {
      adminUpdate.email = updatePayload.email;
      adminUpdate.email_confirm = true;
    }

    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      userId,
      adminUpdate
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If email changed, also update profile
    if (updatePayload.email) {
      await supabaseClient
        .from("profiles")
        .update({ email: updatePayload.email })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário atualizado com sucesso",
        updatedEmail: updatePayload.email || null,
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
