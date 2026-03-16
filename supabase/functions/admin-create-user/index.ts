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

    // Verify admin role
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

    const { username, password, fullName, crm, specialty, phone, email, role } = await req.json();

    if (!username || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Usuário, senha e nome completo são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate password format
    if (!/^[A-Z0-9]{6}$/.test(password)) {
      return new Response(
        JSON.stringify({
          error: "Senha deve ter exatamente 6 caracteres alfanuméricos em maiúsculas",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const internalEmail = username.includes("@")
      ? username
      : `${username.toLowerCase()}@sistema.local`;

    // Create user via admin API
    const { data: newUser, error: createError } =
      await supabaseClient.auth.admin.createUser({
        email: internalEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username: username.toUpperCase(),
          crm: crm || null,
          specialty: specialty || null,
          phone: phone || null,
        },
      });

    if (createError) {
      if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "Usuário já cadastrado com este login" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = newUser.user.id;

    // Update profile with additional data
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        email: internalEmail,
        crm: crm || null,
        specialty: specialty || null,
        phone: phone || null,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: caller.id,
      });

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Assign role (default to medico)
    const userRole = role || "medico";
    // Delete any existing role first (trigger may have created one)
    await supabaseClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .insert({ user_id: userId, role: userRole });

    if (roleError) {
      console.error("Error assigning role:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário criado com sucesso",
        userId: userId,
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
