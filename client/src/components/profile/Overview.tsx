"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { Profile } from "@/lib/useProfile";

type Overview = {
  profile: Profile;
  stats: { totalOrders: number; totalSpent: number; activeOrders: number };
  recentOrders: {
    _id: string;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
  }[];
};

const badge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const card = "ring-1 ring-gray-200 rounded-md p-4";

const Skeleton = () => (
  <div className="animate-pulse flex flex-col gap-6">
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-md" />
      ))}
    </div>
    <div className="h-48 bg-gray-100 rounded-md" />
  </div>
);

const Overview = ({ go }: { go: (tab: string) => void }) => {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Overview>("/profile/overview")
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Skeleton />;

  const { profile, stats, recentOrders } = data;
  const defaultAddress = profile.addresses.find((a) => a.isDefault);

  const checklist = [
    {
      done: profile.emailVerified,
      text: "Verify your email",
      href: "/verify-email",
    },
    { done: !!profile.phone, text: "Add a phone number", tab: "edit" },
    {
      done: profile.addresses.length > 0,
      text: "Save a delivery address",
      tab: "addresses",
    },
    { done: !!profile.avatarUrl, text: "Add a profile photo", tab: "edit" },
    {
      done: !!profile.phone,
      text: "Add a phone number",
      href: "/profile/edit",
    },
    {
      done: profile.addresses.length > 0,
      text: "Save a delivery address",
      tab: "addresses",
    },
    {
      done: !!profile.avatarUrl,
      text: "Add a profile photo",
      href: "/profile/edit",
    },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const percent = Math.round((completed / checklist.length) * 100);

  const cards = [
    { label: "Total orders", value: stats.totalOrders },
    { label: "Total spent", value: money(stats.totalSpent) },
    { label: "Active orders", value: stats.activeOrders },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={card}>
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/orders" className="text-sm underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div
              className={`${card} text-sm text-gray-500 flex flex-col gap-3`}
            >
              You haven&apos;t placed any orders yet.
              <Link
                href="/list"
                className="rounded-md bg-lama text-white px-4 py-2 w-max"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="ring-1 ring-gray-200 rounded-md divide-y">
              {recentOrders.map((o) => (
                <li key={o._id}>
                  <Link
                    href={`/orders/${o._id}`}
                    className="flex justify-between items-center p-3 text-sm hover:bg-gray-50"
                  >
                    <span>
                      #{o._id.slice(-8)}
                      <span className="block text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                        {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="text-right">
                      {money(o.total)}
                      <span
                        className={`block text-xs rounded-full px-2 py-0.5 mt-1 capitalize ${badge[o.status] ?? ""}`}
                      >
                        {o.status}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-semibold mb-3">
              Profile completeness · {percent}%
            </h2>
            <div className={card}>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-lama transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {checklist.map((c) => (
                  <li key={c.text} className="flex items-center gap-2">
                    <span
                      className={c.done ? "text-green-600" : "text-gray-300"}
                    >
                      {c.done ? "✓" : "○"}
                    </span>
                    {c.done ? (
                      <span className="text-gray-500">{c.text}</span>
                    ) : c.href ? (
                      <Link href={c.href} className="underline">
                        {c.text}
                      </Link>
                    ) : (
                      <button onClick={() => go(c.tab!)} className="underline">
                        {c.text}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Default address</h2>
              <button
                onClick={() => go("addresses")}
                className="text-sm underline"
              >
                Manage
              </button>
            </div>
            <div className={`${card} text-sm`}>
              {defaultAddress ? (
                <>
                  <div className="font-medium capitalize">
                    {defaultAddress.label} · {defaultAddress.fullName}
                  </div>
                  <div className="text-gray-500">{defaultAddress.line1}</div>
                  <div className="text-gray-500">
                    {defaultAddress.city}
                    {defaultAddress.postalCode
                      ? `, ${defaultAddress.postalCode}`
                      : ""}
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
    </div>
  );
};

export default Overview;
