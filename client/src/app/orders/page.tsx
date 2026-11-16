"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; price: number; quantity: number; color?: string; size?: string }[];
};

const OrdersPage = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ orders: Order[] }>("/orders")
      .then((d) => setOrders(d.orders))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return null;
  if (!user)
    return (
      <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        Please <Link href="/login" className="underline">log in</Link> to see your orders.
      </div>
    );

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 min-h-[50vh]">
      <h1 className="text-2xl font-semibold mb-8">My Orders</h1>
      {fetching ? (
        <p className="text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((o) => (
            <div key={o._id} className="ring-1 ring-gray-200 rounded-md p-4">
              <div className="flex justify-between text-sm text-gray-500 mb-3">
                <span>{new Date(o.createdAt).toLocaleString()}</span>
                <span className="capitalize">{o.status}</span>
              </div>
              {o.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span>
                    {i.name} x {i.quantity}
                    {[i.color, i.size].filter(Boolean).length > 0 &&
                      ` (${[i.color, i.size].filter(Boolean).join(" / ")})`}
                  </span>
                  <span>${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold mt-3 pt-3 border-t">
                <span>Total</span>
                <span>${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;