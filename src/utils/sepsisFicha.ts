import { PDFDocument, StandardFonts } from "pdf-lib";
import layout from "./sepsisLayout.json";
import { drawSpot, type Spot } from "./pdfOverlay";

/**
 * "Ficha do Gerenciamento do Protocolo de Sepse Adulto": the protocol data is written over the
 * untouched original PDF (public/documents/protocolo-sepse-adulto.pdf). Every printed position
 * lives only in sepsisLayout.json and every value comes from `buildSepsisFichaValues`.
 */

export interface SepsisFichaData {
  patient_name?: string | null;
  birth_date?: string | null;
  attendance_number?: string | null;
  hospital?: string | null;
  responsible_name?: string | null;
  opening_date?: string | null;
  opening_time?: string | null;
  patient_weight?: number | string | null;
  sirs_temp_high?: boolean | null;
  sirs_temp_low?: boolean | null;
  sirs_heart_rate?: boolean | null;
  sirs_respiratory_rate?: boolean | null;
  sirs_leukocytosis?: boolean | null;
  sirs_leukopenia?: boolean | null;
  sirs_young_cells?: boolean | null;
  has_organic_dysfunction?: boolean | null;
  dysfunction_hypotension?: boolean | null;
  dysfunction_oliguria?: boolean | null;
  dysfunction_pao2?: boolean | null;
  dysfunction_platelets?: boolean | null;
  dysfunction_acidosis?: boolean | null;
  dysfunction_consciousness?: boolean | null;
  dysfunction_bilirubin?: boolean | null;
  dysfunction_excluded_date?: string | null;
  has_infection?: boolean | null;
  infection_excluded_date?: string | null;
  focus_pulmonary?: boolean | null;
  focus_urinary?: boolean | null;
  focus_abdominal?: boolean | null;
  focus_skin?: boolean | null;
  focus_neurological?: boolean | null;
  focus_other?: string | null;
  medical_evaluation_date?: string | null;
  medical_evaluation_time?: string | null;
  blood_culture_date?: string | null;
  blood_culture_time?: string | null;
  lactate_date?: string | null;
  lactate_time?: string | null;
  lactate_result?: string | null;
  lactate_result_date?: string | null;
  lactate_result_time?: string | null;
  second_lactate_date?: string | null;
  second_lactate_time?: string | null;
  second_lactate_result?: string | null;
  second_lactate_result_date?: string | null;
  second_lactate_result_time?: string | null;
  antibiotic_prescription_date?: string | null;
  antibiotic_prescription_time?: string | null;
  antibiotic_administration_date?: string | null;
  antibiotic_administration_time?: string | null;
  antibiotic_names?: string | null;
  fluid_date?: string | null;
  fluid_time?: string | null;
  fluid_solution?: string | null;
  volume_administered?: number | string | null;
  destination?: string | null;
  destination_date?: string | null;
  destination_time?: string | null;
  destination_hospital?: string | null;
  outcome?: string | null;
  outcome_date?: string | null;
  outcome_time?: string | null;
}

const up = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase() : v == null ? "" : String(v).trim());

/** "2026-10-31" (or "31/10/2026") → ["31", "10", "2026"]; anything else → empty parts. */
export function splitDate(value: string | null | undefined): [string, string, string] {
  const v = (value || "").trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return [m[3], m[2], m[1]];
  m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return [m[1], m[2], m[3]];
  return ["", "", ""];
}

/** "14:05" / "14:05:00" → ["14", "05"]. */
export function splitTime(value: string | null | undefined): [string, string] {
  const m = (value || "").trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? [m[1].padStart(2, "0"), m[2]] : ["", ""];
}

