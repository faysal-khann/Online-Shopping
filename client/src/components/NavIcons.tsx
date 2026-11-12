"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CartModal from "./CartModal";
import { useAuth } from "../context/AuthContext";

const NavIcons = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user, logout } = useAuth();

  const handleProfile = () => {
    if (!user) router.push("/login");
    else setIsProfileOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    setIsProfileOpen(false);
    router.push("/");
  };

  return (
    <div className="flex items-center gap-4 xl:gap-6 relative">
      <Image
        src="/profile.png"
        alt=""
        width={22}
        height={22}
        className="cursor-pointer"
        onClick={handleProfile}
      />
      {isProfileOpen && user && (
        <div className="absolute p-4 rounded-md top-12 left-0 bg-white text-sm shadow-[0_3px_10px_rgb(0,0,0,0.2)] text-black z-20">
          <div className="font-medium mb-2">{user.name}</div>
          <Link href="/" onClick={() => setIsProfileOpen(false)}>
            Profile
          </Link>
          <div className="mt-2 cursor-pointer" onClick={handleLogout}>
            {isLoading ? "Logging out" : "Logout"}
          </div>
        </div>
      )}
      <Image src="/notification.png" alt="" width={22} height={22} className="cursor-pointer" />
      <div className="relative cursor-pointer" onClick={() => setIsCartOpen((prev) => !prev)}>
        <Image src="/cart.png" alt="" width={22} height={22} />
      </div>
      {isCartOpen && <CartModal />}
    </div>
  );
};

export default NavIcons;