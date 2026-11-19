"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { apiFetch, errorMessage, money } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { useAuth } from "@/context/AuthContext";
import { canWrite } from "@/lib/roles";
import Pager from "@/components/admin/Pager";
import Avatar from "@/components/profile/Avatar";
import { btnGhost, fmtDate, input } from "@/components/dashboard/ui";

type C = {
  id: string; name: string; email: string; avatarUrl?: string; role: string; blocked: boolean;
  emailVerified: boolean; createdAt: string; orders: number; spent: number;
};
type Resp = { customers: C[]; total: number; page: number; pages: number };

const AdminCustomers = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<"customers" | "team">("customers");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useCallback(() => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (group === "team") qs.set("role", "team");
    if (blocked) qs.set("blocked", "1");
    return qs;
  }, [q, group, blocked]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = params();
      qs.set("page", String(page));
      setData(await apiFetch<Resp>(`/admin/customers?${qs}`));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        {canWrite(user?.role) && (
          <button className={btnGhost} onClick={() => downloadFile(`/admin/customers/export?${params()}`, "customers.csv").catch((e) => toast.error(errorMessage(e)))}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${input} pl-9`} placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {(["customers", "team"] as const).map((g) => (
          <button key={g} onClick={() => { setGroup(g); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm capitalize ${group === g ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{g}</button>
        ))}
        <button onClick={() => { setBlocked((b) => !b); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm ${blocked ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>Blocked only</button>
      </div>

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Name</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y">
            {data?.customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                    <Avatar name={c.name} url={c.avatarUrl} size={36} />
                    <span><span className="font-medium block">{c.name}</span><span className="text-xs text-gray-500">{c.email}</span></span>
                  </Link>
                </td>
                <td className="p-3">{c.orders}</td>
                <td className="p-3">{money(c.spent)}</td>
                <td className="p-3 text-gray-600">{fmtDate(c.createdAt)}</td>
                <td className="p-3 flex gap-1.5 flex-wrap">
                  {c.role !== "user" && <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 capitalize">{c.role}</span>}
                  {c.blocked && <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5">Blocked</span>}
                  {!c.emailVerified && <span className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">Unverified</span>}
                </td>
              </tr>
            ))}
            {data && data.customers.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No one found.</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
};

export default AdminCustomers;