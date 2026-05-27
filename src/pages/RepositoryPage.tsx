import { useCallback, useRef, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload, Search, FileText, FileImage, FileArchive, Trash2, Download,
  Sparkles, Loader2, X, Camera, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useHospitalFiles, HospitalFile } from "@/hooks/useHospitalFiles";
import {
  compressImage, convertImage, downloadFile, formatBytes, imagesToPdf,
  pdfToImages, reducePdf, ImageFormat,
} from "@/utils/fileConverters";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";
const MAX_BYTES = 25 * 1024 * 1024;

function iconFor(mime?: string | null) {
  if (!mime) return FileArchive;
  if (mime.startsWith("image/")) return FileImage;
  if (mime.includes("pdf")) return FileText;
  return FileArchive;
}

export default function RepositoryPage() {
  const { files, isLoading, upload, isUploading, remove, getSignedUrl } = useHospitalFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<HospitalFile | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  // Compression dialog
  const [compressTarget, setCompressTarget] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [maxDim, setMaxDim] = useState(2000);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter(f =>
      f.file_name.toLowerCase().includes(q) ||
      (f.description || "").toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [files, search]);

  const addPending = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter(f => {
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" excede 25 MB`);
        return false;
      }
      return true;
    });
    if (!arr.length) return;
    setPending(prev => [...prev, ...arr]);
    setOpenUploadDialog(true);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addPending(e.dataTransfer.files);
  }, [addPending]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    if (e.clipboardData.files?.length) addPending(e.clipboardData.files);
  }, [addPending]);

  const handleUpload = async () => {
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    try {
      for (const f of pending) {
        await upload({ file: f, description, tags });
      }
      setPending([]); setDescription(""); setTagsInput("");
      setOpenUploadDialog(false);
    } catch {}
  };

  const openPreview = async (f: HospitalFile) => {
    try {
      const url = await getSignedUrl(f.storage_path);
      setPreviewUrl(url);
      setPreviewFile(f);
    } catch (e: any) {
      toast.error("Não foi possível abrir");
    }
  };

  const downloadOriginal = async (f: HospitalFile) => {
    const url = await getSignedUrl(f.storage_path);
    const r = await fetch(url);
    const blob = await r.blob();
    downloadFile(blob, f.file_name);
  };

  const fetchAsFile = async (f: HospitalFile): Promise<File> => {
    const url = await getSignedUrl(f.storage_path);
    const r = await fetch(url);
    const blob = await r.blob();
    return new File([blob], f.file_name, { type: f.mime_type || blob.type });
  };

  const doConvert = async (f: HospitalFile, target: ImageFormat) => {
    setWorking(f.id);
    try {
      const file = await fetchAsFile(f);
      const out = await convertImage(file, target);
      downloadFile(out);
      toast.success("Convertido");
    } catch (e: any) {
      toast.error(e.message || "Falha na conversão");
    } finally { setWorking(null); }
  };

  const doPdfToImages = async (f: HospitalFile) => {
    setWorking(f.id);
    try {
      const file = await fetchAsFile(f);
      const imgs = await pdfToImages(file);
      const pdf = await imagesToPdf(imgs, f.file_name.replace(/\.pdf$/i, "_paginas.pdf"));
      // give the user every page as a ZIP-ish: just download each
      imgs.forEach(i => downloadFile(i));
      toast.success(`${imgs.length} página(s) extraídas`);
    } catch (e: any) {
      toast.error(e.message || "Falha");
    } finally { setWorking(null); }
  };

  const doReducePdf = async (f: HospitalFile) => {
    setWorking(f.id);
    try {
      const file = await fetchAsFile(f);
      const out = await reducePdf(file);
      downloadFile(out);
      toast.success("PDF otimizado");
    } catch (e: any) {
      toast.error(e.message || "Falha");
    } finally { setWorking(null); }
  };

  const doMergeSelectedToPdf = async () => {
    if (pending.length < 1) return;
    setWorking("merge");
    try {
      const out = await imagesToPdf(pending.filter(f => f.type.startsWith("image/")));
      downloadFile(out);
    } catch (e: any) {
      toast.error(e.message || "Falha");
    } finally { setWorking(null); }
  };

  const openCompress = async (f: HospitalFile) => {
    const file = await fetchAsFile(f);
    setCompressTarget(file);
  };

  const runCompress = async () => {
    if (!compressTarget) return;
    setWorking("cmp");
    try {
      const out = await compressImage(compressTarget, {
        quality, maxWidthOrHeight: maxDim, maxSizeMB: 5,
      });
      downloadFile(out, `compactada_${out.name}`);
      toast.success(`De ${formatBytes(compressTarget.size)} para ${formatBytes(out.size)}`);
      setCompressTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Falha");
    } finally { setWorking(null); }
  };

  return (
    <div
      className="container mx-auto px-4 py-6 max-w-7xl"
      onPaste={onPaste}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Helmet>
        <title>Repositório de Arquivos | HAPMAP</title>
        <meta name="description" content="Repositório compartilhado de arquivos do hospital com upload, conversão e compressão." />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">REPOSITÓRIO DE ARQUIVOS</h1>
        <p className="text-sm text-muted-foreground">
          Compartilhado entre todos os usuários da sua unidade. Limite 25 MB por arquivo.
        </p>
      </header>

      {/* Drop zone */}
      <Card
        className={cn(
          "border-dashed border-2 transition-colors mb-6",
          dragging ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Arraste arquivos aqui, cole da área de transferência ou</p>
            <p className="text-xs text-muted-foreground">imagens, PDFs, documentos — até 25 MB</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => inputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />Selecionar
            </Button>
            <Button variant="outline" onClick={() => cameraRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />Foto
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept={ACCEPT}
            onChange={e => e.target.files && addPending(e.target.files)}
          />
          <input
            ref={cameraRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={e => e.target.files && addPending(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{filtered.length} arquivo(s)</Badge>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum arquivo. Envie o primeiro arrastando ou clicando em Selecionar.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(f => {
            const Icon = iconFor(f.mime_type);
            const isImg = f.mime_type?.startsWith("image/");
            const isPdf = f.mime_type?.includes("pdf");
            return (
              <Card key={f.id} className="group overflow-hidden hover:shadow-md transition">
                <button
                  onClick={() => openPreview(f)}
                  className="block w-full aspect-square bg-muted/30 flex items-center justify-center relative"
                >
                  {isImg ? (
                    <ThumbImg path={f.storage_path} getUrl={getSignedUrl} />
                  ) : (
                    <Icon className="h-12 w-12 text-muted-foreground" />
                  )}
                  {working === f.id && (
                    <div className="absolute inset-0 bg-background/70 grid place-items-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </button>
                <CardContent className="p-2 space-y-1">
                  <p className="text-xs font-medium truncate" title={f.file_name}>{f.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(f.size_bytes)}</p>
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.tags.slice(0, 2).map(t => (
                        <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => downloadOriginal(f)}>
                          <Download className="h-4 w-4 mr-2" />Baixar original
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isImg && <>
                          <DropdownMenuLabel className="text-xs">Converter imagem</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => doConvert(f, "image/png")}>→ PNG</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doConvert(f, "image/jpeg")}>→ JPG</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doConvert(f, "image/webp")}>→ WEBP</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCompress(f)}>Reduzir tamanho…</DropdownMenuItem>
                        </>}
                        {isPdf && <>
                          <DropdownMenuLabel className="text-xs">PDF</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => doReducePdf(f)}>Reduzir PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doPdfToImages(f)}>Extrair páginas (PNG)</DropdownMenuItem>
                        </>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Remover ${f.file_name}?`)) remove(f); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar envio</DialogTitle>
            <DialogDescription>
              {pending.length} arquivo(s) prontos. Adicione descrição e tags (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-40 overflow-auto space-y-1">
              {pending.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                  <span className="truncate">{f.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                    <button onClick={() => setPending(p => p.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="exame, raio-x, urgência" />
              </div>
            </div>
            {pending.filter(f => f.type.startsWith("image/")).length > 1 && (
              <Button variant="outline" size="sm" onClick={doMergeSelectedToPdf} disabled={working === "merge"}>
                {working === "merge" && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                Mesclar imagens em PDF (download)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUploadDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={isUploading || pending.length === 0}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={o => !o && (setPreviewUrl(null), setPreviewFile(null))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.file_name}</DialogTitle>
            {previewFile?.description && (
              <DialogDescription>{previewFile.description}</DialogDescription>
            )}
          </DialogHeader>
          {previewUrl && previewFile && (
            previewFile.mime_type?.startsWith("image/") ? (
              <img src={previewUrl} alt={previewFile.file_name} className="max-w-full h-auto mx-auto" />
            ) : previewFile.mime_type?.includes("pdf") ? (
              <iframe src={previewUrl} className="w-full h-[70vh]" title={previewFile.file_name} />
            ) : (
              <div className="text-center py-8">
                <Button onClick={() => downloadOriginal(previewFile)}>
                  <Download className="h-4 w-4 mr-2" />Baixar para visualizar
                </Button>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Compression dialog */}
      <Dialog open={!!compressTarget} onOpenChange={o => !o && setCompressTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reduzir imagem</DialogTitle>
            <DialogDescription>
              Original: {compressTarget ? formatBytes(compressTarget.size) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Qualidade: {Math.round(quality * 100)}%</Label>
              <Slider value={[quality * 100]} onValueChange={v => setQuality(v[0] / 100)} min={20} max={100} step={5} />
            </div>
            <div>
              <Label>Dimensão máxima: {maxDim}px</Label>
              <Slider value={[maxDim]} onValueChange={v => setMaxDim(v[0])} min={400} max={4000} step={100} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompressTarget(null)}>Cancelar</Button>
            <Button onClick={runCompress} disabled={working === "cmp"}>
              {working === "cmp" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reduzir e baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThumbImg({ path, getUrl }: { path: string; getUrl: (p: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);
  useMemo(() => { getUrl(path).then(setUrl).catch(() => {}); }, [path]);
  if (!url) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  return <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />;
}
