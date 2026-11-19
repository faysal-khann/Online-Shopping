/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Banner } from "@/lib/api";

const BannerSlider = ({ banners }: { banners: Banner[] }) => {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const b = banners[i % banners.length];
  return (
    <div className="relative h-[60vh] min-h-72 overflow-hidden bg-gray-100">
      {banners.map((x, idx) => (
        <img key={x._id} src={x.image} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="absolute inset-0 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 flex flex-col justify-center gap-4 text-white max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-semibold leading-tight">{b.title}</h2>
        {b.subtitle && <p className="text-lg text-white/90">{b.subtitle}</p>}
        <Link href={b.link} className="w-max rounded-full bg-white text-gray-900 px-6 py-2.5 text-sm font-medium hover:bg-gray-100">
          {b.buttonText}
        </Link>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
          {banners.map((x, idx) => (
            <button key={x._id} aria-label={`Banner ${idx + 1}`} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/60"}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;