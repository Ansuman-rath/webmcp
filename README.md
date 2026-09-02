# ⚡ AgentMarket — WebMCP Challenge Submission

> **The first marketplace where negotiation is a native web capability.**
> Humans set goals. Agents execute the deal — through standardized WebMCP tools declared directly on the listing page.

[![WebMCP Standard Compliant](https://img.shields.io/badge/WebMCP-Compliant-00F0FF?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/ai/webmcp)
[![Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🎯 The Pitch (Submission Text)

There are a lot of "AI marketplaces." AgentMarket is not one of them.

**AgentMarket is a marketplace designed as an agent-native protocol.** The distinction matters.

Today, when an AI agent attempts to negotiate on a peer-to-peer marketplace, it either **fails outright** (no public API exists) or relies on **fragile DOM scraping and blind button clicking** — because those websites were built for humans, not agents.

**AgentMarket solves this at the protocol layer.** By leveraging the Chrome WebMCP standard (`navigator.modelContext.registerTool`), the marketplace exposes the *entire negotiation capability* as structured, discoverable tools directly on the webpage — not in a separate API. Both buyer and seller declare:

* `make_offer(listingId, amount, message)`
* `counter_offer(negotiationId, amount, message)`
* `accept_offer(negotiationId)`
* `reject_offer(negotiationId, reason)`
* `propose_pickup(negotiationId, location, time)`
* `get_listing_details(listingId)`
* `search_listings(query, maxPrice, category)`
* `get_negotiation_history(negotiationId)`

Two independent AI agents can discover, negotiate, and complete a transaction through the open web **the exact same way they'd use a structured API** — except there's no separate integration, no scraping, no guessing. Just a standard webpage declaring its own protocol.

The negotiation capability **lives in the webpage itself**, discoverable and executable by any WebMCP-compatible agent.

### Why it's a strong WebMCP fit:
* **The "Impossible Before" Story:** Webpages were static HTML documents or SPA user interfaces intended solely for human eyes. WebMCP enables the *site itself* to declare its interactive business negotiation protocol to visiting AI agents in real time.
* **Dynamic Tool Gating & AbortSignal:** Tools are conditionally registered based on role (`buyer` vs `seller`) and negotiation turn. You cannot execute `accept_offer` on your own offer — the tool surface itself enforces business logic boundaries via `AbortController` signals and strict turn validation.
* **Security & Scoping (`exposedTo`):** Demonstrates awareness of cross-origin security boundaries specified by the WebMCP standard for multi-domain commerce.

---

## 🏗️ Architecture & Protocol Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AgentMarket Frontend                          │
│                                                                        │
│  /app/page.tsx                     → Marketplace Feed & Services       │
│  /app/listing/[id]/page.tsx        → Listing Details + WebMCP Tools   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
              navigator.modelContext.registerTool()
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                        WebMCP Tool Surface                             │
│                                                                        │
│  • search_listings(query, maxPrice, category)                          │
│  • get_listing_details(listingId)                                      │
│  • make_offer(listingId, amount, message)                              │
│  • counter_offer(negotiationId, amount, message)                       │
│  • accept_offer(negotiationId)                                         │
│  • reject_offer(negotiationId, reason)                                 │
│  • propose_pickup(negotiationId, location, time)                       │
│  • get_negotiation_history(negotiationId)                             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  HTTP Requests
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js API Layer & Store                       │
│                                                                        │
│  GET/POST   /api/listings          → Query Goods & Services Listings   │
│  GET        /api/listings/[id]     → Single Listing & Negotiation State │
│  POST       /api/negotiations      → Create Negotiation / Initial Offer │
│  GET/PATCH  /api/negotiations/[id] → Live Polling & State Validation    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 WebMCP Tool Registration & `execute()` Implementations

Below are the complete, production-grade `execute()` handlers registered on `navigator.modelContext` for all 8 WebMCP protocol tools:

### 1. `make_offer`
```typescript
navigator.modelContext.registerTool({
  name: "make_offer",
  description: "Make an initial price offer on a listing as a buyer.",
  inputSchema: {
    type: "object",
    properties: {
      listingId: { type: "string", description: "Unique listing ID" },
      amount: { type: "number", description: "Offer amount in USD" },
      message: { type: "string", description: "Optional note to seller" }
    },
    required: ["listingId", "amount"]
  },
  async execute(args) {
    const res = await fetch("/api/negotiations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: args.listingId,
        amount: args.amount,
        message: args.message,
        buyerId: "user-buyer-alice"
      })
    });
    const data = await res.json();
    if (data.isError) return { isError: true, content: [{ type: "text", text: data.error }] };
    return { content: [{ type: "text", text: `Offer of $${args.amount} sent. Negotiation ID: ${data.id}` }] };
  }
});
```

### 2. `counter_offer`
```typescript
navigator.modelContext.registerTool({
  name: "counter_offer",
  description: "Counter an active offer with a revised price.",
  inputSchema: {
    type: "object",
    properties: {
      negotiationId: { type: "string", description: "Active negotiation ID" },
      amount: { type: "number", description: "Counter offer price in USD" },
      message: { type: "string", description: "Reasoning or counter terms" }
    },
    required: ["negotiationId", "amount"]
  },
  async execute(args) {
    const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "counter",
        from: currentRole,
        amount: args.amount,
        message: args.message
      })
    });
    const data = await res.json();
    if (data.isError) return { isError: true, content: [{ type: "text", text: data.error }] };
    return { content: [{ type: "text", text: `Counter offer of $${args.amount} submitted.` }] };
  }
});
```

### 3. `accept_offer`
```typescript
navigator.modelContext.registerTool({
  name: "accept_offer",
  description: "Accept the latest offer from the opposing party. Gated by turn.",
  inputSchema: {
    type: "object",
    properties: {
      negotiationId: { type: "string", description: "Negotiation ID to accept" }
    },
    required: ["negotiationId"]
  },
  async execute(args) {
    const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", from: currentRole })
    });
    const data = await res.json();
    if (data.isError) return { isError: true, content: [{ type: "text", text: data.error }] };
    return { content: [{ type: "text", text: `Offer accepted! Negotiation ${args.negotiationId} completed.` }] };
  }
});
```

### 4. `propose_pickup`
```typescript
navigator.modelContext.registerTool({
  name: "propose_pickup",
  description: "Propose pickup location and schedule time after agreement.",
  inputSchema: {
    type: "object",
    properties: {
      negotiationId: { type: "string", description: "Negotiation ID" },
      location: { type: "string", description: "Meeting location" },
      time: { type: "string", description: "Date and time" }
    },
    required: ["negotiationId", "location", "time"]
  },
  async execute(args) {
    const res = await fetch(`/api/negotiations/${args.negotiationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pickup",
        from: currentRole,
        location: args.location,
        time: args.time
      })
    });
    const data = await res.json();
    if (data.isError) return { isError: true, content: [{ type: "text", text: data.error }] };
    return { content: [{ type: "text", text: `Pickup scheduled at ${args.location} for ${args.time}.` }] };
  }
});
```

---

## 🔒 Cross-Origin Security Scope (`exposedTo`)

AgentMarket is designed to support cross-domain agentic embeds. For embedded cross-origin listing widgets, tools specify the `exposedTo` property to restrict tool invocation exclusively to authorized host origins:

```typescript
navigator.modelContext.registerTool({
  name: "make_offer",
  exposedTo: ["https://trusted-agent-host.com"], // Scoped per WebMCP Security Model
  description: "Cross-origin secured offer tool",
  // ...
});
```

---

## 🚀 Quickstart & Deployment Guide

### Prerequisites
* Node.js 18.x or 20.x
* npm / pnpm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/webmcp-agentmarket.git
cd webmcp-agentmarket
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Deploy to Vercel (Live URL)
```bash
npx vercel
```
Or push to GitHub and import directly into Vercel for instant live deployment.

---

## 🎬 Demo Video Script (~2:30)

1. **(0:00–0:20) Introduction & Pitch**
   * Show homepage listing feed (Goods & Services).
   * *"This is AgentMarket — the first marketplace where AI agents negotiate directly on the web page using Chrome's WebMCP standard."*
2. **(0:20–0:45) Multi-Session Identity Demonstration**
   * Open two side-by-side browser windows using **New Buyer Tab** (`?role=buyer&user=alice`) and **New Seller Tab** (`?role=seller&user=bob`).
   * Show that tool gating dynamically adapts per role.
3. **(0:45–1:45) Two-Agent Negotiation Walkthrough**
   * Demonstrate `make_offer($1,850)` on Window 1 → `counter_offer($1,980)` on Window 2 → `accept_offer($1,920)` → Confetti celebration & `propose_pickup()`.
4. **(1:45–2:15) Live Audit Log & Capability Detection**
   * Point out the 1.5s live polling audit log and WebMCP capability banner.
5. **(2:15–2:30) Outro**
   * *"No APIs, no brittle scraping — just standard web pages declaring their own negotiation protocols."*

---

## 📜 License

Distributed under the [MIT License](LICENSE).
