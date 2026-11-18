"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Profile, useProfile } from "@/lib/useProfile";

const input = "ring-1 ring-gray-300 rounded-md p-2 w-full text-sm";
const label = "text-xs font-medium text-gray-600 flex flex-col gap-1";
const card = "ring-1 ring-gray-200 rounded-md p-4 flex flex-col gap-4";

type Msg = { ok: boolean; text: string } | null;
const Note = ({ m }: { m: Msg }) =>
  m ? <p className={`text-sm ${m.ok ? "text-green-700" : "text-red-600"}`}>{m.text}</p> : null;

const AccountPage = () => {
  const { refresh } = useAuth();
  const router = useRouter();
  const { profile, setProfile } = useProfile();

  // email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "code">("form");
  const [emailMsg, setEmailMsg] = useState<Msg>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  // google
  const [googleMsg, setGoogleMsg] = useState<Msg>(null);

  // delete
  const [delPw, setDelPw] = useState("");
  const [delEmail, setDelEmail] = useState("");
  const [delMsg, setDelMsg] = useState<Msg>(null);
  const [delBusy, setDelBusy] = useState(false);

  // export
  const [exportMsg, setExportMsg] = useState<Msg>(null);

  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const d = await apiFetch<{ message: string }>("/profile/email/request", {
        method: "POST",
        body: JSON.stringify({ email: newEmail, password: emailPw }),
      });
      setStep("code");
      setEmailMsg({ ok: true, text: d.message });
    } catch (err) {
      setEmailMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setEmailBusy(false);
    }
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const d = await apiFetch<{ profile: Profile }>("/profile/email/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setProfile(d.profile);
      await refresh();
      setStep("form");
      setNewEmail("");
      setEmailPw("");
      setCode("");
      setEmailMsg({ ok: true, text: "Email updated" });
    } catch (err) {
      setEmailMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setEmailBusy(false);
    }
  };

  const unlink = async () => {
    if (!window.confirm("Disconnect Google from your account?")) return;
    setGoogleMsg(null);
    try {
      const d = await apiFetch<{ profile: Profile }>("/profile/unlink-google", { method: "POST" });
      setProfile(d.profile);
      setGoogleMsg({ ok: true, text: "Google disconnected" });
    } catch (err) {
      setGoogleMsg({ ok: false, text: errorMessage(err) });
    }
  };

  const download = async () => {
    setExportMsg(null);
    try {
      const res = await fetch(`${API_URL}/profile/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "cartiva-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportMsg({ ok: false, text: errorMessage(err) });
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("This permanently deletes your account. Continue?")) return;
    setDelBusy(true);
    setDelMsg(null);
    try {
      await apiFetch("/profile", {
        method: "DELETE",
        body: JSON.stringify({ password: delPw, confirmEmail: delEmail }),
      });
      await refresh(); // the cookie is gone, so this clears the user
      router.push("/");
    } catch (err) {
      setDelMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Account</h1>

      {/* EMAIL */}
      <section className={card}>
        <h2 className="font-semibold">Change email</h2>
        <p className="text-sm text-gray-500">
          Current email: <strong>{profile.email}</strong>
        </p>
        {step === "form" ? (
          <form onSubmit={requestCode} className="flex flex-col gap-4">
            <label className={label}>
              New email
              <input className={input} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </label>
            {profile.hasPassword && (
              <label className={label}>
                Your password
                <input className={input} type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} required />
              </label>
            )}
            <button disabled={emailBusy} className="rounded-md bg-lama text-white text-sm px-4 py-2 w-max disabled:opacity-60">
              {emailBusy ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmCode} className="flex flex-col gap-4">
            <label className={label}>
              6-digit code sent to {newEmail}
              <input
                className={`${input} text-center text-xl tracking-[0.4em]`}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <div className="flex gap-3">
              <button disabled={emailBusy || code.length !== 6} className="rounded-md bg-lama text-white text-sm px-4 py-2 disabled:opacity-60">
                {emailBusy ? "Checking..." : "Confirm"}
              </button>
              <button type="button" onClick={() => { setStep("form"); setEmailMsg(null); }} className="rounded-md text-sm px-4 py-2 ring-1 ring-gray-300">
                Back
              </button>
            </div>
          </form>
        )}
        <Note m={emailMsg} />
      </section>

      {/* GOOGLE */}
      <section className={card}>
        <h2 className="font-semibold">Connected accounts</h2>
        <div className="flex items-center justify-between text-sm">
          <span>
            Google{" "}
            <span className={profile.googleLinked ? "text-green-600" : "text-gray-400"}>
              {profile.googleLinked ? "· Connected" : "· Not connected"}
            </span>
          </span>
          {profile.googleLinked && (
            <button onClick={unlink} className="underline text-red-600">Disconnect</button>
          )}
        </div>
        {profile.googleLinked && !profile.hasPassword && (
          <p className="text-xs text-gray-500">
            To disconnect Google, first set a password on the Password page so you can still log in.
          </p>
        )}
        {!profile.googleLinked && (
          <p className="text-xs text-gray-500">
            To connect Google, log out and use &quot;Continue with Google&quot; with the same email address.
          </p>
        )}
        <Note m={googleMsg} />
      </section>

      {/* DATA */}
      <section className={card}>
        <h2 className="font-semibold">Download my data</h2>
        <p className="text-sm text-gray-500">Get a JSON file with your profile, addresses and orders.</p>
        <button onClick={download} className="rounded-md ring-1 ring-gray-300 text-sm px-4 py-2 w-max">
          Download
        </button>
        <Note m={exportMsg} />
      </section>

      {/* DELETE */}
      {profile.role !== "admin" && (
        <form onSubmit={deleteAccount} className={`${card} ring-red-200`}>
          <h2 className="font-semibold text-red-600">Delete account</h2>
          <p className="text-sm text-gray-500">
            This removes your profile, addresses and cart permanently. Past orders are kept for store records
            but are no longer linked to you. You can&apos;t delete while an order is in progress.
          </p>
          {profile.hasPassword ? (
            <label className={label}>
              Password
              <input className={input} type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} required />
            </label>
          ) : (
            <label className={label}>
              Type your email ({profile.email}) to confirm
              <input className={input} value={delEmail} onChange={(e) => setDelEmail(e.target.value)} required />
            </label>
          )}
          <Note m={delMsg} />
          <button disabled={delBusy} className="rounded-md bg-red-600 text-white text-sm px-4 py-2 w-max disabled:opacity-60">
            {delBusy ? "Deleting..." : "Delete my account"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AccountPage;