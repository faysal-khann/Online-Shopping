"use client";

import { Award, Check } from "lucide-react";
import { useOverview } from "@/lib/useOverview";
import { card, SectionHeader, Skeleton } from "./ui";

const TIERS = [
  { name: "Bronze", at: 0, perk: "Earn 1 point per $1 on delivered orders" },
  { name: "Silver", at: 200, perk: "Silver badge on your profile" },
  { name: "Gold", at: 1000, perk: "Gold badge on your profile" },
];

const Rewards = () => {
  const { data, error } = useOverview();
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Skeleton className="h-64" />;

  const { points, tier, next } = data.rewards;
  const current = TIERS.find((t) => t.name === tier)!;
  const span = next ? next.at - current.at : 1;
  const pct = next ? Math.min(((points - current.at) / span) * 100, 100) : 100;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Rewards" subtitle="Earn points every time an order is delivered" />

      <div className={`${card} p-6 flex flex-col gap-5`}>
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Award size={28} />
          </span>
          <div>
            <div className="text-3xl font-semibold">{points} <span className="text-base text-gray-500 font-normal">points</span></div>
            <div className="text-sm text-gray-500">{tier} member</div>
          </div>
        </div>
        <div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {next ? `${next.at - points} more points to reach ${next.name}` : "You've reached the top tier."}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const reached = points >= t.at;
          return (
            <div key={t.name} className={`${card} p-4 ${reached ? "ring-amber-300" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.name}</span>
                {reached && <Check size={16} className="text-green-600" />}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t.at}+ points</div>
              <div className="text-sm mt-3">{t.perk}</div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Points are counted from delivered orders only. Redeeming points for discounts is not available yet.
      </p>
    </div>
  );
};

export default Rewards;