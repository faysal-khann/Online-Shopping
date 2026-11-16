"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, Product } from "../lib/api";
import { useAuth } from "./AuthContext";

export type CartItem = {
  _id: string;
  product: Pick<Product, "_id" | "name" | "slug" | "price" | "discountPrice" | "images" | "stock">;
  quantity: number;
  color?: string;
  size?: string;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  
  
  addToCart: (p: { productId: string; quantity: number; color?: string; size?: string }) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  checkout: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const load = useCallback(async () => {
    if (!user) return setItems([]);
    try {
      const d = await apiFetch<{ cart: { items: CartItem[] } }>("/cart");
      setItems(d.cart.items);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addToCart: CartState["addToCart"] = async (body) => {
    const d = await apiFetch<{ cart: { items: CartItem[] } }>("/cart", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setItems(d.cart.items);
  };

  const removeFromCart = async (itemId: string) => {
    const d = await apiFetch<{ cart: { items: CartItem[] } }>(`/cart/${itemId}`, {
      method: "DELETE",
    });
    setItems(d.cart.items);
  };
    const checkout = async () => {
    await apiFetch("/orders", { method: "POST" });
    await load();
  };

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.product.discountPrice ?? i.product.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ items, count, subtotal, addToCart, removeFromCart, checkout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};