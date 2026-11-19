"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NavLinks from "./NavLinks";

const Menu = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Lock page scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    close();
    router.push("/");
  };

  return (
    <div>
      <button onClick={() => setOpen(true)} aria-label="Open menu">
        <MenuIcon size={28} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={close}>
          <div
            className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-white p-6 flex flex-col gap-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Menu</span>
              <button onClick={close} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-4 text-lg">
              <NavLinks onClick={close} />
            </nav>

            <div className="border-t pt-4 mt-auto flex flex-col gap-3 text-sm">
              {user ? (
                <>
                  <Link href="/profile" onClick={close} className="hover:text-lama">
                    My dashboard
                  </Link>
                  <Link href="/profile#orders" onClick={close} className="hover:text-lama">
                    My orders
                  </Link>
                  {user.role !== "user"&& (
                    <Link href="/admin" onClick={close} className="hover:text-lama">
                      Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-left text-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-lg bg-lama text-white text-center py-2"
                >
                  Log in / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;