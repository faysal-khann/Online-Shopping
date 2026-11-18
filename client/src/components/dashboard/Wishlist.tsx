/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { apiFetch, errorMessage, finalPrice, money, type Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { btnPrimary, card, EmptyState, SectionHeader, Skeleton } from "./ui";

type Item = Pick<Product, "_id" | "name" | "slug" | "price" | "discountPrice" | "images" | "stock" | "colors" | "sizes">;

const Wishlist = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ products: Item[] }>("/wishlist")
      .then((d) => setItems(d.products))
      .catch((e) => {
        toast.error(errorMessage(e));
        setItems([]);
      });
  }, []);

  const remove = async (p: Item) => {
    try {
      await apiFetch(`/wishlist/${p._id}`, { method: "DELETE" });
      setItems((list) => list?.filter((i) => i._id !== p._id) ?? null);
      toast.success("Removed from wishlist");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const add = async (p: Item) => {
    setBusy(p._id);
    try {
      await addToCart({ productId: p._id, quantity: 1 });
      toast.success("Added to cart");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Wishlist" subtitle="Products you saved for later" />
      {!items ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={22} />}
          title="Your wishlist is empty"
          text="Tap “Save to wishlist” on any product page to keep it here."
          action={<Link href="/list" className="rounded-lg bg-lama text-white text-sm px-4 py-2">Browse products</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const needsOptions = p.colors.length > 0 || p.sizes.length > 0;
            return (
              <div key={p._id} className={`${card} overflow-hidden flex flex-col`}>
                <Link href={`/${p.slug}`} className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />}
                </Link>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex justify-between gap-2">
                    <Link href={`/${p.slug}`} className="font-medium hover:underline">{p.name}</Link>
                    <button onClick={() => remove(p)} aria-label="Remove from wishlist" className="text-lama">
                      <Heart size={18} className="fill-current" />
                    </button>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{money(finalPrice(p))}</span>
                    {p.discountPrice != null && <span className="ml-2 text-xs text-gray-400 line-through">{money(p.price)}</span>}
                  </div>
                  {p.stock < 1 ? (
                    <span className="text-sm text-red-600 mt-auto">Out of stock</span>
                  ) : needsOptions ? (
                    <Link href={`/${p.slug}`} className={`${btnPrimary} mt-auto`}>Choose options</Link>
                  ) : (
                    <button disabled={busy === p._id} onClick={() => add(p)} className={`${btnPrimary} mt-auto`}>
                      {busy === p._id ? "Adding..." : "Add to cart"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;