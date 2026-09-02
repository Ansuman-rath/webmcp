"use client";

import React, { useState } from "react";
import { useWebMcp } from "./WebMcpProvider";
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle,
  Code,
  Bot,
  ExternalLink,
} from "lucide-react";

export function WebMcpDevDrawer({ currentListingId }: { currentListingId?: string }) {
  const {
    isWebMcpAvailable,
    registeredTools,
    logs,
    clearLogs,
    currentRole,
    setCurrentRole,
    invokeToolSimulated,
    activeNegotiationId,
  } = useWebMcp();

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"tools" | "logs">("tools");


  return (
    <div className="fixed bottom-0 right-0 left-0 md:left-auto md:right-6 md:bottom-4 z-50 md:max-w-xl w-full">
      <div className="bg-zinc-950/95 border border-zinc-800/90 rounded-t-2xl md:rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300">
        {/* Toggle Bar */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-3 bg-zinc-900/90 hover:bg-zinc-900 flex items-center justify-between cursor-pointer border-b border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              WebMCP Protocol Inspector
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-400">
              {registeredTools.filter((t) => t.isActive).length} Active Tools
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isWebMcpAvailable ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3 h-3" /> Native API
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                WebMCP Standard
              </span>
            )}
            <button className="text-zinc-400 hover:text-zinc-200">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {isOpen && (
          <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("tools")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === "tools"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Registered Tools ({registeredTools.length})
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                    activeTab === "logs"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Live Logs ({logs.length})
                  {logs.length > 0 && (
                    <span className="ml-1.5 w-2 h-2 inline-block rounded-full bg-purple-400" />
                  )}
                </button>
              </div>

              {activeTab === "logs" && (
                <button
                  onClick={clearLogs}
                  className="text-zinc-500 hover:text-rose-400 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* TAB 1: REGISTERED TOOLS */}
            {activeTab === "tools" && (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Tools registered in <code className="text-cyan-400 bg-zinc-900 px-1 rounded">navigator.modelContext</code>. Dynamic gating enables/disables tools per negotiation turn:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {registeredTools.map((tool) => (
                    <div
                      key={tool.name}
                      className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                        tool.isActive
                          ? "bg-zinc-900/80 border-cyan-900/50 hover:border-cyan-500/50"
                          : "bg-zinc-950/40 border-zinc-800/40 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{tool.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold ${
                            tool.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {tool.isActive ? "Active" : "Gated"}
                        </span>
                      </div>
                      <p className="text-[10px] font-sans text-zinc-400 mt-1 line-clamp-1">
                        {tool.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: LIVE LOGS */}
            {activeTab === "logs" && (
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No WebMCP tool invocations logged yet. Trigger tools via UI or two independent browser tabs!
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border font-mono text-xs ${
                        log.status === "success"
                          ? "bg-emerald-950/10 border-emerald-900/40 text-emerald-200"
                          : "bg-rose-950/10 border-rose-900/40 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-zinc-800/40 mb-2">
                        <span className="font-bold text-cyan-400 flex items-center gap-1">
                          <Code className="w-3 h-3 text-indigo-400" />
                          {log.toolName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400 font-sans capitalize">
                            Role: {log.role} ({log.userId})
                          </span>
                          <span className="text-zinc-500">{log.timestamp}</span>
                        </div>
                      </div>

                      <div className="text-[10px] space-y-1">
                        <p className="text-zinc-400">
                          <span className="text-zinc-500">Args:</span> {JSON.stringify(log.args)}
                        </p>
                        <p className={log.status === "error" ? "text-rose-300" : "text-zinc-300"}>
                          <span className="text-zinc-500">Result:</span> {JSON.stringify(log.result)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
