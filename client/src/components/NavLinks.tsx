"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const NAV_LINKS = [
  { href: "/", label: "Homepage" },
  { href: "/list", label: "Shop" },
  { href: "/list?deals=1", label: "Deals" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const Inner = ({ onClick, className = "" }: { onClick?: () => void; className?: string }) => {
  const pathname = usePathname();
  const deals = useSearchParams().get("deals") === "1";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/list") return pathname === "/list" && !deals;
    if (href === "/list?deals=1") return pathname === "/list" && deals;
    return pathname.startsWith(href);
  };

  return (
    <>
      {NAV_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onClick}
          className={`${className} ${
            isActive(l.href) ? "text-lama font-medium" : "hover:text-lama"
          } transition-colors`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
};

// useSearchParams needs a Suspense boundary in Next.js
const NavLinks = (props: { onClick?: () => void; className?: string }) => (
  <Suspense fallback={null}>
    <Inner {...props} />
  </Suspense>
);

export default NavLinks;