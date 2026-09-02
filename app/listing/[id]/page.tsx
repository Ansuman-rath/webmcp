"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Listing, Negotiation } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { NegotiationPanel } from "@/components/NegotiationPanel";
import { WebMcpDevDrawer } from "@/components/WebMcpDevDrawer";
import { CreateListingModal } from "@/components/CreateListingModal";
import { useWebMcp } from "@/components/WebMcpProvider";
import { getWebMcpToolDefinitions } from "@/lib/webmcp-tools";
import {
  ArrowLeft,
  MapPin,
  Tag,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [listing, setListing] = useState<Listing | null>(null);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { registerWebMcpTools, currentRole } = useWebMcp();

  const fetchListingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${id}?buyerId=buyer-alice`);
      if (!res.ok) {
        throw new Error("Listing not found");
      }
      const data = await res.json();
      setListing(data.listing);
      setNegotiation(data.negotiation || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  // Dynamically register WebMCP tools when listing or negotiation state updates
  useEffect(() => {
    if (!listing) return;

    const lastOffer = negotiation?.offers[negotiation.offers.length - 1];

    const tools = getWebMcpToolDefinitions(currentRole, negotiation ? {
      id: negotiation.id,
      status: negotiation.status,
      lastOfferFrom: lastOffer?.from,
    } : null);

    const executeMap: Record<string, (args: any) => Promise<any>> = {
      search_listings: async (args: any) => {
        const query = args?.query || "";
        const res = await fetch(`/api/listings?query=${encodeURIComponent(query)}`);
        return await res.json();
      },

      get_listing_details: async (args: any) => {
        const res = await fetch(`/api/listings/${args?.listingId || listing.id}`);
        return await res.json();
      },

      make_offer: async (args: any) => {
        const res = await fetch("/api/negotiations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: args.listingId || listing.id,
            amount: args.amount,
            message: args.message,
            buyerId: "buyer-alice",
          }),
        });
        const data = await res.json();
        fetchListingData();
        return data;
      },

      counter_offer: async (args: any) => {
        const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "counter",
            from: currentRole,
            amount: args.amount,
            message: args.message,
          }),
        });
        const data = await res.json();
        fetchListingData();
        return data;
      },

      accept_offer: async (args: any) => {
        const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
            from: currentRole,
          }),
        });
        const data = await res.json();
        fetchListingData();
        return data;
      },

      reject_offer: async (args: any) => {
        const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reject",
            from: currentRole,
            reason: args.reason,
          }),
        });
        const data = await res.json();
        fetchListingData();
        return data;
      },

      propose_pickup: async (args: any) => {
        const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "pickup",
            from: currentRole,
            location: args.location,
            time: args.time,
          }),
        });
        const data = await res.json();
        fetchListingData();
        return data;
      },

      get_negotiation_history: async (args: any) => {
        const res = await fetch(`/api/negotiations/${args.negotiationId}`);
        return await res.json();
      },
    };

    registerWebMcpTools(tools, executeMap);
  }, [listing, negotiation, currentRole, registerWebMcpTools, fetchListingData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar onOpenCreate={() => setIsModalOpen(true)} />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="animate-pulse space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto" />
            <p className="text-sm text-zinc-400">Loading WebMCP listing specs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar onOpenCreate={() => setIsModalOpen(true)} />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-rose-400">Listing Not Found</h2>
          <p className="text-sm text-zinc-400">{error || "The requested item could not be retrieved."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar onOpenCreate={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>WebMCP Protocol Listener Registered</span>
          </div>
        </div>

        {/* Listing & Negotiation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Photo & Spec Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Image Box */}
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              {/* eslint-disable-next-html-element-suppression */}
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md text-xs font-semibold text-zinc-200 border border-zinc-700">
                  {listing.category}
                </span>
                <span className="px-3 py-1 rounded-xl bg-cyan-500/20 backdrop-blur-md text-xs font-semibold text-cyan-300 border border-cyan-500/40">
                  {listing.condition}
                </span>
              </div>
            </div>

            {/* Product Overview Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {listing.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      {listing.sellerName}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-950 px-4 py-2.5 rounded-2xl border border-zinc-800 shrink-0 text-right">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Asking Price</span>
                  <span className="text-2xl font-black text-emerald-400">${listing.askingPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Item Description</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* WebMCP Protocol Technical Card */}
              <div className="pt-4 border-t border-zinc-800/80 p-4 rounded-2xl bg-zinc-950/80 border border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    WebMCP Standard Binding
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Chrome navigator.modelContext</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  This listing declares <code className="text-cyan-300">make_offer</code>, <code className="text-cyan-300">counter_offer</code>, and <code className="text-cyan-300">accept_offer</code> tools on page mount. Any compliant AI agent browsing this URL can negotiate directly on your behalf without scraping.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Negotiation Panel (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <NegotiationPanel listing={listing} initialNegotiation={negotiation} />
          </div>
        </div>
      </main>

      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchListingData()}
      />

      <WebMcpDevDrawer currentListingId={listing.id} />
    </div>
  );
}
