"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CartModal from "./CartModal";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const NavIcons = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useCart();

  // Logged in: open the dashboard. Logged out: go to login.
  const handleProfile = () => router.push(user ? "/profile" : "/login");

  return (
    <div className="flex items-center gap-4 xl:gap-6 relative">
      <Image
        src="/profile.png"
        alt="Profile"
        width={22}
        height={22}
        className="cursor-pointer"
        onClick={handleProfile}
      />
      <Image src="/notification.png" alt="" width={22} height={22} className="cursor-pointer" />
      <div className="relative cursor-pointer" onClick={() => setIsCartOpen((prev) => !prev)}>
        <Image src="/cart.png" alt="Cart" width={22} height={22} />
        {count > 0 && (
          <div className="absolute -top-4 -right-4 w-6 h-6 bg-lama rounded-full text-white text-sm flex items-center justify-center">
            {count}
          </div>
        )}
      </div>
      {isCartOpen && <CartModal />}
    </div>
  );
};

export default NavIcons;