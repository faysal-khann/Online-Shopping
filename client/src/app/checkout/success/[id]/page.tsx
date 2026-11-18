"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { btnGhost, btnPrimary, card } from "@/components/dashboard/ui";

type Order = {
  _id: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  status: string;
  shippingMethod?: { label: string; eta: string };
  shippingAddress?: { fullName: string; line1: string; city: string; phone: string };
  payment?: { method: "card" | "mobile" | "cod"; status: string; brand?: string; last4?: string; provider?: string };
  items: { name: string; price: number; quantity: number }[];
};

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 pb-16";

const payText = (p?: Order["payment"]) =>
  !p ? "" : p.method === "cod" ? "Cash on delivery (pay when it arrives)"
  : p.method === "card" ? `Paid with ${p.brand ?? "card"} ending ${p.last4}`
  : `Paid with ${p.provider === "nagad" ? "Nagad" : "bKash"}`;

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch<{ order: Order }>(`/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => setError(errorMessage(e)));
  }, [user, id]);

  if (loading) return null;
  if (!user) return <div className={wrap}>Please <Link href="/login" className="underline">log in</Link>.</div>;
  if (error) return <div className={`${wrap} text-red-600`}>{error}</div>;
  if (!order) return <div className={`${wrap} text-gray-500`}>Loading...</div>;

  return (
    <div className={`${wrap} max-w-2xl mx-auto fade-in`}>
      <div className="flex flex-col items-center text-center gap-3 py-8">
        <CheckCircle2 size={64} className="text-green-500" />
        <h1 className="text-3xl font-semibold">Thank you for your order!</h1>
        <p className="text-gray-500">
          Order <strong>#{order._id.slice(-8).toUpperCase()}</strong> is confirmed. A confirmation email is on its way.
        </p>
      </div>

      <div className={`${card} p-6 flex flex-col gap-5`}>
        <div className="grid sm:grid-cols-2 gap-5 text-sm">
          {order.shippingAddress && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Delivering to</div>
              <div className="font-medium">{order.shippingAddress.fullName}</div>
              <div className="text-gray-600">{order.shippingAddress.line1}, {order.shippingAddress.city}</div>
              <div className="text-gray-600">{order.shippingAddress.phone}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500 mb-1">{order.shippingMethod?.label ?? "Delivery"}</div>
            <div className="font-medium">{order.shippingMethod?.eta}</div>
            <div className="text-gray-600 mt-2">{payText(order.payment)}</div>
          </div>
        </div>

        <div className="border-t pt-4 text-sm flex flex-col gap-1.5">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{i.name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span>
            </div>
          ))}
          {order.subtotal != null && (
            <>
              <div className="flex justify-between text-gray-500 pt-2 border-t mt-2"><span>Shipping</span><span>{order.shippingFee ? money(order.shippingFee) : "Free"}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>{money(order.tax ?? 0)}</span></div>
            </>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2"><span>Total</span><span>{money(order.total)}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link href={`/orders/${order._id}`} className={btnPrimary}>Track order</Link>
        <Link href={`/orders/${order._id}/invoice`} className={btnGhost}>Invoice</Link>
        <Link href="/list" className={btnGhost}>Continue shopping</Link>
      </div>
    </div>
  );
}