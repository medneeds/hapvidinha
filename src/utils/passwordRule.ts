/** Senha da plataforma: exatamente 6 caracteres, letras maiúsculas e/ou números. */
export const PASSWORD_REGEX = /^[A-Z0-9]{6}$/;

export const PASSWORD_RULE_MESSAGE = "SENHA: 6 CARACTERES (LETRAS MAIÚSCULAS E/OU NÚMEROS)";

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/** Traduz erros de senha do servidor de autenticação para mensagens claras. */
export function translatePasswordError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("weak") || lower.includes("easy to guess") || lower.includes("pwned")) {
    return "SENHA RECUSADA POR SER MUITO COMUM. ESCOLHA OUTRA COMBINAÇÃO DE 6 CARACTERES.";
  }
  if (lower.includes("user already registered")) return "USUÁRIO JÁ CADASTRADO";
  return message.toUpperCase();
}
