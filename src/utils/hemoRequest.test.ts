import { describe, it, expect } from "vitest";
import type { Patient } from "@/types/patient";
import {
  buildDefaultHemoForm,
  buildHemoFieldValues,
  formatQuantity,
  hemocomponentsSummary,
  validateHemoForm,
} from "./hemoRequest";
import layout from "./hemoLayout.json";

const patient = {
  id: "p1",
  bedNumber: "V03",
  name: "Thalita da Conceicao",
  age: "",
  birthDate: "20/12/1982",
  sector: "red",
  diagnoses: ["polimenorreia", "anemia"],
  medicalHistory: [],
  pendencies: [],
  schedule: [],
  admissionHistory: "",
  admissionDate: "",
  medicalRecordNumber: "13693030",
  attendanceNumber: "194632105",
} as unknown as Patient;

const now = new Date(2026, 9, 31, 6, 44);

describe("solicitação de hemocomponentes", () => {
  it("pre-fills name, prontuário, atendimento, bed, sector, diagnoses and the current date/time", () => {
    const f = buildDefaultHemoForm(patient, { department: "URGÊNCIA E EMERGÊNCIA ADULTO", doctorName: "Artur Batista", now });
    expect(f.nome).toBe("THALITA DA CONCEICAO");
    expect(f.prontuario).toBe("13693030");
    expect(f.atendimento).toBe("194632105");
    expect(f.leito).toBe("V03");
    expect(f.setor).toBe("UE ADULTO");
    expect(f.diagnostico).toBe("POLIMENORREIA, ANEMIA");
    expect(f.medico).toBe("ARTUR BATISTA");
    expect(f.data).toBe("31/10/2026");
    expect(f.hora).toBe("06:44");
  });

  it("labels UTI 2 beds (yellow) as UTI 2", () => {
    const f = buildDefaultHemoForm({ ...patient, sector: "yellow" } as Patient, { department: "UTI", now });
    expect(f.setor).toBe("UTI 2");
  });

  it("requires only name, prontuário and atendimento", () => {
    const f = buildDefaultHemoForm(patient, { department: "UTI", now });
    expect(validateHemoForm(f)).toEqual([]);
    expect(validateHemoForm({ ...f, nome: " " })).toContain("Informe o nome do paciente.");
    expect(validateHemoForm({ ...f, prontuario: "" })).toContain("Informe o prontuário.");
    expect(validateHemoForm({ ...f, atendimento: "" })).toContain("Informe o atendimento.");
  });

  it("does not require atendimento when the Termo (the only form with it) is not printed", () => {
    const f = buildDefaultHemoForm(patient, { department: "UTI", now });
    expect(validateHemoForm({ ...f, atendimento: "", docs: { ...f.docs, termo: false } })).toEqual([]);
  });

  it("does not require prontuário when only the SP/SADT guides (name only) are printed", () => {
    const f = buildDefaultHemoForm(patient, { department: "UTI", now });
    const docs = { solicitacao: false, termo: false, sadtAto: true, sadtExames: true, sadtConcentrados: true };
    expect(validateHemoForm({ ...f, prontuario: "", atendimento: "", docs })).toEqual([]);
  });

  it("prints quantities with two digits", () => {
    expect(formatQuantity("3")).toBe("03");
    expect(formatQuantity("12")).toBe("12");
    expect(formatQuantity("")).toBe("");
  });

  it("fills the HAIMA guide quantities and the Solicitação box from the same quantities", () => {
    const f = { ...buildDefaultHemoForm(patient, { department: "UTI", now }), qtdHemacias: "3", qtdPlasma: "1" };
    const v = buildHemoFieldValues(f);
    expect(v.sadtConcentrados.qtdHemacias).toBe("03");
    expect(v.sadtConcentrados.qtdPlaquetas).toBe("");
    expect(v.sadtConcentrados.qtdPlasma).toBe("01");
    expect(hemocomponentsSummary(f)).toBe("03 CONCENTRADOS DE HEMÁCIAS · 01 CONCENTRADOS DE PLASMA");
  });

  it("the two SP/SADT guides of Onco-Hematologia receive only the patient name", () => {
    const v = buildHemoFieldValues(buildDefaultHemoForm(patient, { department: "UTI", now }));
    expect(Object.keys(v.sadtAto)).toEqual(["nome"]);
    expect(Object.keys(v.sadtExames)).toEqual(["nome"]);
  });

  it("leaves the gestation questions blank for male patients", () => {
    const f = { ...buildDefaultHemoForm(patient, { department: "UTI", now }), sexo: "M" as const, gestante: "sim" as const, gestacoes: "nao" as const };
    const v = buildHemoFieldValues(f).solicitacao;
    expect(v.sexoM).toBe("X");
    expect(v.gestanteSim + v.gestanteNao + v.gestacoesSim + v.gestacoesNao).toBe("");
  });

  it("writes the scheduled date only for 'Programada'", () => {
    const base = { ...buildDefaultHemoForm(patient, { department: "UTI", now }), progData: "01/11/2026", progHora: "14:00" };
    expect(buildHemoFieldValues({ ...base, tipo: "programada" }).solicitacao.progDia).toBe("01");
    expect(buildHemoFieldValues({ ...base, tipo: "urgente" }).solicitacao.progDia).toBe("");
    expect(buildHemoFieldValues({ ...base, tipo: "urgente" }).solicitacao.tipoUrgente).toBe("X");
  });

  it("Termo: birth date split, month written out, consent left blank unless chosen", () => {
    const f = buildDefaultHemoForm(patient, { department: "UTI", now });
    const t = buildHemoFieldValues(f).termo;
    expect([t.dnDia, t.dnMes, t.dnAno]).toEqual(["20", "12", "1982"]);
    expect([t.dia, t.mes]).toEqual(["31", "OUTUBRO"]);
    expect(t.aceito + t.naoAceito + t.naoObtido).toBe("");
    expect(buildHemoFieldValues({ ...f, consentimento: "naoObtido" }).termo.naoObtido).toBe("X");
  });

  it("every value has a position on its document", () => {
    const v = buildHemoFieldValues(buildDefaultHemoForm(patient, { department: "UTI", now }));
    for (const [doc, fields] of Object.entries(v)) {
      const spots = (layout as any)[doc].fields;
      for (const key of Object.keys(fields)) expect(spots[key], `${doc}.${key}`).toBeDefined();
    }
  });
});
