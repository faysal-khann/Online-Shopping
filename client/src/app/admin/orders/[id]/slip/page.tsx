"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import { btnPrimary, fmtDate } from "@/components/dashboard/ui";
import type { AdminOrder } from "../page";

const SlipPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ order: AdminOrder }>(`/admin/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-gray-500">Loading...</p>;
  const a = order.shippingAddress;
  if (!a) return <p className="text-gray-600">This order has nothing to ship (digital items only).</p>;

  return (
    <div>
      <div className="flex gap-3 mb-6 print:hidden">
        <Link href={`/admin/orders/${id}`} className="text-sm underline self-center">← Back to order</Link>
        <button onClick={() => window.print()} className={`${btnPrimary} ml-auto`}><Printer size={16} /> Print</button>
      </div>

      <div id="invoice" className="bg-white max-w-3xl mx-auto flex flex-col gap-6">
        {/* SHIPPING LABEL */}
        <div className="border-2 border-dashed border-gray-400 rounded-lg p-6">
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Cartiva</span>
            <span>Order #{order._id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-500">Ship to</div>
          <div className="text-2xl font-bold mt-1">{a.fullName}</div>
          <div className="text-lg">{a.line1}</div>
          <div className="text-lg">{a.city}{a.postalCode ? ` ${a.postalCode}` : ""}</div>
          <div className="text-lg mt-1">Tel: {a.phone}</div>
          {order.shippingMethod && (
            <div className="mt-4 inline-block border-2 border-black px-3 py-1 font-bold uppercase">{order.shippingMethod.label}</div>
          )}
          {order.payment?.method === "cod" && order.payment.status !== "paid" && (
            <div className="mt-4 text-xl font-bold">COLLECT ON DELIVERY: ${order.total.toFixed(2)}</div>
          )}
        </div>

        {/* PACKING SLIP */}
        <div className="p-2">
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-semibold">Packing slip</h1>
            <span className="text-sm text-gray-500">{fmtDate(order.createdAt)}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 w-10">Packed</th><th className="py-2">Item</th><th className="py-2">Options</th><th className="py-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2"><span className="inline-block w-4 h-4 border border-gray-500" /></td>
                  <td className="py-2 font-medium">{i.name}</td>
                  <td className="py-2 text-gray-500">{[i.color, i.size].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="py-2 text-right">{i.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-6">Thank you for shopping with Cartiva. Questions? hello@cartiva.com</p>
        </div>
      </div>
    </div>
  );
};

export default SlipPage;