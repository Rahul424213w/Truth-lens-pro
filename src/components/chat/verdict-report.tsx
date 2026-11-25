"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  FileText,
  ShieldCheck,
  Sparkles,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisData } from "./types";

const CATEGORY_STYLES: Record<string, { label: string; dot: string }> = {
  real: { label: "Verified", dot: "bg-emerald-400" },
  fake: { label: "False", dot: "bg-rose-400" },
  misleading: { label: "Misleading", dot: "bg-amber-400" },
  clickbait: { label: "Clickbait", dot: "bg-yellow-400" },
  satire: { label: "Satire", dot: "bg-purple-400" },
  "ai-generated": { label: "AI-generated", dot: "bg-pink-400" },
  unclear: { label: "Unverified", dot: "bg-slate-400" },
};

interface VerdictReportProps {
  analysis: AnalysisData;
  isOpen: boolean;
  onToggle: () => void;
  copied: boolean;
  onCopyDebunk: (text: string) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

export function VerdictReport({
  analysis,
  isOpen,
  onToggle,
  copied,
  onCopyDebunk,
}: VerdictReportProps) {
  const style = CATEGORY_STYLES[analysis.category] ?? CATEGORY_STYLES.unclear;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40 focus-visible:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200">
          {analysis.verdict}
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:inline">
          {style.label}
        </span>
        <span className="text-xs font-bold tabular-nums text-white">
          {analysis.credibilityScore}
          <span className="text-slate-500">/100</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-slate-800/80 px-4 py-4 text-xs leading-relaxed text-slate-300">
              {analysis.consensusFact && (
                <div className="space-y-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <SectionLabel>Verified context</SectionLabel>
                  </div>
                  <p>{analysis.consensusFact}</p>
                </div>
              )}

              {analysis.realityCheck && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <XCircle className="h-3.5 w-3.5" />
                      <SectionLabel>Claim</SectionLabel>
                    </div>
                    <p className="text-slate-300">{analysis.realityCheck.claimedAssertion}</p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <SectionLabel>Reality</SectionLabel>
                    </div>
                    <p className="text-slate-300">{analysis.realityCheck.factualReality}</p>
                  </div>
                </div>
              )}

              {analysis.riskAssessment &&
                (analysis.riskAssessment.riskLevel ||
                  analysis.riskAssessment.whyItSpreads) && (
                  <div className="space-y-1.5 rounded-xl border border-slate-800 bg-[#090f20] p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <SectionLabel>Risk</SectionLabel>
                      {analysis.riskAssessment.riskLevel && (
                        <span className="font-mono text-[10px] font-semibold text-amber-300">
                          {analysis.riskAssessment.riskLevel}
                        </span>
                      )}
                    </div>
                    {analysis.riskAssessment.whyItSpreads && (
                      <p className="text-slate-400">
                        Why it spreads: {analysis.riskAssessment.whyItSpreads}
                      </p>
                    )}
                  </div>
                )}

              {analysis.extractedClaims && analysis.extractedClaims.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileText className="h-3.5 w-3.5" />
                    <SectionLabel>Claims</SectionLabel>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.extractedClaims.map((claim, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-slate-200">“{claim.claim}”</p>
                          {claim.note && (
                            <p className="text-[11px] text-slate-400">{claim.note}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                          {claim.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.debunkCopyScript && (
                <div className="space-y-2 rounded-xl border border-purple-500/25 bg-purple-500/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-purple-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      <SectionLabel>Shareable reply</SectionLabel>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopyDebunk(analysis.debunkCopyScript!)}
                      className="flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-600/30 px-2 py-1 text-[11px] font-semibold text-purple-200 transition-colors hover:bg-purple-600/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="rounded-lg border border-purple-500/20 bg-[#070b14]/70 p-2.5 font-mono text-slate-200">
                    {analysis.debunkCopyScript}
                  </p>
                </div>
              )}

              {analysis.authoritativeSources && analysis.authoritativeSources.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>Sources</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.authoritativeSources.map((source, index) => (
                      <span
                        key={index}
                        className="rounded-md border border-blue-500/25 bg-blue-500/10 px-2 py-1 font-mono text-[10px] text-blue-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
