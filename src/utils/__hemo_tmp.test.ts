import { it } from "vitest";
import { readFileSync, writeFileSync } from "fs";
import { buildDefaultHemoForm, buildHemoFieldValues } from "./hemoRequest";
import { generateHemoPdf } from "./hemoPdf";
it("render", async () => {
  const p: any = { id:"1", bedNumber:"V03", name:"Maria Aparecida dos Santos Albuquerque de Oliveira Cavalcante", birthDate:"20/12/1982", sector:"red", diagnoses:["POLIMENORREIA","ANEMIA FERROPRIVA GRAVE","HIPERTENSÃO ARTERIAL SISTÊMICA","DIABETES MELLITUS TIPO 2 INSULINODEPENDENTE","DOENÇA RENAL CRÔNICA ESTÁGIO IV"], medicalRecordNumber:"13693030", attendanceNumber:"194632105" };
  const f = { ...buildDefaultHemoForm(p, { department:"URGÊNCIA E EMERGÊNCIA ADULTO", doctorName:"Artur Augusto Santos Batista", now:new Date(2026,9,31,6,44) }),
    sexo:"F" as const, peso:"62 KG", grupo:"O", fatorRh:"POSITIVO", indicacao:"ANEMIA GRAVE SINTOMÁTICA", qtdHemacias:"3", qtdPlaquetas:"2", qtdPlasma:"1", outrosHemocomponentes:"CRIOPRECIPITADO 10 UNIDADES",
    dadosClinicos:"PALIDEZ, TAQUICARDIA", hbHt:"5,0 / 15%", plaquetas:"180.000", medicamentos:"NORIPURUM", transfPrevias:"sim" as const, reacao:"nao" as const, gestante:"nao" as const, gestacoes:"sim" as const,
    tipo:"urgente" as const, consentimento:"aceito" as const };
  const bytes = await generateHemoPdf(buildHemoFieldValues(f), f.docs, async (file) => { const b = readFileSync("public/documents/hemoderivados/"+file); return new Uint8Array(b).buffer; });
  writeFileSync("/tmp/hemo/out.pdf", bytes);
});
