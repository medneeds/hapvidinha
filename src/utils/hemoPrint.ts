import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { HemoDocKey } from "./hemoRequest";

/**
 * Tabbed print window for the hemocomponent documents: every filled document becomes its own
 * printable sheet set with its own path (#/<doc>), so each one can be printed separately or all at once.
 * The sheets are images of the filled PDFs drawn by `hemoPdf.ts` — positions stay in hemoLayout.json.
 */

export interface HemoPrintPage {
  src: string;
  landscape: boolean;
}
export interface HemoPrintDoc {
  key: HemoDocKey;
  title: string;
  detail: string;
  pages: HemoPrintPage[];
}

/** Rasterizes every page of a filled PDF (≈200 dpi) for the print window. */
export async function renderPdfPages(bytes: Uint8Array, scale = 2.8): Promise<HemoPrintPage[]> {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pages: HemoPrintPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    pages.push({ src: canvas.toDataURL("image/jpeg", 0.9), landscape: viewport.width > viewport.height });
    canvas.width = canvas.height = 0;
  }
  await pdf.destroy?.();
  return pages;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Standalone light-theme HTML page with one tab (and path) per document. */
export function buildHemoPrintHtml(docs: HemoPrintDoc[], meta: { patientName: string; issuedAt: string }): string {
  const tabs = docs
    .map(
      (d, i) => `<a class="tab" href="#/${d.key}" data-key="${d.key}" role="tab">
        <span class="num">${i + 1}</span>
        <span class="txt"><b>${esc(d.title)}</b><small>${esc(d.detail)}</small></span>
      </a>`
    )
    .join("");
  const sections = docs
    .map(
      (d) => `<section class="doc" data-key="${d.key}" role="tabpanel" aria-label="${esc(d.title)}">
        ${d.pages
          .map(
            (p, i) => `<div class="sheet ${p.landscape ? "landscape" : "portrait"}"><img src="${p.src}" alt="${esc(d.title)} — página ${i + 1}" /></div>`
          )
          .join("")}
      </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hemocomponentes · ${esc(meta.patientName)}</title>
<style>
  :root { color-scheme: light; --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --accent:#be123c; --accent-soft:#fff1f2; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #f1f5f9; color: var(--ink); font-family: "Segoe UI", system-ui, -apple-system, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
  .top { display: flex; align-items: center; gap: 12px; padding: 12px 20px 8px; flex-wrap: wrap; }
  .top h1 { margin: 0; font-size: 15px; letter-spacing: .02em; }
  .top p { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
  .actions { margin-left: auto; display: flex; gap: 8px; }
  button { font: inherit; font-size: 13px; font-weight: 600; border-radius: 8px; padding: 8px 14px; cursor: pointer; border: 1px solid var(--line); background: #fff; color: var(--ink); transition: background .15s, transform .15s; }
  button:hover { background: #f8fafc; }
  button:active { transform: scale(.97); }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.primary:hover { background: #9f1239; }
  nav { display: flex; gap: 6px; padding: 0 20px 10px; overflow-x: auto; }
  .tab { display: flex; align-items: center; gap: 8px; padding: 7px 12px 7px 8px; border-radius: 10px; border: 1px solid var(--line); background: #fff; color: var(--ink); text-decoration: none; white-space: nowrap; transition: border-color .15s, background .15s; }
  .tab:hover { border-color: #fda4af; }
  .tab .num { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: #f1f5f9; font-size: 12px; font-weight: 700; color: var(--muted); }
  .tab .txt { display: flex; flex-direction: column; line-height: 1.15; }
  .tab b { font-size: 12px; font-weight: 600; }
  .tab small { font-size: 11px; color: var(--muted); }
  .tab.active { border-color: var(--accent); background: var(--accent-soft); }
  .tab.active .num { background: var(--accent); color: #fff; }
  main { padding: 24px 16px 48px; }
  .doc { display: none; flex-direction: column; align-items: center; gap: 20px; animation: fade .25s ease; }
  .doc.active { display: flex; }
  .sheet { background: #fff; box-shadow: 0 1px 3px rgba(15,23,42,.12), 0 8px 24px rgba(15,23,42,.08); }
  .sheet img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .sheet.portrait { width: min(210mm, 100%); aspect-ratio: 210 / 297; }
  .sheet.landscape { width: min(297mm, 100%); aspect-ratio: 297 / 210; }
  @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .doc { animation: none; } }
  @page { margin: 0; }
  @page portrait { size: A4 portrait; margin: 0; }
  @page landscape { size: A4 landscape; margin: 0; }
  @media print {
    html, body { background: #fff; }
    header { display: none; }
    main { padding: 0; }
    .doc { display: block !important; gap: 0; animation: none; }
    body[data-print="one"] .doc:not(.active) { display: none !important; }
    .sheet { box-shadow: none; break-after: page; page-break-after: always; }
    .sheet.portrait { page: portrait; width: 210mm; height: 297mm; aspect-ratio: auto; }
    .sheet.landscape { page: landscape; width: 297mm; height: 210mm; aspect-ratio: auto; }
    .doc:last-of-type .sheet:last-child { break-after: auto; page-break-after: auto; }
  }
</style>
</head>
<body data-print="one">
<header>
  <div class="top">
    <div>
      <h1>${esc(meta.patientName)}</h1>
      <p>Hemocomponentes · emitido em ${esc(meta.issuedAt)} · ${docs.length} documento${docs.length === 1 ? "" : "s"}</p>
    </div>
    <div class="actions">
      ${docs.length > 1 ? `<button type="button" id="print-all">Imprimir todos (${docs.length})</button>` : ""}
      <button type="button" class="primary" id="print-one">Imprimir este documento</button>
    </div>
  </div>
  <nav role="tablist">${tabs}</nav>
</header>
<main>${sections}</main>
<script>
  (function () {
    var docs = Array.prototype.slice.call(document.querySelectorAll(".doc"));
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    function current() {
      var k = location.hash.replace(/^#\\/?/, "");
      return docs.some(function (d) { return d.dataset.key === k; }) ? k : docs[0] && docs[0].dataset.key;
    }
    function show() {
      var k = current();
      docs.forEach(function (d) { d.classList.toggle("active", d.dataset.key === k); });
      tabs.forEach(function (t) {
        var on = t.dataset.key === k;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        if (on) t.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      window.scrollTo(0, 0);
    }
    function print(mode) { document.body.dataset.print = mode; window.print(); }
    window.addEventListener("hashchange", show);
    window.addEventListener("afterprint", function () { document.body.dataset.print = "one"; });
    var one = document.getElementById("print-one");
    var all = document.getElementById("print-all");
    if (one) one.addEventListener("click", function () { print("one"); });
    if (all) all.addEventListener("click", function () { print("all"); });
    show();
  })();
</script>
</body>
</html>`;
}

/** Placeholder shown in the print window while the documents are being filled. */
export const HEMO_PRINT_LOADING_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gerando documentos…</title>
<style>html,body{margin:0;height:100%;background:#fff;color:#0f172a;font-family:"Segoe UI",system-ui,sans-serif}
body{display:grid;place-items:center}.b{text-align:center}.d{width:44px;height:44px;margin:0 auto 14px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#be123c;animation:p 1.4s ease-in-out infinite}
@keyframes p{0%,100%{opacity:.55;transform:rotate(-45deg) scale(.9)}50%{opacity:1;transform:rotate(-45deg) scale(1)}}p{margin:0;font-size:14px;color:#64748b}</style></head>
<body><div class="b"><div class="d"></div><p>Gerando documentos…</p></div></body></html>`;
