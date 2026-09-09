"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAdmin } from "@/app/actions";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(pin);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 320 }}
    >
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Admin PIN"
        className="pin-input"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={pending || pin.length === 0} className="btn btn-primary btn-block">
        {pending ? "Checking..." : "Enter"}
      </button>
      <Link href="/" className="link">
        ← Back
      </Link>
    </form>
  );
}
