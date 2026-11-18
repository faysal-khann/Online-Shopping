"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { btnPrimary, fmtDate } from "@/components/dashboard/ui";

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  items: {
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }[];
};

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 pb-16";

const InvoicePage = () => {
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
        </Link>
        .
      </div>
    );
  if (error) return <div className={`${wrap} text-red-600`}>{error}</div>;
  if (!order) return <div className={`${wrap} text-gray-500`}>Loading...</div>;

  return (
    <div className={wrap}>
      <div className="flex gap-3 mb-6 print:hidden">
        <Link href="/profile#orders" className="text-sm underline self-center">
          ← Back to orders
        </Link>
        <button
          onClick={() => window.print()}
          className={`${btnPrimary} ml-auto`}
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <div
        id="invoice"
        className="bg-white max-w-3xl mx-auto ring-1 ring-gray-200 rounded-xl p-8 print:ring-0 print:p-0"
      >
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-2xl font-bold text-lama">Cartiva</div>
            <div className="text-sm text-gray-500">Online Store</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">Invoice</div>
            <div className="text-sm text-gray-500">
              #{order._id.slice(-8).toUpperCase()}
            </div>
            <div className="text-sm text-gray-500">
              {fmtDate(order.createdAt)}
            </div>
          </div>
        </div>

        <div className="mb-8 text-sm">
          <div className="text-gray-500 mb-1">Billed to</div>
          <div className="font-medium">{user.name}</div>
          <div className="text-gray-600">{user.email}</div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">
                  {i.name}
                  {[i.color, i.size].filter(Boolean).length > 0 && (
                    <span className="text-gray-400">
                      {" "}
                      ({[i.color, i.size].filter(Boolean).join(" / ")})
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">{money(i.price)}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">
                  {money(i.price * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-64 text-sm flex flex-col gap-1.5">
            {order.subtotal != null && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {order.shippingFee ? money(order.shippingFee) : "Free"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{money(order.tax ?? 0)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-gray-500 flex justify-between">
          <span>
            Status: <span className="capitalize">{order.status}</span>
          </span>
          <span>Thank you for shopping with Cartiva.</span>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
