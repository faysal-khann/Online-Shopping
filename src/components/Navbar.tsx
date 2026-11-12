import React from "react";
import Menu from "./Menu";
import Link from "next/link";
import Image from "next/image";
import SearchBar from "./SearchBar";
import NavIcons from "./NavIcons";

const Navbar = () => {
  return (
    <div className="bg-blue-500 text-white h-20 px-4 md:px-8 lg:px-16 xl:pr-32 2xl:pr-64 relative">
      {/* MOBILE */}
      <div className="md:hidden h-full flex items-center justify-between ">
        <Link href="/">FLipkart</Link>

        <Menu />
      </div>

      {/* BIGGER SCREEN */}
      <div className="hidden md:flex h-full items-center justify-between gap-8">
        {/* LEFT */}
        <div className="w-1/3 xl:w-1/2 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={24} height={24} />
            <div className="text-2xl ">FLipkart</div>
          </Link>
          <div className="hidden xl:flex gap-4">
            <Link href="/">Homepage</Link>
            <Link href="/">Shop</Link>
            <Link href="/">Deals</Link>
            <Link href="/">About</Link>
            <Link href="/">Contact</Link>
          </div>
        </div>

        {/* Right */}
        <div className="w-2/3 xl:w-1/2 flex items-center justify-end gap-4">
          <SearchBar />
          <NavIcons />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
