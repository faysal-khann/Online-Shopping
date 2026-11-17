"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const VerifyEmailPage = () => {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (loading) return null;
  if (!user)
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Link href="/login" className="underline">Log in to verify your email</Link>
      </div>
    );
  if (user.emailVerified)
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Email verified</h1>
        <Link href="/list" className="rounded-md bg-lama text-white px-5 py-2 text-sm">Start shopping</Link>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch("/auth/verify-email", { method: "POST", body: JSON.stringify({ code }) });
      await refresh();
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await apiFetch("/auth/resend-verification", { method: "POST" });
      setInfo("A new code has been sent.");
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="min-h-[60vh] px-4 flex items-center justify-center">
      <form onSubmit={submit} className="flex flex-col gap-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="text-sm text-gray-500">
          We sent a 6-digit code to <strong>{user.email}</strong>. It expires in 10 minutes.
        </p>
        <input
          className="ring-2 ring-gray-200 rounded-md p-4 w-full text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {info && <div className="text-green-700 text-sm">{info}</div>}
        <button
          disabled={busy || code.length !== 6}
          className="bg-lama text-white p-2 rounded-md disabled:bg-pink-200"
        >
          {busy ? "Verifying..." : "Verify"}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="text-sm underline disabled:no-underline disabled:text-gray-400"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmailPage;