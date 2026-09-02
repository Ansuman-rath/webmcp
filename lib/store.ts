export type ListingStatus = "available" | "pending" | "sold";

export type ListingCategory =
  | "Electronics"
  | "Vehicles"
  | "Furniture"
  | "Music"
  | "Home"
  | "Services"
  | "Other";

export type Listing = {
  id: string;
  title: string;
  description: string;
  askingPrice: number;
  sellerId: string;
  sellerName: string;
  category: ListingCategory;
  imageUrl: string;
  status: ListingStatus;
  createdAt: string;
  location: string;
  condition: "Brand New" | "Like New" | "Good" | "Fair" | "Professional Service";
};

export type OfferFrom = "buyer" | "seller";

export type Offer = {
  id: string;
  from: OfferFrom;
  userId: string;
  userName: string;
  amount: number;
  message?: string;
  ts: number;
};

export type NegotiationStatus = "open" | "accepted" | "rejected";

export type PickupDetails = {
  location: string;
  time: string;
  confirmedBy: ("buyer" | "seller")[];
};

export type Negotiation = {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  offers: Offer[];
  status: NegotiationStatus;
  pickup?: PickupDetails;
  createdAt: number;
  updatedAt: number;
};

// Seed initial listings including Goods and Services
const INITIAL_LISTINGS: Listing[] = [
  {
    id: "listing-1",
    title: "Specialized Turbo Vado 4.0 Electric Bike (2024)",
    description: "Mint condition e-bike with only 120 miles. Integrated battery, 70mi range, disc brakes, includes fast charger & Kryptonite lock.",
    askingPrice: 2100,
    sellerId: "seller-bob",
    sellerName: "Bob Miller (Tech Seller)",
    category: "Vehicles",
    imageUrl: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    location: "San Francisco, CA (SoMa)",
    condition: "Like New",
  },
  {
    id: "listing-6",
    title: "WebMCP Protocol Agent Integration & Architecture Consulting",
    description: "Full-stack consulting session to declare WebMCP client tools on your existing React / Next.js web application. Includes security auditing & exposedTo scoping.",
    askingPrice: 450,
    sellerId: "seller-dev",
    sellerName: "Devin Vance (WebMCP Architect)",
    category: "Services",
    imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    location: "Remote / Online",
    condition: "Professional Service",
  },
  {
    id: "listing-2",
    title: "Herman Miller Aeron Chair - Size B (Fully Loaded)",
    description: "Fully loaded Aeron Chair with lumbar support, posturefit, tilt lock, adjustable armrests. Ergo perfection for remote work.",
    askingPrice: 650,
    sellerId: "seller-sarah",
    sellerName: "Sarah Lin (Designer)",
    category: "Furniture",
    imageUrl: "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    location: "Palo Alto, CA",
    condition: "Good",
  },
  {
    id: "listing-3",
    title: "Sony Alpha a7 IV Full-Frame Camera + FE 24-70mm f/2.8 GM",
    description: "Professional camera setup. Barely 3,500 shutter actuations. Comes with original box, 2 batteries, dual charger, and peak design strap.",
    askingPrice: 1850,
    sellerId: "seller-alex",
    sellerName: "Alex Rivera (Photographer)",
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    location: "San Jose, CA",
    condition: "Brand New",
  },
  {
    id: "listing-4",
    title: "Italian Cognac Top-Grain Leather Mid-Century Sofa",
    description: "Authentic caramel/cognac Italian leather couch. 84 inches wide, incredibly comfortable patina, solid walnut legs.",
    askingPrice: 920,
    sellerId: "seller-elena",
    sellerName: "Elena Rostova",
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    location: "Berkeley, CA",
    condition: "Like New",
  },
  {
    id: "listing-5",
    title: "Fender American Professional II Stratocaster - Olympic White",
    description: "Deep C neck profile, V-Mod II single-coil pickups, treble bleed circuit. Includes molded hardshell case and certificate of authenticity.",
    askingPrice: 1250,
    sellerId: "seller-dave",
    sellerName: "Dave Grohl",
    category: "Music",
    imageUrl: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=1200&auto=format&fit=crop",
    status: "available",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    location: "Oakland, CA",
    condition: "Brand New",
  },
];

