"use client";

import React from "react";
import Link from "next/link";
import { Listing } from "@/lib/store";
import { MapPin, Tag, Shield, ArrowRight, Sparkles } from "lucide-react";

export function ListingCard({ listing }: { listing: Listing }) {
  const getStatusBadge = () => {
    switch (listing.status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Available
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Negotiation Pending
          </span>
        );
      case "sold":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-700">
            Sold
          </span>
        );
    }
  };

  return (
    <div className="group relative bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
          {/* eslint-disable-next-html-element-suppression */}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-950/80 backdrop-blur-md text-zinc-200 border border-zinc-700/60">
              {listing.category}
            </span>
            {getStatusBadge()}
          </div>

          {/* Price overlay on image bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Asking Price</p>
              <p className="text-xl font-bold text-emerald-400">${listing.askingPrice.toLocaleString()}</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/20 backdrop-blur-md text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              WebMCP Enabled
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4">
          <h3 className="font-semibold text-base text-zinc-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Meta details */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-zinc-300">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>{listing.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Link
          href={`/listing/${listing.id}`}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-zinc-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all group-hover:shadow-md group-hover:shadow-indigo-600/20"
        >
          <span>Inspect & Negotiate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
