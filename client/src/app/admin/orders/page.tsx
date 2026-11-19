"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/lib/roles";
import Pager from "@/components/admin/Pager";
import { btnDanger, btnGhost, fmtDateTime, input, Modal, StatusBadge } from "@/components/dashboard/ui";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type Row = {
  _id: string;
  total: number;
  status: Status;
  createdAt: string;
  user?: { name: string; email: string } | null;
  items: { quantity: number }[];
  payment?: { method: string; status: string };
};
type Resp = { orders: Row[]; total: number; page: number; pages: number };

const AdminOrders = () => {
  const { user } = useAuth();
  const write = canWrite(user?.role);

  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Row | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const filters = useCallback(() => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    if (payment) qs.set("payment", payment);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return qs;
  }, [q, status, payment, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filters();
      qs.set("page", String(page));
      qs.set("limit", "12");
      setData(await apiFetch<Resp>(`/admin/orders?${qs}`));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const change = async (id: string, next: Status) => {
    setSaving(id);
    try {
      const { order } = await apiFetch<{ order: Row }>(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setData((d) => d && { ...d, orders: d.orders.map((o) => (o._id === id ? { ...o, status: order.status, payment: order.payment ?? o.payment } : o)) });
      toast.success(`Order marked ${next}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(null);
      setCancelling(null);
    }
  };

  const reset = () => { setSearch(""); setQ(""); setStatus(""); setPayment(""); setFrom(""); setTo(""); setPage(1); };
  const filtered = !!(q || status || payment || from || to);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        {write && (
          <button className={btnGhost} onClick={() => downloadFile(`/admin/orders/export?${filters()}`, "orders.csv").catch((e) => toast.error(errorMessage(e)))}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder="Customer name, email, product or order #" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${input} !w-auto capitalize`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={`${input} !w-auto capitalize`} value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}>
          <option value="">Any payment</option>
          {["paid", "unpaid", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" aria-label="From" className={`${input} !w-auto`} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input type="date" aria-label="To" className={`${input} !w-auto`} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        {filtered && <button className={btnGhost} onClick={reset}>Clear</button>}
      </div>

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th>
              <th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.orders.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/orders/${o._id}`} className="font-medium underline">#{o._id.slice(-8)}</Link>
                  <div className="text-xs text-gray-500">{o.items.reduce((n, i) => n + i.quantity, 0)} items</div>
                </td>
                <td className="p-3">
                  {o.user?.name ?? "Deleted user"}
                  <div className="text-xs text-gray-500">{o.user?.email}</div>
                </td>
                <td className="p-3 whitespace-nowrap text-gray-600">{fmtDateTime(o.createdAt)}</td>
                <td className="p-3">{money(o.total)}</td>
                <td className="p-3">
                  <div className="text-xs text-gray-500 capitalize">{o.payment?.method ?? "—"}</div>
                  {o.payment && <StatusBadge status={o.payment.status} />}
                </td>
                <td className="p-3">
                  {write && o.status !== "cancelled" ? (
                    <select
                      value={o.status}
                      disabled={saving === o._id}
                      onChange={(e) => {
                        const next = e.target.value as Status;
                        if (next === "cancelled") setCancelling(o);
                        else change(o._id, next);
                      }}
                      className="ring-1 ring-gray-300 rounded-md px-2 py-1 text-sm capitalize disabled:opacity-50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <StatusBadge status={o.status} />
                  )}
                </td>
              </tr>
            ))}
            {data && data.orders.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">No orders match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      <Modal open={!!cancelling} title="Cancel this order?" onClose={() => setCancelling(null)}>
        <p className="text-sm text-gray-600 mb-5">
          Order #{cancelling?._id.slice(-8)} will be cancelled, the items return to stock and a paid order is refunded.
          The customer is emailed. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setCancelling(null)}>Keep order</button>
          <button className={btnDanger} disabled={!!saving} onClick={() => cancelling && change(cancelling._id, "cancelled")}>
            {saving ? "Cancelling..." : "Cancel order"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrders;