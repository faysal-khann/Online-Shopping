/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

const COLORS = ["bg-pink-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-teal-500"];

const Avatar = ({ name, url, size = 80 }: { name: string; url?: string; size?: number }) => {
  const [broken, setBroken] = useState(false);
  const initials =
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

  if (url && !broken)
    return (
      <img
        src={url}
        alt={name}
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      className={`${color} rounded-full text-white flex items-center justify-center font-semibold`}
    >
      {initials}
    </div>
  );
};

export default Avatar;