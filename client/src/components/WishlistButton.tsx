"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WishlistButton = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return setSaved(false);
    apiFetch<{ ids: string[] }>("/wishlist/ids")
      .then((d) => setSaved(d.ids.includes(productId)))
      .catch(() => {});
  }, [user, productId]);

  const toggle = async () => {
    if (!user) return router.push("/login");
    setBusy(true);
    try {
      await apiFetch(`/wishlist/${productId}`, { method: saved ? "DELETE" : "POST" });
      setSaved(!saved);
      toast.success(saved ? "Removed from wishlist" : "Saved to wishlist");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="inline-flex items-center gap-2 text-sm rounded-lg ring-1 ring-gray-300 px-4 py-2 w-max hover:bg-gray-50 disabled:opacity-60"
    >
      <Heart size={16} className={saved ? "fill-current text-lama" : ""} />
      {saved ? "Saved to wishlist" : "Save to wishlist"}
    </button>
  );
};

export default WishlistButton;