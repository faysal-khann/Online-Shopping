"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { fmtDate, StatusBadge } from "@/components/dashboard/ui";

const STATUSES = ["requested", "approved", "rejected", "refunded"];

type Ret = {
  _id: string;
  reason: string;
  details: string;
  status: string;
  adminNote: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
  order?: { _id: string; total: number } | null;
};

const Row = ({ r, onSaved }: { r: Ret; onSaved: () => void }) => {
  const [status, setStatus] = useState(r.status);
  const [note, setNote] = useState(r.adminNote);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await apiFetch(`/admin/returns/${r._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNote: note }),
      });
      toast.success("Return updated");
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ring-1 ring-gray-200 rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <div>
          <div className="font-medium">{r.user?.name ?? "Deleted user"}</div>
          <div className="text-xs text-gray-500">
            {r.user?.email} · {fmtDate(r.createdAt)}
          </div>
        </div>
        <div className="text-right">
          <div>Order #{r.order?._id.slice(-8)} · {r.order ? money(r.order.total) : ""}</div>
          <StatusBadge status={r.status} />
        </div>
      </div>
      <div className="text-sm">
        <span className="font-medium capitalize">{r.reason.replace(/_/g, " ")}</span>
        {r.details && <span className="text-gray-500"> · “{r.details}”</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="ring-1 ring-gray-300 rounded-md px-2 py-1 text-sm capitalize">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note shown to the customer"
          maxLength={500}
          className="ring-1 ring-gray-300 rounded-md px-3 py-1 text-sm flex-1 min-w-48"
        />
        <button disabled={busy} onClick={save} className="rounded-md bg-lama text-white text-sm px-4 py-1 disabled:opacity-60">
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const AdminReturns = () => {
  const [items, setItems] = useState<Ret[] | null>(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const qs = status ? `?status=${status}` : "";
      const d = await apiFetch<{ returns: Ret[] }>(`/admin/returns${qs}`);
      setItems(d.returns);
    } catch (e) {
      toast.error(errorMessage(e));
      setItems([]);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Returns</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="ring-1 ring-gray-300 rounded-md px-3 py-2 text-sm capitalize">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!items ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">No return requests.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((r) => <Row key={r._id + r.status} r={r} onSaved={load} />)}
        </div>
      )}
    </div>
  );
};

export default AdminReturns;