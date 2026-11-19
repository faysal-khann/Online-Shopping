"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import Pager from "@/components/admin/Pager";
import { fmtDateTime, input } from "@/components/dashboard/ui";

type Log = {
  _id: string; userName?: string; userRole?: string; action: string; createdAt: string; ip?: string;
  target?: { type?: string; label?: string }; meta?: Record<string, unknown>;
};
type Resp = { logs: Log[]; total: number; page: number; pages: number };

const GROUPS = ["order", "product", "inventory", "customer", "user", "coupon", "banner", "category", "return", "upload"];

const AuditPage = () => {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (group) qs.set("group", group);
      if (q) qs.set("q", q);
      setData(await apiFetch<Resp>(`/admin/audit?${qs}`));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, group, q]);
  useEffect(() => { load(); }, [load]);

  const detail = (m?: Record<string, unknown>) =>
    m && Object.keys(m).length
      ? Object.entries(m).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" · ")
      : "";

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Audit log</h1>
      <p className="text-sm text-gray-500 mb-6">Who changed what, and when. Only admins can see this page.</p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder="Search person, action or item" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${input} !w-auto capitalize`} value={group} onChange={(e) => { setGroup(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Item</th><th className="p-3">Details</th></tr>
          </thead>
          <tbody className="divide-y">
            {data?.logs.map((l) => (
              <tr key={l._id}>
                <td className="p-3 whitespace-nowrap text-gray-600">{fmtDateTime(l.createdAt)}</td>
                <td className="p-3">{l.userName}<div className="text-xs text-gray-500 capitalize">{l.userRole}</div></td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3">{l.target?.label ?? "—"}</td>
                <td className="p-3 text-xs text-gray-600 max-w-80">{detail(l.meta)}</td>
              </tr>
            ))}
            {data && data.logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nothing logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
};

export default AuditPage;