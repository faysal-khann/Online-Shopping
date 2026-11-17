"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const VerifyBanner = () => {
  const { user } = useAuth();
  if (!user || user.emailVerified) return null;
  return (
    <div className="bg-yellow-50 text-yellow-900 text-sm px-4 py-2 text-center">
      Please verify <strong>{user.email}</strong> to place orders.{" "}
      <Link href="/verify-email" className="underline">Enter code</Link>
    </div>
  );
};

export default VerifyBanner;