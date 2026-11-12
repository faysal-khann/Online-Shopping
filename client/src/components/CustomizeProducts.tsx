"use client";

import { useState } from "react";

type Props = { colors: string[]; sizes: string[] };

// Color and size selection. These get sent to the cart in the next step.
function CustomizeProducts({ colors, sizes }: Props) {
  const [color, setColor] = useState<string | undefined>(colors[0]);
  const [size, setSize] = useState<string | undefined>(sizes[0]);

  return (
    <>
      {colors.length > 0 && (
        <div className="flex flex-col gap-6">
          <h4 className="font-medium">Choose a Color</h4>
          <ul className="flex gap-4">
            {colors.map((c) => (
              <li
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className="w-8 h-8 rounded-full ring-1 ring-gray-300 relative cursor-pointer"
              >
                {color === c && (
                  <div className="absolute w-10 h-10 rounded-full ring-2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <h4 className="font-medium">Choose a Size</h4>
          <div className="flex gap-4 mt-4">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`min-w-10 h-10 px-2 rounded-full ring-1 ring-gray-300 text-sm font-medium hover:bg-gray-100 ${
                  size === s ? "bg-lama text-white ring-lama hover:bg-lama" : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default CustomizeProducts;