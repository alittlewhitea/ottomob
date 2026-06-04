"use client";

import { useMemo, useState } from "react";
import type { SmmService } from "@/modules/services/catalog.service";

export function OrderForm({ service }: { service: SmmService }) {
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(service.minQuantity);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const charge = useMemo(
    () => ((service.rate * quantity) / 1000).toFixed(4),
    [quantity, service.rate],
  );

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: service.id,
        link,
        quantity,
      }),
    });
    const data = (await response.json()) as { message?: string };

    if (response.status === 401) {
      window.location.href = `/login?next=/services/${service.id}`;
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "Order creation failed.");
      setLoading(false);
      return;
    }

    window.location.href = "/account?order=created";
  }

  return (
    <form className="orderForm" onSubmit={submitOrder}>
      <label>
        Profile, post, video, channel, or group link
        <input
          autoComplete="url"
          name="link"
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://..."
          required
          type="url"
          value={link}
        />
      </label>

      <label>
        Quantity
        <input
          max={service.maxQuantity}
          min={service.minQuantity}
          name="quantity"
          onChange={(event) => setQuantity(Number(event.target.value))}
          required
          step={service.quantityStep}
          type="number"
          value={quantity}
        />
      </label>

      <div className="quantityHints">
        <span>Min {service.minQuantity}</span>
        <span>Max {service.maxQuantity}</span>
        <span>Step {service.quantityStep}</span>
      </div>

      <div className="orderEstimate">
        <span>Estimated charge</span>
        <strong>${charge}</strong>
      </div>

      {message && <p className="formMessage">{message}</p>}
      {message.toLowerCase().includes("insufficient") && (
        <a className="softButton accountSoftButton" href="/funds">
          Add Funds
        </a>
      )}

      <button className="primaryCta compact" disabled={loading} type="submit">
        {loading ? "Creating order" : "Create Pending Order"}
      </button>
    </form>
  );
}
