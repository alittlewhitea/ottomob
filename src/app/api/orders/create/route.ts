import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeString } from "@/lib/http/validation";
import { orderService } from "@/modules/orders/order.service";

function isLikelyUrl(value: string) {
  return /^https?:\/\/[^\s.]+\.[^\s]+/i.test(value);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in before placing an order." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const serviceId = Number(body.serviceId);
  const quantity = Number(body.quantity);
  const link = normalizeString(body.link);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ message: "Invalid service." }, { status: 422 });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ message: "Invalid quantity." }, { status: 422 });
  }

  if (!isLikelyUrl(link) || link.length > 700) {
    return NextResponse.json({ message: "Please enter a valid public profile or post URL." }, { status: 422 });
  }

  try {
    const order = await orderService.createLocalOrder({
      userId: user.id,
      serviceId,
      quantity,
      link,
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json({ message: "Service not found." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INVALID_QUANTITY") {
      return NextResponse.json(
        { message: "Quantity must follow this service's minimum, maximum, and step rules." },
        { status: 422 },
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { message: "Insufficient balance. Please add funds before placing this order." },
        { status: 402 },
      );
    }

    if (error instanceof Error && error.message === "SUPPLIER_NOT_CONFIGURED") {
      return NextResponse.json(
        { message: "Supplier API is not configured. Your balance was refunded." },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message === "SUPPLIER_ORDER_FAILED") {
      return NextResponse.json(
        { message: "Supplier order failed. Your balance was refunded automatically." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: "Order creation failed." }, { status: 500 });
  }
}
