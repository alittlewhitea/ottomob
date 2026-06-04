"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button className="softButton" disabled={loading} onClick={logout} type="button">
      {loading ? "Signing out" : "Sign out"}
    </button>
  );
}
