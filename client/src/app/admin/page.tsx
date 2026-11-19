"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, ShoppingBag, TrendingUp, UserPlus } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { card, fmtDateTime, Skeleton, StatusBadge } from "@/components/dashboard/ui";

type Kpi = { value: number; prev: number };
type Stats = {
  days: number;
  kpis: { revenue: Kpi; orders: Kpi; aov: Kpi; customers: Kpi };
  totals: { products: number; customers: number; pending: number; openReturns: number };
  daily: { date: string; revenue: number; orders: number }[];
  byStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  lowStock: { _id: string; name: string; stock: number }[];
  recent: { _id: string; total: number; status: string; createdAt: string; user?: { name: string } | null }[];
};

const COLORS: Record<string, string> = {
  pending: "#eab308", paid: "#3b82f6", shipped: "#a855f7", delivered: "#22c55e", cancelled: "#ef4444",
};

const Delta = ({ k }: { k: Kpi }) => {
  if (!k.prev) return <span className="text-xs text-gray-400">No prior data</span>;
  const pct = ((k.value - k.prev) / k.prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs inline-flex items-center gap-0.5 ${up ? "text-green-600" : "text-red-600"}`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(pct).toFixed(1)}% vs previous period
    </span>
  );
};

const AdminDashboard = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    apiFetch<Stats>(`/admin/stats?days=${days}&tz=${encodeURIComponent(tz)}`)
      .then((d) => alive && (setData(d), setError("")))
      .catch((e) => alive && setError(errorMessage(e)));
    return () => { alive = false; };
  }, [days]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data)
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-72" />
      </div>
    );

  const k = data.kpis;
  const cards = [
    { label: "Revenue", value: money(k.revenue.value), kpi: k.revenue, icon: DollarSign, tone: "bg-green-100 text-green-600" },
    { label: "Orders", value: k.orders.value, kpi: k.orders, icon: ShoppingBag, tone: "bg-blue-100 text-blue-600" },
    { label: "Avg order value", value: money(k.aov.value), kpi: k.aov, icon: TrendingUp, tone: "bg-purple-100 text-purple-600" },
    { label: "New customers", value: k.customers.value, kpi: k.customers, icon: UserPlus, tone: "bg-amber-100 text-amber-600" },
  ];
  const maxTop = Math.max(...data.topProducts.map((t) => t.revenue), 1);
  const statusTotal = data.byStatus.reduce((s, x) => s + x.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-1.5 text-sm ${days === d ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* ATTENTION */}
      {(data.totals.pending > 0 || data.totals.openReturns > 0 || data.lowStock.length > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {data.totals.pending > 0 && (
            <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 text-yellow-900 px-3 py-2">
              <AlertTriangle size={16} /> {data.totals.pending} pending order{data.totals.pending > 1 ? "s" : ""}
            </Link>
          )}
          {data.totals.openReturns > 0 && (
            <Link href="/admin/returns" className="inline-flex items-center gap-2 rounded-lg bg-orange-50 text-orange-900 px-3 py-2">
              <AlertTriangle size={16} /> {data.totals.openReturns} return request{data.totals.openReturns > 1 ? "s" : ""} waiting
            </Link>
          )}
          {data.lowStock.length > 0 && (
            <Link href="/admin/inventory" className="inline-flex items-center gap-2 rounded-lg bg-red-50 text-red-900 px-3 py-2">
              <AlertTriangle size={16} /> {data.lowStock.length} product{data.lowStock.length > 1 ? "s" : ""} low on stock
            </Link>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{c.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.tone}`}><c.icon size={16} /></span>
            </div>
            <div className="text-2xl font-semibold mt-2">{c.value}</div>
            <Delta k={c.kpi} />
          </div>
        ))}
      </div>

      {/* REVENUE CHART */}
      <div className={`${card} p-5`}>
        <h2 className="font-semibold mb-4">Revenue, last {data.days} days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f35c7a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f35c7a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(l) => String(l)} />
              <Area type="monotone" dataKey="revenue" stroke="#f35c7a" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* STATUS */}
        <div className={`${card} p-5`}>
          <h2 className="font-semibold mb-4">Orders by status</h2>
          {statusTotal === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No orders in this period.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byStatus} dataKey="count" nameKey="status" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {data.byStatus.map((s) => <Cell key={s.status} fill={COLORS[s.status] ?? "#9ca3af"} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="text-sm flex flex-col gap-2">
                {data.byStatus.map((s) => (
                  <li key={s.status} className="flex items-center gap-2 capitalize">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[s.status] ?? "#9ca3af" }} />
                    {s.status} <span className="text-gray-500">({s.count})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* TOP PRODUCTS */}
        <div className={`${card} p-5`}>
          <h2 className="font-semibold mb-4">Top products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No sales in this period.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.topProducts.map((t) => (
                <li key={t.name} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium truncate pr-4">{t.name}</span>
                    <span className="text-gray-600 whitespace-nowrap">{money(t.revenue)} · {t.quantity} sold</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-lama rounded-full" style={{ width: `${(t.revenue / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold">Low stock</h2>
            <Link href="/admin/inventory" className="text-sm underline">Inventory</Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">Everything is well stocked.</p>
          ) : (
            <ul className={`${card} divide-y`}>
              {data.lowStock.map((p) => (
                <li key={p._id} className="flex justify-between p-3 text-sm">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? "text-red-600" : "text-orange-500"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm underline">View all</Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className={`${card} divide-y`}>
              {data.recent.map((o) => (
                <li key={o._id}>
                  <Link href={`/admin/orders/${o._id}`} className="flex justify-between items-center p-3 text-sm hover:bg-gray-50">
                    <span>
                      {o.user?.name ?? "Deleted user"}
                      <span className="block text-xs text-gray-500">{fmtDateTime(o.createdAt)}</span>
                    </span>
                    <span className="text-right flex flex-col items-end gap-1">{money(o.total)}<StatusBadge status={o.status} /></span>
                  </Link>
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