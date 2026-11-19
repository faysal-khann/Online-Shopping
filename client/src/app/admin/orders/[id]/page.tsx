"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/lib/roles";
import { btnGhost, card, fmtDateTime, Skeleton, StatusBadge } from "@/components/dashboard/ui";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

export type AdminOrder = {
  _id: string;
  total: number;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  shippingFee?: number;
  tax?: number;
  status: string;
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
  user?: { _id: string; name: string; email: string; phone?: string } | null;
  items: { name: string; price: number; quantity: number; color?: string; size?: string }[];
  shippingMethod?: { label: string; eta: string };
  shippingAddress?: { fullName: string; phone: string; line1: string; city: string; postalCode?: string };
  payment?: { method: string; status: string; brand?: string; last4?: string; provider?: string; ref?: string };
};

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const write = canWrite(user?.role);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ order: AdminOrder }>(`/admin/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => toast.error(errorMessage(e)));
  }, [id]);

  if (!order) return <Skeleton className="h-96" />;

  const change = async (status: string) => {
    if (status === "cancelled" && !window.confirm("Cancel this order, refund it if paid, and return the items to stock?")) return;
    setSaving(true);
    try {
      const d = await apiFetch<{ order: AdminOrder }>(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrder((o) => o && { ...o, status: d.order.status, payment: d.order.payment ?? o.payment, statusHistory: d.order.statusHistory });
      toast.success(`Order marked ${status}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const a = order.shippingAddress;
  const payText = !order.payment ? "—"
    : order.payment.method === "card" ? `${order.payment.brand ?? "Card"} ending ${order.payment.last4}`
    : order.payment.method === "mobile" ? `${order.payment.provider === "nagad" ? "Nagad" : "bKash"} ···${order.payment.last4}`
    : "Cash on delivery";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="text-sm underline w-max">← All orders</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order._id.slice(-8)}</h1>
          <p className="text-sm text-gray-500">Placed {fmtDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {write && order.status !== "cancelled" && (
            <select value={order.status} disabled={saving} onChange={(e) => change(e.target.value)} className="ring-1 ring-gray-300 rounded-md px-2 py-1.5 text-sm capitalize">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {a && <Link href={`/admin/orders/${order._id}/slip`} className={btnGhost}><Printer size={16} /> Packing slip</Link>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`${card} p-5 lg:col-span-2`}>
          <h2 className="font-semibold mb-3">Items</h2>
          <div className="text-sm divide-y">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between py-2">
                <span>
                  {i.name} × {i.quantity}
                  {[i.color, i.size].filter(Boolean).length > 0 && <span className="text-gray-400"> ({[i.color, i.size].filter(Boolean).join(" / ")})</span>}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="text-sm border-t mt-3 pt-3 flex flex-col gap-1.5">
            {order.subtotal != null && (
              <>
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
                {!!order.discount && <div className="flex justify-between text-green-700"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>−{money(order.discount)}</span></div>}
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shippingFee ? money(order.shippingFee) : "Free"}</span></div>
                <div className="flex justify-between text-gray-500"><span>Tax</span><span>{money(order.tax ?? 0)}</span></div>
              </>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t"><span>Total</span><span>{money(order.total)}</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className={`${card} p-5 text-sm`}>
            <h2 className="font-semibold mb-3">Customer</h2>
            {order.user ? (
              <>
                <Link href={`/admin/customers/${order.user._id}`} className="font-medium underline">{order.user.name}</Link>
                <div className="text-gray-500">{order.user.email}</div>
                {order.user.phone && <div className="text-gray-500">{order.user.phone}</div>}
              </>
            ) : <span className="text-gray-500">Deleted user</span>}
          </div>
          {a && (
            <div className={`${card} p-5 text-sm`}>
              <h2 className="font-semibold mb-3">Ship to</h2>
              <div className="font-medium">{a.fullName}</div>
              <div className="text-gray-600">{a.line1}</div>
              <div className="text-gray-600">{a.city}{a.postalCode ? `, ${a.postalCode}` : ""}</div>
              <div className="text-gray-600">{a.phone}</div>
              {order.shippingMethod && <div className="text-gray-500 mt-2">{order.shippingMethod.label} · {order.shippingMethod.eta}</div>}
            </div>
          )}
          <div className={`${card} p-5 text-sm`}>
            <h2 className="font-semibold mb-3">Payment</h2>
            <div>{payText}</div>
            {order.payment && <div className="mt-1"><StatusBadge status={order.payment.status} /></div>}
            {order.payment?.ref && <div className="text-xs text-gray-400 mt-2">Ref {order.payment.ref}</div>}
          </div>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <h2 className="font-semibold mb-3">Timeline</h2>
        <ol className="text-sm flex flex-col gap-2">
          {(order.statusHistory ?? []).map((h, i) => (
            <li key={i} className="flex gap-3"><span className="w-40 text-gray-500">{fmtDateTime(h.at)}</span><span className="capitalize">{h.status}</span></li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AdminOrderDetail;