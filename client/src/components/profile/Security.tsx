"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/lib/useProfile";

const input = "ring-1 ring-gray-300 rounded-md p-2 w-full text-sm";
const label = "text-xs font-medium text-gray-600 flex flex-col gap-1";

const SecurityPage = () => {
  const { refresh } = useAuth();
  const { profile, reload } = useProfile();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) return setMsg({ ok: false, text: "New passwords don't match" });
    setBusy(true);
    try {
      await apiFetch("/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg({ ok: true, text: "Password updated. You were signed out on all other devices." });
      await reload();
      await refresh();
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Password</h1>
      {!profile.hasPassword && (
        <p className="text-sm bg-blue-50 text-blue-900 rounded-md p-3">
          You signed up with Google, so you have no password yet. Set one to also log in with your email.
        </p>
      )}

      {profile.hasPassword && (
        <label className={label}>
          Current password
          <input className={input} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
      )}
      <label className={label}>
        New password (min 6 characters)
        <input className={input} type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={6} required />
      </label>
      <label className={label}>
        Confirm new password
        <input className={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
      </label>

      <p className="text-xs text-gray-500">Changing your password signs you out everywhere else.</p>
      {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

      <button disabled={busy} className="rounded-md bg-lama text-white text-sm px-4 py-2 w-max disabled:opacity-60">
        {busy ? "Saving..." : profile.hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
};

export default SecurityPage;