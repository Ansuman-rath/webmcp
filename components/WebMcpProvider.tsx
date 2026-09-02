"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type WebMcpLogItem = {
  id: string;
  timestamp: string;
  toolName: string;
  role: "buyer" | "seller" | "system";
  userId: string;
  args: Record<string, unknown>;
  result: unknown;
  status: "success" | "error";
};

export type RegisteredTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  roleGating?: "buyer" | "seller" | "all";
  isActive: boolean;
};

type WebMcpContextType = {
  isWebMcpAvailable: boolean;
  registeredTools: RegisteredTool[];
  logs: WebMcpLogItem[];
  currentRole: "buyer" | "seller";
  currentUserId: string;
  currentUserName: string;
  setCurrentRole: (role: "buyer" | "seller") => void;
  setIdentity: (role: "buyer" | "seller", userId: string, userName: string) => void;
  registerWebMcpTools: (tools: RegisteredTool[], executeMap: Record<string, (args: any) => Promise<any>>) => void;
  invokeToolSimulated: (toolName: string, args: Record<string, unknown>) => Promise<any>;
  clearLogs: () => void;
  activeNegotiationId: string | null;
  setActiveNegotiationId: (id: string | null) => void;
};

const WebMcpContext = createContext<WebMcpContextType | undefined>(undefined);

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
        execute: (args: any) => Promise<any>;
        signal?: AbortSignal;
      }) => void;
      unregisterTool?: (name: string) => void;
    };
  }
}

export function WebMcpProvider({ children }: { children: React.ReactNode }) {
  const [isWebMcpAvailable, setIsWebMcpAvailable] = useState<boolean>(false);
  const [registeredTools, setRegisteredTools] = useState<RegisteredTool[]>([]);
  const [logs, setLogs] = useState<WebMcpLogItem[]>([]);

  // Real Identity state (synced with URL query params or session)
  const [currentRole, setCurrentRoleState] = useState<"buyer" | "seller">("buyer");
  const [currentUserId, setCurrentUserId] = useState<string>("user-buyer-alice");
  const [currentUserName, setCurrentUserName] = useState<string>("Alice Agent (Buyer)");

  const [activeNegotiationId, setActiveNegotiationId] = useState<string | null>("neg-demo-1");
  const [toolExecutors, setToolExecutors] = useState<Record<string, (args: any) => Promise<any>>>({});

  // AbortController ref for dynamic tool unregistration
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync identity from URL query parameters (e.g. ?role=seller&user=bob)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      const userParam = params.get("user");
      const nameParam = params.get("name");

      if (roleParam === "seller" || roleParam === "buyer") {
        setCurrentRoleState(roleParam);
        if (roleParam === "seller") {
          setCurrentUserId(userParam || "user-seller-bob");
          setCurrentUserName(nameParam || "Bob Miller (Seller)");
        } else {
          setCurrentUserId(userParam || "user-buyer-alice");
          setCurrentUserName(nameParam || "Alice Agent (Buyer)");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "modelContext" in navigator && navigator.modelContext?.registerTool) {
      setIsWebMcpAvailable(true);
    }
  }, []);

  const setIdentity = useCallback((role: "buyer" | "seller", userId: string, userName: string) => {
    setCurrentRoleState(role);
    setCurrentUserId(userId);
    setCurrentUserName(userName);
  }, []);

  const setCurrentRole = useCallback((role: "buyer" | "seller") => {
    setCurrentRoleState(role);
    if (role === "seller") {
      setCurrentUserId("user-seller-bob");
      setCurrentUserName("Bob Miller (Seller)");
    } else {
      setCurrentUserId("user-buyer-alice");
      setCurrentUserName("Alice Agent (Buyer)");
    }
  }, []);

  const addLog = useCallback((item: Omit<WebMcpLogItem, "id" | "timestamp">) => {
    const newLog: WebMcpLogItem = {
      ...item,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  const registerWebMcpTools = useCallback(
    (tools: RegisteredTool[], executeMap: Record<string, (args: any) => Promise<any>>) => {
      setRegisteredTools(tools);
      setToolExecutors(executeMap);

      // Abort previous registrations if modelContext supports signal
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      tools.forEach((tool) => {
        const executor = executeMap[tool.name];
        if (!executor) return;

        const wrappedExecutor = async (args: any) => {
          try {
            const res = await executor(args);
            if (res?.isError) {
              addLog({
                toolName: tool.name,
                role: currentRole,
                userId: currentUserId,
                args: args || {},
                result: res,
                status: "error",
              });
            } else {
              addLog({
                toolName: tool.name,
                role: currentRole,
                userId: currentUserId,
                args: args || {},
                result: res,
                status: "success",
              });
            }
            return res;
          } catch (err: any) {
            const errorRes = { isError: true, error: err?.message || "Tool execution failed" };
            addLog({
              toolName: tool.name,
              role: currentRole,
              userId: currentUserId,
              args: args || {},
              result: errorRes,
              status: "error",
            });
            return errorRes;
          }
        };

        if (typeof window !== "undefined" && navigator.modelContext?.registerTool && tool.isActive) {
          try {
            navigator.modelContext.registerTool({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
              execute: wrappedExecutor,
              signal,
            });
          } catch (e) {
            console.warn(`[WebMCP] Tool registration note for ${tool.name}:`, e);
          }
        }
      });
    },
    [addLog, currentRole, currentUserId]
  );

  const invokeToolSimulated = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      const executor = toolExecutors[toolName];
      if (!executor) {
        const errObj = { isError: true, error: `Tool '${toolName}' is currently inactive or gated.` };
        addLog({
          toolName,
          role: currentRole,
          userId: currentUserId,
          args,
          result: errObj,
          status: "error",
        });
        return errObj;
      }

      try {
        const res = await executor(args);
        if (res?.isError) {
          addLog({
            toolName,
            role: currentRole,
            userId: currentUserId,
            args,
            result: res,
            status: "error",
          });
        } else {
          addLog({
            toolName,
            role: currentRole,
            userId: currentUserId,
            args,
            result: res,
            status: "success",
          });
        }
        return res;
      } catch (err: any) {
        const errObj = { isError: true, error: err?.message || "Execution error" };
        addLog({
          toolName,
          role: currentRole,
          userId: currentUserId,
          args,
          result: errObj,
          status: "error",
        });
        return errObj;
      }
    },
    [toolExecutors, currentRole, currentUserId, addLog]
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <WebMcpContext.Provider
      value={{
        isWebMcpAvailable,
        registeredTools,
        logs,
        currentRole,
        currentUserId,
        currentUserName,
        setCurrentRole,
        setIdentity,
        registerWebMcpTools,
        invokeToolSimulated,
        clearLogs,
        activeNegotiationId,
        setActiveNegotiationId,
      }}
    >
      {children}
    </WebMcpContext.Provider>
  );
}

export function useWebMcp() {
  const context = useContext(WebMcpContext);
  if (!context) {
    throw new Error("useWebMcp must be used within a WebMcpProvider");
  }
  return context;
}
