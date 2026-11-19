"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage, type Product } from "@/lib/api";
import { btnGhost, btnPrimary, input, label, Modal } from "@/components/dashboard/ui";

const StockModal = ({
  product, onClose, onSaved,
}: { product: Product | null; onClose: () => void; onSaved: () => void }) => {
  const [mode, setMode] = useState<"add" | "set">("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/products/${product._id}/stock`, {
        method: "POST",
        body: JSON.stringify({ mode, quantity: Number(qty), reason }),
      });
      toast.success("Stock updated");
      setQty("");
      setReason("");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!product} title={`Adjust stock: ${product?.name ?? ""}`} onClose={onClose}>
      {product && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Current stock: <strong>{product.stock}</strong></p>
          <div className="flex gap-2">
            {(["add", "set"] as const).map((m) => (
              <button
                key={m} type="button" onClick={() => setMode(m)}
                className={`rounded-full px-4 py-1.5 text-sm ${mode === m ? "bg-lama text-white" : "bg-gray-100"}`}
              >
                {m === "add" ? "Add / remove" : "Set exact amount"}
              </button>
            ))}
          </div>
          <label className={label}>
            {mode === "add" ? "Change (use a negative number to remove)" : "New stock level"}
            <input className={input} type="number" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </label>
          <label className={label}>
            Reason
            <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Supplier delivery, damaged goods" required minLength={3} maxLength={200} />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
            <button disabled={busy} className={btnPrimary}>{busy ? "Saving..." : "Save"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default StockModal;