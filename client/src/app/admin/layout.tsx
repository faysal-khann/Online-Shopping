"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList, Boxes, Image as ImageIcon, Layers, LayoutDashboard, Package,
  RotateCcw, ScrollText, Tag, Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin, isStaff } from "@/lib/roles";

const GROUPS = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Layers },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  { title: "System", adminOnly: true, items: [{ href: "/admin/audit", label: "Audit log", icon: ScrollText }] },
];

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;
  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please <Link href="/login" className="underline">log in</Link> to continue.
      </div>
    );
  if (!isStaff(user.role))
    return (
      <div className={`${wrap} py-20`}>
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-gray-500 mt-2">This area is for the store team only.</p>
      </div>
    );

  const groups = GROUPS.filter((g) => !g.adminOnly || isAdmin(user.role));
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className={`${wrap} pb-16 flex flex-col lg:flex-row gap-8 min-h-[70vh]`}>
      <aside className="lg:w-56 shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Admin</h2>
          <span className="inline-block mt-1 text-xs capitalize rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5">
            {user.role}
          </span>
        </div>

        {/* desktop */}
        <nav className="hidden lg:flex flex-col gap-5 sticky top-24">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-3 mb-1">{g.title}</div>
              {g.items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active(i.href) ? "bg-lama text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <i.icon size={18} /> {i.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* mobile */}
        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-2">
          {groups.flatMap((g) => g.items).map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                active(i.href) ? "bg-lama text-white" : "bg-gray-100"
              }`}
            >
              <i.icon size={16} /> {i.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="flex-1 min-w-0">
        {user.role === "viewer" && (
          <div className="mb-6 text-sm bg-blue-50 text-blue-900 rounded-lg px-4 py-2">
            You have read-only access. Changes are disabled for your role.
          </div>
        )}
        {children}
      </section>
    </div>
  );
}