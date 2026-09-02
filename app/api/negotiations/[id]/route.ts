import { NextResponse } from "next/server";
import {
  getNegotiationById,
  addCounterOffer,
  acceptOffer,
  rejectOffer,
  proposePickup,
  OfferFrom,
} from "@/lib/store";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const negotiation = getNegotiationById(id);

  if (!negotiation) {
    return NextResponse.json(
      { isError: true, error: `Negotiation '${id}' not found` },
      {
        status: 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  return NextResponse.json(
    { negotiation },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, from, userId, userName, amount, message, reason, location, time } = body;

    const actingRole: OfferFrom = from === "seller" ? "seller" : "buyer";
    let updated;

    switch (action) {
      case "counter": {
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { isError: true, error: "Valid counter offer amount in USD is required" },
            { status: 400 }
          );
        }
        updated = addCounterOffer({
          negotiationId: id,
          from: actingRole,
          userId: userId || `${actingRole}-agent`,
          userName: userName || `${actingRole.toUpperCase()} Agent`,
          amount: Number(amount),
          message,
        });
        break;
      }

      case "accept": {
        updated = acceptOffer(id, actingRole);
        break;
      }

      case "reject": {
        updated = rejectOffer(id, actingRole, reason);
        break;
      }

      case "pickup": {
        if (!location || !time) {
          return NextResponse.json(
            { isError: true, error: "Both pickup location and time are required for propose_pickup" },
            { status: 400 }
          );
        }
        updated = proposePickup({
          negotiationId: id,
          location,
          time,
          confirmedByRole: actingRole,
        });
        break;
      }

      default:
        return NextResponse.json(
          { isError: true, error: `Unknown action '${action}'. Valid: counter, accept, reject, pickup` },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        action,
        negotiation: updated,
        message: `WebMCP tool action '${action}' applied successfully to negotiation ${id}`,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error executing WebMCP negotiation tool update";
    return NextResponse.json(
      { isError: true, error: errorMessage },
      { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
