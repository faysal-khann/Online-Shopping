"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Profile } from "./useProfile";

export type OverviewData = {
  profile: Profile;
  stats: {
    totalOrders: number;
    totalSpent: number;
    activeOrders: number;
    wishlistCount: number;
    openReturns: number;
  };
  rewards: { points: number; tier: string; next: { name: string; at: number } | null };
  monthly: { label: string; total: number }[];
  recentOrders: { _id: string; total: number; status: string; createdAt: string; itemCount: number }[];
};

export function useOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setData(await apiFetch<OverviewData>("/profile/overview"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}