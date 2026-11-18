/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { money } from "@/lib/api";
import { clearRecent, getRecent, type RecentItem } from "@/lib/recent";
import { btnGhost, card, EmptyState, SectionHeader } from "./ui";

const Grid = ({ items }: { items: RecentItem[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {items.map((p) => (
      <Link key={p.slug} href={`/${p.slug}`} className={`${card} overflow-hidden group hover:shadow-md transition`}>
        <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
          {p.image && (
            <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          )}
        </div>
        <div className="p-3 text-sm">
          <div className="font-medium truncate">{p.name}</div>
          <div className="text-gray-500">{money(p.price)}</div>
        </div>
      </Link>
    ))}
  </div>
);

// compact = small strip used inside Overview
const RecentlyViewed = ({ compact = false }: { compact?: boolean }) => {
  const [items, setItems] = useState<RecentItem[] | null>(null);

  useEffect(() => {
    setItems(getRecent());
  }, []);

  if (!items) return null;

  if (compact) {
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className="font-semibold mb-3">Recently viewed</h2>
        <Grid items={items.slice(0, 4)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Recently viewed"
        subtitle="Products you looked at on this device"
        action={
          items.length > 0 && (
            <button
              className={btnGhost}
              onClick={() => {
                clearRecent();
                setItems([]);
              }}
            >
              Clear
            </button>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<Clock size={22} />}
          title="Nothing viewed yet"
          text="Products you open will show up here so you can find them again."
          action={<Link href="/list" className="text-sm underline">Browse products</Link>}
        />
      ) : (
        <Grid items={items} />
      )}
    </div>
  );
};

export default RecentlyViewed;