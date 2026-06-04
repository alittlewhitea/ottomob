import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { paymentService } from "@/modules/payments/payment.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature || !appConfig.stripe.webhookSecret) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      appConfig.stripe.webhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      await paymentService.handleStripeCheckoutCompleted(event.data.object);
    }

    if (event.type === "checkout.session.expired") {
      await paymentService.markStripeCheckoutExpired(event.data.object);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
