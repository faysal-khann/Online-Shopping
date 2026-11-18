"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import { btnGhost, btnPrimary, input, label, Modal, StarPicker } from "./ui";

export type OrderItem = {
  product?: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
};

export type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
  items: OrderItem[];
};

const REASONS = [
  ["damaged", "Item arrived damaged"],
  ["wrong_item", "Wrong item received"],
  ["not_as_described", "Not as described"],
  ["changed_mind", "Changed my mind"],
  ["other", "Other"],
] as const;

export const ReturnModal = ({
  order,
  onClose,
  onDone,
}: {
  order: Order | null;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [reason, setReason] = useState("damaged");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    try {
      await apiFetch("/returns", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id, reason, details }),
      });
      toast.success("Return request sent. We'll review it soon.");
      setDetails("");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!order} title="Request a return" onClose={onClose}>
      {order && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}. Returns are accepted within 14 days of delivery.</p>
          <label className={label}>
            Reason
            <select className={input} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map(([v, text]) => (
                <option key={v} value={v}>{text}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Details (optional)
            <textarea className={input} rows={4} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
            <button disabled={busy} className={btnPrimary}>{busy ? "Sending..." : "Send request"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
};

const ReviewRow = ({
  orderId,
  item,
  done,
  onSaved,
}: {
  orderId: string;
  item: OrderItem;
  done: boolean;
  onSaved: (productId: string) => void;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (done)
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 py-2">
        <CheckCircle2 size={16} /> {item.name}: reviewed
      </div>
    );

  const submit = async () => {
    if (!rating) return toast.error("Pick a star rating first");
    setBusy(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ orderId, productId: item.product, rating, comment }),
      });
      toast.success("Thanks for your review!");
      onSaved(item.product!);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ring-1 ring-gray-200 rounded-lg p-3 flex flex-col gap-3">
      <div className="font-medium text-sm">{item.name}</div>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        className={input}
        rows={2}
        maxLength={1000}
        placeholder="Share your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="button" disabled={busy} onClick={submit} className={`${btnPrimary} w-max`}>
        {busy ? "Saving..." : "Submit review"}
      </button>
    </div>
  );
};

export const ReviewModal = ({
  order,
  reviewed,
  onClose,
  onSaved,
}: {
  order: Order | null;
  reviewed: Set<string>;
  onClose: () => void;
  onSaved: (productId: string) => void;
}) => (
  <Modal open={!!order} title="Review your items" onClose={onClose}>
    {order && (
      <div className="flex flex-col gap-3">
        {order.items
          .filter((i) => i.product)
          .map((i, idx) => (
            <ReviewRow
              key={`${i.product}-${idx}`}
              orderId={order._id}
              item={i}
              done={reviewed.has(i.product!)}
              onSaved={onSaved}
            />
          ))}
      </div>
    )}
  </Modal>
);