import type { Patient } from "@/types/patient";
import { getPatientAgeDisplay } from "@/utils/ageDisplay";
import { getDepartmentLabel } from "@/contexts/DepartmentContext";

/**
 * Solicitação de Hemocomponentes.
 * The doctor fills one on-screen form; each selected original PDF (Documentos › Hemoderivados)
 * receives ONLY the directed information at fixed spots — the documents themselves are never changed.
 */

export type HemoDocKey = "solicitacao" | "termo" | "sadtAto" | "sadtExames" | "sadtConcentrados";

export const HEMO_DOCS: { key: HemoDocKey; title: string; detail: string }[] = [
  { key: "solicitacao", title: "Solicitação de Sangue / Hemoderivados", detail: "Hospital Guarás" },
  { key: "termo", title: "Termo de Esclarecimento de Hemotransfusão", detail: "Hapvida" },
  { key: "sadtAto", title: "SP/SADT · Ato Transfusional", detail: "Onco-Hematologia" },
  { key: "sadtExames", title: "SP/SADT · Exames pré-transfusionais", detail: "Onco-Hematologia" },
  { key: "sadtConcentrados", title: "SP/SADT · Concentrados", detail: "HAIMA" },
];

export type YesNo = "" | "sim" | "nao";
export type TransfusionType = "" | "programada" | "naoUrgente" | "urgente" | "extrema";
export type Consent = "" | "aceito" | "naoAceito" | "naoObtido";

export interface HemoForm {
  docs: Record<HemoDocKey, boolean>;
  nome: string;
  prontuario: string;
  atendimento: string;
  leito: string;
  setor: string;
  birthDate: string; // DD/MM/AAAA
  idade: string;
  sexo: "" | "F" | "M";
  peso: string;
  medico: string;
  grupo: string;
  fatorRh: string;
  diagnostico: string;
  indicacao: string;
  qtdHemacias: string;
  qtdPlaquetas: string;
  qtdPlasma: string;
  outrosHemocomponentes: string;
  dadosClinicos: string;
  hbHt: string;
  plaquetas: string;
  medicamentos: string;
  transfPrevias: YesNo;
  reacao: YesNo;
  qualTipo: string;
  gestante: YesNo;
  gestacoes: YesNo;
  tipo: TransfusionType;
  progData: string; // DD/MM/AAAA
  progHora: string; // HH:MM
  data: string; // DD/MM/AAAA
  hora: string; // HH:MM
  consentimento: Consent;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
export const formatDateBR = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
export const formatTimeBR = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export const MONTHS_PT = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/** Short sector label that fits the forms: UE ADULTO, UE PEDIÁTRICA, UTI 1, UTI 2. */
export function hemoSectorLabel(department: string, sector: Patient["sector"]): string {
  if (department === "UTI") return sector === "yellow" ? "UTI 2" : "UTI 1";
  return getDepartmentLabel(department);
}

/** Form pre-filled with what the system already knows; every value stays editable. */
export function buildDefaultHemoForm(
  patient: Patient,
  opts: { department: string; doctorName?: string; now?: Date }
): HemoForm {
  const now = opts.now ?? new Date();
  const up = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase() : "");
  return {
    docs: { solicitacao: true, termo: true, sadtAto: true, sadtExames: true, sadtConcentrados: true },
    nome: up(patient.name),
    prontuario: up(patient.medicalRecordNumber),
    atendimento: up(patient.attendanceNumber),
    leito: up(patient.bedNumber),
    setor: hemoSectorLabel(opts.department, patient.sector),
    birthDate: patient.birthDate || "",
    idade: up(getPatientAgeDisplay(patient)),
    sexo: "",
    peso: "",
    medico: up(opts.doctorName),
    grupo: "",
    fatorRh: "",
    diagnostico: (patient.diagnoses || []).map((d) => d.trim().toUpperCase()).filter(Boolean).join(", "),
    indicacao: "",
    qtdHemacias: "",
    qtdPlaquetas: "",
    qtdPlasma: "",
    outrosHemocomponentes: "",
    dadosClinicos: "",
    hbHt: "",
    plaquetas: "",
    medicamentos: "",
    transfPrevias: "",
    reacao: "",
    qualTipo: "",
    gestante: "",
    gestacoes: "",
    tipo: "",
    progData: "",
    progHora: "",
    data: formatDateBR(now),
    hora: formatTimeBR(now),
    consentimento: "",
  };
}

/** Only patient name, prontuário and atendimento are required — and only when a selected document has that field. */
export function validateHemoForm(form: HemoForm): string[] {
  const errors: string[] = [];
  const selected = HEMO_DOCS.filter((d) => form.docs[d.key]);
  if (selected.length === 0) errors.push("Selecione pelo menos um documento.");
  if (!form.nome.trim()) errors.push("Informe o nome do paciente.");
  if ((form.docs.solicitacao || form.docs.termo) && !form.prontuario.trim()) errors.push("Informe o prontuário.");
  if (form.docs.termo && !form.atendimento.trim()) errors.push("Informe o atendimento.");
  return errors;
}

