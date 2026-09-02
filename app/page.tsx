"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Listing } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { ListingCard } from "@/components/ListingCard";
import { WebMcpDevDrawer } from "@/components/WebMcpDevDrawer";
import { CreateListingModal } from "@/components/CreateListingModal";
import { useWebMcp } from "@/components/WebMcpProvider";
import { getWebMcpToolDefinitions } from "@/lib/webmcp-tools";
import {
  Search,
  Zap,
  Sparkles,
  ShieldCheck,
  Bot,
  ArrowRight,
  Filter,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { registerWebMcpTools, currentRole } = useWebMcp();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/listings", window.location.origin);
      if (searchQuery) url.searchParams.set("query", searchQuery);
      if (selectedCategory !== "All") url.searchParams.set("category", selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error("Failed to fetch listings:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Register home level WebMCP tools (search_listings & get_listing_details)
  useEffect(() => {
    const tools = getWebMcpToolDefinitions(currentRole);

    const executeMap: Record<string, (args: any) => Promise<any>> = {
      search_listings: async (args: any) => {
        const query = args?.query || "";
        const maxPrice = args?.maxPrice;
        const category = args?.category;

        const res = await fetch(
          `/api/listings?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category || "")}&maxPrice=${maxPrice || ""}`
        );
        return await res.json();
      },

      get_listing_details: async (args: any) => {
        if (!args?.listingId) throw new Error("listingId is required");
        const res = await fetch(`/api/listings/${args.listingId}`);
        return await res.json();
      },

      make_offer: async (args: any) => {
        const res = await fetch("/api/negotiations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: args.listingId,
            amount: args.amount,
            message: args.message,
            buyerId: "buyer-alice",
          }),
        });
        return await res.json();
      },
    };

    registerWebMcpTools(tools, executeMap);
  }, [currentRole, registerWebMcpTools]);

  const categories = ["All", "Vehicles", "Electronics", "Furniture", "Music", "Home"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Navbar */}
      <Navbar onOpenCreate={() => setIsModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Banner */}
        <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-br from-zinc-900 via-indigo-950/40 to-zinc-950 border border-zinc-800 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Agent-Native Protocol · WebMCP Challenge Submission</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              The First Marketplace Where{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Negotiation Is a Native Web Capability
              </span>
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Humans set goals. Agents execute the deal.{" "}
              AgentMarket isn&apos;t an AI that buys things — it&apos;s a marketplace where both sides expose standardized WebMCP tools (
              <code className="text-cyan-300 bg-zinc-900 px-1 py-0.5 rounded font-mono text-xs">make_offer</code>,{" "}
              <code className="text-cyan-300 bg-zinc-900 px-1 py-0.5 rounded font-mono text-xs">counter_offer</code>,{" "}
              <code className="text-cyan-300 bg-zinc-900 px-1 py-0.5 rounded font-mono text-xs">accept_offer</code>,{" "}
              <code className="text-cyan-300 bg-zinc-900 px-1 py-0.5 rounded font-mono text-xs">propose_pickup</code>
              ) directly on the listing page — no scraping, no guessing, no hidden APIs.
            </p>

            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed border-l-2 border-cyan-500/40 pl-4">
              Not <em className="text-zinc-400">&ldquo;an AI marketplace.&rdquo;</em> There are thousands of those.{" "}
              This is a marketplace <strong className="text-zinc-200">designed as an agent-native protocol</strong> — where the negotiation capability lives in the webpage itself, discoverable and executable by any WebMCP-compatible agent.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm transition-all"
              >
                Post New Item
              </button>
            </div>
          </div>

          {/* Protocol Stats Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Standard</span>
              <span className="text-zinc-200 font-bold text-sm">Chrome WebMCP API</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Native Tools</span>
              <span className="text-cyan-400 font-bold text-sm">8 Protocol Functions</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Sync Model</span>
              <span className="text-indigo-400 font-bold text-sm">BroadcastChannel + Poll</span>
            </div>
            <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Role Gating</span>
              <span className="text-purple-400 font-bold text-sm">Turn-Based Enforcement</span>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or keyword..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Listings Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Active Marketplace Listings</span>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                {listings.length} Available
              </span>
            </h2>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              All listings WebMCP compliant
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-zinc-900/40 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl">
              <p className="text-sm text-zinc-400">No listings found matching your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchListings()}
      />

      {/* WebMCP Dev Drawer */}
      <WebMcpDevDrawer />

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-800/80 py-8 bg-zinc-950/80 text-xs text-zinc-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AgentMarket — Powered by WebMCP Open Protocol Standard.</p>
          <div className="flex items-center gap-4">
            <Link href="https://github.com" target="_blank" className="hover:text-zinc-300 transition-colors">
              GitHub Repo (MIT License)
            </Link>
            <span>•</span>
            <Link href="https://chrome.dev" target="_blank" className="hover:text-zinc-300 transition-colors">
              Chrome WebMCP Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
