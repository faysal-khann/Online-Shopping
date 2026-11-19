"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import {
  apiFetch, Category, errorMessage, finalPrice, money, PLACEHOLDER_IMG, Product, ProductsResponse,
} from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { useAuth } from "@/context/AuthContext";
import { canWrite, isAdmin } from "@/lib/roles";
import ProductForm from "@/components/admin/ProductForm";
import StockModal from "@/components/admin/StockModal";
import CsvImportModal from "@/components/admin/CsvImportModal";
import Pager from "@/components/admin/Pager";
import { btnDanger, btnGhost, btnPrimary, input, Modal } from "@/components/dashboard/ui";

const FILTERS = [["", "All"], ["low", "Low stock"], ["out", "Out of stock"]];

const AdminProducts = () => {
  const { user } = useAuth();
  const write = canWrite(user?.role);
  const admin = isAdmin(user?.role);

  const [data, setData] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/categories").then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "10", sort: "desc lastUpdated" });
      if (query) qs.set("name", query);
      if (stock) qs.set("stock", stock);
      setData(await apiFetch<ProductsResponse>(`/products?${qs}`));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, query, stock]);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    if (!deleting) return;
    try {
      await apiFetch(`/products/${deleting._id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setDeleting(null);
      if (data && data.products.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const exportCsv = () => downloadFile("/admin/products/export", "products.csv").catch((e) => toast.error(errorMessage(e)));

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className={`${input} !w-52`} />
          {write && (
            <>
              <button className={btnGhost} onClick={exportCsv}><Download size={16} /> Export</button>
              <button className={btnGhost} onClick={() => setImporting(true)}><Upload size={16} /> Import</button>
              <button className={btnPrimary} onClick={() => setEditing("new")}>New product</button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map(([v, text]) => (
          <button
            key={v}
            onClick={() => { setStock(v); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm ${stock === v ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {text}
          </button>
        ))}
      </div>

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th>
              <th className="p-3">Stock</th>{write && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.products.map((p) => (
              <tr key={p._id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0] || PLACEHOLDER_IMG} alt="" className="w-10 h-12 object-cover rounded" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500">{p.category?.name ?? "—"}</td>
                <td className="p-3">
                  {money(finalPrice(p))}
                  {p.discountPrice != null && <span className="ml-2 text-xs text-gray-400 line-through">{money(p.price)}</span>}
                </td>
                <td className={`p-3 ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-orange-500" : ""}`}>{p.stock}</td>
                {write && (
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="underline mr-4">Edit</button>
                    <button onClick={() => setAdjusting(p)} className="underline mr-4">Stock</button>
                    {admin && <button onClick={() => setDeleting(p)} className="text-red-600 underline">Delete</button>}
                  </td>
                )}
              </tr>
            ))}
            {data && data.products.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      <StockModal product={adjusting} onClose={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); load(); }} />
      <CsvImportModal open={importing} onClose={() => setImporting(false)} onDone={load} />
      <Modal open={!!deleting} title="Delete this product?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-gray-600 mb-5">&quot;{deleting?.name}&quot; will be removed permanently. Past orders keep their own copy of the details.</p>
        <div className="flex justify-end gap-3">
          <button className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
          <button className={btnDanger} onClick={remove}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;