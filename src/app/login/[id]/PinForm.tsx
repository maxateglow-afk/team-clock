"use client";

import { useState, useTransition } from "react";
import { loginEmployee } from "@/app/actions";

export default function PinForm({ employeeId }: { employeeId: string }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await loginEmployee(employeeId, pin);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}
    >
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN"
        className="pin-input"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={pending || pin.length === 0} className="btn btn-primary btn-block">
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
