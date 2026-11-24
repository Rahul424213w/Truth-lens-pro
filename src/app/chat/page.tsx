"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Info,
  MessageSquare,
  LayoutDashboard,
  Loader2,
  FileText,
  Search,
  Globe,
  Radio,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractedClaim {
  claim: string;
  verdict: string;
  note: string;
}

interface AnalysisData {
  credibilityScore: number;
  category: "real" | "fake" | "misleading" | "clickbait" | "satire" | "unclear" | string;
  verdict: string;
  analysis: string;
  consensusFact?: string;
  realityCheck?: {
    claimedAssertion: string;
    factualReality: string;
  };
  extractedClaims?: ExtractedClaim[];
  riskAssessment?: {
    riskLevel?: string;
    harmCategory?: string;
    whyItSpreads?: string;
  };
  originAndSpread?: {
    originContext?: string;
    spreadPattern?: string;
  };
  authoritativeSources?: string[];
  redFlags?: string[];
  positiveSignals?: string[];
  debunkCopyScript?: string;
  verificationSteps?: string[];
  factCheckQueries?: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  attachment?: {
    type: "image" | "url";
    data: string;
    name?: string;
  };
  analysisData?: AnalysisData;
  intent?: "NEW_FACT_CHECK" | "FOLLOW_UP" | "GENERAL_QUERY";
  engine?: string;
  suggestedFollowUps?: string[];
}

interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const CATEGORY_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  real: {
    label: "Credible & Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  fake: {
    label: "False & Fabricated",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  misleading: {
    label: "Misleading Context",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  clickbait: {
    label: "Sensational Clickbait",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: AlertTriangle,
  },
  satire: {
    label: "Satire & Parody",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: Sparkles,
  },
  unclear: {
    label: "Unverified Claim",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    icon: Info,
  },
};

const STARTER_PROMPTS = [
  {
    title: "Check Miracle Health Cure",
    prompt: "Is it true that drinking 3 cups of coffee daily completely cures cancer and replaces chemotherapy?",
    category: "Health Misinformation",
  },
  {
    title: "Verify Space Anomaly",
    prompt: "Did NASA Cassini probe discover a secret alien megastructure hidden inside Saturn's B-ring?",
    category: "Conspiracy Check",
  },
  {
    title: "Government Free Scheme",
    prompt: "A WhatsApp message says the government is distributing free laptops to all college students via a portal link. Is this real?",
    category: "Phishing / Scam",
  },
  {
    title: "How to Spot Deepfakes",
    prompt: "What visual cues and forensic signs should I look for to identify AI-generated video deepfakes?",
    category: "Media Literacy",
  },
];

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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const activeConversation = conversations.find((c) => c.id === currentId) || null;

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isLoading]);

  // Fetch conversations on load
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        if (data.data.length > 0 && !currentId) {
          setCurrentId(data.data[0].id);
        }
      }
    } catch {
      showToast("Failed to load chat history", "error");
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const createNewChat = async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Fact-Check Session" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConversations((prev) => [data.data, ...prev]);
        setCurrentId(data.data.id);
        setImagePreview(null);
        setInputMessage("");
        setSidebarOpen(false);
        if (textareaRef.current) textareaRef.current.focus();
      }
    } catch {
      showToast("Could not create new session", "error");
    }
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/conversations?id=${id}`, { method: "DELETE" });
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (currentId === id) {
        setCurrentId(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast("Conversation deleted", "info");
    } catch {
      showToast("Failed to delete chat", "error");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if ((!text && !imagePreview) || isLoading) return;

    let convId = currentId;
    // If no active conversation, create one first
    if (!convId) {
      const newConv: ChatConversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: text.slice(0, 40) + "...",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentId(newConv.id);
      convId = newConv.id;
    }

    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text || (imagePreview ? "Analyze this uploaded image" : ""),
      createdAt: new Date().toISOString(),
      ...(imagePreview ? { attachment: { type: "image", data: imagePreview.data, name: imagePreview.name } } : {}),
    };

    // Optimistically update conversation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.messages.length === 0 ? text.slice(0, 45) : c.title,
              messages: [...c.messages, userMessage],
            }
          : c
      )
    );

    const attachmentPayload = imagePreview
      ? { type: "image" as const, data: imagePreview.data, name: imagePreview.name }
      : undefined;

    setInputMessage("");
    setImagePreview(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          message: text,
          attachment: attachmentPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Server processing failed");
      }

      // Replace with confirmed messages from backend
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            // Replace optimistic user message with confirmed and append assistant message
            const filtered = c.messages.filter((m) => m.id !== userMessage.id);
            return {
              ...c,
              title: c.title === "New Fact-Check Session" ? text.slice(0, 45) : c.title,
              messages: [...filtered, data.userMessage, data.assistantMessage],
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      showToast(err.message || "Failed to get AI response", "error");
      // Add error notification assistant message
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Truth Lens encountered an error: ${err.message || "Network issue"}. Please try again or rephrase your claim.`,
        createdAt: new Date().toISOString(),
        engine: "Truth Lens Recovery Handler",
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, errorMsg] } : c))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, WebP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview({
        data: event.target?.result as string,
        name: file.name,
      });
      showToast(`Attached: ${file.name}`, "success");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleReport = (msgId: string) => {
    setExpandedReports((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const copyDebunkScript = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDebunkId(msgId);
    showToast("Debunk script copied to clipboard!", "success");
    setTimeout(() => setCopiedDebunkId(null), 2500);
  };

  const copyMessageContent = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    showToast("Message copied!", "success");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-[#070b14] text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2",
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                : "bg-slate-900/90 border-slate-700 text-slate-200"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (Desktop + Mobile Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-[#090e1a] border-r border-slate-800/80 flex flex-col transition-transform duration-300 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/40">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                Truth Lens
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block -mt-0.5">AI Fact-Checking</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2 border-b border-slate-800/60">
          <button
            onClick={createNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Fact-Check</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Analytics Dashboard</span>
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* History / Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <MessageSquare className="w-6 h-6 mx-auto text-slate-400 opacity-60" />
              <p>No previous conversations.</p>
              <p className="text-[11px] text-slate-400">Click New Fact-Check to begin.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setCurrentId(conv.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "group relative p-2.5 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between",
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700 font-semibold"
                      : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-6">
                    <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-cyan-400" : "text-slate-400")} />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => deleteChat(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-400 transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Meta */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Groq Intelligence</span>
            </span>
            <span className="text-slate-400">gpt-oss-120b</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Empirical consensus & forensic AI
          </div>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b14]">
        {/* Chat Top Bar */}
        <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-[#080d1a]/80 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeConversation?.title || "Truth Lens Chat"}</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-semibold">
                  <Sparkles className="w-3 h-3" /> Conversational AI
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <button
              onClick={createNewChat}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="max-w-2xl mx-auto pt-6 pb-12 space-y-8">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-900/30">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Truth Lens Conversational AI
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Verify viral claims, analyze suspicious news links, inspect images, and get ready-to-share polite debunk scripts for family chats.
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block px-1">
                  Try asking or testing:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between space-y-2 shadow-sm"
                    >
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-semibold self-start">
                        {item.category}
                      </span>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-relaxed">
                        "{item.prompt}"
                      </p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-cyan-400 pt-1">
                        <span>Investigate claim</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-300">Multi-turn Memory:</strong> Truth Lens remembers previous verdicts in this session. You can ask follow-ups like <em>"Why did you give this score?"</em>, <em>"Who started this rumor?"</em>, or <em>"Can you write a shorter debunk for WhatsApp?"</em>.
                </p>
              </div>
            </div>
          ) : (
            /* Render Message History */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeConversation.messages.map((msg) => {
                const isUser = msg.role === "user";
                const isReportOpen = !!expandedReports[msg.id];
                const analysis = msg.analysisData;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 sm:gap-4",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-cyan-900/40 mt-1">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "space-y-3 max-w-[88%] sm:max-w-[80%]",
                        isUser ? "items-end" : "items-start"
                      )}
                    >
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "p-4 rounded-2xl text-xs sm:text-sm leading-relaxed",
                          isUser
                            ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-none shadow-md shadow-blue-900/20"
                            : "bg-[#0c1222] border border-slate-800 text-slate-200 rounded-bl-none shadow-sm"
                        )}
                      >
                        {/* If attachment */}
                        {msg.attachment && (
                          <div className="mb-3 p-2 rounded-lg bg-black/30 border border-white/10 space-y-1.5">
                            {msg.attachment.type === "image" ? (
                              <div>
                                <img
                                  src={msg.attachment.data}
                                  alt="Attachment"
                                  className="max-h-48 rounded object-cover border border-white/10"
                                />
                                <span className="text-[10px] text-slate-300 font-mono block mt-1">
                                  Attachment: {msg.attachment.name || "Image file"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-cyan-300">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="truncate">{msg.attachment.data}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Content */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Engine Badge and Copy Tool for Assistant */}
                        {!isUser && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Cpu className="w-3 h-3 text-cyan-400" />
                              <span>{msg.engine || "Truth Lens Engine"}</span>
                            </span>
                            <button
                              onClick={() => copyMessageContent(msg.content, msg.id)}
                              className="hover:text-white flex items-center gap-1"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedMsgId === msg.id ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expandable Forensic Report Card if analysisData exists */}
                      {analysis && (
                        <div className="w-full rounded-2xl bg-[#080d1c] border border-slate-800 overflow-hidden shadow-lg">
                          {/* Card Header Preview Button */}
                          <button
                            onClick={() => toggleReport(msg.id)}
                            className="w-full p-3.5 text-left flex items-center justify-between hover:bg-slate-850/60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const cat = CATEGORY_MAP[analysis.category] || CATEGORY_MAP.unclear;
                                const Icon = cat.icon;
                                return (
                                  <div
                                    className={cn(
                                      "px-2.5 py-1 rounded-lg border text-[11px] font-bold font-mono uppercase flex items-center gap-1.5",
                                      cat.bg,
                                      cat.color,
                                      cat.border
                                    )}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{cat.label}</span>
                                  </div>
                                );
                              })()}

                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{analysis.verdict}</span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Score: {analysis.credibilityScore}/100
                                  </span>
                                </div>
                                <span className="text-[11px] text-cyan-400 block">
                                  {isReportOpen ? "Click to collapse report" : "Click to view full forensic dossier"}
                                </span>
                              </div>
                            </div>

                            <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                              {isReportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {/* Expanded Full Structured Forensic Report */}
                          <AnimatePresence>
                            {isReportOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-800 p-4 space-y-4 text-xs bg-[#090f20]"
                              >
                                {/* Consensus Fact */}
                                {analysis.consensusFact && (
                                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1">
                                    <div className="text-[10px] font-bold text-blue-400 uppercase font-mono flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Verified Institutional Consensus</span>
                                    </div>
                                    <p className="text-xs text-slate-200 leading-relaxed">{analysis.consensusFact}</p>
                                  </div>
                                )}

                                {/* Side-by-side Reality Check */}
                                {analysis.realityCheck && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                                      <span className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Claimed Narrative
                                      </span>
                                      <p className="text-xs text-rose-200/90 font-medium">
                                        "{analysis.realityCheck.claimedAssertion}"
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Factual Reality
                                      </span>
                                      <p className="text-xs text-emerald-200/90 font-medium">
                                        {analysis.realityCheck.factualReality}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Threat Intelligence */}
                                {(analysis.riskAssessment || analysis.originAndSpread) && (
                                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Threat & Spread Vectors
                                      </span>
                                      {analysis.riskAssessment?.riskLevel && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                                          {analysis.riskAssessment.riskLevel}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                      {analysis.riskAssessment?.harmCategory && (
                                        <div>
                                          <span className="text-slate-400 font-mono">Domain: </span>
                                          <span className="text-slate-200">{analysis.riskAssessment.harmCategory}</span>
                                        </div>
                                      )}
                                      {analysis.riskAssessment?.whyItSpreads && (
                                        <div>
                                          <span className="text-slate-400 font-mono">Psychological Hook: </span>
                                          <span className="text-slate-200">{analysis.riskAssessment.whyItSpreads}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Extracted Claims Breakdown */}
                                {analysis.extractedClaims && analysis.extractedClaims.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-cyan-400" /> Extracted Atomic Claims
                                    </span>
                                    <div className="space-y-1.5">
                                      {analysis.extractedClaims.map((claimObj, idx) => (
                                        <div
                                          key={idx}
                                          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                                        >
                                          <div className="space-y-0.5">
                                            <p className="font-semibold text-white">"{claimObj.claim}"</p>
                                            <p className="text-[11px] text-slate-400">{claimObj.note}</p>
                                          </div>
                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold flex-shrink-0">
                                            {claimObj.verdict}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 1-Click Debunk Script */}
                                {analysis.debunkCopyScript && (
                                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-purple-300 uppercase font-bold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-purple-400" /> 1-Click WhatsApp / Social Debunk
                                      </span>
                                      <button
                                        onClick={() => copyDebunkScript(analysis.debunkCopyScript!, msg.id)}
                                        className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-[11px] font-semibold text-purple-200 border border-purple-500/40 flex items-center gap-1"
                                      >
                                        {copiedDebunkId === msg.id ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                        <span>{copiedDebunkId === msg.id ? "Copied!" : "Copy Script"}</span>
                                      </button>
                                    </div>
                                    <div className="p-2 rounded bg-black/40 text-slate-200 font-mono text-[11px] leading-relaxed">
                                      "{analysis.debunkCopyScript}"
                                    </div>
                                  </div>
                                )}

                                {/* Authoritative Sources */}
                                {analysis.authoritativeSources && analysis.authoritativeSources.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Accredited Authorities Cited
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {analysis.authoritativeSources.map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px]"
                                        >
                                          • {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Suggested Follow-up Chips */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestedFollowUps.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(chip)}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors text-left"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading State Bubble */}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-cyan-900/40">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-bl-none bg-[#0c1222] border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Cross-referencing claim across forensic intelligence models...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM INPUT BAR */}
        <div className="border-t border-slate-800/80 p-3 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md flex-shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Image Preview Chip if attached */}
            {imagePreview && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={imagePreview.data}
                    alt="Preview"
                    className="w-10 h-10 rounded object-cover border border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-white block truncate max-w-xs">
                      {imagePreview.name}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">Image attached for forensic check</span>
                  </div>
                </div>
                <button
                  onClick={() => setImagePreview(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Form Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2 bg-[#0d1428] border border-slate-700/80 rounded-2xl p-2 focus-within:border-cyan-500/80 transition-colors shadow-xl"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Attach Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors flex-shrink-0"
                title="Attach claim image or screenshot"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Paste any headline, claim, rumor, or question..."
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none py-2 px-1 max-h-32 min-h-[38px]"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputMessage.trim() && !imagePreview) || isLoading}
                className={cn(
                  "p-2.5 rounded-xl text-white transition-all flex-shrink-0 flex items-center justify-center",
                  (!inputMessage.trim() && !imagePreview) || isLoading
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-900/30 active:scale-95"
                )}
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Disclaimer */}
            <p className="text-[10px] text-center text-slate-400 font-mono">
              Truth Lens verifies claims using Groq LLM intelligence & consensus registries. Always consult accredited healthcare and legal professionals for critical decisions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
