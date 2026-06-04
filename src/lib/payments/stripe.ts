import Stripe from "stripe";
import { appConfig } from "@/lib/config";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (!appConfig.stripe.secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!stripe) {
    stripe = new Stripe(appConfig.stripe.secretKey);
  }

  return stripe;
}
