"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Profile, useProfile } from "@/lib/useProfile";
import Avatar from "@/components/profile/Avatar";
import { btnPrimary, card, input, label, SectionHeader, Skeleton } from "./ui";

const ProfileForm = () => {
  const { refresh } = useAuth();
  const { profile, setProfile } = useProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  if (!profile) return <Skeleton className="h-80" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await apiFetch<{ profile: Profile }>("/profile", {
        method: "PUT",
        body: JSON.stringify({ name, phone, avatarUrl }),
      });
      setProfile(d.profile);
      await refresh();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <SectionHeader title="Profile" subtitle="Your name, phone number and photo" />
      <form onSubmit={save} className={`${card} p-6 flex flex-col gap-5`}>
        <div className="flex items-center gap-4">
          <Avatar name={name || profile.name} url={avatarUrl || undefined} size={80} />
          <p className="text-xs text-gray-500">Paste an image link below, or leave it empty to use your initials.</p>
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
          <div className="ring-1 ring-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm flex justify-between">
            <span>{profile.email}</span>
            <span className={profile.emailVerified ? "text-green-600" : "text-orange-500"}>
              {profile.emailVerified ? "Verified" : "Not verified"}
            </span>
          </div>
          <span className="font-normal text-gray-500">Change it from the Account section.</span>
        </div>
        <button disabled={busy} className={`${btnPrimary} w-max`}>{busy ? "Saving..." : "Save changes"}</button>
      </form>
    </div>
  );
};

export default ProfileForm;