// Initial negotiation
const INITIAL_NEGOTIATIONS: Negotiation[] = [
  {
    id: "neg-demo-1",
    listingId: "listing-1",
    buyerId: "buyer-alice",
    buyerName: "Alice (Buyer Agent)",
    sellerId: "seller-bob",
    sellerName: "Bob Miller (Tech Seller)",
    status: "open",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    offers: [
      {
        id: "off-1",
        from: "buyer",
        userId: "buyer-alice",
        userName: "Alice Agent",
        amount: 1800,
        message: "Hi Bob! Willing to do $1,800 for prompt cash pickup today.",
        ts: Date.now() - 3600000,
      },
      {
        id: "off-2",
        from: "seller",
        userId: "seller-bob",
        userName: "Bob Miller",
        amount: 1950,
        message: "Thanks Alice! $1,800 is a bit low given mileage. Can do $1,950 with Kryptonite lock included.",
        ts: Date.now() - 1800000,
      },
    ],
  },
];

// Global in-memory storage singleton
const globalStore = globalThis as unknown as {
  __agentMarketListings?: Listing[];
  __agentMarketNegotiations?: Negotiation[];
};

if (!globalStore.__agentMarketListings) {
  globalStore.__agentMarketListings = [...INITIAL_LISTINGS];
}

if (!globalStore.__agentMarketNegotiations) {
  globalStore.__agentMarketNegotiations = [...INITIAL_NEGOTIATIONS];
}

export function getListings(query?: string, maxPrice?: number, category?: string): Listing[] {
  let list = globalStore.__agentMarketListings || [];

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }

  if (maxPrice !== undefined && maxPrice > 0) {
    list = list.filter((item) => item.askingPrice <= maxPrice);
  }

  if (category && category !== "All") {
    list = list.filter((item) => item.category === category);
  }

  return list;
}

export function getListingById(id: string): Listing | undefined {
  return globalStore.__agentMarketListings?.find((item) => item.id === id);
}

export function createListing(data: Omit<Listing, "id" | "createdAt" | "status">): Listing {
  const newListing: Listing = {
    ...data,
    id: `listing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: "available",
    createdAt: new Date().toISOString(),
  };
  globalStore.__agentMarketListings?.unshift(newListing);
  return newListing;
}

export function getNegotiationById(id: string): Negotiation | undefined {
  return globalStore.__agentMarketNegotiations?.find((n) => n.id === id);
}

export function getNegotiationForListing(listingId: string, buyerId?: string): Negotiation | undefined {
  const list = globalStore.__agentMarketNegotiations || [];
  if (buyerId && buyerId !== "any" && !buyerId.startsWith("seller") && !buyerId.startsWith("user-seller")) {
    const matched = list.find((n) => n.listingId === listingId && n.buyerId === buyerId);
    if (matched) return matched;
  }
  // Default to returning the latest negotiation for this listing so sellers & buyers see the shared thread
  return list.find((n) => n.listingId === listingId);
}

export function createNegotiation(params: {
  listingId: string;
  buyerId: string;
  buyerName?: string;
  amount: number;
  message?: string;
}): Negotiation {
  if (params.amount <= 0) {
    throw new Error("Offer amount must be greater than $0.");
  }

  const listing = getListingById(params.listingId);
  if (!listing) {
    throw new Error("Listing not found.");
  }

  const existing = getNegotiationForListing(params.listingId, params.buyerId);
  if (existing) {
    if (existing.status !== "open") {
      throw new Error(`Negotiation is already ${existing.status}. Cannot make new offers.`);
    }

    const lastOffer = existing.offers[existing.offers.length - 1];
    if (lastOffer && lastOffer.from === "buyer") {
      throw new Error("Out of turn: You already submitted the last offer. Waiting for seller response.");
    }

    existing.offers.push({
      id: `off-${Date.now()}`,
      from: "buyer",
      userId: params.buyerId,
      userName: params.buyerName || "Buyer Agent",
      amount: params.amount,
      message: params.message,
      ts: Date.now(),
    });
    existing.updatedAt = Date.now();
    return existing;
  }

  const newNeg: Negotiation = {
    id: `neg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    listingId: params.listingId,
    buyerId: params.buyerId,
    buyerName: params.buyerName || "Buyer Agent",
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    offers: [
      {
        id: `off-${Date.now()}`,
        from: "buyer",
        userId: params.buyerId,
        userName: params.buyerName || "Buyer Agent",
        amount: params.amount,
        message: params.message,
        ts: Date.now(),
      },
    ],
  };

  globalStore.__agentMarketNegotiations?.unshift(newNeg);
  return newNeg;
}

