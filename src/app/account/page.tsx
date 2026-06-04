import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { orderService } from "@/modules/orders/order.service";
import { userService } from "@/modules/users/user.service";
import { LogoutButton } from "./LogoutButton";

export default async function AccountPage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const [user, orders] = await Promise.all([
    userService.findById(sessionUser.id),
    orderService.listForUser(sessionUser.id),
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
        <LogoutButton />
      </section>

      <section className="accountPanel">
        <p className="eyebrow">Account</p>
        <h1>{user.name ?? user.email}</h1>
        <p>{user.email}</p>
        <div className="accountTiles">
          <article>
            <strong>Balance</strong>
            <span>${user.balance.toFixed(2)}</span>
          </article>
          <article>
            <strong>Orders</strong>
            <span>{orders.length}</span>
          </article>
          <article>
            <strong>Role</strong>
            <span>{user.role}</span>
          </article>
        </div>
        <div className="accountActions">
          <a className="primaryCta compact" href="/funds">
            Add Funds
          </a>
          <a className="softButton accountSoftButton" href="/#all-services">
            Browse Services
          </a>
        </div>
      </section>

      <section className="accountPanel ordersPanel">
        <div className="panelTitleRow">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Recent orders</h2>
          </div>
        </div>

        {orders.length ? (
          <div className="ordersTable">
            <div className="ordersTableHead">
              <span>Order</span>
              <span>Service</span>
              <span>Quantity</span>
              <span>Charge</span>
              <span>Status</span>
            </div>
            {orders.map((order) => (
              <article className="orderRow" key={order.id}>
                <span>
                  #{order.id}
                  {order.externalOrderId && <small>Supplier #{order.externalOrderId}</small>}
                </span>
                <span>
                  <b>{order.serviceName}</b>
                  <small>{order.platform}</small>
                </span>
                <span>{order.quantity}</span>
                <span>${order.charge.toFixed(4)}</span>
                <span className={`statusPill ${order.status}`}>
                  {order.status} / {order.paymentStatus}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyOrders">
            <strong>No orders yet</strong>
            <p>Your pending local orders will appear here before payment and supplier submission are connected.</p>
          </div>
        )}
      </section>
    </main>
  );
}
