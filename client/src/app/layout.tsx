import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Providers from "../components/Providers";
import VerifyBanner from "@/components/VerifyBanner";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lama Dev E-Commerce Application",
  description: "A complete e-commerce application with Next.js and Wix",
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
