import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";

export default async function AccountPage() {
  const user = await getCurrentUser();

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
        <LogoutButton />
      </section>

      <section className="accountPanel">
        <p className="eyebrow">Account</p>
        <h1>{user.name ?? user.email}</h1>
        <p>{user.email}</p>
        <div className="accountTiles">
          <article>
            <strong>Balance</strong>
            <span>$0.00</span>
          </article>
          <article>
            <strong>Orders</strong>
            <span>Coming soon</span>
          </article>
          <article>
            <strong>Role</strong>
            <span>{user.role}</span>
          </article>
        </div>
      </section>
    </main>
  );
}
