"use client";

import { useState } from "react";

type AuthMode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "Authentication failed.");
      setLoading(false);
      return;
    }

    window.location.href = "/account";
  }

  return (
    <div className="authCard">
      <div className="authSwitch" role="tablist" aria-label="Authentication mode">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          Sign in
        </button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          Create account
        </button>
      </div>

      <a className="googleButton" href="/api/auth/google">
        Continue with Google
      </a>

      <form onSubmit={handleSubmit} className="authForm">
        {mode === "register" && (
          <label>
            Name
            <input name="name" autoComplete="name" minLength={2} required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" minLength={8} required />
        </label>
        {message && <p className="formMessage">{message}</p>}
        <button className="primaryCta compact" disabled={loading} type="submit">
          {loading ? "Please wait" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