/** Timestamp (exclusion columns) → local "yyyy-mm-dd" and "HH:MM". */
export function timestampToLocalParts(ts: string | null | undefined): { date: string; time: string } {
  if (!ts) return { date: "", time: "" };
  const d = new Date(ts);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

/** Local date + time → ISO timestamp for the exclusion columns (null when no date). */
export function localPartsToTimestamp(date: string, time: string): string | null {
  if (!date) return null;
  const d = new Date(`${date}T${time || "00:00"}`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const num = (v: unknown) => {
  if (v === null || v === undefined || v === "") return "";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? "" : String(n).replace(".", ",");
};

/** Every value printed on the form, keyed by the spot names in sepsisLayout.json. Empty = left blank. */
export function buildSepsisFichaValues(d: SepsisFichaData): Record<string, string> {
  const v: Record<string, string> = {};
  const put = (k: string, val: unknown) => {
    const s = up(val);
    if (s) v[k] = s;
  };
  const mark = (k: string, on: unknown) => {
    if (on === true) v[k] = "X";
  };
  const dateTime = (prefix: string, date?: string | null, time?: string | null) => {
    const [dd, mm, aa] = splitDate(date);
    const [h, min] = splitTime(time);
    put(`${prefix}_d`, dd);
    put(`${prefix}_m`, mm);
    put(`${prefix}_a`, aa);
    put(`${prefix}_h`, h);
    put(`${prefix}_min`, min);
  };

  // Frente
  put("nome", d.patient_name);
  const [nd, nm, na] = splitDate(d.birth_date);
  put("nasc_d", nd);
  put("nasc_m", nm);
  put("nasc_a", na);
  put("atendimento", d.attendance_number);
  put("hospital", d.hospital);
  put("responsavel", d.responsible_name);
  const [ad, am, aa] = splitDate(d.opening_date);
  put("abertura_d", ad);
  put("abertura_m", am);
  put("abertura_a", aa);
  const [oh, om] = splitTime(d.opening_time);
  if (oh) v.abertura_hora = `${oh}:${om}`;
  for (const k of [
    "sirs_temp_high", "sirs_temp_low", "sirs_heart_rate", "sirs_respiratory_rate",
    "sirs_leukocytosis", "sirs_leukopenia", "sirs_young_cells",
    "dysfunction_hypotension", "dysfunction_oliguria", "dysfunction_pao2", "dysfunction_platelets",
    "dysfunction_acidosis", "dysfunction_consciousness", "dysfunction_bilirubin",
  ] as const) mark(k, d[k]);

  // Verso
  dateTime("aval", d.medical_evaluation_date, d.medical_evaluation_time);
  dateTime("hemo", d.blood_culture_date, d.blood_culture_time);
  dateTime("lact", d.lactate_date, d.lactate_time);
  put("lact_res", d.lactate_result);
  dateTime("lactres", d.lactate_result_date, d.lactate_result_time);
  if (d.has_infection === false) {
    const x = timestampToLocalParts(d.infection_excluded_date);
    dateTime("exc1", x.date, x.time);
  }
  put("atb1", d.antibiotic_names);
  dateTime("prescr", d.antibiotic_prescription_date, d.antibiotic_prescription_time);
  if (d.antibiotic_administration_date || d.antibiotic_administration_time) put("atb2", d.antibiotic_names);
  dateTime("adm", d.antibiotic_administration_date, d.antibiotic_administration_time);
  mark("foco_pulm", d.focus_pulmonary);
  mark("foco_uri", d.focus_urinary);
  mark("foco_abd", d.focus_abdominal);
  mark("foco_cut", d.focus_skin);
  mark("foco_neuro", d.focus_neurological);
  put("foco_outros", d.focus_other);
  dateTime("lact2", d.second_lactate_date, d.second_lactate_time);
  put("lact2_res", d.second_lactate_result);
  dateTime("lact2res", d.second_lactate_result_date, d.second_lactate_result_time);
  if (d.has_organic_dysfunction === false) {
    const x = timestampToLocalParts(d.dysfunction_excluded_date);
    dateTime("exc2", x.date, x.time);
  }
  dateTime("vol", d.fluid_date, d.fluid_time);
  const peso = num(d.patient_weight);
  if (peso) v.peso = peso;
  const vol = num(d.volume_administered);
  if (vol) v.volume = `${vol} ML`;
  put("solucao", d.fluid_solution);

  const dest = up(d.destination);
  if (dest) {
    mark("dest_uti", dest === "UTI");
    mark("dest_int", dest === "ENFERMARIA" || dest === "INTERNAÇÃO");
    dateTime("dest", d.destination_date, d.destination_time);
  }
  put("dest_hosp", d.destination_hospital);

  const outcome = up(d.outcome);
  if (outcome === "ALTA" || outcome === "ÓBITO") {
    mark("desf_alta", outcome === "ALTA");
    mark("desf_obito", outcome === "ÓBITO");
    dateTime("desf", d.outcome_date, d.outcome_time);
  }
  return v;
}

interface SepsisLayout {
  file: string;
  size: number;
  pageSizes: number[];
  fields: Record<string, Spot>;
}

export const SEPSIS_FICHA_PAGES = [
  { key: "frente", title: "Frente", detail: "Identificação e critérios" },
  { key: "verso", title: "Verso", detail: "Gerenciamento do protocolo" },
] as const;

type FetchFile = (file: string) => Promise<ArrayBuffer>;
const fetchOriginal: FetchFile = async (file) => {
  const res = await fetch(`/documents/${file}`);
  if (!res.ok) throw new Error("Não foi possível abrir a ficha original do protocolo de sepse.");
  return res.arrayBuffer();
};

/** Filled form. `pages` picks which original pages to keep (default both: frente e verso). */
export async function generateSepsisFichaPdf(
  values: Record<string, string>,
  pages: number[] = [0, 1],
  fetchFile: FetchFile = fetchOriginal
): Promise<Uint8Array> {
  const L = layout as unknown as SepsisLayout;
  const src = await PDFDocument.load(await fetchFile(L.file));
  const out = await PDFDocument.create();
  const regular = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const copied = await out.copyPages(src, pages);
  copied.forEach((p) => out.addPage(p));
  for (const [field, value] of Object.entries(values)) {
    const spot = L.fields[field];
    if (!spot || !value) continue;
    const idx = pages.indexOf(spot.page);
    if (idx < 0) continue;
    drawSpot(copied[idx], spot, value, regular, bold, L.pageSizes[spot.page] ?? L.size);
  }
  out.setTitle("Ficha do Gerenciamento do Protocolo de Sepse Adulto");
  return out.save();
}
