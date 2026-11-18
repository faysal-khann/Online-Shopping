"use client";

import Link from "next/link";
import { Award, Package, Truck, Wallet } from "lucide-react";
import { money } from "@/lib/api";
import { useOverview } from "@/lib/useOverview";
import RecentlyViewed from "./RecentlyViewed";
import { card, fmtDate, Skeleton, StatusBadge } from "./ui";

const Overview = ({ go }: { go: (key: string) => void }) => {
  const { data, error } = useOverview();

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data)
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-60" />
        <Skeleton className="h-48" />
      </div>
    );

  const { profile, stats, rewards, monthly, recentOrders } = data;
  const defaultAddress = profile.addresses.find((a) => a.isDefault);
  const max = Math.max(...monthly.map((m) => m.total), 1);
  const hasSpending = monthly.some((m) => m.total > 0);

  const tiles = [
    { label: "Total orders", value: stats.totalOrders, icon: Package, tone: "bg-blue-100 text-blue-600", tab: "orders" },
    { label: "Total spent", value: money(stats.totalSpent), icon: Wallet, tone: "bg-green-100 text-green-600", tab: "orders" },
    { label: "Active orders", value: stats.activeOrders, icon: Truck, tone: "bg-purple-100 text-purple-600", tab: "orders" },
    { label: "Reward points", value: rewards.points, icon: Award, tone: "bg-amber-100 text-amber-600", tab: "rewards" },
  ];

  const checklist = [
    { done: profile.emailVerified, text: "Verify your email", href: "/verify-email" },
    { done: !!profile.phone, text: "Add a phone number", tab: "profile" },
    { done: profile.addresses.length > 0, text: "Save a delivery address", tab: "addresses" },
    { done: !!profile.avatarUrl, text: "Add a profile photo", tab: "profile" },
  ];
  const percent = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  return (
    <div className="flex flex-col gap-8">
      {/* STAT TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={() => go(t.tab)}
            className={`${card} p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition`}
          >
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.tone}`}>
              <t.icon size={18} />
            </span>
            <div className="text-2xl font-semibold mt-3">{t.value}</div>
            <div className="text-sm text-gray-500">{t.label}</div>
          </button>
        ))}
      </div>

      {/* SPENDING CHART */}
      <div className={`${card} p-5`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold">Spending, last 6 months</h2>
          <span className="text-xs text-gray-500">Cancelled orders excluded</span>
        </div>
        {hasSpending ? (
          <div className="flex items-end gap-3 h-44">
            {monthly.map((m) => (
              <div key={m.label} className="group h-full flex-1 flex flex-col gap-2">
                <div className="relative flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-lama/70 group-hover:bg-lama transition-colors"
                    style={{ height: `${m.total > 0 ? Math.max((m.total / max) * 100, 4) : 0}%` }}
                  />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-7 text-xs bg-gray-900 text-white rounded px-2 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {money(m.total)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 text-center">{m.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-8 text-center">No spending yet. Place an order to see your chart.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* RECENT ORDERS */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Recent orders</h2>
            <button onClick={() => go("orders")} className="text-sm underline">View all</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className={`${card} p-5 text-sm text-gray-500 flex flex-col gap-3 items-start`}>
              You haven&apos;t placed any orders yet.
              <Link href="/list" className="rounded-lg bg-lama text-white px-4 py-2">Start shopping</Link>
            </div>
          ) : (
            <ul className={`${card} divide-y`}>
              {recentOrders.map((o) => (
                <li key={o._id}>
                  <Link href={`/orders/${o._id}`} className="flex justify-between items-center p-3 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">
                    <span>
                      #{o._id.slice(-8)}
                      <span className="block text-xs text-gray-500">
                        {fmtDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="text-right flex flex-col items-end gap-1">
                      {money(o.total)}
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-8">
          {/* COMPLETENESS */}
          <div>
            <h2 className="font-semibold mb-3">Profile completeness · {percent}%</h2>
            <div className={`${card} p-4`}>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-lama transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {checklist.map((c) => (
                  <li key={c.text} className="flex items-center gap-2">
                    <span className={c.done ? "text-green-600" : "text-gray-300"}>{c.done ? "✓" : "○"}</span>
                    {c.done ? (
                      <span className="text-gray-500">{c.text}</span>
                    ) : c.href ? (
                      <Link href={c.href} className="underline">{c.text}</Link>
                    ) : (
                      <button onClick={() => go(c.tab!)} className="underline">{c.text}</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DEFAULT ADDRESS */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Default address</h2>
              <button onClick={() => go("addresses")} className="text-sm underline">Manage</button>
            </div>
            <div className={`${card} p-4 text-sm`}>
              {defaultAddress ? (
                <>
                  <div className="font-medium capitalize">{defaultAddress.label} · {defaultAddress.fullName}</div>
                  <div className="text-gray-500">{defaultAddress.line1}</div>
                  <div className="text-gray-500">
                    {defaultAddress.city}{defaultAddress.postalCode ? `, ${defaultAddress.postalCode}` : ""}
                  </div>
                  <div className="text-gray-500">{defaultAddress.phone}</div>
                </>
              ) : (
                <span className="text-gray-500">No address saved yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <RecentlyViewed compact />
    </div>
  );
};

export default Overview;