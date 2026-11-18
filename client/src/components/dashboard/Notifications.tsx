"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { Profile, useProfile } from "@/lib/useProfile";
import { card, SectionHeader, Skeleton, Toggle } from "./ui";

const Notifications = () => {
  const { profile, setProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  if (!profile) return <Skeleton className="h-40" />;
  const prefs = profile.prefs ?? { orderEmails: true, promotions: false };

  const update = async (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch };
    setProfile({ ...profile, prefs: next }); // instant feedback
    setSaving(true);
    try {
      const d = await apiFetch<{ profile: Profile }>("/profile/preferences", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setProfile(d.profile);
      toast.success("Preferences saved");
    } catch (e) {
      setProfile({ ...profile, prefs });
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    {
      key: "orderEmails" as const,
      title: "Order updates",
      text: "Emails when your order is placed, shipped, delivered or cancelled.",
    },
    {
      key: "promotions" as const,
      title: "Offers and news",
      text: "Occasional emails about deals and new products.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <SectionHeader title="Notifications" subtitle="Choose which emails you receive" />
      <div className={`${card} divide-y`}>
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="font-medium text-sm">{r.title}</div>
              <div className="text-sm text-gray-500">{r.text}</div>
            </div>
            <Toggle on={prefs[r.key]} disabled={saving} onChange={(v) => update({ [r.key]: v })} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Account emails such as verification codes and password resets are always sent.
      </p>
    </div>
  );
};

export default Notifications;