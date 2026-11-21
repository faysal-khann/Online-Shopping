"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canWrite, isAdmin } from "@/lib/roles";
import { btnDanger, btnGhost, btnPrimary, fmtDate, input, label, Modal, Skeleton, Toggle } from "@/components/dashboard/ui";

type Coupon = {
  _id: string; code: string; description: string; type: "percent" | "fixed"; value: number; minSubtotal: number;
  maxDiscount: number | null; maxUses: number | null; used: number; perUserLimit: number;
  startsAt: string | null; expiresAt: string | null; active: boolean; status: string;
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800", expired: "bg-gray-100 text-gray-600",
  exhausted: "bg-orange-100 text-orange-800", disabled: "bg-red-100 text-red-800",
};

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const blank = {
  code: "", description: "", type: "percent", value: "", minSubtotal: "", maxDiscount: "", maxUses: "",
  perUserLimit: "1", startsAt: "", expiresAt: "", active: true,
};

const AdminCoupons = () => {
  const { user } = useAuth();
  const write = canWrite(user?.role);
  const admin = isAdmin(user?.role);

  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const load = useCallback(() => {
    apiFetch<{ coupons: Coupon[] }>("/admin/coupons").then((d) => setCoupons(d.coupons)).catch((e) => toast.error(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const open = (c: Coupon | "new") => {
    setEditing(c);
    setF(
      c === "new" ? blank : {
        code: c.code, description: c.description, type: c.type, value: String(c.value),
        minSubtotal: c.minSubtotal ? String(c.minSubtotal) : "", maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
        maxUses: c.maxUses != null ? String(c.maxUses) : "", perUserLimit: String(c.perUserLimit),
        startsAt: toLocal(c.startsAt), expiresAt: toLocal(c.expiresAt), active: c.active,
      }
    );
  };

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...f,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
    };
    try {
      if (editing === "new") await apiFetch("/admin/coupons", { method: "POST", body: JSON.stringify(body) });
      else if (editing) await apiFetch(`/admin/coupons/${editing._id}`, { method: "PUT", body: JSON.stringify(body) });
      toast.success("Coupon saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      await apiFetch(`/admin/coupons/${c._id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...c, startsAt: c.startsAt, expiresAt: c.expiresAt, active: !c.active,
        }),
      });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await apiFetch(`/admin/coupons/${deleting._id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Coupons</h1>
        {write && <button className={btnPrimary} onClick={() => open("new")}>New coupon</button>}
      </div>

      {!coupons ? <Skeleton className="h-48" /> : (
        <div className="overflow-x-auto ring-1 ring-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Rules</th><th className="p-3">Used</th><th className="p-3">Valid</th><th className="p-3">Status</th>{write && <th className="p-3 text-right">Actions</th>}</tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="p-3"><div className="font-mono font-semibold">{c.code}</div><div className="text-xs text-gray-500">{c.description}</div></td>
                  <td className="p-3">{c.type === "percent" ? `${c.value}%` : money(c.value)}{c.maxDiscount ? <span className="text-xs text-gray-500"> (max {money(c.maxDiscount)})</span> : null}</td>
                  <td className="p-3 text-xs text-gray-600">{c.minSubtotal ? `Min ${money(c.minSubtotal)}` : "No minimum"}<br />{c.perUserLimit}× per customer</td>
                  <td className="p-3">{c.used}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</td>
                  <td className="p-3 text-xs text-gray-600">{c.startsAt ? fmtDate(c.startsAt) : "Now"} → {c.expiresAt ? fmtDate(c.expiresAt) : "No end"}</td>
                  <td className="p-3"><span className={`text-xs rounded-full px-2.5 py-0.5 capitalize ${STATUS_TONE[c.status]}`}>{c.status}</span></td>
                  {write && (
                    <td className="p-3 text-right whitespace-nowrap">
                      <span className="inline-block align-middle mr-3"><Toggle on={c.active} onChange={() => toggle(c)} /></span>
                      <button className="underline mr-3" onClick={() => open(c)}>Edit</button>
                      {admin && <button className="text-red-600 underline" onClick={() => setDeleting(c)}>Delete</button>}
                    </td>
                  )}
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} title={editing === "new" ? "New coupon" : "Edit coupon"} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>Code
              <input className={`${input} uppercase font-mono`} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} disabled={editing !== "new"} required placeholder="SAVE10" />
            </label>
            <label className={label}>Type
              <select className={input} value={f.type} onChange={set("type")}>
                <option value="percent">Percentage off</option><option value="fixed">Fixed amount off</option>
              </select>
            </label>
          </div>
          <label className={label}>Description (optional)<input className={input} value={f.description} onChange={set("description")} maxLength={200} /></label>
          <div className="grid grid-cols-3 gap-4">
            <label className={label}>{f.type === "percent" ? "Percent" : "Amount (৳)"}<input className={input} type="number" min="0" step="0.01" value={f.value} onChange={set("value")} required /></label>
            <label className={label}>Min spend (৳)<input className={input} type="number" min="0" step="0.01" value={f.minSubtotal} onChange={set("minSubtotal")} placeholder="none" /></label>
            {f.type === "percent" && <label className={label}>Max discount (৳)<input className={input} type="number" min="0" step="0.01" value={f.maxDiscount} onChange={set("maxDiscount")} placeholder="none" /></label>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>Total uses<input className={input} type="number" min="1" step="1" value={f.maxUses} onChange={set("maxUses")} placeholder="unlimited" /></label>
            <label className={label}>Uses per customer<input className={input} type="number" min="1" step="1" value={f.perUserLimit} onChange={set("perUserLimit")} required /></label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>Starts<input className={input} type="datetime-local" value={f.startsAt} onChange={set("startsAt")} /></label>
            <label className={label}>Expires<input className={input} type="datetime-local" value={f.expiresAt} onChange={set("expiresAt")} /></label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
            <button disabled={busy} className={btnPrimary}>{busy ? "Saving..." : "Save coupon"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} title="Delete coupon?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-gray-600 mb-5">Delete <strong>{deleting?.code}</strong>? Past orders keep their discount. To stop it temporarily, switch it off instead.</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
          <button className={btnDanger} onClick={remove}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCoupons;