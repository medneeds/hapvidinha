import type { Patient } from "@/types/patient";

/**
 * PSM status cycle (AGUARDANDO → FAVORÁVEL → DESFAVORÁVEL → IR PARA → AGUARDANDO).
 * "IR PARA" means audit approved and the patient only waits for the transfer;
 * the pendency text becomes the final destination (e.g. "IR PARA LEITO DE UTI").
 */
export type PsmState = 'aguardando' | 'favoravel' | 'desfavoravel' | 'ir_para';

export const PSM_CYCLE: { text: string; status: PsmState; label: string }[] = [
  { text: 'AGUARDANDO PSM', status: 'aguardando', label: 'AGUARDANDO' },
  { text: 'PSM FAVORÁVEL', status: 'favoravel', label: 'FAVORÁVEL' },
  { text: 'PSM DESFAVORÁVEL', status: 'desfavoravel', label: 'DESFAVORÁVEL' },
  { text: 'IR PARA', status: 'ir_para', label: 'IR PARA' },
];

// Terminologias equivalentes a "AGUARDANDO PSM" (reagem com o mesmo status visual)
export const AGUARDANDO_ALIASES = [
  'AGUARDANDO PSM',
  'EM AUDITORIA',
  'AGUARDANDO AUTORIZAÇÃO',
  'AGUARDANDO AUTORIZACAO',
  'EM AUTORIZAÇÃO',
  'EM AUTORIZACAO',
  'SOLICITADO PROCEDIMENTO',
];

export const matchesAguardandoStatus = (upper: string) =>
  AGUARDANDO_ALIASES.some(alias => upper.includes(alias));

const INTERNMENT_TO_DESTINATION: { pattern: string; destination: string }[] = [
  { pattern: 'UTI', destination: 'IR PARA LEITO DE UTI' },
  { pattern: 'PSIQUIÁTRICA', destination: 'IR PARA O INSTITUTO VOLTA VIDA (IVV)' },
  { pattern: 'PSIQUIATRICA', destination: 'IR PARA O INSTITUTO VOLTA VIDA (IVV)' },
  { pattern: 'ENFERMARIA', destination: 'IR PARA ENFERMARIA' },
  { pattern: 'CENTRO CIRÚRGICO', destination: 'IR PARA O CENTRO CIRÚRGICO' },
  { pattern: 'CENTRO CIRURGICO', destination: 'IR PARA O CENTRO CIRÚRGICO' },
  { pattern: 'HEMODINÂMICA', destination: 'IR PARA A HEMODINÂMICA' },
  { pattern: 'HEMODINAMICA', destination: 'IR PARA A HEMODINÂMICA' },
  { pattern: 'IVV', destination: 'IR PARA O INSTITUTO VOLTA VIDA (IVV)' },
];

export const getIrParaDestination = (originalText: string): string => {
  const upper = originalText.toUpperCase();
  for (const mapping of INTERNMENT_TO_DESTINATION) {
    if (upper.includes(mapping.pattern)) return mapping.destination;
  }
  return 'IR PARA LEITO';
};

export const extractBaseContext = (text: string): string =>
  text
    .toUpperCase()
    .replace(/\s*\(?\s*(AGUARDANDO PSM|PSM FAVOR[AÁ]VEL|PSM DESFAVOR[AÁ]VEL|EM AUDITORIA|AGUARDANDO AUTORIZA[ÇC][ÃA]O|EM AUTORIZA[ÇC][ÃA]O|SOLICITADO PROCEDIMENTO)\s*\)?\s*/g, '')
    .trim();

export const isPsmText = (text: string) => {
  const upper = text.toUpperCase();
  return matchesAguardandoStatus(upper) ||
    upper.includes('PSM FAVORÁVEL') || upper.includes('PSM FAVORAVEL') ||
    upper.includes('PSM DESFAVORÁVEL') || upper.includes('PSM DESFAVORAVEL') ||
    upper.includes('IR PARA');
};

export const getPsmCycleIndex = (text: string) => {
  const upper = text.toUpperCase();
  if (upper.includes('IR PARA')) return 3;
  if (upper.includes('PSM DESFAVORÁVEL') || upper.includes('PSM DESFAVORAVEL')) return 2;
  if (upper.includes('PSM FAVORÁVEL') || upper.includes('PSM FAVORAVEL')) return 1;
  if (matchesAguardandoStatus(upper)) return 0;
  return -1;
};

/** Advances one PSM pendency text to the next state of the cycle. */
export function cyclePsmText(pendency: string): { text: string; status: PsmState } | null {
  const currentIndex = getPsmCycleIndex(pendency);
  if (currentIndex < 0) return null;
  const next = PSM_CYCLE[(currentIndex + 1) % PSM_CYCLE.length];
  let newText: string;
  if (next.status === 'ir_para') {
    newText = getIrParaDestination(extractBaseContext(pendency));
  } else if (currentIndex === 3) {
    newText = 'AGUARDANDO PSM';
  } else {
    const upper = pendency.toUpperCase();
    newText = pendency;
    for (const psm of PSM_CYCLE) {
      if (psm.status === 'ir_para') continue;
      const variants = psm.status === 'aguardando'
        ? AGUARDANDO_ALIASES
        : [psm.text, psm.text.replace('Á', 'A')];
      for (const variant of variants) {
        const idx = upper.indexOf(variant);
        if (idx >= 0) {
          newText = pendency.substring(0, idx) + next.text + pendency.substring(idx + variant.length);
          break;
        }
      }
      if (newText !== pendency) break;
    }
  }
  return { text: newText.toUpperCase(), status: next.status };
}

/** Current PSM state of a patient: saved status first, then the PSM pendency text. */
export function getPatientPsmState(patient: Pick<Patient, 'psmStatus' | 'pendencies'>): PsmState | null {
  if (patient.psmStatus) return patient.psmStatus as PsmState;
  const pendency = (patient.pendencies || []).find(isPsmText);
  if (!pendency) return null;
  const idx = getPsmCycleIndex(pendency);
  return idx >= 0 ? PSM_CYCLE[idx].status : null;
}

/** Changes needed to move the patient to the next PSM state (keeps the PSM pendency in sync). */
export function nextPatientPsm(patient: Pick<Patient, 'psmStatus' | 'pendencies'>): Partial<Patient> {
  const pendencies = patient.pendencies || [];
  const psmIndex = pendencies.findIndex(isPsmText);
  if (psmIndex >= 0) {
    const cycled = cyclePsmText(pendencies[psmIndex]);
    if (cycled) {
      const updated = [...pendencies];
      updated[psmIndex] = cycled.text;
      return { pendencies: updated, psmStatus: cycled.status as Patient['psmStatus'] };
    }
  }
  const current = getPatientPsmState(patient);
  const currentIdx = current ? PSM_CYCLE.findIndex(s => s.status === current) : -1;
  const next = PSM_CYCLE[(currentIdx + 1) % PSM_CYCLE.length];
  return { psmStatus: next.status as Patient['psmStatus'] };
}
