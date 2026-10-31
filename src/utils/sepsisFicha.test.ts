import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PDFDocument } from "pdf-lib";
import layout from "./sepsisLayout.json";
import { buildSepsisFichaValues, generateSepsisFichaPdf, localPartsToTimestamp, splitDate, splitTime, timestampToLocalParts } from "./sepsisFicha";

const ORIGINAL = resolve(__dirname, "../../public/documents/protocolo-sepse-adulto.pdf");
// Plain Uint8Array copy: the test DOM's ArrayBuffer is a different realm from Node's file buffer.
const fetchLocal = async () => Uint8Array.from(readFileSync(ORIGINAL)) as unknown as ArrayBuffer;

const full = {
  patient_name: "maria silva",
  birth_date: "1958-03-07",
  attendance_number: "123",
  hospital: "hospital guarás",
  responsible_name: "dr artur",
  opening_date: "2026-10-31",
  opening_time: "14:05:00",
  patient_weight: "72.5",
  sirs_temp_high: true,
  dysfunction_hypotension: true,
  has_infection: true,
  focus_pulmonary: true,
  focus_other: "cateter",
  medical_evaluation_date: "2026-10-31",
  medical_evaluation_time: "14:10",
  blood_culture_date: "2026-10-31",
  blood_culture_time: "14:20",
  lactate_date: "2026-10-31",
  lactate_time: "14:21",
  lactate_result: "3,8 mmol/l",
  antibiotic_names: "ceftriaxona",
  antibiotic_prescription_date: "2026-10-31",
  antibiotic_prescription_time: "14:30",
  antibiotic_administration_date: "2026-10-31",
  antibiotic_administration_time: "14:50",
  second_lactate_date: "2026-10-31",
  second_lactate_time: "17:00",
  fluid_date: "2026-10-31",
  fluid_time: "14:40",
  fluid_solution: "ringer",
  volume_administered: 2100,
  destination: "UTI",
  destination_date: "2026-10-31",
  destination_time: "20:00",
  destination_hospital: "hospital guarás",
  outcome: "ALTA",
  outcome_date: "2026-11-05",
  outcome_time: "10:30",
};

describe("ficha do protocolo de sepse", () => {
  it("splits dates and times into the form's slots", () => {
    expect(splitDate("2026-10-31")).toEqual(["31", "10", "2026"]);
    expect(splitDate("07/03/1958")).toEqual(["07", "03", "1958"]);
    expect(splitDate("")).toEqual(["", "", ""]);
    expect(splitTime("9:05:00")).toEqual(["09", "05"]);
  });

  it("keeps the exclusion date and time when stored and read back", () => {
    const ts = localPartsToTimestamp("2026-10-31", "18:20");
    expect(timestampToLocalParts(ts)).toEqual({ date: "2026-10-31", time: "18:20" });
    expect(localPartsToTimestamp("", "18:20")).toBeNull();
  });

  it("leaves an empty protocol completely blank", () => {
    expect(buildSepsisFichaValues({})).toEqual({});
  });

  it("writes text in uppercase, marks only what was chosen and every value has a place on the form", () => {
    const v = buildSepsisFichaValues(full);
    expect(v.nome).toBe("MARIA SILVA");
    expect(v.abertura_hora).toBe("14:05");
    expect(v.sirs_temp_high).toBe("X");
    expect(v.sirs_temp_low).toBeUndefined();
    expect(v.foco_pulm).toBe("X");
    expect(v.foco_uri).toBeUndefined();
    expect(v.peso).toBe("72,5");
    expect(v.volume).toBe("2100 ML");
    expect(v.dest_uti).toBe("X");
    expect(v.dest_int).toBeUndefined();
    expect(v.desf_alta).toBe("X");
    expect(v.desf_d).toBe("05");
    const fields = (layout as { fields: Record<string, unknown> }).fields;
    for (const key of Object.keys(v)) expect(fields[key], key).toBeDefined();
  });

  it("prints exclusion times only when infection / dysfunction was ruled out", () => {
    const ts = localPartsToTimestamp("2026-10-31", "18:20");
    expect(buildSepsisFichaValues({ has_infection: true, infection_excluded_date: ts }).exc1_h).toBeUndefined();
    expect(buildSepsisFichaValues({ has_infection: false, infection_excluded_date: ts }).exc1_h).toBe("18");
    expect(buildSepsisFichaValues({ has_organic_dysfunction: false, dysfunction_excluded_date: ts }).exc2_min).toBe("20");
  });

  it("outcomes not on the form (transferência, sepse descartada) leave the outcome boxes blank", () => {
    const v = buildSepsisFichaValues({ outcome: "TRANSFERÊNCIA", outcome_date: "2026-11-05", outcome_time: "10:30" });
    expect(v.desf_alta).toBeUndefined();
    expect(v.desf_obito).toBeUndefined();
    expect(v.desf_d).toBeUndefined();
  });

  it("keeps the original two A4 pages and can produce each page on its own", async () => {
    const values = buildSepsisFichaValues(full);
    const both = await PDFDocument.load(await generateSepsisFichaPdf(values, [0, 1], fetchLocal));
    expect(both.getPageCount()).toBe(2);
    const { width, height } = both.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
    const verso = await PDFDocument.load(await generateSepsisFichaPdf(values, [1], fetchLocal));
    expect(verso.getPageCount()).toBe(1);
  });
});
