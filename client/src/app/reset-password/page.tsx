"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Inner = () => {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const { refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords don't match");
    setBusy(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      await refresh(); // the server logs you in after a reset
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!token)
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <p className="text-red-600">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="underline text-sm">Request a new link</Link>
      </div>
    );

  const input = "ring-2 ring-gray-200 rounded-md p-4 w-full";
  return (
    <div className="min-h-[60vh] px-4 flex items-center justify-center">
      <form onSubmit={submit} className="flex flex-col gap-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <input className={input} type="password" placeholder="New password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <input className={input} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
        {error && (
          <div className="text-red-600 text-sm">
            {error}{" "}
            <Link href="/forgot-password" className="underline">Request a new link</Link>
          </div>
        )}
        <button disabled={busy} className="bg-lama text-white p-2 rounded-md disabled:bg-pink-200">
          {busy ? "Saving..." : "Reset password"}
        </button>
      </form>
    </div>
  );
};

const ResetPasswordPage = () => (
  <Suspense fallback={null}>
    <Inner />
  </Suspense>
);

export default ResetPasswordPage;