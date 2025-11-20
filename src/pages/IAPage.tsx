import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, Copy, Check, FileText, X } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para o final quando houver mudanças nas mensagens
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      // Força scroll para o final imediatamente
      const scrollToEnd = () => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      };
      
      scrollToEnd();
      // Segundo scroll após pequeno delay para garantir que o DOM atualizou
      setTimeout(scrollToEnd, 50);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success("Copiado!");
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      return fullText;
    } catch (error) {
      console.error("Erro ao extrair PDF:", error);
      throw new Error("Falha ao processar PDF");
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      toast.error("Apenas PDFs e imagens são aceitos");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB");
      return;
    }

    setSelectedFile(file);

    // Preview para imagens
    if (file.type.includes("image")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const streamChat = async (userMessage: string, file?: File) => {
    setIsLoading(true);
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage || "Extraia e formate este exame:" }];
    setMessages(newMessages);
    
    let fileContent = null;

    // Processar arquivo se houver
    if (file) {
      try {
        if (file.type.includes("pdf")) {
          // Extrair texto do PDF
          const pdfText = await extractTextFromPDF(file);
          userMessage = pdfText;
        } else if (file.type.includes("image")) {
          // Converter imagem para base64
          const reader = new FileReader();
          fileContent = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        toast.error("Erro ao processar arquivo");
        setMessages(messages);
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/examinus-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: fileContent ? newMessages : newMessages,
            fileContent 
          }),
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente mais tarde.");
        setMessages(messages);
        return;
      }

      if (response.status === 402) {
        toast.error("Créditos de IA esgotados. Adicione créditos nas configurações.");
        setMessages(messages);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Falha ao iniciar stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantContent }
              ]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Erro no chat:", error);
      toast.error("Erro ao processar mensagem. Tente novamente.");
      setMessages(messages);
    } finally {
      setIsLoading(false);
      removeFile();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    streamChat(userMessage, selectedFile || undefined);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Examinus</h1>
                <p className="text-sm text-muted-foreground">Formatador Inteligente de Exames Médicos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="container mx-auto max-w-4xl py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 mb-6 shadow-sm">
                  <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-foreground">Olá! Sou o Examinus</h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Cole ou digite laudos de exames para formatação automática
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      🧪 Exames Laboratoriais
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Hemograma, bioquímica, coagulograma formatados em linha única
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      🖼 Exames de Imagem
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      TC, RX, US com apenas achados anormais extraídos
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-5 py-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card border border-border shadow-sm"
                  }`}
                >
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                    {message.content}
                  </pre>
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(message.content, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Formatando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card/50 backdrop-blur-sm shadow-lg">
          <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl px-4 py-4">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <FileText className="h-12 w-12 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedFile ? "Mensagem opcional..." : "Cole o laudo do exame ou anexe PDF/imagem..."}
                  className="min-h-[80px] max-h-[300px] resize-none text-base font-mono shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-[38px] w-[38px]"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Anexar PDF ou imagem"
                >
                  <FileText className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-[38px] w-[38px]"
                  disabled={(!input.trim() && !selectedFile) || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Shift + Enter para nova linha • Enter para enviar • PDF máximo 20MB
            </p>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

