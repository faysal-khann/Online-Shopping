"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <CartProvider>{children}</CartProvider>
    <Toaster richColors closeButton position="top-right" />
  </AuthProvider>
);

export default Providers;