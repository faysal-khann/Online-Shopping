"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
  items: {
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }[];
  payment?: {
    method: string;
    status: string;
    brand?: string;
    last4?: string;
    provider?: string;
  };
  shippingAddress?: {
    fullName: string;
    line1: string;
    city: string;
    phone: string;
  };
};

const FLOW = [
  { key: "pending", label: "Order placed" },
  { key: "paid", label: "Payment confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 min-h-[50vh]";

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch<{ order: Order }>(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(errorMessage(e)));
  }, [user, id]);

  if (loading) return null;
  if (!user)
    return (
      <div className={wrap}>
        Please{" "}
        <Link href="/login" className="underline">
          log in
        </Link>{" "}
        to see this order.
      </div>
    );
  if (error)
    return (
      <div className={wrap}>
        <p className="text-red-600">{error}</p>
        <Link href="/orders" className="underline text-sm">
          Back to orders
        </Link>
      </div>
    );
  if (!order)
    return (
      <div className={wrap}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  // Orders created before history existed fall back to one entry
  const history = order.statusHistory?.length
    ? order.statusHistory
    : [{ status: order.status, at: order.createdAt }];
  const at = (s: string) => history.find((h) => h.status === s)?.at;
  const cancelled = order.status === "cancelled";
  const reached = FLOW.findIndex((f) => f.key === order.status);

  let steps = FLOW.map((f, i) => ({
    ...f,
    when: at(f.key),
    done: i <= reached || !!at(f.key),
    bad: false,
  }));
  if (cancelled) {
    steps = steps.filter((s) => s.done);
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      when: at("cancelled"),
      done: true,
      bad: true,
    });
  }

  return (
    <div className={wrap}>
      <Link href="/orders" className="text-sm underline">
        ← All orders
      </Link>
      <h1 className="text-2xl font-semibold mt-4">
        Order #{order._id.slice(-8)}
      </h1>
      <p className="text-sm text-gray-500">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="grid lg:grid-cols-2 gap-12 mt-8">
        <div>
          <h2 className="font-semibold mb-6">Status</h2>
          <ol className="relative border-l-2 border-gray-200 ml-3">
            {steps.map((s) => (
              <li key={s.key} className="relative ml-6 mb-8 last:mb-0">
                <span
                  className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                    s.done
                      ? s.bad
                        ? "bg-red-500"
                        : "bg-green-500"
                      : "bg-gray-300"
                  }`}
                >
                  {s.done ? (s.bad ? "✕" : "✓") : ""}
                </span>
                <div className={`font-medium ${s.done ? "" : "text-gray-400"}`}>
                  {s.label}
                </div>
                <div className="text-xs text-gray-500">
                  {s.when
                    ? new Date(s.when).toLocaleString()
                    : s.done
                      ? ""
                      : "Waiting"}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="font-semibold mb-6">Items</h2>
          <div className="ring-1 ring-gray-200 rounded-md p-4">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>
                  {i.name} x {i.quantity}
                  {[i.color, i.size].filter(Boolean).length > 0 &&
                    ` (${[i.color, i.size].filter(Boolean).join(" / ")})`}
                </span>
                <span>{money(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold mt-3 pt-3 border-t">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
      {(order.payment || order.shippingAddress) && (
        <div className="ring-1 ring-gray-200 rounded-md p-4 mt-6 text-sm flex flex-col gap-3">
          {order.payment && (
            <div>
              <div className="text-xs text-gray-500">Payment</div>
              <div className="capitalize">
                {order.payment.method === "card"
                  ? `${order.payment.brand ?? "Card"} ending ${order.payment.last4}`
                  : order.payment.method === "mobile"
                    ? `${order.payment.provider} ···${order.payment.last4}`
                    : "Cash on delivery"}{" "}
                · {order.payment.status}
              </div>
            </div>
          )}

          {order.shippingAddress && (
            <div>
              <div className="text-xs text-gray-500">Shipping address</div>
              <div>
                {order.shippingAddress.fullName}, {order.shippingAddress.line1},{" "}
                {order.shippingAddress.city}
              </div>
              <div className="text-gray-500">{order.shippingAddress.phone}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
