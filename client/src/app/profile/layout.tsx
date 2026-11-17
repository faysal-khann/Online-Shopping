"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/profile/Avatar";

const links = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/edit", label: "Edit profile" },
  { href: "/profile/addresses", label: "Addresses" },
  { href: "/profile/security", label: "Password" },
  { href: "/profile/account", label: "Account" },
];

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;
  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please <Link href="/login" className="underline">log in</Link> to see your profile.
      </div>
    );

  return (
    <div className={`${wrap} flex flex-col md:flex-row gap-8 min-h-[70vh]`}>
      <aside className="md:w-56 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <Avatar name={user.name} url={user.avatarUrl} size={48} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-4 py-2 text-sm whitespace-nowrap ${
                pathname === l.href ? "bg-lama text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/orders" className="rounded-md px-4 py-2 text-sm whitespace-nowrap bg-gray-100 hover:bg-gray-200">
            My orders
          </Link>
        </nav>
      </aside>
      <section className="flex-1 min-w-0 max-w-4xl">{children}</section>
    </div>
  );
}