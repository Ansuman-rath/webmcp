import { NextResponse } from "next/server";
import { getListingById, getNegotiationForListing } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const buyerId = searchParams.get("buyerId") || "buyer-alice";
  const negotiation = getNegotiationForListing(id, buyerId);

  return NextResponse.json({ listing, negotiation });
}
