/**
 * Escapes a value for safe insertion into HTML built as a string
 * (print windows written with document.write). Use it for every stored or
 * user-typed value; React JSX already escapes on its own.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
