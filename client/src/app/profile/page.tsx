"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award, Bell, Clock, Heart, LayoutDashboard, LogOut, MapPin, Package,
  RotateCcw, Settings, ShieldCheck, User as UserIcon, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/profile/Avatar";
import Addresses from "@/components/profile/Addresses";
import Security from "@/components/profile/Security";
import AccountSettings from "@/components/profile/AccountSettings";
import Overview from "@/components/dashboard/Overview";
import Orders from "@/components/dashboard/Orders";
import Wishlist from "@/components/dashboard/Wishlist";
import RecentlyViewed from "@/components/dashboard/RecentlyViewed";
import Returns from "@/components/dashboard/Returns";
import Rewards from "@/components/dashboard/Rewards";
import ProfileForm from "@/components/dashboard/ProfileForm";
import Notifications from "@/components/dashboard/Notifications";
import Sessions from "@/components/dashboard/Sessions";
import { btnGhost, card } from "@/components/dashboard/ui";

const GROUPS = [
  {
    title: "Shopping",
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "orders", label: "My orders", icon: Package },
      { key: "wishlist", label: "Wishlist", icon: Heart },
      { key: "recent", label: "Recently viewed", icon: Clock },
      { key: "returns", label: "Returns", icon: RotateCcw },
      { key: "rewards", label: "Rewards", icon: Award },
    ],
  },
  {
    title: "Account",
    items: [
      { key: "profile", label: "Profile", icon: UserIcon },
      { key: "addresses", label: "Addresses", icon: MapPin },
      { key: "security", label: "Security", icon: ShieldCheck },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "account", label: "Account", icon: Settings },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);
const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";

const ProfileDashboard = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (ALL.some((i) => i.key === h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = (key: string) => {
    setTab(key);
    window.history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;
  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please <Link href="/login" className="underline">log in</Link> to see your dashboard.
      </div>
    );

  const NavButton = ({ item }: { item: (typeof ALL)[number] }) => (
    <button
      onClick={() => go(item.key)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
        tab === item.key ? "bg-lama text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <item.icon size={18} />
      {item.label}
    </button>
  );

  return (
    <div className={`${wrap} pb-16`}>
      {/* HERO */}
      <div className={`${card} bg-gradient-to-r from-pink-50 to-white p-5 mb-6 flex flex-wrap items-center gap-4`}>
        <Avatar name={user.name} url={user.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold truncate">Hi, {user.name}</h1>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          {!user.emailVerified && (
            <Link href="/verify-email" className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1 underline">
              <ShieldAlert size={14} /> Verify your email to place orders
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/list" className={btnGhost}>Continue shopping</Link>
          {user.role !== "user" && <Link href="/admin" className={btnGhost}>Admin</Link>}
          <button onClick={handleLogout} className={`${btnGhost} !text-red-600 !ring-red-200`}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[230px_1fr] gap-8">
        {/* SIDEBAR (desktop) */}
        <aside className="hidden lg:flex flex-col gap-6 self-start sticky top-24">
          {GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-3 mb-1">{g.title}</div>
              {g.items.map((i) => <NavButton key={i.key} item={i} />)}
            </div>
          ))}
        </aside>

        {/* TABS (mobile) */}
        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mt-2">
          {ALL.map((i) => <NavButton key={i.key} item={i} />)}
        </nav>

        {/* CONTENT */}
        <section key={tab} className="fade-in min-w-0">
          {tab === "overview" && <Overview go={go} />}
          {tab === "orders" && <Orders />}
          {tab === "wishlist" && <Wishlist />}
          {tab === "recent" && <RecentlyViewed />}
          {tab === "returns" && <Returns />}
          {tab === "rewards" && <Rewards />}
          {tab === "profile" && <ProfileForm />}
          {tab === "addresses" && <div className="max-w-2xl"><Addresses /></div>}
          {tab === "security" && (
            <div className="max-w-2xl">
              <Security />
              <Sessions />
            </div>
          )}
          {tab === "notifications" && <Notifications />}
          {tab === "account" && <div className="max-w-2xl"><AccountSettings /></div>}
        </section>
      </div>
    </div>
  );
};

export default ProfileDashboard;