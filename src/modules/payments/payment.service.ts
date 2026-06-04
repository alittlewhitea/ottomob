import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type Stripe from "stripe";
import { appConfig } from "@/lib/config";
import { getMysqlPool } from "@/lib/db/mysql";
import { getStripeClient } from "@/lib/payments/stripe";

export type RechargeStatus = "pending" | "paid" | "failed" | "canceled";

export type Recharge = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: RechargeStatus;
  provider: "stripe";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

type RechargeRow = RowDataPacket & {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  status: RechargeStatus;
  provider: "stripe";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: Date | null;
  created_at: Date;
};

type UserBalanceRow = RowDataPacket & {
  id: number;
  balance: string;
};

function mapRecharge(row: RechargeRow): Recharge {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    paidAt: row.paid_at ? row.paid_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

function normalizeAmount(amount: number) {
  return Number(amount.toFixed(2));
}

function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

async function markRechargePaid(
  connection: PoolConnection,
  recharge: RechargeRow,
  stripePaymentIntentId: string | null,
) {
  if (recharge.status === "paid") {
    return;
  }

  const [userRows] = await connection.query<UserBalanceRow[]>(
    "SELECT id, balance FROM users WHERE id = ? FOR UPDATE",
    [recharge.user_id],
  );
  const user = userRows[0];

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const balanceBefore = Number(user.balance);
  const amount = Number(recharge.amount);
  const balanceAfter = Number((balanceBefore + amount).toFixed(4));

  await connection.execute(
    "UPDATE users SET balance = ? WHERE id = ?",
    [balanceAfter, recharge.user_id],
  );
  await connection.execute(
    `INSERT INTO wallet_transactions
      (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
     VALUES (?, 'recharge', ?, ?, ?, 'recharge', ?, ?)`,
    [
      recharge.user_id,
      amount,
      balanceBefore,
      balanceAfter,
      recharge.id,
      `Stripe recharge #${recharge.id}`,
    ],
  );
  await connection.execute(
    `UPDATE recharges
     SET status = 'paid', stripe_payment_intent_id = ?, paid_at = COALESCE(paid_at, NOW())
     WHERE id = ?`,
    [stripePaymentIntentId, recharge.id],
  );
}

export const paymentService = {
  async listRechargesForUser(userId: number, limit = 10): Promise<Recharge[]> {
    const [rows] = await getMysqlPool().query<RechargeRow[]>(
      "SELECT * FROM recharges WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit],
    );
    return rows.map(mapRecharge);
  },

  async createStripeRechargeCheckout(input: {
    userId: number;
    email: string;
    amount: number;
  }) {
    const amount = normalizeAmount(input.amount);

    if (amount < 5 || amount > 5000) {
      throw new Error("INVALID_RECHARGE_AMOUNT");
    }

    const currency = appConfig.stripe.currency.toLowerCase();
    const [result] = await getMysqlPool().execute<ResultSetHeader>(
      "INSERT INTO recharges (user_id, amount, currency, status, provider) VALUES (?, ?, ?, 'pending', 'stripe')",
      [input.userId, amount, currency],
    );
    const rechargeId = result.insertId;
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      success_url: `${appConfig.appUrl}/funds?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appConfig.appUrl}/funds?status=cancelled`,
      metadata: {
        rechargeId: String(rechargeId),
        userId: String(input.userId),
      },
      payment_intent_data: {
        metadata: {
          rechargeId: String(rechargeId),
          userId: String(input.userId),
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: toMinorUnits(amount),
            product_data: {
              name: "OttoMob account balance",
              description: `Add $${amount.toFixed(2)} to your OttoMob balance`,
            },
          },
        },
      ],
    });

    await getMysqlPool().execute(
      "UPDATE recharges SET stripe_checkout_session_id = ? WHERE id = ?",
      [session.id, rechargeId],
    );

    return {
      rechargeId,
      checkoutUrl: session.url,
    };
  },

  async handleStripeCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.payment_status !== "paid") {
      return;
    }

    const connection = await getMysqlPool().getConnection();

    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<RechargeRow[]>(
        "SELECT * FROM recharges WHERE stripe_checkout_session_id = ? FOR UPDATE",
        [session.id],
      );
      const recharge = rows[0];

      if (!recharge) {
        throw new Error("RECHARGE_NOT_FOUND");
      }

      await markRechargePaid(
        connection,
        recharge,
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async markStripeCheckoutExpired(session: Stripe.Checkout.Session) {
    await getMysqlPool().execute(
      "UPDATE recharges SET status = 'canceled' WHERE stripe_checkout_session_id = ? AND status = 'pending'",
      [session.id],
    );
  },
};
