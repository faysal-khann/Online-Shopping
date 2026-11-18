"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { fmtDate, Stars } from "@/components/dashboard/ui";

type Data = {
  average: number;
  count: number;
  reviews: { _id: string; rating: number; comment: string; createdAt: string; userName: string }[];
};

const ProductReviews = ({ productId }: { productId: string }) => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    apiFetch<Data>(`/reviews/product/${productId}`).then(setData).catch(() => {});
  }, [productId]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">User Reviews</h1>
      {!data || data.count === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Stars value={data.average} size={20} />
            <span className="text-sm text-gray-600">{data.average} out of 5 · {data.count} review{data.count > 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-col gap-4">
            {data.reviews.map((r) => (
              <div key={r._id} className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.userName}</span>
                  <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} size={14} />
                {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductReviews;