"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, errorMessage, money } from "../../lib/api";

type Stats = {
  users: number;
  products: number;
  orders: number;
  revenue: number;
  lowStock: { _id: string; name: string; slug: string; stock: number }[];
  recent: {
    _id: string;
    total: number;
    status: string;
    createdAt: string;
    user?: { name: string; email: string } | null;
  }[];
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Stats>("/admin/stats").then(setStats).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-gray-500">Loading...</p>;

  const cards = [
    { label: "Revenue", value: money(stats.revenue) },
    { label: "Orders", value: stats.orders },
    { label: "Products", value: stats.products },
    { label: "Customers", value: stats.users },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="ring-1 ring-gray-200 rounded-md p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3">Low stock (5 or fewer)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y ring-1 ring-gray-200 rounded-md">
              {stats.lowStock.map((p) => (
                <li key={p._id} className="flex justify-between p-3 text-sm">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? "text-red-600" : "text-orange-500"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm underline">
              View all
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y ring-1 ring-gray-200 rounded-md">
              {stats.recent.map((o) => (
                <li key={o._id} className="flex justify-between p-3 text-sm">
                  <span>
                    {o.user?.name ?? "Deleted user"}
                    <span className="block text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-right">
                    {money(o.total)}
                    <span className="block text-xs text-gray-500 capitalize">{o.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;