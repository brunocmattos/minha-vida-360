import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Plus, Send, X, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { luisaConfirm, luisaSend } from "@/lib/luisa.functions";
import { actionSummary, type LuisaAction } from "@/lib/luisa";
import { LuisaAvatar } from "@/components/luisa-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Convo = { id: string; title: string; updated_at: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action: LuisaAction | null;
  created_at: string;
};

export function LuisaChat() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const send = useServerFn(luisaSend);
  const confirm = useServerFn(luisaConfirm);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [micSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
  );
  const [listening, setListening] = useState(false);

  const loadConvos = useCallback(async () => {
    const { data } = await supabase
      .from("luisa_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    setConvos(data ?? []);
    return data ?? [];
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("luisa_messages")
      .select("id, role, content, action, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
  }, []);

  const openConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      setShowHistory(false);
      await loadMessages(id);
    },
    [loadMessages],
  );

  const newConversation = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("luisa_conversations")
      .insert({ title: "Nova conversa" })
      .select("id")
      .single();
    if (err || !data) {
      setError("Não consegui criar a conversa.");
      return null;
    }
    await loadConvos();
    setActiveId(data.id);
    setMessages([]);
    setShowHistory(false);
    return data.id as string;
  }, [loadConvos]);

  // Abrir via evento global (ex.: botão na Casa)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("luisa:open", onOpen);
    return () => window.removeEventListener("luisa:open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const list = await loadConvos();
      if (!activeId && list.length > 0) await openConversation(list[0]!.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (open && !sending) inputRef.current?.focus();
  }, [open, sending, activeId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    try {
      let id = activeId;
      if (!id) id = await newConversation();
      if (!id) return;
      const saved = (await send({ data: { conversationId: id, message: text } })) as Msg;
      await loadMessages(id);
      void loadConvos();
      // Título da conversa = primeira mensagem
      if (messages.length === 0) {
        await supabase
          .from("luisa_conversations")
          .update({ title: text.slice(0, 60) })
          .eq("id", id);
        void loadConvos();
      }
      void saved;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "A Luísa não conseguiu responder agora. Tente de novo.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(msg: Msg, approved: boolean) {
    if (!msg.action || busyAction) return;
    setBusyAction(msg.id);
    setError(null);
    try {
      await confirm({ data: { messageId: msg.id, approved } });
      if (activeId) await loadMessages(activeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não consegui concluir a ação.");
    } finally {
      setBusyAction(null);
    }
  }

  function toggleMic() {
    if (!micSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.onresult = (ev: any) => {
      const t = ev.results?.[0]?.[0]?.transcript;
      if (t) setInput((prev) => (prev ? `${prev} ${t}` : t));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Falar com a Luísa"
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-2 z-50 flex h-11 items-center gap-2 rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground shadow-lift transition hover:scale-105 sm:right-5 sm:h-auto sm:px-4 sm:py-2.5",
          open && "hidden",
        )}
      >
        <LuisaAvatar size={28} />
        <span className="hidden sm:inline">Luísa</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat com a Luísa"
          className="fixed inset-x-3 bottom-3 top-16 z-50 flex flex-col overflow-hidden rounded-3xl border bg-card shadow-lift sm:inset-x-auto sm:right-5 sm:top-auto sm:h-[560px] sm:w-[380px]"
        >
          <div className="flex items-center gap-3 border-b bg-secondary/60 px-4 py-3">
            <LuisaAvatar size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Luísa</p>
              <p className="text-xs text-muted-foreground">Sua assistente pessoal</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Histórico de conversas"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Nova conversa"
              onClick={() => void newConversation()}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3">
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Conversas
              </p>
              {convos.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
              )}
              <ul className="space-y-1">
                {convos.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void openConversation(c.id)}
                      className={cn(
                        "w-full truncate rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary",
                        c.id === activeId && "bg-secondary font-semibold",
                      )}
                    >
                      {c.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <LuisaAvatar size={56} className="mx-auto mb-3" />
                  <p className="font-semibold text-foreground">Oi! Eu sou a Luísa.</p>
                  <p className="mt-1">
                    Posso registrar uma despesa (“gastei R$120 no mercado”) ou anotar no seu diário.
                    Eu sempre mostro um resumo para você confirmar antes de gravar.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/70",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                    {m.action && m.action.status === "pendente" && (
                      <div className="mt-2 rounded-xl border bg-card p-3 text-card-foreground">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Confirmar registro
                        </p>
                        <p className="mt-1 text-sm font-semibold">{actionSummary(m.action)}</p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={busyAction === m.id}
                            onClick={() => void handleConfirm(m, true)}
                            className="rounded-full"
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyAction === m.id}
                            onClick={() => void handleConfirm(m, false)}
                            className="rounded-full"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                    {m.action && m.action.status === "confirmada" && (
                      <p className="mt-1.5 text-xs font-semibold text-green-500">
                        ✓ Registrado: {actionSummary(m.action)}
                      </p>
                    )}
                    {m.action && m.action.status === "cancelada" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">Registro descartado.</p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LuisaAvatar size={24} /> digitando…
                </div>
              )}
              {error && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="border-t p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder="Escreva para a Luísa…"
                aria-label="Mensagem para a Luísa"
                className="min-w-0 w-full max-h-28 resize-none rounded-2xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex shrink-0 items-center gap-1">
                {micSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={listening ? "Parar gravação" : "Falar por microfone"}
                    onClick={toggleMic}
                    className={cn(
                      "rounded-full",
                      listening && "bg-destructive/15 text-destructive",
                    )}
                  >
                    <Mic className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  aria-label="Enviar mensagem"
                  disabled={sending || !input.trim()}
                  onClick={() => void handleSend()}
                  className="rounded-full"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function openLuisaChat() {
  window.dispatchEvent(new Event("luisa:open"));
}
