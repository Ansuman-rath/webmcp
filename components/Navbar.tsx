"use client";

import React from "react";
import Link from "next/link";
import { useWebMcp } from "./WebMcpProvider";
import { User, Bot, PlusCircle, ExternalLink, Zap, AlertTriangle, ShieldCheck } from "lucide-react";

export function Navbar({ onOpenCreate }: { onOpenCreate: () => void }) {
  const { currentRole, setCurrentRole, currentUserName, isWebMcpAvailable, registeredTools } = useWebMcp();
  const activeToolsCount = registeredTools.filter((t) => t.isActive).length;

  return (
    <div className="sticky top-0 z-40">
      {/* Capability Detection Banner */}
      {!isWebMcpAvailable && (
        <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>WebMCP Capability Note:</strong> For native browser agent execution, open in Chrome with{" "}
            <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded font-mono">chrome://flags/#enable-webmcp-testing</code>. Standard protocol fallback active.
          </span>
        </div>
      )}

      <header className="backdrop-blur-xl bg-zinc-950/85 border-b border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-zinc-100 tracking-tight">AgentMarket</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  WebMCP Standard
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">Zero-API Agentic Negotiation Marketplace</p>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-zinc-300 font-medium">
                {isWebMcpAvailable ? "Native WebMCP API" : "WebMCP Protocol Active"}
              </span>
              <span className="text-zinc-500 font-mono text-[11px] border-l border-zinc-800 pl-2">
                {activeToolsCount} Active Tools
              </span>
            </div>

            {/* Quick Session Openers */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <a
                href="?role=buyer&user=user-buyer-alice&name=Alice+Agent"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-cyan-950/40 text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 text-[11px] flex items-center gap-1 transition-all"
                title="Open new window/tab as Buyer session"
              >
                <span>New Buyer Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="?role=seller&user=user-seller-bob&name=Bob+Miller"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-purple-950/40 text-purple-300 border border-zinc-800 hover:border-purple-500/40 text-[11px] flex items-center gap-1 transition-all"
                title="Open new window/tab as Seller session"
              >
                <span>New Seller Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Role Toggle Switch */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setCurrentRole("buyer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentRole === "buyer"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Buyer (Alice)</span>
              </button>
              <button
                onClick={() => setCurrentRole("seller")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentRole === "seller"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Seller (Bob)</span>
              </button>
            </div>

            {/* Create Listing Button */}
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post Listing</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
