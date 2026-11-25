"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUp,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { FormattedText } from "@/components/chat/formatted-text";
import { VerdictReport } from "@/components/chat/verdict-report";
import type { ChatConversation, ChatMessage } from "@/components/chat/types";

const STARTERS = [
  {
    label: "Coffee cures cancer?",
    prompt:
      "Is it true that drinking 3 cups of coffee daily completely cures cancer and replaces chemotherapy?",
  },
  {
    label: "Alien megastructure on Saturn?",
    prompt:
      "Did NASA's Cassini probe discover a secret alien megastructure inside Saturn's B-ring?",
  },
  {
    label: "Free laptops on WhatsApp?",
    prompt:
      "A WhatsApp message says the government is distributing free laptops to all college students via a portal link. Is this real?",
  },
  {
    label: "How to spot a deepfake",
    prompt:
      "What visual cues and forensic signs should I look for to identify AI-generated video deepfakes?",
  },
];

type Toast = { message: string; type: "success" | "error" | "info" };

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ data: string; name: string } | null>(null);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [copiedDebunkId, setCopiedDebunkId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === currentId) ?? null;

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isLoading]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        const data = await res.json();
        if (!active) return;
        if (data.success && Array.isArray(data.data)) {
          setConversations(data.data);
          // Always open a fresh chat; previous conversations stay in the sidebar.
          setCurrentId(null);
        }
      } catch {
        if (active) showToast("Couldn't load history", "error");
      }
    };

    void load();
    return () => {
      active = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [showToast]);

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New check" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConversations((previous) => [data.data, ...previous]);
        setCurrentId(data.data.id);
        setImagePreview(null);
        setInputMessage("");
        setSidebarOpen(false);
        textareaRef.current?.focus();
      }
    } catch {
      showToast("Couldn't start a new check", "error");
    }
  };

  const deleteChat = async (id: string) => {
    try {
      await fetch(`/api/chat/conversations?id=${id}`, { method: "DELETE" });
      const remaining = conversations.filter((conversation) => conversation.id !== id);
      setConversations(remaining);
      if (currentId === id) {
        setCurrentId(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast("Deleted");
    } catch {
      showToast("Couldn't delete chat", "error");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if ((!text && !imagePreview) || isLoading) return;

    let conversationId = currentId;
    if (!conversationId) {
      const newConversation: ChatConversation = {
        id: createId("conv"),
        title: text.slice(0, 40) || "Image check",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConversations((previous) => [newConversation, ...previous]);
      setCurrentId(newConversation.id);
      conversationId = newConversation.id;
    }

    const userMessage: ChatMessage = {
      id: createId("temp-user"),
      role: "user",
      content: text || (imagePreview ? "Check this image" : ""),
      createdAt: new Date().toISOString(),
      ...(imagePreview
        ? {
            attachment: {
              type: "image" as const,
              data: imagePreview.data,
              name: imagePreview.name,
            },
          }
        : {}),
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title:
                conversation.messages.length === 0
                  ? text.slice(0, 45) || "Image check"
                  : conversation.title,
              messages: [...conversation.messages, userMessage],
            }
          : conversation
      )
    );

    const attachmentPayload = imagePreview
      ? {
          type: "image" as const,
          data: imagePreview.data,
          name: imagePreview.name,
        }
      : undefined;

    setInputMessage("");
    setImagePreview(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          attachment: attachmentPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Request failed");
      }

      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const confirmed = conversation.messages.filter(
            (message) => message.id !== userMessage.id
          );
          return {
            ...conversation,
            title:
              conversation.title === "New check"
                ? text.slice(0, 45) || "Image check"
                : conversation.title,
            messages: [...confirmed, data.userMessage, data.assistantMessage],
          };
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      showToast(message, "error");
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: createId("err"),
                    role: "assistant",
                    content: "Couldn't complete that check. Try again.",
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : conversation
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Use an image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large (5MB max)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setImagePreview({
        data: loadEvent.target?.result as string,
        name: file.name,
      });
      showToast("Image attached", "success");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const copyMessageContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    showToast("Copied", "success");
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  const copyDebunkScript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDebunkId(id);
    showToast("Copied", "success");
    setTimeout(() => setCopiedDebunkId(null), 1800);
  };

  const isEmpty = !activeConversation || activeConversation.messages.length === 0;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#070b14] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <div aria-hidden="true" className="app-grid pointer-events-none fixed inset-0 z-0 opacity-[0.14]" />
      <div aria-hidden="true" className="pointer-events-none fixed left-1/3 top-0 z-0 h-[350px] w-[600px] rounded-full bg-blue-600/8 blur-[140px]" />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className={cn(
              "fixed bottom-6 right-6 z-50 flex max-w-[calc(100%-2rem)] items-center gap-2.5 rounded-xl border bg-[#0e172a] px-4 py-3 text-xs font-semibold text-slate-100 shadow-2xl backdrop-blur-xl",
              toast.type === "success"
                ? "border-emerald-500/50"
                : toast.type === "error"
                ? "border-rose-500/50"
                : "border-blue-500/50"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            {toast.type === "error" && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            {toast.type === "info" && (
              <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
            )}
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatSidebar
        conversations={conversations}
        currentId={currentId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={createNewChat}
        onSelect={(id) => {
          setCurrentId(id);
          setSidebarOpen(false);
        }}
        onDelete={deleteChat}
      />

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800/80 bg-[#070b14]/90 px-3 backdrop-blur-xl sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-white">
            {activeConversation?.title ?? "New check"}
          </h1>

          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={createNewChat}
            aria-label="New check"
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-12 text-center sm:py-16">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Truth, at a glance.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Paste a claim, a link, or drop a screenshot. Get a clear verdict.
              </p>

              <div className="mt-9 w-full space-y-2 text-left">
                <p className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Try one
                </p>
                {STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => handleSendMessage(starter.prompt)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3.5 text-left text-sm font-medium text-slate-200 shadow-lg transition-all hover:border-blue-500/40 hover:bg-slate-800/60 hover:text-white hover:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="truncate">{starter.label}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-2xl space-y-6 px-3 py-6 sm:px-4">
              {activeConversation.messages.map((message) => {
                const isUser = message.role === "user";
                const analysis = message.analysisData;

                return (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                    )}

                    <div
                      className={cn(
                        "flex min-w-0 max-w-[88%] flex-col gap-2 sm:max-w-[80%]",
                        isUser && "items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "min-w-0 rounded-xl px-4 py-3 text-sm leading-6",
                          isUser
                            ? "rounded-br-sm bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                            : "rounded-bl-sm border border-slate-800 bg-slate-900/70 text-slate-200 shadow-lg"
                        )}
                      >
                        {message.attachment?.type === "image" && (
                          <img
                            src={message.attachment.data}
                            alt="Attached claim"
                            className="mb-3 max-h-48 rounded-lg border border-slate-700/60 object-cover"
                          />
                        )}
                        {message.attachment?.type === "url" && (
                          <span className="mb-3 flex items-center gap-1.5 text-xs text-blue-300">
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{message.attachment.data}</span>
                          </span>
                        )}
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        ) : (
                          <FormattedText text={message.content} />
                        )}
                      </div>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => copyMessageContent(message.content, message.id)}
                          aria-label="Copy response"
                          className="flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {copiedMsgId === message.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedMsgId === message.id ? "Copied" : "Copy"}
                        </button>
                      )}

                      {analysis && (
                        <VerdictReport
                          analysis={analysis}
                          isOpen={!!expandedReports[message.id]}
                          onToggle={() =>
                            setExpandedReports((previous) => ({
                              ...previous,
                              [message.id]: !previous[message.id],
                            }))
                          }
                          copied={copiedDebunkId === message.id}
                          onCopyDebunk={(text) => copyDebunkScript(text, message.id)}
                        />
                      )}

                      {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {message.suggestedFollowUps.map((followUp, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSendMessage(followUp)}
                              disabled={isLoading}
                              className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-800 text-slate-400">
                        <User className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 pl-10 font-mono text-[11px] text-slate-400"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  Checking…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-800/80 bg-[#070b14]/90 px-3 pb-3 pt-3 backdrop-blur-xl sm:px-4 sm:pb-4">
          <div className="mx-auto max-w-2xl">
            {imagePreview && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <img
                    src={imagePreview.data}
                    alt="Image preview"
                    className="h-9 w-9 rounded object-cover"
                  />
                  <span className="truncate text-xs text-slate-300">{imagePreview.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  aria-label="Remove attachment"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-1 rounded-xl border border-slate-800 bg-[#090e1c] p-1.5 shadow-xl transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Attach an image"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                aria-label="Message"
                placeholder="Paste a claim or ask anything…"
                className="auto-grow min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={(!inputMessage.trim() && !imagePreview) || isLoading}
                aria-label="Send message"
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  (!inputMessage.trim() && !imagePreview) || isLoading
                    ? "cursor-not-allowed bg-slate-800 text-slate-500"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-900/30 hover:from-blue-500 hover:to-cyan-500"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </form>

            <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
              AI can be wrong. Verify what matters.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
