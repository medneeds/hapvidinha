import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cada aba mantém sua própria sessão. Isso impede que várias abas abertas em
// computadores compartilhados tentem rotacionar o mesmo refresh token ao
// mesmo tempo e bloqueiem o IP do hospital por excesso de requisições.
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: sessionStorage,
      storageKey: "hapmap-auth-session-v2",
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);