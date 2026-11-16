"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import Pager from "@/components/admin/Pager";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type AdminOrder = {
  _id: string;
  total: number;
  status: Status;
  createdAt: string;
  user?: { name: string; email: string } | null;
  items: { name: string; price: number; quantity: number; color?: string; size?: string }[];
};

type OrdersResponse = { orders: AdminOrder[]; total: number; page: number; pages: number };

const badge: Record<Status, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "10" });
      if (status) qs.set("status", status);
      setData(await apiFetch<OrdersResponse>(`/admin/orders?${qs}`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id: string, next: Status) => {
    if (next === "cancelled" && !window.confirm("Cancel this order and return the items to stock?"))
      return;
    setSaving(id);
    setError("");
    try {
      const { order } = await apiFetch<{ order: AdminOrder }>(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setData((d) =>
        d && { ...d, orders: d.orders.map((o) => (o._id === id ? { ...o, status: order.status } : o)) }
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="ring-1 ring-gray-300 rounded-md px-3 py-2 text-sm capitalize"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`}>
        {data?.orders.map((o) => (
          <div key={o._id} className="ring-1 ring-gray-200 rounded-md p-4">
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div className="text-sm">
                <div className="font-medium">{o.user?.name ?? "Deleted user"}</div>
                <div className="text-xs text-gray-500">
                  {o.user?.email} · {new Date(o.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">#{o._id.slice(-8)}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs rounded-full px-3 py-1 capitalize ${badge[o.status]}`}>
                  {o.status}
                </span>
                <select
                  value={o.status}
                  disabled={saving === o._id || o.status === "cancelled"}
                  onChange={(e) => changeStatus(o._id, e.target.value as Status)}
                  className="ring-1 ring-gray-300 rounded-md px-2 py-1 text-sm capitalize disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {o.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>
                  {i.name} × {i.quantity}
                  {[i.color, i.size].filter(Boolean).length > 0 &&
                    ` (${[i.color, i.size].filter(Boolean).join(" / ")})`}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold mt-3 pt-3 border-t text-sm">
              <span>Total</span>
              <span>{money(o.total)}</span>
            </div>
          </div>
        ))}
        {data && data.orders.length === 0 && (
          <p className="text-gray-500 text-sm">No orders found.</p>
        )}
      </div>

      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
};

export default AdminOrders;