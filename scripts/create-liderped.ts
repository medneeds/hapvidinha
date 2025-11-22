// Script temporário para criar usuário LIDERPED
// Execute este arquivo uma vez para criar o usuário

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsonasdmcklteggrpafd.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Substitua pela service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createLiderPed() {
  // Criar usuário através do admin API
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: 'liderped@sistema.local',
    password: 'HAPVIDINHA123',
    email_confirm: true,
    user_metadata: {
      full_name: 'LIDERPED',
      username: 'LIDERPED'
    }
  });

  if (createError) {
    console.error('Erro ao criar usuário:', createError);
    return;
  }

  console.log('Usuário criado:', user);

  // Criar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.user.id,
      full_name: 'LIDERPED',
      email: null
    });

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
  }

  // Criar role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: user.user.id,
      role: 'medico'
    });

  if (roleError) {
    console.error('Erro ao criar role:', roleError);
  }

  // Criar departamento
  const { error: deptError } = await supabase
    .from('user_departments')
    .insert({
      user_id: user.user.id,
      department: 'URGÊNCIA E EMERGÊNCIA PEDIÁTRICA'
    });

  if (deptError) {
    console.error('Erro ao criar departamento:', deptError);
  }

  console.log('Usuário LIDERPED criado com sucesso!');
}

createLiderPed();
