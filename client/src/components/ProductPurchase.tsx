"use client";

import { useState } from "react";
import CustomizeProducts from "./CustomizeProducts";
import Add from "./Add";
import type { Product } from "../lib/api";

const ProductPurchase = ({ product }: { product: Product }) => {
  const [color, setColor] = useState<string | undefined>(product.colors[0]);
  const [size, setSize] = useState<string | undefined>(product.sizes[0]);

  return (
    <>
      <CustomizeProducts
        colors={product.colors}
        sizes={product.sizes}
        color={color}
        size={size}
        onColor={setColor}
        onSize={setSize}
      />
      <Add
        productId={product._id}
        stock={product.stock}
        color={color}
        size={size}
      />
    </>
  );
};

export default ProductPurchase;
