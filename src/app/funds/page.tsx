import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userService } from "@/modules/users/user.service";

export default async function FundsPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const user = await userService.findById(sessionUser.id);

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
          Payment connection is reserved for the next stage. This page is ready
          for card, crypto, or third-party checkout providers.
        </p>

        <div className="accountTiles">
          <article>
            <strong>Current balance</strong>
            <span>${user.balance.toFixed(2)}</span>
          </article>
          <article>
            <strong>Payment status</strong>
            <span>Reserved</span>
          </article>
          <article>
            <strong>Currency</strong>
            <span>USD</span>
          </article>
        </div>
      </section>
    </main>
  );
}
