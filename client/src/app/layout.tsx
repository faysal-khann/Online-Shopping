import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Providers from "../components/Providers";
import VerifyBanner from "@/components/VerifyBanner";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Cartiva | Online Store",
    template: "%s | Cartiva",
  },
  description:
    "Shop clothing, electronics, home and accessories at Cartiva. Fast checkout, easy returns and order tracking.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Cartiva | Online Store",
    description: "Shop clothing, electronics, home and accessories at Cartiva.",
    siteName: "Cartiva",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Providers>
  <VerifyBanner />
  <Navbar />
  {children}
  <Footer />
</Providers>
      </body>
    </html>
  );
}
