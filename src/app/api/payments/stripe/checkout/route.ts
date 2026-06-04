import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { paymentService } from "@/modules/payments/payment.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in before adding funds." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const amount = Number(body.amount);

  if (!Number.isFinite(amount)) {
    return NextResponse.json({ message: "Invalid amount." }, { status: 422 });
  }

  try {
    const checkout = await paymentService.createStripeRechargeCheckout({
      userId: user.id,
      email: user.email,
      amount,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RECHARGE_AMOUNT") {
      return NextResponse.json(
        { message: "Recharge amount must be between $5 and $5,000." },
        { status: 422 },
      );
    }

    if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") {
      return NextResponse.json({ message: "Stripe is not configured." }, { status: 500 });
    }

    return NextResponse.json({ message: "Unable to start Stripe checkout." }, { status: 500 });
  }
}
