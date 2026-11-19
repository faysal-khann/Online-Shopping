"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import Pager from "@/components/admin/Pager";
import { fmtDateTime, input } from "@/components/dashboard/ui";

type Log = {
  _id: string; productName: string; type: string; delta: number; before?: number; after?: number;
  reason: string; userName?: string; createdAt: string;
};
type Resp = { logs: Log[]; total: number; page: number; pages: number };

const TYPES = ["sale", "cancel", "manual", "edit", "import"];
const TONE: Record<string, string> = {
  sale: "bg-blue-100 text-blue-800", cancel: "bg-green-100 text-green-800", manual: "bg-purple-100 text-purple-800",
  edit: "bg-gray-100 text-gray-700", import: "bg-amber-100 text-amber-800", return: "bg-green-100 text-green-800",
};

const Inventory = () => {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
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
      if (type) qs.set("type", type);
      if (q) qs.set("q", q);
      setData(await apiFetch<Resp>(`/admin/inventory?${qs}`));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, type, q]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Inventory log</h1>
      <p className="text-sm text-gray-500 mb-6">Every stock change: sales, cancellations, manual adjustments and imports. Adjust stock from the Products page.</p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder="Search product" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={`${input} !w-auto capitalize`} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">When</th><th className="p-3">Product</th><th className="p-3">Type</th><th className="p-3">Change</th><th className="p-3">Stock</th><th className="p-3">Reason</th><th className="p-3">By</th></tr>
          </thead>
          <tbody className="divide-y">
            {data?.logs.map((l) => (
              <tr key={l._id}>
                <td className="p-3 whitespace-nowrap text-gray-600">{fmtDateTime(l.createdAt)}</td>
                <td className="p-3 font-medium">{l.productName}</td>
                <td className="p-3"><span className={`text-xs rounded-full px-2 py-0.5 capitalize ${TONE[l.type] ?? ""}`}>{l.type}</span></td>
                <td className={`p-3 font-medium ${l.delta < 0 ? "text-red-600" : "text-green-600"}`}>{l.delta > 0 ? `+${l.delta}` : l.delta}</td>
                <td className="p-3 text-gray-500">{l.before} → {l.after}</td>
                <td className="p-3 text-gray-600 max-w-60 truncate" title={l.reason}>{l.reason}</td>
                <td className="p-3 text-gray-500">{l.userName ?? "System"}</td>
              </tr>
            ))}
            {data && data.logs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No stock changes yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
};

export default Inventory;