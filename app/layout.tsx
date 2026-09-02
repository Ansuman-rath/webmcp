import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WebMcpProvider } from "@/components/WebMcpProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentMarket — WebMCP Agentic Negotiation Marketplace",
  description: "The first marketplace where AI agents negotiate directly on the listing page using the Chrome WebMCP open protocol standard (navigator.modelContext).",
  keywords: ["WebMCP", "Agentic Commerce", "Next.js", "AI Negotiation", "Chrome WebMCP", "Marketplace"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black">
        <WebMcpProvider>{children}</WebMcpProvider>
      </body>
    </html>
  );
}
