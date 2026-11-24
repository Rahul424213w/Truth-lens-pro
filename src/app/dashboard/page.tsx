"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  FileText,
  Globe,
  Hash,
  Shield,
  Sparkles,
  History as HistoryIcon,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Trash2,
  Plus,
  RefreshCw,
  Cpu,
  Zap,
  Info,
  Check,
  Menu,
  X,
  Sliders,
  Send,
  HelpCircle,
  Flame,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
interface ExtractedClaim {
  claim: string;
  verdict: string;
  note: string;
}

interface AnalysisData {
  _id?: string;
  type?: string;
  inputPreview?: string;
  credibilityScore: number;
  category: "real" | "fake" | "misleading" | "clickbait" | "satire" | "unclear" | "ai-generated" | string;
  verdict: string;
  analysis: string;
  consensusFact?: string;
  realityCheck?: {
    claimedAssertion: string;
    factualReality: string;
    scientificOrHistoricalTruth?: string;
  };
  extractedClaims?: ExtractedClaim[];
  riskAssessment?: {
    riskLevel?: string;
    harmCategory?: string;
    whyItSpreads?: string;
  };
  originAndSpread?: {
    originContext?: string;
    likelyOrigin?: string;
    spreadPattern?: string;
    intendedAudience?: string;
  };
  authoritativeSources?: string[];
  redFlags?: string[];
  positiveSignals?: string[];
  biasDiagnostics?: {
    sensationalism?: string;
    tone?: string;
    manipulationTechnique?: string;
  };
  debunkCopyScript?: string;
  verificationSteps?: string[];
  factCheckQueries?: string[];
  // For article analysis:
  sourceAssessment?: {
    domain?: string;
    domainType?: string;
    knownBias?: string;
    reliabilityRating?: string;
    notes?: string;
  };
  journalisticStandards?: {
    hasAuthor?: boolean;
    hasDate?: boolean;
    hasSources?: boolean;
    hasQuotes?: boolean;
    editorialStandards?: string;
  };
  specificClaims?: string[];
  claimAccuracy?: string[];
  relatedCredibleSources?: string[];
  // For fact check:
  expertConsensus?: string;
  originOfClaim?: string;
  keyFacts?: string[];
  relatedMisconceptions?: string[];
  specificSources?: string[];
  // For image check:
  technicalAnalysis?: Record<string, string>;
  manipulationSigns?: string[];
  authenticitySignals?: string[];
  createdAt?: string;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string; glow: string; icon: any }
> = {
  real: {
    label: "Credible & Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.25)",
    icon: CheckCircle2,
  },
  fake: {
    label: "False & Fabricated",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    glow: "rgba(244,63,94,0.25)",
    icon: XCircle,
  },
  misleading: {
    label: "Misleading Context",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "rgba(245,158,11,0.25)",
    icon: AlertTriangle,
  },
  clickbait: {
    label: "Sensational Clickbait",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "rgba(234,179,8,0.25)",
    icon: AlertTriangle,
  },
  satire: {
    label: "Satire & Parody",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "rgba(168,85,247,0.25)",
    icon: Sparkles,
  },
  unclear: {
    label: "Unverified Claim",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    glow: "rgba(148,163,184,0.25)",
    icon: Info,
  },
  "ai-generated": {
    label: "AI-Generated Media",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.25)",
    icon: Cpu,
  },
};

