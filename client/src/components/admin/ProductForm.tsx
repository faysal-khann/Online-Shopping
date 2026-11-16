"use client";

import { useEffect, useState } from "react";
import { apiFetch, Category, errorMessage, Product } from "../../lib/api";

type Props = {
  product: Product | null; // null = create
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const ProductForm = ({ product, categories, onClose, onSaved }: Props) => {
  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    discountPrice: product?.discountPrice != null ? String(product.discountPrice) : "",
    stock: product ? String(product.stock) : "0",
    category: product?.category?._id ?? "",
    type: product?.type ?? "physical",
    colors: product?.colors.join(", ") ?? "",
    sizes: product?.sizes.join(", ") ?? "",
    images: product?.images.join("\n") ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const price = Number(f.price);
    const stock = Number(f.stock);
    const discount = f.discountPrice === "" ? null : Number(f.discountPrice);
    const images = f.images.split("\n").map((s) => s.trim()).filter(Boolean);

    if (!f.name.trim()) return setError("Name is required");
    if (f.price === "" || isNaN(price) || price < 0) return setError("Enter a valid price");
    if (discount !== null && (isNaN(discount) || discount < 0 || discount >= price))
      return setError("Discount price must be lower than the price");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number");
    if (images.some((u) => !/^(https?:\/\/|\/)/.test(u)))
      return setError("Each image must be a URL (https://...) or a path starting with /");

    const body = {
      name: f.name.trim(),
      description: f.description.trim(),
      price,
      discountPrice: discount,
      stock,
      category: f.category || null,
      type: f.type,
      colors: list(f.colors),
      sizes: list(f.sizes),
      images,
    };

    setBusy(true);
    try {
      if (product) {
        await apiFetch(`/products/${product._id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/products", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const input = "ring-1 ring-gray-300 rounded-md p-2 w-full text-sm";
  const label = "text-xs font-medium text-gray-600 flex flex-col gap-1";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-md max-w-2xl mx-auto my-8 p-6 flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{product ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-500">
            ×
          </button>
        </div>

        <label className={label}>
          Name
          <input className={input} value={f.name} onChange={set("name")} required />
        </label>

        <label className={label}>
          Description
          <textarea className={input} rows={3} value={f.description} onChange={set("description")} />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className={label}>
            Price ($)
            <input className={input} type="number" min="0" step="0.01" value={f.price} onChange={set("price")} required />
          </label>
          <label className={label}>
            Discount price ($)
            <input className={input} type="number" min="0" step="0.01" value={f.discountPrice} onChange={set("discountPrice")} placeholder="optional" />
          </label>
          <label className={label}>
            Stock
            <input className={input} type="number" min="0" step="1" value={f.stock} onChange={set("stock")} required />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={label}>
            Category
            <select className={input} value={f.category} onChange={set("category")}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            Type
            <select className={input} value={f.type} onChange={set("type")}>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={label}>
            Colors (comma separated, e.g. #111827, #ffffff)
            <input className={input} value={f.colors} onChange={set("colors")} />
            <span className="flex gap-1 mt-1">
              {list(f.colors).map((c) => (
                <span key={c} style={{ backgroundColor: c }} className="w-5 h-5 rounded-full ring-1 ring-gray-300" />
              ))}
            </span>
          </label>
          <label className={label}>
            Sizes (comma separated, e.g. S, M, L)
            <input className={input} value={f.sizes} onChange={set("sizes")} />
          </label>
        </div>

        <label className={label}>
          Image URLs (one per line, first is the main image)
          <textarea className={input} rows={3} value={f.images} onChange={set("images")} />
        </label>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md py-2 px-4 text-sm ring-1 ring-gray-300">
            Cancel
          </button>
          <button
            disabled={busy}
            className="rounded-md py-2 px-4 text-sm bg-lama text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;