"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiFetch, Category, errorMessage, finalPrice, money,
  PLACEHOLDER_IMG, Product, ProductsResponse,
} from "../../../lib/api";
import ProductForm from "../../../components/admin/ProductForm";
import Pager from "../../../components/admin/Pager";

const AdminProducts = () => {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  // Wait until the admin stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "10", sort: "desc lastUpdated" });
      if (query) qs.set("name", query);
      setData(await apiFetch<ProductsResponse>(`/products?${qs}`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/products/${p._id}`, { method: "DELETE" });
      if (data && data.products.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="ring-1 ring-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={() => setEditing("new")}
            className="rounded-md bg-lama text-white text-sm px-4 py-2"
          >
            New product
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className={`overflow-x-auto ring-1 ring-gray-200 rounded-md ${loading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.products.map((p) => (
              <tr key={p._id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0] || PLACEHOLDER_IMG}
                      alt=""
                      className="w-10 h-12 object-cover rounded"
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500">{p.category?.name ?? "—"}</td>
                <td className="p-3">
                  {money(finalPrice(p))}
                  {p.discountPrice != null && (
                    <span className="ml-2 text-xs text-gray-400 line-through">{money(p.price)}</span>
                  )}
                </td>
                <td className={`p-3 ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-orange-500" : ""}`}>
                  {p.stock}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(p)} className="underline mr-4">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="text-red-600 underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data && data.products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
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
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default AdminProducts;