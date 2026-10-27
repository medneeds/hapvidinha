/**
 * TPS — tempo de permanência no setor (emergência), em minutos, horas e dias.
 * Ex.: 45 → "45min", 205 → "3h 25min", 1680 → "1d 4h".
 */
export function formatTps(totalMinutes: number): string {
  const total = Math.max(0, Math.floor(totalMinutes || 0));
  if (total < 60) return `${total}min`;
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  if (days === 0) return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}
