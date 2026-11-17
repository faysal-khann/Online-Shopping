"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/lib/useProfile";
import Avatar from "@/components/profile/Avatar";

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";
const input = "ring-1 ring-gray-300 rounded-md p-2 w-full text-sm";
const label = "text-xs font-medium text-gray-600 flex flex-col gap-1";

const EditProfilePage = () => {
  const { user, loading, refresh } = useAuth();
  const { profile, setProfile, error: loadError } = useProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;
  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please <Link href="/login" className="underline">log in</Link> to edit your profile.
      </div>
    );
  if (loadError) return <p className={`${wrap} text-red-600`}>{loadError}</p>;
  if (!profile) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const d = await apiFetch<{ profile: typeof profile }>("/profile", {
        method: "PUT",
        body: JSON.stringify({ name, phone, avatarUrl }),
      });
      setProfile(d.profile);
      await refresh();
      setMsg({ ok: true, text: "Profile saved" });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${wrap} min-h-[70vh]`}>
      <div className="max-w-xl">
        <Link href="/profile" className="text-sm underline">← Back to dashboard</Link>
        <h1 className="text-2xl font-semibold mt-4 mb-6">Edit profile</h1>

        <form onSubmit={save} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || profile.name} url={avatarUrl || undefined} size={80} />
            <p className="text-xs text-gray-500">
              Paste an image link below, or leave it empty to use your initials.
            </p>
          </div>

          <label className={label}>
            Full name
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className={label}>
            Phone
            <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
          </label>

          <label className={label}>
            Avatar image URL (optional)
            <input className={input} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </label>

          <div className={label}>
            Email
            <div className="ring-1 ring-gray-200 bg-gray-50 rounded-md p-2 text-sm flex justify-between">
              <span>{profile.email}</span>
              <span className={profile.emailVerified ? "text-green-600" : "text-orange-500"}>
                {profile.emailVerified ? "Verified" : "Not verified"}
              </span>
            </div>
            <span className="font-normal text-gray-500">Change it from Account on the dashboard.</span>
          </div>

          {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

          <div className="flex gap-3">
            <button disabled={busy} className="rounded-md bg-lama text-white text-sm px-4 py-2 disabled:opacity-60">
              {busy ? "Saving..." : "Save changes"}
            </button>
            <Link href="/profile" className="rounded-md ring-1 ring-gray-300 text-sm px-4 py-2">
              Done
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;