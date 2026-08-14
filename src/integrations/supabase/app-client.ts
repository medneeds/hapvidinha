import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const AUTH_STORAGE_KEY = "hapmap-auth-session-v3";

// Versões anteriores compartilhavam o refresh token pelo localStorage. Em uma
// rede com várias abas/computadores isso fazia várias rotações concorrentes e
// invalidava a sessão recém-criada. Remover a chave legada também notifica abas
// antigas para que deixem de reutilizar esse token.
try {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  }
} catch {
  // O login continua funcional quando o navegador restringe o localStorage.
}

// Cada aba mantém sua própria sessão. Isso impede que várias abas abertas em
// computadores compartilhados tentem rotacionar o mesmo refresh token ao
// mesmo tempo e bloqueiem o IP do hospital por excesso de requisições.
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: sessionStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);