export function addCounterOffer(params: {
  negotiationId: string;
  from: OfferFrom;
  userId: string;
  userName?: string;
  amount: number;
  message?: string;
}): Negotiation {
  if (params.amount <= 0) {
    throw new Error("Counter offer amount must be greater than $0.");
  }

  const neg = getNegotiationById(params.negotiationId);
  if (!neg) throw new Error("Negotiation session not found.");
  if (neg.status !== "open") throw new Error(`Negotiation is already ${neg.status}.`);

  const lastOffer = neg.offers[neg.offers.length - 1];
  if (lastOffer && lastOffer.from === params.from) {
    throw new Error(`Out of turn: It is not the ${params.from}'s turn to counter. Waiting for opposing party.`);
  }

  neg.offers.push({
    id: `off-${Date.now()}`,
    from: params.from,
    userId: params.userId,
    userName: params.userName || (params.from === "buyer" ? "Buyer Agent" : "Seller Agent"),
    amount: params.amount,
    message: params.message,
    ts: Date.now(),
  });
  neg.updatedAt = Date.now();

  return neg;
}

export function acceptOffer(negotiationId: string, actingRole: OfferFrom): Negotiation {
  const neg = getNegotiationById(negotiationId);
  if (!neg) throw new Error(`Negotiation session '${negotiationId}' not found.`);
  if (neg.status !== "open") throw new Error(`Negotiation is already ${neg.status}.`);

  const lastOffer = neg.offers[neg.offers.length - 1];
  if (!lastOffer) throw new Error("No offers exist to accept.");

  // Strict Protocol Turn Enforcement: Cannot accept an offer made by your own role!
  if (lastOffer.from === actingRole) {
    throw new Error(
      `Out of turn: You (${actingRole}) submitted the latest offer. Only the opposing party can accept.`
    );
  }

  neg.status = "accepted";
  neg.updatedAt = Date.now();

  const listing = getListingById(neg.listingId);
  if (listing) {
    listing.status = "pending";
  }

  return neg;
}

export function rejectOffer(negotiationId: string, actingRole: OfferFrom, reason?: string): Negotiation {
  const neg = getNegotiationById(negotiationId);
  if (!neg) throw new Error(`Negotiation session '${negotiationId}' not found.`);
  if (neg.status !== "open") throw new Error(`Negotiation is already ${neg.status}.`);

  const lastOffer = neg.offers[neg.offers.length - 1];
  if (lastOffer && lastOffer.from === actingRole) {
    throw new Error(`Out of turn: You cannot reject an offer made by yourself.`);
  }

  neg.status = "rejected";
  neg.updatedAt = Date.now();

  if (reason && lastOffer) {
    lastOffer.message = `${lastOffer.message || ""} [Declined: ${reason}]`.trim();
  }

  return neg;
}

export function proposePickup(params: {
  negotiationId: string;
  location: string;
  time: string;
  confirmedByRole: "buyer" | "seller";
}): Negotiation {
  const neg = getNegotiationById(params.negotiationId);
  if (!neg) throw new Error(`Negotiation session '${params.negotiationId}' not found.`);
  if (neg.status !== "accepted") {
    throw new Error(`Cannot propose pickup logistics until offer is accepted (current status: ${neg.status}).`);
  }

  if (!params.location || !params.time) {
    throw new Error("Both pickup location and time must be specified.");
  }

  if (!neg.pickup) {
    neg.pickup = {
      location: params.location,
      time: params.time,
      confirmedBy: [params.confirmedByRole],
    };
  } else {
    neg.pickup.location = params.location;
    neg.pickup.time = params.time;
    if (!neg.pickup.confirmedBy.includes(params.confirmedByRole)) {
      neg.pickup.confirmedBy.push(params.confirmedByRole);
    }
  }

  if (neg.pickup.confirmedBy.includes("buyer") && neg.pickup.confirmedBy.includes("seller")) {
    const listing = getListingById(neg.listingId);
    if (listing) {
      listing.status = "sold";
    }
  }

  neg.updatedAt = Date.now();
  return neg;
}
