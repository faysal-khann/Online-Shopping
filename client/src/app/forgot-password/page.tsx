"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, errorMessage } from "@/lib/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDone(d.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[60vh] px-4 flex items-center justify-center">
      <form onSubmit={submit} className="flex flex-col gap-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Forgot your password?</h1>
        {done ? (
          <>
            <p className="text-gray-600">{done}</p>
            <Link href="/login" className="underline text-sm">Back to login</Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <input
              className="ring-2 ring-gray-200 rounded-md p-4 w-full"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button disabled={busy} className="bg-lama text-white p-2 rounded-md disabled:bg-pink-200">
              {busy ? "Sending..." : "Send reset link"}
            </button>
            <Link href="/login" className="underline text-sm">Back to login</Link>
          </>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;