"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/profile/Avatar";
import Overview from "@/components/profile/Overview";
import Addresses from "@/components/profile/Addresses";
import Security from "@/components/profile/Security";
import AccountSettings from "@/components/profile/AccountSettings";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "addresses", label: "Addresses" },
  { key: "security", label: "Password" },
  { key: "account", label: "Account" },
];

const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64";

const ProfileDashboard = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Keep the active tab in the URL hash so a refresh stays on the same tab
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (TABS.some((t) => t.key === fromHash)) setTab(fromHash);
  }, []);

  const go = (key: string) => {
    setTab(key);
    window.history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;

  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please{" "}
        <Link href="/login" className="underline">
          log in
        </Link>{" "}
        to see your profile.
      </div>
    );

  return (
    <div className={`${wrap} min-h-[70vh]`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Avatar name={user.name} url={user.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold truncate">Hi, {user.name}</h1>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Link
            href="/profile/edit"
            className="rounded-md bg-lama text-white text-sm px-4 py-2 whitespace-nowrap"
          >
            Edit profile
          </Link>
          <Link
            href="/orders"
            className="rounded-md ring-1 ring-gray-300 text-sm px-4 py-2 whitespace-nowrap"
          >
            My orders
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-md ring-1 ring-gray-300 text-sm px-4 py-2 whitespace-nowrap"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md ring-1 ring-red-300 text-red-600 text-sm px-4 py-2 whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </div>

      {/* TABS */}
      <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 mb-8 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            className={`rounded-md px-4 py-2 text-sm whitespace-nowrap ${
              tab === t.key
                ? "bg-lama text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <div className={tab === "overview" ? "" : "max-w-2xl"}>
        {tab === "overview" && <Overview go={go} />}
        {tab === "addresses" && <Addresses />}
        {tab === "security" && <Security />}
        {tab === "account" && <AccountSettings />}
      </div>
    </div>
  );
};

export default ProfileDashboard;