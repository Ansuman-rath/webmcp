import { NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || undefined;
  const maxPriceStr = searchParams.get("maxPrice");
  const category = searchParams.get("category") || undefined;

  const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
  const listings = getListings(query, maxPrice, category);

  return NextResponse.json({ listings, count: listings.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, askingPrice, sellerId, sellerName, category, imageUrl, location, condition } = body;

    if (!title || !askingPrice || !sellerId) {
      return NextResponse.json(
        { error: "Missing required fields: title, askingPrice, sellerId" },
        { status: 400 }
      );
    }

    const listing = createListing({
      title,
      description: description || "",
      askingPrice: Number(askingPrice),
      sellerId,
      sellerName: sellerName || "Seller",
      category: category || "Other",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1200&auto=format&fit=crop",
      location: location || "San Francisco, CA",
      condition: condition || "Like New",
    });

    return NextResponse.json({ listing, message: "Listing created successfully" }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
