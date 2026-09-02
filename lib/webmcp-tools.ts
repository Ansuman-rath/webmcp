import { RegisteredTool } from "@/components/WebMcpProvider";

export function getWebMcpToolDefinitions(
  currentRole: "buyer" | "seller",
  negotiationState?: {
    id: string;
    status: "open" | "accepted" | "rejected";
    lastOfferFrom?: "buyer" | "seller";
  } | null
): RegisteredTool[] {
  const isNegOpen = negotiationState?.status === "open";
  const isNegAccepted = negotiationState?.status === "accepted";
  const lastFrom = negotiationState?.lastOfferFrom;

  // Logic gating based on business context
  // Buyer can make an offer if no negotiation exists or to initiate
  const canMakeOffer = currentRole === "buyer" && (!negotiationState || !isNegOpen);

  // Counter offer: available when open and it's your turn (last offer was from the other party)
  const isYourTurn = isNegOpen && lastFrom !== undefined && lastFrom !== currentRole;
  const canCounter = isNegOpen && (isYourTurn || !lastFrom);

  // Accept offer: available when open and last offer came from the OTHER party
  const canAccept = isNegOpen && lastFrom !== undefined && lastFrom !== currentRole;

  // Reject offer: available when open and last offer came from the OTHER party
  const canReject = isNegOpen && lastFrom !== undefined && lastFrom !== currentRole;

  // Propose pickup: available when negotiation status is "accepted"
  const canProposePickup = isNegAccepted;

  return [
    {
      name: "search_listings",
      description: "Search and browse marketplace listings by keywords, max price, or category.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search terms (e.g. 'e-bike', 'camera', 'desk')" },
          maxPrice: { type: "number", description: "Maximum asking price in USD" },
          category: { type: "string", description: "Category filter (Electronics, Vehicles, Furniture, Music, Home)" },
        },
      },
      roleGating: "all",
      isActive: true,
    },
    {
      name: "get_listing_details",
      description: "Retrieve comprehensive details for a specific listing including condition, price, seller info, and active negotiation status.",
      inputSchema: {
        type: "object",
        properties: {
          listingId: { type: "string", description: "Unique listing ID (e.g. 'listing-1')" },
        },
        required: ["listingId"],
      },
      roleGating: "all",
      isActive: true,
    },
    {
      name: "make_offer",
      description: "Make an initial price offer on a listing as a buyer. Creates a new negotiation session.",
      inputSchema: {
        type: "object",
        properties: {
          listingId: { type: "string", description: "Listing ID to make an offer on" },
          amount: { type: "number", description: "Offer amount in USD" },
          message: { type: "string", description: "Optional message or terms to the seller" },
        },
        required: ["listingId", "amount"],
      },
      roleGating: "buyer",
      isActive: canMakeOffer,
    },
    {
      name: "counter_offer",
      description: "Counter an active offer with a revised price and optional note. Gated by turn (only available when responding to the other party).",
      inputSchema: {
        type: "object",
        properties: {
          negotiationId: { type: "string", description: "Active negotiation ID" },
          amount: { type: "number", description: "Counter offer price in USD" },
          message: { type: "string", description: "Reasoning or note for the counter offer" },
        },
        required: ["negotiationId", "amount"],
      },
      roleGating: "all",
      isActive: canCounter,
    },
    {
      name: "accept_offer",
      description: "Accept the latest offer from the opposing party and close the price agreement phase. Gated to the party receiving the offer.",
      inputSchema: {
        type: "object",
        properties: {
          negotiationId: { type: "string", description: "Negotiation ID to accept" },
        },
        required: ["negotiationId"],
      },
      roleGating: "all",
      isActive: canAccept,
    },
    {
      name: "reject_offer",
      description: "Decline and terminate the current negotiation session with an optional reason.",
      inputSchema: {
        type: "object",
        properties: {
          negotiationId: { type: "string", description: "Negotiation ID to reject" },
          reason: { type: "string", description: "Optional reason for declining" },
        },
        required: ["negotiationId"],
      },
      roleGating: "all",
      isActive: canReject,
    },
    {
      name: "propose_pickup",
      description: "Propose pickup/hand-off location and schedule time after an offer has been accepted.",
      inputSchema: {
        type: "object",
        properties: {
          negotiationId: { type: "string", description: "Negotiation ID" },
          location: { type: "string", description: "Proposed pickup address or public meeting spot" },
          time: { type: "string", description: "Proposed date and time (e.g. 'Tomorrow at 4:00 PM')" },
        },
        required: ["negotiationId", "location", "time"],
      },
      roleGating: "all",
      isActive: canProposePickup,
    },
    {
      name: "get_negotiation_history",
      description: "Fetch full audit trail of offers, messages, and pickup details for context-aware decision making.",
      inputSchema: {
        type: "object",
        properties: {
          negotiationId: { type: "string", description: "Negotiation ID to inspect" },
        },
        required: ["negotiationId"],
      },
      roleGating: "all",
      isActive: true,
    },
  ];
}
