"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, Category, errorMessage } from "../../../lib/api";

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ categories: Category[] }>("/categories");
      setCategories(d.categories);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setName("");
    setImage("");
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setImage(c.image ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = JSON.stringify({ name: name.trim(), image: image.trim() || undefined });
      if (editing) await apiFetch(`/categories/${editing._id}`, { method: "PUT", body });
      else await apiFetch("/categories", { method: "POST", body });
      reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError("");
    try {
      await apiFetch(`/categories/${c._id}`, { method: "DELETE" });
      if (editing?._id === c._id) reset();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const input = "ring-1 ring-gray-300 rounded-md px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Categories</h1>

      <form onSubmit={submit} className="flex flex-wrap gap-3 mb-2">
        <input
          className={`${input} flex-1 min-w-40`}
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={`${input} flex-[2] min-w-56`}
          placeholder="Image URL (optional)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <button disabled={busy} className="rounded-md bg-lama text-white text-sm px-4 py-2 disabled:opacity-60">
          {busy ? "Saving..." : editing ? "Update" : "Add category"}
        </button>
        {editing && (
          <button type="button" onClick={reset} className="rounded-md text-sm px-4 py-2 ring-1 ring-gray-300">
            Cancel
          </button>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="mt-6 ring-1 ring-gray-200 rounded-md divide-y">
        {loading ? (
          <p className="p-4 text-gray-500 text-sm">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No categories yet.</p>
        ) : (
          categories.map((c) => (
            <div key={c._id} className="flex items-center justify-between p-3 text-sm">
              <div className="flex items-center gap-3">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="w-10 h-12 object-cover rounded" />
                )}
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">/list?cat={c.slug}</div>
                </div>
              </div>
              <div className="whitespace-nowrap">
                <button onClick={() => startEdit(c)} className="underline mr-4">
                  Edit
                </button>
                <button onClick={() => remove(c)} className="text-red-600 underline">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;