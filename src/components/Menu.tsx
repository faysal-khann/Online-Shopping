"use client";
import React from "react";
import { useState } from "react";

import Image from "next/image";
import Link from "next/dist/client/link";

function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        <Image
          src="/menu.png"
          alt="Menu"
          width={24}
          height={24}
          className="cursor-pointer"
          onClick={() => setOpen(!open)}
        />
        {open && (
          <div className="absolute top-20 left-0 bg-black text-white w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-8 text-xl z-10">

             
            <Link href="/">Homepage</Link>
            <Link href="/">Shop</Link>
            <Link href="/">Deals</Link>
            <Link href="/">About</Link>
            <Link href="/">Contact</Link>
            <Link href="/">Logout</Link>
            <Link href="/">Cart(1)</Link>
          </div>  
        )}
      </button>
    </div>
  );
}

export default Menu;
