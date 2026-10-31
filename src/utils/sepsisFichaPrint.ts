import { HEMO_PRINT_LOADING_HTML, buildHemoPrintHtml, renderPdfPages, type HemoPrintDoc } from "./hemoPrint";
import { SEPSIS_FICHA_PAGES, buildSepsisFichaValues, generateSepsisFichaPdf, type SepsisFichaData } from "./sepsisFicha";

export type SepsisFichaProgress = { index: number; total: number; finished: boolean };

/**
 * Fills the original sepsis protocol form and opens it in one print window, with one tab per page
 * (path `#/frente`, `#/verso`). Must be called straight from the click handler: the window is opened
 * before any await so the browser doesn't block it. When pop-ups are blocked, the filled PDF is downloaded.
 */
export async function printSepsisFicha(
  data: SepsisFichaData,
  onProgress?: (p: SepsisFichaProgress) => void
): Promise<"window" | "download"> {
  const win = window.open("", "_blank");
  if (win) {
    try {
      win.document.open();
      win.document.write(HEMO_PRINT_LOADING_HTML.replaceAll("Gerando documentos…", "Gerando ficha do protocolo…"));
      win.document.close();
    } catch {
      /* window still usable */
    }
  }

  const values = buildSepsisFichaValues(data);
  const total = SEPSIS_FICHA_PAGES.length;
  try {
    if (win) {
      const docs: HemoPrintDoc[] = [];
      for (let i = 0; i < total; i++) {
        onProgress?.({ index: i, total, finished: false });
        const meta = SEPSIS_FICHA_PAGES[i];
        const bytes = await generateSepsisFichaPdf(values, [i]);
        docs.push({ key: meta.key, title: meta.title, detail: meta.detail, pages: await renderPdfPages(bytes) });
      }
      const now = new Date();
      const html = buildHemoPrintHtml(docs, {
        patientName: (data.patient_name || "").toUpperCase(),
        issuedAt: now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
        label: "Protocolo de Sepse",
        unit: ["página", "páginas"],
        printOne: "esta página",
      });
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      win.location.replace(`${url}#/${docs[0].key}`);
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
      onProgress?.({ index: total - 1, total, finished: true });
      return "window";
    }

    onProgress?.({ index: 0, total, finished: false });
    const bytes = await generateSepsisFichaPdf(values);
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `PROTOCOLO_SEPSE_${(data.patient_name || "PACIENTE").trim().replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    onProgress?.({ index: total - 1, total, finished: true });
    return "download";
  } catch (e) {
    win?.close();
    throw e;
  }
}
