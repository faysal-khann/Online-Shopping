"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/roles";
import Avatar from "@/components/profile/Avatar";
import { btnDanger, btnGhost, card, fmtDate, Modal, Skeleton, StatusBadge } from "@/components/dashboard/ui";

type Detail = {
  customer: {
    id: string; name: string; email: string; phone?: string; avatarUrl?: string; role: string; blocked: boolean;
    emailVerified: boolean; googleLinked: boolean; createdAt: string; orders: number; spent: number; lastOrder: string | null;
    addresses: { _id: string; label: string; fullName: string; line1: string; city: string; phone: string; isDefault: boolean }[];
  };
  orders: { _id: string; total: number; status: string; createdAt: string; itemCount: number }[];
};

const ROLES = [["user", "Customer"], ["viewer", "Viewer (read-only)"], ["staff", "Staff"], ["admin", "Admin"]];

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [data, setData] = useState<Detail | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<Detail>(`/admin/customers/${id}`).then(setData).catch((e) => toast.error(errorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  if (!data) return <Skeleton className="h-96" />;
  const c = data.customer;
  const self = c.id === user?.id;

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await apiFetch(`/admin/customers/${c.id}/block`, { method: "PATCH", body: JSON.stringify({ blocked: !c.blocked }) });
      toast.success(c.blocked ? "Customer unblocked" : "Customer blocked and signed out");
      setConfirm(false);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (role: string) => {
    if (!window.confirm(`Change ${c.name}'s role to ${role}?`)) return;
    try {
      await apiFetch(`/admin/customers/${c.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      toast.success("Role updated");
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/customers" className="text-sm underline w-max">← All customers</Link>

      <div className={`${card} p-5 flex flex-wrap items-center gap-4`}>
        <Avatar name={c.name} url={c.avatarUrl} size={64} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{c.name} {c.blocked && <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 align-middle">Blocked</span>}</h1>
          <p className="text-sm text-gray-500">{c.email}{c.phone && ` · ${c.phone}`}</p>
          <p className="text-xs text-gray-400">Joined {fmtDate(c.createdAt)} · {c.emailVerified ? "Email verified" : "Email not verified"}{c.googleLinked && " · Google linked"}</p>
        </div>
        {admin && !self && (
          <div className="flex flex-wrap items-center gap-3">
            <select value={c.role} onChange={(e) => changeRole(e.target.value)} className="ring-1 ring-gray-300 rounded-md px-2 py-1.5 text-sm">
              {ROLES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            {c.role === "user" && (
              <button className={c.blocked ? btnGhost : `${btnGhost} !text-red-600 !ring-red-200`} onClick={() => (c.blocked ? toggleBlock() : setConfirm(true))}>
                {c.blocked ? "Unblock" : "Block"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[["Orders", c.orders], ["Total spent", money(c.spent)], ["Last order", c.lastOrder ? fmtDate(c.lastOrder) : "—"]].map(([l, v]) => (
          <div key={String(l)} className={`${card} p-4`}><div className="text-sm text-gray-500">{l}</div><div className="text-xl font-semibold mt-1">{v}</div></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-3">Order history</h2>
          {data.orders.length === 0 ? <p className="text-sm text-gray-500">No orders yet.</p> : (
            <ul className={`${card} divide-y`}>
              {data.orders.map((o) => (
                <li key={o._id}>
                  <Link href={`/admin/orders/${o._id}`} className="flex justify-between items-center p-3 text-sm hover:bg-gray-50">
                    <span>#{o._id.slice(-8)}<span className="block text-xs text-gray-500">{fmtDate(o.createdAt)} · {o.itemCount} items</span></span>
                    <span className="text-right flex flex-col items-end gap-1">{money(o.total)}<StatusBadge status={o.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-3">Addresses</h2>
          {c.addresses.length === 0 ? <p className="text-sm text-gray-500">No saved addresses.</p> : (
            <div className="flex flex-col gap-3">
              {c.addresses.map((a) => (
                <div key={a._id} className={`${card} p-4 text-sm`}>
                  <div className="font-medium capitalize">{a.label} · {a.fullName} {a.isDefault && <span className="text-xs text-green-700">(default)</span>}</div>
                  <div className="text-gray-500">{a.line1}, {a.city}</div>
                  <div className="text-gray-500">{a.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={confirm} title={`Block ${c.name}?`} onClose={() => setConfirm(false)}>
        <p className="text-sm text-gray-600 mb-5">They will be signed out everywhere and can&apos;t log in or order until you unblock them.</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setConfirm(false)}>Cancel</button>
          <button className={btnDanger} disabled={busy} onClick={toggleBlock}>{busy ? "Blocking..." : "Block"}</button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetail;