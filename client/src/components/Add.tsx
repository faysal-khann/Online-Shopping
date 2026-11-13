"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

type Props = { productId: string; stock: number; color?: string; size?: string };

function Add({ productId, stock, color, size }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const handleQuantity = (type: "i" | "d") => {
    if (type === "d" && quantity > 1) setQuantity((q) => q - 1);
    if (type === "i" && quantity < stock) setQuantity((q) => q + 1);
  };

  const handleAdd = async () => {
    if (!user) return router.push("/login");
    setLoading(true);
    setMessage("");
    try {
      await addToCart({ productId, quantity, color, size });
      setMessage("Added to cart!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4>Choose a Quantity</h4>
      <div className="flex justify-between mt-2">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 py-2 px-4 rounded-3xl flex items-center justify-between w-32">
            <button className="cursor-pointer text-xl" onClick={() => handleQuantity("d")}>
              -
            </button>
            {quantity}
            <button className="cursor-pointer text-xl" onClick={() => handleQuantity("i")}>
              +
            </button>
          </div>
          {stock < 1 ? (
            <div className="text-xs">Product is out of stock</div>
          ) : (
            <div className="text-xs">
              Only <span className="text-orange-500">{stock} items</span> left!
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={loading || stock < 1}
          className="w-36 text-sm rounded-3xl ring-1 ring-lama text-lama py-2 px-4 hover:bg-lama hover:text-white disabled:cursor-not-allowed disabled:bg-pink-200 disabled:ring-0 disabled:text-white"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
      {message && <div className="text-sm mt-2 text-gray-600">{message}</div>}
    </div>
  );
}

export default Add;