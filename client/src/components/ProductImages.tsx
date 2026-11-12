"use client";

import Image from "next/image";
import { useState } from "react";
import { PLACEHOLDER_IMG } from "../lib/api";

const ProductImages = ({ images, name = "" }: { images: string[]; name?: string }) => {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [PLACEHOLDER_IMG];

  return (
    <div>
      <div className="h-[500px] relative">
        <Image
          src={list[index]}
          alt={name}
          fill
          sizes="50vw"
          className="object-cover rounded-md"
        />
      </div>
      <div className="flex justify-between gap-4 mt-8">
        {list.map((url, i) => (
          <div
            key={url + i}
            className="w-1/4 h-32 relative cursor-pointer"
            onClick={() => setIndex(i)}
          >
            <Image src={url} alt="" fill sizes="30vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;