const SAMPLE_PRESETS = [
  {
    label: "Coffee Cures All Cancer",
    text: "Scientists at major hospital announce drinking 3 cups of coffee daily completely cures all stages of cancer, eliminating chemotherapy requirements.",
  },
  {
    label: "WHO Malaria Breakthrough",
    text: "World Health Organization approves new R21 malaria vaccine after clinical phase trials demonstrate 75% efficacy across endemic regions.",
  },
  {
    label: "5G Water Contamination",
    text: "Viral forwarded message claims high-frequency 5G microwave emissions chemically alter municipal tap water into magnetic toxins.",
  },
  {
    label: "NASA Saturn Coverup",
    text: "Former contractor claims NASA Cassini probe secretly documented an artificial alien megastructure concealed within Saturn's B-ring.",
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [debunkCopied, setDebunkCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Forms
  const [textInput, setTextInput] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [compareSources, setCompareSources] = useState<string[]>(["", ""]);
  const [factCheckClaim, setFactCheckClaim] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const [results, setResults] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyDebunkScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setDebunkCopied(true);
    showToast("Debunk script copied to clipboard!", "success");
    setTimeout(() => setDebunkCopied(false), 2500);
  };

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    setResults(null);
    setSidebarOpen(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const d = await res.json();
      if (d.success) setHistory(d.data);
    } catch { }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch("/api/analyze/trending");
      const d = await res.json();
      if (d.success) setTrending(d.data);
    } catch { }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const d = await res.json();
      if (d.success) setStats(d.data);
    } catch { }
  };

  useEffect(() => {
    fetchHistory();
    fetchTrending();
    fetchStats();
  }, []);

  const handleAnalyze = async (type: string, input: any) => {
    setIsLoading(true);
    setResults(null);

    try {
      let endpoint = "/api/analyze/text";
      let body: any = {};

      if (type === "text") {
        endpoint = "/api/analyze/text";
        body = { text: input };
      } else if (type === "article") {
        endpoint = "/api/analyze/article";
        body = { url: articleUrl, content: input };
      } else if (type === "compare") {
        endpoint = "/api/analyze/compare";
        body = { sources: input.filter((s: string) => s.trim()) };
      } else if (type === "factcheck") {
        endpoint = "/api/factcheck";
        body = { claim: input };
      } else if (type === "image") {
        endpoint = "/api/analyze/image";
        body = { image: input };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const d = await res.json();
      if (!d.success) {
        showToast(d.error || "Analysis failed", "error");
        return;
      }

      setResults({ ...d.data, type });
      showToast("Forensic credibility report ready", "success");
      fetchHistory();
      fetchStats();
    } catch {
      showToast("Verification request failed. Please retry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("JSON report copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = history.filter(
    (item) => historyFilter === "all" || item.type === historyFilter
  );

  return (
    <div className="dark bg-[#070b14] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Grid & Ambient Lighting */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.14] z-0"
        style={{
          backgroundSize: "32px 32px",
          backgroundImage:
            "linear-gradient(to right, rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.2) 1px, transparent 1px)",
        }}
      />
      <div className="fixed top-0 left-1/3 w-[600px] h-[350px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl bg-[#0e172a] text-xs font-semibold"
            style={{
              borderColor:
                toast.type === "success"
                  ? "rgba(16,185,129,0.5)"
                  : toast.type === "error"
                    ? "rgba(244,63,94,0.5)"
                    : "rgba(59,130,246,0.5)",
            }}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toast.type === "info" && <Sparkles className="w-4 h-4 text-blue-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Truth Lens</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Misinformation & Claim Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Engine status & landing link */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Groq GPT-OSS 120B Connected</span>
          </div>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-900/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Chatbot</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex w-full relative z-10 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex flex-col border-r border-slate-800/80 bg-[#080d1a] transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* User Status */}
          <div className="p-3.5 border-b border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                TL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Investigator Session</p>
                <p className="text-[10px] text-emerald-400 font-mono">{history.length} claims verified</p>
              </div>
            </div>
          </div>

          {/* AI Chat Shortcut */}
          <div className="p-2.5 border-b border-slate-800/60">
            <Link
              href="/chat"
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-semibold flex items-center justify-between transition-all group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Conversational AI Chat</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>

          {/* Nav items */}
          <div className="flex-1 p-2.5 space-y-1 overflow-y-auto">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Investigation Tools
            </div>

            {[
              { id: "text", label: "Text & Claims", icon: FileText },
              { id: "article", label: "Article Audit", icon: Globe },
              { id: "compare", label: "Source Compare", icon: Hash },
              { id: "factcheck", label: "Fact Check Query", icon: Shield },
              { id: "image", label: "Forensic Image", icon: ImageIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="pt-3 px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Feeds & Logs
            </div>

            {[
              { id: "trending", label: "Viral Hoax Radar", icon: Flame, badge: trending.length },
              { id: "history", label: "Audit History", icon: HistoryIcon, badge: history.length },
              { id: "stats", label: "Accuracy Stats", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Engine indicator */}
          <div className="p-3 border-t border-slate-800/60 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span>Engine:</span>
              <span className="text-slate-200">Groq GPT-OSS</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Latency:</span>
              <span className="text-emerald-400">&lt; 350ms</span>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Top Banner & Mode Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === "text" && "Text & Claim Verification"}
                {activeTab === "article" && "Journalistic Article Audit"}
                {activeTab === "compare" && "Source Contradiction Compare"}
                {activeTab === "factcheck" && "Targeted Fact-Check Search"}
                {activeTab === "image" && "Forensic Visual Artifacts"}
                {activeTab === "trending" && "Live Viral Misinformation Ticker"}
                {activeTab === "history" && "Past Claim Audits"}
                {activeTab === "stats" && "Credibility Metrics"}
              </h1>
              <p className="text-xs text-slate-400">
                {activeTab === "text" && "Inspect headlines, messages, or paragraphs for factual integrity, red flags, and linguistic bias."}
                {activeTab === "article" && "Audit editorial standards, domain credibility, and unsourced statements."}
                {activeTab === "compare" && "Analyze differences between outlets covering the same event."}
                {activeTab === "factcheck" && "Query verified institutional consensus on specific claims."}
                {activeTab === "image" && "Detect AI generation, synthetic artifacts, and compression tampering."}
                {activeTab === "trending" && "Real-time viral claims actively debunked across internet channels."}
                {activeTab === "history" && "Review previous investigation results and scores."}
                {activeTab === "stats" && "Session-wide credibility index and category distribution."}
              </p>
            </div>

            {/* Quick Presets for Text mode */}
            {activeTab === "text" && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-mono">Example:</span>
                {SAMPLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTextInput(p.text)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700/60 text-slate-300 hover:text-blue-300 transition-all font-medium"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form & Studio Section */}
          {activeTab === "text" && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Input Claim or Statement
                </label>
                <span className="text-[11px] font-mono text-slate-400">{textInput.length} chars</span>
              </div>

              <textarea
                rows={5}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste news headline, WhatsApp forward, tweet, or statement to verify..."
                className="w-full p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setTextInput("")}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear input
                </button>

                <button
                  disabled={isLoading || textInput.trim().length < 5}
                  onClick={() => handleAnalyze("text", textInput)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with Groq AI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Inspect Claim Credibility</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "article" && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-xl">
              <input
                type="url"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="Article URL (e.g. https://www.nytimes.com/...)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e1c] border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              />
              <textarea
                rows={5}
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="Paste full article text or paragraphs..."
                className="w-full p-3.5 rounded-xl bg-[#090e1c] border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
              <div className="flex justify-end pt-1">
                <button
                  disabled={isLoading || !articleContent.trim() || !articleUrl.trim()}
                  onClick={() => handleAnalyze("article", articleContent)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Audit Article Journalistic Standards</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "compare" && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-xl">
              {compareSources.map((src, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Source #{i + 1}</span>
                    {compareSources.length > 2 && (
                      <button onClick={() => setCompareSources(compareSources.filter((_, idx) => idx !== i))} className="text-rose-400">
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={src}
                    onChange={(e) => setCompareSources(compareSources.map((s, idx) => (idx === i ? e.target.value : s)))}
                    placeholder={`Paste excerpt from Outlet ${i + 1}...`}
                    className="w-full p-3 rounded-xl bg-[#090e1c] border border-slate-800 text-slate-100 text-sm resize-none"
                  />
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <button
                  onClick={() => setCompareSources([...compareSources, ""])}
                  className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-500/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Outlet
                </button>
                <button
                  disabled={isLoading || compareSources.filter((s) => s.trim()).length < 2}
                  onClick={() => handleAnalyze("compare", compareSources)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                  <span>Cross-Check Discrepancies</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "factcheck" && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-xl">
              <input
                type="text"
                value={factCheckClaim}
                onChange={(e) => setFactCheckClaim(e.target.value)}
                placeholder="Query a specific claim (e.g. 'Did NASA confirm water on the moon?')"
                className="w-full px-3.5 py-3 rounded-xl bg-[#090e1c] border border-slate-800 text-slate-100 text-sm"
              />
              <div className="flex justify-end pt-1">
                <button
                  disabled={isLoading || !factCheckClaim.trim()}
                  onClick={() => handleAnalyze("factcheck", factCheckClaim)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify Against Fact Database</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "image" && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-xl">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[180px]",
                  imagePreview ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 hover:border-slate-700"
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                {imagePreview ? (
                  <div className="relative max-w-sm">
                    <img src={imagePreview} alt="Preview" className="rounded-lg max-h-48 object-contain" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Click or drop image for forensic AI inspection</p>
                    <p className="text-[11px] text-slate-500">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  disabled={isLoading || !imagePreview}
                  onClick={() => handleAnalyze("image", imagePreview)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Run Forensic Visual Scan</span>
                </button>
              </div>
            </div>
          )}

          {/* RESULTS CARD: STRUCTURED FORENSIC INTELLIGENCE */}
          <AnimatePresence>
            {results && (results.type === activeTab || activeTab === "history") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-6 rounded-2xl bg-[#0c1326] border border-blue-500/30 shadow-2xl space-y-6"
              >
                {/* Score & Verdict Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-[#080d1c] border border-slate-800">
                  <div className="flex items-center gap-5">
                    {/* Radial Score Gauge */}
                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke={
                            results.credibilityScore > 70
                              ? "#10b981"
                              : results.credibilityScore > 40
                                ? "#f59e0b"
                                : "#f43f5e"
                          }
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={213}
                          strokeDashoffset={213 * (1 - results.credibilityScore / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black font-mono text-white">{results.credibilityScore}</span>
                        <span className="text-[8px] font-mono uppercase text-slate-400">Score</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {(() => {
                        const cat = CATEGORY_MAP[results.category] || CATEGORY_MAP.unclear;
                        const Icon = cat.icon;
                        return (
                          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase font-mono", cat.bg, cat.color, cat.border)}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{cat.label}</span>
                          </div>
                        );
                      })()}
                      <h3 className="text-lg font-black text-white">{results.verdict}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{results.analysis}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy JSON"}</span>
                    </button>
                    <button
                      onClick={() => setResults(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Consensus Fact Box */}
                {results.consensusFact && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1">
                    <div className="text-[11px] font-bold text-blue-400 uppercase font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Official / Scientific Consensus</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{results.consensusFact}</p>
                  </div>
                )}

                {/* Side-by-side Factual Reality Check */}
                {results.realityCheck && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase font-mono">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Claimed Narrative</span>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                        "{results.realityCheck.claimedAssertion}"
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Factual Reality</span>
                      </div>
                      <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                        {results.realityCheck.factualReality}
                      </p>
                    </div>
                  </div>
                )}

                {/* Threat & Spread Intelligence */}
                {(results.riskAssessment || results.originAndSpread) && (
                  <div className="p-4 rounded-xl bg-[#090f20] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Threat & Propagation Intelligence</span>
                      </h4>
                      {results.riskAssessment?.riskLevel && (
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border",
                            results.riskAssessment.riskLevel.toLowerCase().includes("critical")
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                              : results.riskAssessment.riskLevel.toLowerCase().includes("high")
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/40"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/40"
                          )}
                        >
                          {results.riskAssessment.riskLevel}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {results.riskAssessment?.harmCategory && (
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">Harm Domain</span>
                          <span className="text-xs font-semibold text-slate-200 block">{results.riskAssessment.harmCategory}</span>
                        </div>
                      )}
                      {results.originAndSpread?.spreadPattern && (
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">Vector / Pattern</span>
                          <span className="text-xs font-semibold text-slate-200 block">{results.originAndSpread.spreadPattern}</span>
                        </div>
                      )}
                      {results.riskAssessment?.whyItSpreads && (
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">Psychological Hook</span>
                          <span className="text-xs font-semibold text-slate-200 block">{results.riskAssessment.whyItSpreads}</span>
                        </div>
                      )}
                    </div>

                    {results.originAndSpread?.originContext && (
                      <div className="pt-2 border-t border-slate-850 text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-slate-500 font-mono text-[10px] font-bold uppercase">Documented Origin:</span>
                        <span className="text-slate-300 text-xs">{results.originAndSpread.originContext}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Atomic Claims Breakdown */}
                {results.extractedClaims && results.extractedClaims.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Extracted Claims & Individual Veracity</span>
                    </h4>
                    <div className="space-y-2">
                      {results.extractedClaims.map((claimObj, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#090f20] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-white">"{claimObj.claim}"</p>
                            <p className="text-[11px] text-slate-400">{claimObj.note}</p>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase self-start sm:self-center border",
                              claimObj.verdict.toLowerCase().includes("true")
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : claimObj.verdict.toLowerCase().includes("false")
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}
                          >
                            {claimObj.verdict}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accredited Institutions & Authoritative References */}
                {((results.authoritativeSources && results.authoritativeSources.length > 0) ||
                  (results.specificSources && results.specificSources.length > 0) ||
                  (results.relatedCredibleSources && results.relatedCredibleSources.length > 0)) && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Accredited Institutions & Authoritative References</span>
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(results.authoritativeSources || results.specificSources || results.relatedCredibleSources || []).map((source, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-300 font-medium flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1-Click Shareable Debunk Script */}
                {results.debunkCopyScript && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold uppercase font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>1-Click Shareable Debunk Script (For WhatsApp / Socials)</span>
                      </div>
                      <button
                        onClick={() => copyDebunkScript(results.debunkCopyScript!)}
                        className="px-2.5 py-1 rounded-md bg-purple-600/30 hover:bg-purple-600/50 text-xs font-semibold text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition-colors"
                      >
                        {debunkCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{debunkCopied ? "Copied!" : "Copy Script"}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-[#070b14]/70 border border-purple-500/20 text-xs text-slate-200 leading-relaxed font-mono">
                      "{results.debunkCopyScript}"
                    </div>
                    <p className="text-[10px] text-purple-300/70">
                      Tip: Paste this polite, fact-based rebuttal into family group chats, forum replies, or social feeds to defuse misinformation without confrontation.
                    </p>
                  </div>
                )}

                {/* Journalistic Integrity & Standards Audit (For Articles) */}
                {results.journalisticStandards && (
                  <div className="p-4 rounded-xl bg-[#090f20] border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>Journalistic Integrity & Standards Audit</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Bylined Author</span>
                        {results.journalisticStandards.hasAuthor ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Publication Date</span>
                        {results.journalisticStandards.hasDate ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Primary Sources</span>
                        {results.journalisticStandards.hasSources ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Direct Quotes</span>
                        {results.journalisticStandards.hasQuotes ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actionable Verification Protocol */}
                {results.verificationSteps && results.verificationSteps.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Actionable Verification Protocol</span>
                    </h4>
                    <ol className="space-y-1.5 text-xs text-slate-300">
                      {results.verificationSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Red Flags & Authenticity Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Red Flags */}
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Detected Red Flags ({results.redFlags?.length || 0})</span>
                    </div>
                    {results.redFlags && results.redFlags.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-rose-300/90 leading-relaxed">
                        {results.redFlags.map((flag, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No manipulation indicators identified.</p>
                    )}
                  </div>

                  {/* Positive Signals */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authenticity Markers ({results.positiveSignals?.length || 0})</span>
                    </div>
                    {results.positiveSignals && results.positiveSignals.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-emerald-300/90 leading-relaxed">
                        {results.positiveSignals.map((sig, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{sig}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">Independent secondary confirmation pending.</p>
                    )}
                  </div>
                </div>

                {/* Bias & Tone Diagnostics */}
                {results.biasDiagnostics && (
                  <div className="p-4 rounded-xl bg-[#090f20] border border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                      Linguistic & Bias Diagnostics
                    </h5>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Sensationalism</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{results.biasDiagnostics.sensationalism || "Normal"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Tone Framing</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{results.biasDiagnostics.tone || "Matter-of-fact"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Technique</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{results.biasDiagnostics.manipulationTechnique || "None"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1-Click Verification Search Links */}
                {results.factCheckQueries && results.factCheckQueries.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cross-Reference on Verified Fact Check Repositories</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {results.factCheckQueries.map((query, idx) => (
                        <a
                          key={idx}
                          href={`https://www.google.com/search?q=${encodeURIComponent(query + " fact check")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700 text-blue-300 flex items-center gap-1.5 transition-colors"
                        >
                          <span>"{query}"</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB: TRENDING HOAXES RADAR */}
          {activeTab === "trending" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono uppercase text-slate-400">Viral misinformation tracked this week</span>
                <button onClick={fetchTrending} className="text-xs text-blue-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh Feed
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {trending.map((t, idx) => {
                  const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.unclear;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border", cat.bg, cat.color, cat.border)}>
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.shares}</span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-relaxed">{t.claim}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">{t.source}</span>
                        <button
                          onClick={() => {
                            switchTab("text");
                            setTextInput(t.claim);
                          }}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: HISTORY LOG */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-mono uppercase text-slate-400">Filter checks</span>
                <div className="flex gap-1.5">
                  {["all", "text", "article", "compare", "factcheck", "image"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={cn(
                        "text-[10px] px-2.5 py-1 rounded font-mono uppercase",
                        historyFilter === f ? "bg-blue-600 text-white font-bold" : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredHistory.map((item, idx) => {
                  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.unclear;
                  return (
                    <div
                      key={item._id || idx}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 border", cat.bg, cat.color, cat.border)}>
                          {item.credibilityScore}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-white truncate">{item.inputPreview}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            <span className="uppercase text-blue-400">{item.type}</span> • {cat.label}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setResults(item);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        Inspect
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: STATS */}
          {activeTab === "stats" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Checked</span>
                  <span className="text-2xl font-black text-white mt-1 block">{stats?.totalAnalyses || history.length}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Credibility</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats?.averageCredibilityScore || 62}%</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Debunked Hoaxes</span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">
                    {history.filter((h) => h.category === "fake").length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Verified Real</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">
                    {history.filter((h) => h.category === "real").length}
                  </span>
                </div>
              </div>

              {stats?.byCategory && (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-white uppercase font-mono block">Category Distribution</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {stats.byCategory.map((c: any) => {
                      const cat = CATEGORY_MAP[c.category] || CATEGORY_MAP.unclear;
                      return (
                        <div key={c.category} className={cn("p-3 rounded-lg border text-center", cat.bg, cat.border)}>
                          <span className={cn("text-xl font-bold font-mono block", cat.color)}>{c.count}</span>
                          <span className={cn("text-[10px] font-mono uppercase font-bold block", cat.color)}>{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
