"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
];

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;

  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please{" "}
        <Link href="/login" className="underline">
          log in
        </Link>{" "}
        to continue.
      </div>
    );

  if (user.role !== "admin")
    return (
      <div className={`${wrap} py-20`}>
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-gray-500 mt-2">This area is for administrators only.</p>
      </div>
    );

  return (
    <div className={`${wrap} flex flex-col md:flex-row gap-8 min-h-[70vh]`}>
      <aside className="md:w-52 shrink-0">
        <h2 className="text-lg font-semibold mb-4">Admin</h2>
        <nav className="flex md:flex-col gap-2 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-4 py-2 text-sm whitespace-nowrap ${
                  active ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}