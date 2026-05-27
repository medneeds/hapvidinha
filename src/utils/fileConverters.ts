import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";

export type ImageFormat = "image/png" | "image/jpeg" | "image/webp";

/** Compress an image while keeping its visible format. */
export async function compressImage(
  file: File,
  opts: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number } = {}
): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: opts.maxSizeMB ?? 1,
    maxWidthOrHeight: opts.maxWidthOrHeight ?? 2000,
    initialQuality: opts.quality ?? 0.8,
    useWebWorker: true,
  });
  return new File([compressed], file.name, { type: compressed.type });
}

/** Convert an image file to another image format via canvas. */
export async function convertImage(
  file: File,
  target: ImageFormat,
  quality = 0.92
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  if (target === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("conv falhou"))), target, quality)
  );
  const ext = target.split("/")[1].replace("jpeg", "jpg");
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.${ext}`, { type: target });
}

/** Pack one or more images into a single PDF (A4 fit). */
export async function imagesToPdf(files: File[], filename = "imagens.pdf"): Promise<File> {
  const pdf = await PDFDocument.create();
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const img = f.type.includes("png")
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(
          f.type.includes("jpeg") || f.type.includes("jpg")
            ? bytes
            : new Uint8Array(await (await convertImage(f, "image/jpeg")).arrayBuffer())
        );
    const page = pdf.addPage([595.28, 841.89]); // A4 pt
    const { width: pw, height: ph } = page.getSize();
    const scale = Math.min(pw / img.width, ph / img.height) * 0.95;
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  const out = await pdf.save();
  // Convert to plain ArrayBuffer slice to satisfy BlobPart typing
  const ab = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  return new File([ab], filename, { type: "application/pdf" });
}

/** Render each PDF page to PNG using pdfjs and return as image files. */
export async function pdfToImages(file: File, scale = 2): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist");
  // worker via CDN to avoid bundling issues
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${(pdfjs as any).version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await (pdfjs as any).getDocument({ data }).promise;
  const out: File[] = [];
  const base = file.name.replace(/\.pdf$/i, "");
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise(r => canvas.toBlob(b => r(b!), "image/png"));
    out.push(new File([blob], `${base}_p${i}.png`, { type: "image/png" }));
  }
  return out;
}

/** Re-save a PDF stripping metadata & using object streams. Modest size gains. */
export async function reducePdf(file: File): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject("");
  pdf.setKeywords([]); pdf.setProducer(""); pdf.setCreator("");
  const out = await pdf.save({ useObjectStreams: true });
  const ab = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
  return new File([ab], file.name.replace(/\.pdf$/i, "_menor.pdf"), { type: "application/pdf" });
}

export function downloadFile(file: File | Blob, filename?: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || (file as File).name || "arquivo";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(n: number): string {
  if (!n) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(k)));
  return `${(n / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
