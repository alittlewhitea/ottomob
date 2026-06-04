export type PaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
};

export const paymentService = {
  // Later: recharge checkout, callbacks/webhooks, and user balance updates.
  async createIntent(_amount: number): Promise<PaymentIntent | null> {
    return null;
  },
};
