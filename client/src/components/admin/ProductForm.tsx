"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { apiFetch, Category, errorMessage, Product } from "@/lib/api";
import { btnGhost, btnPrimary, input, label } from "@/components/dashboard/ui";
import ImageUploader from "./ImageUploader";

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
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
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

    if (!f.name.trim()) return setError("Name is required");
    if (f.price === "" || isNaN(price) || price < 0) return setError("Enter a valid price");
    if (discount !== null && (isNaN(discount) || discount < 0 || discount >= price))
      return setError("Discount price must be lower than the price");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number");

    const body = {
      name: f.name.trim(), description: f.description.trim(), price, discountPrice: discount, stock,
      category: f.category || null, type: f.type, colors: list(f.colors), sizes: list(f.sizes), images,
    };

    setBusy(true);
    try {
      if (product) await apiFetch(`/products/${product._id}`, { method: "PUT", body: JSON.stringify(body) });
      else await apiFetch("/products", { method: "POST", body: JSON.stringify(body) });
      toast.success(product ? "Product updated" : "Product created");
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="fade-in bg-white rounded-xl max-w-2xl mx-auto my-8 p-6 flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{product ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <label className={label}>Name<input className={input} value={f.name} onChange={set("name")} required /></label>
        <label className={label}>Description<textarea className={input} rows={3} value={f.description} onChange={set("description")} /></label>

        <div className="grid grid-cols-3 gap-4">
          <label className={label}>Price (৳)<input className={input} type="number" min="0" step="0.01" value={f.price} onChange={set("price")} required /></label>
          <label className={label}>Discount (৳)<input className={input} type="number" min="0" step="0.01" value={f.discountPrice} onChange={set("discountPrice")} placeholder="optional" /></label>
          <label className={label}>Stock<input className={input} type="number" min="0" step="1" value={f.stock} onChange={set("stock")} required /></label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={label}>Category
            <select className={input} value={f.category} onChange={set("category")}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className={label}>Type
            <select className={input} value={f.type} onChange={set("type")}>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={label}>Colors (comma separated)
            <input className={input} value={f.colors} onChange={set("colors")} placeholder="#111827, #ffffff" />
            <span className="flex gap-1 mt-1">
              {list(f.colors).map((c) => <span key={c} style={{ backgroundColor: c }} className="w-5 h-5 rounded-full ring-1 ring-gray-300" />)}
            </span>
          </label>
          <label className={label}>Sizes (comma separated)<input className={input} value={f.sizes} onChange={set("sizes")} placeholder="S, M, L" /></label>
        </div>

        <div className={label}>
          Images
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button disabled={busy} className={btnPrimary}>{busy ? "Saving..." : "Save product"}</button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;