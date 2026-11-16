"use client";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { PLACEHOLDER_IMG, finalPrice } from "../lib/api";

const CartModal = () => {
  const { user } = useAuth();
  const { items, subtotal, removeFromCart, checkout } = useCart();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCheckout = async () => {
    setBusy(true);
    setMessage("");
    try {
      await checkout();
      setMessage("Order placed! Thank you for shopping with Cartiva.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-max absolute p-4 rounded-md shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-white top-12 right-0 flex flex-col gap-6 z-20 text-black">
      {!user ? (
        <div>Please log in to use your cart</div>
      ) : items.length === 0 ? (
        <div>{message || "Cart is Empty"}</div>
      ) : (
        <>
          <h2 className="text-xl">Shopping Cart</h2>
          <div className="gap-8 flex flex-col">
            {items.map((item) => (
              <div className="flex gap-4" key={item._id}>
                <Image
                  src={item.product.images[0] || PLACEHOLDER_IMG}
                  alt={item.product.name}
                  width={72}
                  height={96}
                  className="object-cover rounded-md"
                />
                <div className="flex flex-col justify-between w-full gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-8">
                      <h2 className="font-semibold">{item.product.name}</h2>
                      <div className="p-1 bg-gray-50 rounded-md">
                        ${finalPrice(item.product)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {[item.color, item.size].filter(Boolean).join(" / ") ||
                        "available"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Qty. {item.quantity}</span>
                    <span
                      className="text-white bg-lama p-1 rounded-lg cursor-pointer"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center font-semibold justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              Shipping and taxes are calculated at checkout.
            </p>
            {message && <p className="text-sm text-red-500 mb-2">{message}</p>}
            <button
              onClick={handleCheckout}
              disabled={busy}
              className="p-2 rounded-md bg-blue-400 text-white text-sm disabled:opacity-60"
            >
              {busy ? "Processing..." : "Check Out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartModal;