/** Quantity as printed on the forms: digits only, at least two (3 → "03"). Empty stays empty. */
export function formatQuantity(q: string): string {
  const digits = (q || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 1 ? `0${digits}` : digits;
}

/** Text for the "Hemocomponente(s) solicitado(s)" box of the Solicitação. */
export function hemocomponentsSummary(form: HemoForm): string {
  const parts: string[] = [];
  const add = (q: string, label: string) => {
    const f = formatQuantity(q);
    if (f) parts.push(`${f} ${label}`);
  };
  add(form.qtdHemacias, "CONCENTRADOS DE HEMÁCIAS");
  add(form.qtdPlaquetas, "CONCENTRADOS DE PLAQUETAS");
  add(form.qtdPlasma, "CONCENTRADOS DE PLASMA");
  if (form.outrosHemocomponentes.trim()) parts.push(form.outrosHemocomponentes.trim().toUpperCase());
  return parts.join(" · ");
}

const splitDate = (v: string) => {
  const m = (v || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? { d: m[1].padStart(2, "0"), m: m[2].padStart(2, "0"), y: m[3] } : { d: "", m: "", y: "" };
};

const mark = (on: boolean) => (on ? "X" : "");

/** Values to draw on each document, keyed by the field names in hemoLayout.json. Empty values are not drawn. */
export function buildHemoFieldValues(form: HemoForm): Record<HemoDocKey, Record<string, string>> {
  const U = (v: string) => (v || "").trim().toUpperCase();
  const isMale = form.sexo === "M";
  const prog = splitDate(form.progData);
  const req = splitDate(form.data);
  const dn = splitDate(form.birthDate);
  const monthIdx = req.m ? parseInt(req.m, 10) - 1 : -1;

  return {
    solicitacao: {
      nome: U(form.nome),
      prontuario: U(form.prontuario),
      leito: U(form.leito),
      setor: U(form.setor),
      sexoF: mark(form.sexo === "F"),
      sexoM: mark(isMale),
      idade: U(form.idade),
      peso: U(form.peso),
      grupo: U(form.grupo),
      fatorRh: U(form.fatorRh),
      diagnostico: U(form.diagnostico),
      indicacao: U(form.indicacao),
      hemocomponentes: hemocomponentsSummary(form),
      dadosClinicos: U(form.dadosClinicos),
      hbHt: U(form.hbHt),
      plaquetas: U(form.plaquetas),
      medicamentos: U(form.medicamentos),
      transfPreviasSim: mark(form.transfPrevias === "sim"),
      transfPreviasNao: mark(form.transfPrevias === "nao"),
      reacaoSim: mark(form.reacao === "sim"),
      reacaoNao: mark(form.reacao === "nao"),
      qualTipo: U(form.qualTipo),
      gestanteSim: mark(!isMale && form.gestante === "sim"),
      gestanteNao: mark(!isMale && form.gestante === "nao"),
      gestacoesSim: mark(!isMale && form.gestacoes === "sim"),
      gestacoesNao: mark(!isMale && form.gestacoes === "nao"),
      tipoProgramada: mark(form.tipo === "programada"),
      tipoNaoUrgente: mark(form.tipo === "naoUrgente"),
      tipoUrgente: mark(form.tipo === "urgente"),
      tipoExtrema: mark(form.tipo === "extrema"),
      progDia: form.tipo === "programada" ? prog.d : "",
      progMes: form.tipo === "programada" ? prog.m : "",
      progAno: form.tipo === "programada" ? prog.y : "",
      progHora: form.tipo === "programada" ? form.progHora : "",
      dataDia: req.d,
      dataMes: req.m,
      dataAno: req.y,
      hora: form.hora,
    },
    termo: {
      nome: U(form.nome),
      leito: U(form.leito),
      prontuario: U(form.prontuario),
      atendimento: U(form.atendimento),
      dnDia: dn.d,
      dnMes: dn.m,
      dnAno: dn.y,
      medico: U(form.medico),
      aceito: mark(form.consentimento === "aceito"),
      naoAceito: mark(form.consentimento === "naoAceito"),
      naoObtido: mark(form.consentimento === "naoObtido"),
      dia: req.d,
      mes: monthIdx >= 0 && monthIdx < 12 ? MONTHS_PT[monthIdx] : "",
    },
    sadtAto: { nome: U(form.nome) },
    sadtExames: { nome: U(form.nome) },
    sadtConcentrados: {
      nome: U(form.nome),
      qtdHemacias: formatQuantity(form.qtdHemacias),
      qtdPlaquetas: formatQuantity(form.qtdPlaquetas),
      qtdPlasma: formatQuantity(form.qtdPlasma),
    },
  };
}

/** Summary saved in the patient's report history. */
export function hemoHistorySummary(form: HemoForm): string {
  const docs = HEMO_DOCS.filter((d) => form.docs[d.key]).map((d) => `- ${d.title}`);
  const tipoLabel: Record<TransfusionType, string> = {
    "": "",
    programada: `PROGRAMADA${form.progData ? ` (${form.progData}${form.progHora ? ` ${form.progHora}` : ""})` : ""}`,
    naoUrgente: "NÃO URGENTE (24H)",
    urgente: "URGENTE (3H)",
    extrema: "EXTREMA URGÊNCIA",
  };
  const lines = [
    "SOLICITAÇÃO DE HEMOCOMPONENTES",
    `DATA: ${form.data} ${form.hora}`,
    hemocomponentsSummary(form) && `HEMOCOMPONENTES: ${hemocomponentsSummary(form)}`,
    form.indicacao.trim() && `INDICAÇÃO: ${form.indicacao.trim().toUpperCase()}`,
    form.hbHt.trim() && `HB/HT: ${form.hbHt.trim().toUpperCase()}`,
    form.tipo && `TIPO: ${tipoLabel[form.tipo]}`,
    "DOCUMENTOS EMITIDOS:",
    ...docs,
  ];
  return lines.filter(Boolean).join("\n");
}
