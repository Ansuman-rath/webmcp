import { NextResponse } from "next/server";
import { createNegotiation } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, buyerId, buyerName, amount, message } = body;

    if (!listingId || !amount) {
      return NextResponse.json(
        { error: "listingId and amount are required" },
        { status: 400 }
      );
    }

    const negotiation = createNegotiation({
      listingId,
      buyerId: buyerId || "buyer-alice",
      buyerName: buyerName || "Alice Agent (Buyer)",
      amount: Number(amount),
      message,
    });

    return NextResponse.json({
      success: true,
      id: negotiation.id,
      negotiation,
      message: `Offer of $${amount} created successfully.`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error creating negotiation";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
