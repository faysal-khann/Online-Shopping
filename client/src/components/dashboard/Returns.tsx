"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { card, EmptyState, fmtDate, SectionHeader, Skeleton, StatusBadge } from "./ui";

type Ret = {
  _id: string;
  reason: string;
  details: string;
  status: string;
  adminNote: string;
  createdAt: string;
  order?: { _id: string; total: number; items: { quantity: number }[] } | null;
};

const REASON: Record<string, string> = {
  damaged: "Item arrived damaged",
  wrong_item: "Wrong item received",
  not_as_described: "Not as described",
  changed_mind: "Changed my mind",
  other: "Other",
};

const HINT: Record<string, string> = {
  requested: "We're reviewing your request.",
  approved: "Approved. Follow the instructions in the note below.",
  rejected: "This request was not approved.",
  refunded: "Your refund has been issued.",
};

const Returns = () => {
  const [items, setItems] = useState<Ret[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ returns: Ret[] }>("/returns")
      .then((d) => setItems(d.returns))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Returns & refunds" subtitle="Start a return from the Orders section on any delivered order" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!items ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<RotateCcw size={22} />}
          title="No return requests"
          text="Delivered orders can be returned within 14 days."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((r) => (
            <div key={r._id} className={`${card} p-5 flex flex-col gap-2`}>
              <div className="flex flex-wrap justify-between gap-2">
                <div className="font-semibold">
                  {r.order ? (
                    <Link href={`/orders/${r.order._id}`} className="hover:underline">Order #{r.order._id.slice(-8)}</Link>
                  ) : (
                    "Order removed"
                  )}
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm text-gray-600">
                {REASON[r.reason] ?? r.reason} · requested {fmtDate(r.createdAt)}
                {r.order && ` · ${money(r.order.total)}`}
              </div>
              {r.details && <p className="text-sm text-gray-500">“{r.details}”</p>}
              <p className="text-sm">{HINT[r.status]}</p>
              {r.adminNote && (
                <p className="text-sm bg-gray-50 rounded-lg p-3">
                  <span className="font-medium">Note from store: </span>
                  {r.adminNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Returns;