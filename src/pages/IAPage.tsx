import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/examinus-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    streamChat(userMessage);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Examinus</h1>
                <p className="text-sm text-muted-foreground">Assistente de IA Médica</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="container mx-auto max-w-4xl py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block p-6 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Olá! Sou o Examinus</h2>
                <p className="text-muted-foreground">
                  Como posso ajudar com questões médicas hoje?
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl px-4 py-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[60px] max-h-[200px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[60px] w-[60px]"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
