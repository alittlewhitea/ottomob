import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { paymentService } from "@/modules/payments/payment.service";
import { userService } from "@/modules/users/user.service";
import { RechargeForm } from "./RechargeForm";

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const [user, recharges, params] = await Promise.all([
    userService.findById(sessionUser.id),
    paymentService.listRechargesForUser(sessionUser.id),
    searchParams,
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="accountPage">
      <section className="accountHeader">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
          <span>OttoMob</span>
        </a>
        <a className="accountLink" href="/account">
          Account
        </a>
      </section>

      <section className="accountPanel fundsPanel">
        <p className="eyebrow">Add funds</p>
        <h1>Recharge balance</h1>
        <p>
          Add balance with Stripe Checkout. Successful payments are credited by
          Stripe webhook after the payment is confirmed.
        </p>

        <div className="accountTiles">
          <article>
            <strong>Current balance</strong>
            <span>${user.balance.toFixed(2)}</span>
          </article>
          <article>
            <strong>Payment status</strong>
            <span>Stripe</span>
          </article>
          <article>
            <strong>Currency</strong>
            <span>USD</span>
          </article>
        </div>

        {params.status === "success" && (
          <p className="successNotice">
            Stripe payment received. Balance updates after the webhook confirms it.
          </p>
        )}
        {params.status === "cancelled" && (
          <p className="formMessage">Checkout was cancelled. No funds were added.</p>
        )}

        <RechargeForm />
      </section>

      <section className="accountPanel ordersPanel">
        <div className="panelTitleRow">
          <div>
            <p className="eyebrow">Payments</p>
            <h2>Recent recharges</h2>
          </div>
        </div>

        {recharges.length ? (
          <div className="ordersTable rechargeTable">
            <div className="ordersTableHead">
              <span>ID</span>
              <span>Amount</span>
              <span>Provider</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            {recharges.map((recharge) => (
              <article className="orderRow" key={recharge.id}>
                <span>#{recharge.id}</span>
                <span>${recharge.amount.toFixed(2)}</span>
                <span>{recharge.provider}</span>
                <span className={`statusPill ${recharge.status}`}>{recharge.status}</span>
                <span>{new Date(recharge.createdAt).toLocaleDateString()}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyOrders">
            <strong>No recharges yet</strong>
            <p>Your Stripe recharge history will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
