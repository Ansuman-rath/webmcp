"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Negotiation, Listing } from "@/lib/store";
import { useWebMcp } from "./WebMcpProvider";
import confetti from "canvas-confetti";
import {
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Send,
  DollarSign,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

type Props = {
  listing: Listing;
  initialNegotiation?: Negotiation | null;
};

export function NegotiationPanel({ listing, initialNegotiation }: Props) {
  const { currentRole, invokeToolSimulated, setActiveNegotiationId } = useWebMcp();
  const [negotiation, setNegotiation] = useState<Negotiation | null>(initialNegotiation || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState<string>(
    listing.askingPrice ? String(Math.round(listing.askingPrice * 0.9)) : ""
  );
  const [offerMessage, setOfferMessage] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>(listing.location || "Public Market Plaza");
  const [pickupTime, setPickupTime] = useState<string>("Tomorrow at 3:00 PM");

  const [showOfferForm, setShowOfferForm] = useState<boolean>(false);
  const [showPickupForm, setShowPickupForm] = useState<boolean>(false);

  // Set active negotiation ID in WebMCP provider when loaded
  useEffect(() => {
    if (negotiation?.id) {
      setActiveNegotiationId(negotiation.id);
    }
  }, [negotiation?.id, setActiveNegotiationId]);

  // Polling helper
  const fetchLatestNegotiation = useCallback(async () => {
    try {
      const buyerParam = currentRole === "buyer" ? "buyer-alice" : "any";
      const res = await fetch(`/api/listings/${listing.id}?buyerId=${buyerParam}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.negotiation) {
          setNegotiation((prev) => {
            if (!prev) return data.negotiation;
            // Always accept status transition from open to accepted or rejected across sessions
            if (prev.status === "open" && data.negotiation.status !== "open") {
              return data.negotiation;
            }
            // Never downgrade an accepted/rejected negotiation to open via stale serverless poll
            if (prev.status !== "open" && data.negotiation.status === "open") {
              return prev;
            }
            // Never overwrite a local negotiation state with fewer offers (stale container state)
            if (data.negotiation.offers.length < prev.offers.length) {
              return prev;
            }
            // Ignore stale serverless poll responses with older timestamp
            if (
              data.negotiation.updatedAt < prev.updatedAt &&
              data.negotiation.offers.length === prev.offers.length &&
              data.negotiation.status === prev.status
            ) {
              return prev;
            }
            return data.negotiation;
          });
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  }, [listing.id, currentRole]);

  // 1.5s Polling loop
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLatestNegotiation();
    }, 1500);
    return () => clearInterval(interval);
  }, [fetchLatestNegotiation]);

  const lastOffer = negotiation?.offers[negotiation.offers.length - 1];
  const isNegOpen = negotiation?.status === "open";
  const isNegAccepted = negotiation?.status === "accepted";
  const isNegRejected = negotiation?.status === "rejected";

  // Turn enforcement calculation
  const isYourTurn = isNegOpen && lastOffer !== undefined && lastOffer.from !== currentRole;

  // Handle Make Initial Offer
  const handleMakeInitialOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amountNum = parseFloat(offerAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid offer amount.");
      }

      const res = await invokeToolSimulated("make_offer", {
        listingId: listing.id,
        amount: amountNum,
        message: offerMessage || `Initial offer from ${currentRole} agent`,
      });

      if (res?.isError || res?.error) {
        setError(res?.error || "Failed to submit initial offer.");
        return;
      }

      if (res?.negotiation) {
        setNegotiation(res.negotiation);
      } else {
        await fetchLatestNegotiation();
      }
      setShowOfferForm(false);
      setOfferMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to submit offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Counter Offer
  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiation) return;
    setError(null);
    setLoading(true);

    try {
      const amountNum = parseFloat(offerAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid counter amount.");
      }

      const res = await invokeToolSimulated("counter_offer", {
        negotiationId: negotiation.id,
        amount: amountNum,
        message: offerMessage || `Counter offer submitted by ${currentRole}`,
      });

      if (res?.isError || res?.error) {
        setError(res?.error || "Failed to submit counter offer.");
        return;
      }

      if (res?.negotiation) {
        setNegotiation(res.negotiation);
      } else {
        await fetchLatestNegotiation();
      }
      setShowOfferForm(false);
      setOfferMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to submit counter offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Accept Offer
  const handleAccept = async () => {
    if (!negotiation) return;
    setError(null);
    setLoading(true);

    try {
      const res = await invokeToolSimulated("accept_offer", {
        negotiationId: negotiation.id,
      });

      if (res?.isError || res?.error) {
        setError(res?.error || "Failed to accept offer: Out of turn.");
        return;
      }

      if (res?.negotiation) {
        setNegotiation(res.negotiation);
      } else {
        await fetchLatestNegotiation();
      }

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to accept offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reject Offer
  const handleReject = async () => {
    if (!negotiation) return;
    const reason = prompt("Enter a reason for rejecting this offer (optional):");
    if (reason === null) return; // User cancelled prompt

    setError(null);
    setLoading(true);

    try {
      const res = await invokeToolSimulated("reject_offer", {
        negotiationId: negotiation.id,
        reason: reason || "Price too far apart.",
      });

      if (res?.isError || res?.error) {
        setError(res?.error || "Failed to reject offer");
        return;
      }

      await fetchLatestNegotiation();
    } catch (err: any) {
      setError(err?.message || "Failed to reject offer");
    } finally {
      setLoading(false);
    }
  };

  // Handle Propose Pickup
  const handleProposePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiation) return;
    setError(null);
    setLoading(true);

    try {
      const res = await invokeToolSimulated("propose_pickup", {
        negotiationId: negotiation.id,
        location: pickupLocation,
        time: pickupTime,
      });

      if (res?.isError || res?.error) {
        setError(res?.error || "Failed to schedule pickup");
        return;
      }

      await fetchLatestNegotiation();
      setShowPickupForm(false);
    } catch (err: any) {
      setError(err?.message || "Failed to schedule pickup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between h-full">
      <div>
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>WebMCP Negotiation Protocol</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Agent-to-Agent protocol active for <span className="text-zinc-200 font-semibold">{listing.title}</span>
              </p>
            </div>
          </div>

          {/* Refresh / Polling Indicator */}
          <button
            onClick={() => fetchLatestNegotiation()}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Negotiation Status Banner */}
        <div className="mt-5">
          {!negotiation ? (
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center">
              <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-300">No active negotiation yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                As a buyer, you can trigger <code className="text-cyan-400 bg-zinc-900 px-1 py-0.5 rounded">make_offer</code> via WebMCP or use the button below to start negotiating.
              </p>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border ${
                isNegAccepted
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : isNegRejected
                  ? "bg-rose-500/10 border-rose-500/30"
                  : "bg-indigo-500/10 border-indigo-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isNegAccepted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isNegRejected ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      {isNegAccepted
                        ? `Deal Agreed at $${lastOffer?.amount.toLocaleString()}`
                        : isNegRejected
                        ? "Negotiation Closed / Rejected"
                        : `Negotiation Open (Latest: $${lastOffer?.amount.toLocaleString()})`}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      ID: <span className="font-mono text-zinc-300">{negotiation.id}</span> • {negotiation.offers.length} offer round(s)
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                    isNegAccepted
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : isNegRejected
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  }`}
                >
                  {negotiation.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Offer Timeline Stream */}
        {negotiation && negotiation.offers.length > 0 && (
          <div className="mt-6 space-y-3 max-h-[320px] overflow-y-auto pr-1">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Offer Audit Trail</span>
              <span className="text-[11px] font-normal text-zinc-500">Auto-updating live</span>
            </h4>

            {negotiation.offers.map((offer, idx) => {
              const isBuyerOffer = offer.from === "buyer";
              const isCurrentRoleSender = offer.from === currentRole;

              return (
                <div
                  key={offer.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isBuyerOffer
                      ? "bg-cyan-950/20 border-cyan-800/40 ml-0 sm:mr-8"
                      : "bg-purple-950/20 border-purple-800/40 mr-0 sm:ml-8"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          isBuyerOffer
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-purple-500/20 text-purple-300"
                        }`}
                      >
                        {isBuyerOffer ? "Buyer Agent (Alice)" : "Seller (Bob)"}
                      </span>
                      {isCurrentRoleSender && (
                        <span className="text-[10px] text-zinc-500 font-mono">(You)</span>
                      )}
                    </div>

                    <span className="text-[11px] text-zinc-500">
                      {new Date(offer.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-zinc-100">
                      ${offer.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {offer.amount < listing.askingPrice
                        ? `-${Math.round(((listing.askingPrice - offer.amount) / listing.askingPrice) * 100)}% off asking`
                        : "Full Asking Price"}
                    </span>
                  </div>

                  {offer.message && (
                    <p className="mt-2 text-xs text-zinc-300 bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60 leading-relaxed italic">
                      &quot;{offer.message}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pickup Logistics Section if Accepted */}
        {isNegAccepted && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Pickup & Delivery Logistics
              </h4>
              {negotiation?.pickup?.confirmedBy?.length ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Confirmed by {negotiation.pickup.confirmedBy.join(" & ")}
                </span>
              ) : null}
            </div>

            {negotiation?.pickup ? (
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-emerald-900/50 text-xs space-y-1.5">
                <p className="text-zinc-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <strong>Location:</strong> {negotiation.pickup.location}
                </p>
                <p className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <strong>Time:</strong> {negotiation.pickup.time}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Offer accepted! Schedule hand-off details using <code className="text-emerald-300 bg-zinc-900 px-1">propose_pickup</code> or the form below.
              </p>
            )}

            {!showPickupForm && (
              <button
                onClick={() => setShowPickupForm(true)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{negotiation?.pickup ? "Update Pickup Proposal" : "Propose Pickup Time & Location"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Controls Footer */}
      <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3">
        {/* Role Helper Banner */}
        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
          <span className="text-zinc-400">
            Active Role: <strong className="text-zinc-200 capitalize">{currentRole}</strong>
          </span>
          <span className={`text-[11px] font-medium ${isYourTurn ? "text-emerald-400" : "text-amber-400"}`}>
            {isYourTurn
              ? "⚡ Your turn to accept or counter"
              : isNegOpen
              ? "⏳ Waiting for opposing party response"
              : "Status: " + (negotiation?.status || "Ready")}
          </span>
        </div>

        {/* Modal/Inline Forms */}
        {showOfferForm && (
          <form
            onSubmit={negotiation ? handleCounterOffer : handleMakeInitialOffer}
            className="p-4 rounded-2xl bg-zinc-950 border border-zinc-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                {negotiation ? "Submit Counter Offer" : "Make Initial Offer"}
              </h4>
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Offer Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Message / Negotiation Note
              </label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="e.g. Can pick up today with cash..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Sending Offer..." : negotiation ? "Submit Counter Offer" : "Send Initial Offer"}</span>
            </button>
          </form>
        )}

        {showPickupForm && (
          <form onSubmit={handleProposePickup} className="p-4 rounded-2xl bg-zinc-950 border border-emerald-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Schedule Pickup Location & Time
              </h4>
              <button
                type="button"
                onClick={() => setShowPickupForm(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Meeting Address / Pickup Spot
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Starbucks SoMa (4th St)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="e.g. Saturday at 2:00 PM"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Confirming..." : "Confirm Pickup Proposal"}</span>
            </button>
          </form>
        )}

        {/* Buttons Bar */}
        {!showOfferForm && !showPickupForm && (
          <div className="grid grid-cols-2 gap-2">
            {!negotiation ? (
              <button
                onClick={() => setShowOfferForm(true)}
                className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Make Initial Offer (make_offer)</span>
              </button>
            ) : isNegOpen ? (
              <>
                <button
                  onClick={() => setShowOfferForm(true)}
                  disabled={loading || !isYourTurn}
                  className={`py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isYourTurn
                      ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                  }`}
                  title={!isYourTurn ? "Out of turn: You cannot counter your own offer. Waiting for opposing party." : "Counter offer"}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isYourTurn ? "Counter Offer" : "Waiting to Counter"}</span>
                </button>

                <button
                  onClick={handleAccept}
                  disabled={loading || !isYourTurn}
                  className={`py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isYourTurn
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                  }`}
                  title={!isYourTurn ? "Out of turn: You cannot accept your own offer. Waiting for opposing party to accept." : "Accept latest offer"}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isYourTurn ? "Accept Offer" : "Waiting for Accept"}</span>
                </button>

                <button
                  onClick={handleReject}
                  disabled={loading || !isYourTurn}
                  className={`col-span-2 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    isYourTurn
                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject & Close (reject_offer)</span>
                </button>
              </>
            ) : isNegAccepted ? (
              <button
                onClick={() => setShowPickupForm(true)}
                className="col-span-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Logistics (propose_pickup)</span>
              </button>
            ) : (
              <div className="col-span-2 py-2 text-center text-xs text-zinc-500 font-mono">
                Negotiation session terminated.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
