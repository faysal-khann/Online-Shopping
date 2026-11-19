"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";

export type Address = {
  _id: string;
  label: "home" | "work" | "other";
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
    role: "user" | "staff" | "viewer" | "admin";
  emailVerified: boolean;
  phone?: string;
  avatarUrl?: string;
  hasPassword: boolean;
  googleLinked: boolean;
  addresses: Address[];
  createdAt: string;
  prefs?: { orderEmails: boolean; promotions: boolean };
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const d = await apiFetch<{ profile: Profile }>("/profile");
      setProfile(d.profile);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, setProfile, reload, error };
}
