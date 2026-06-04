"use client";

import { useState } from "react";

const quickAmounts = [10, 25, 50, 100];

export function RechargeForm() {
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/payments/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = (await response.json()) as { checkoutUrl?: string; message?: string };

    if (!response.ok || !data.checkoutUrl) {
      setMessage(data.message ?? "Unable to start Stripe checkout.");
      setLoading(false);
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <form className="rechargeForm" onSubmit={startCheckout}>
      <div className="quickAmounts">
        {quickAmounts.map((value) => (
          <button
            className={amount === value ? "active" : ""}
            key={value}
            onClick={() => setAmount(value)}
            type="button"
          >
            ${value}
          </button>
        ))}
      </div>

      <label>
        Custom amount
        <input
          max={5000}
          min={5}
          onChange={(event) => setAmount(Number(event.target.value))}
          step={1}
          type="number"
          value={amount}
        />
      </label>

      {message && <p className="formMessage">{message}</p>}

      <button className="primaryCta compact" disabled={loading} type="submit">
        {loading ? "Redirecting" : "Pay with Stripe"}
      </button>
    </form>
  );
}
