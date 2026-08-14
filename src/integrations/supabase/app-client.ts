import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cliente único da aplicação. O HAPMAP encerra sessões após 30 minutos de
// inatividade, portanto não deve iniciar o renovador automático do token.
// Configurar isso na criação evita que um reload renove a sessão antes que o
// AuthProvider tenha tempo de chamar stopAutoRefresh().
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: false,
    },
  },
);