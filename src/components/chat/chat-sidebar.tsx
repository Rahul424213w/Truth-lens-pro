"use client";

import Link from "next/link";
import { MessageSquare, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "./types";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  currentId: string | null;
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  currentId,
  open,
  onClose,
  onNewChat,
  onSelect,
  onDelete,
}: ChatSidebarProps) {
  return (
    <>
      <aside
        aria-label="Chat navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-[#080d1a] transition-transform duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/60 px-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-white">
              Truth Lens
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
                PRO
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-800/60 p-2.5">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/30 transition-all hover:from-blue-500 hover:to-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1a] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            New check
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto p-2.5"
          aria-label="Conversations"
        >
          <p className="px-2.5 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent
          </p>

          {conversations.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-xs text-slate-500">
              No conversations yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = conversation.id === currentId;
                return (
                  <li key={conversation.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 pr-9 text-left text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-white" : "text-slate-500"
                        )}
                      />
                      <span className="truncate">{conversation.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(conversation.id)}
                      aria-label={`Delete ${conversation.title}`}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-800/60 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Engine online
            </span>
            <span className="text-slate-200">Groq GPT-OSS</span>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
