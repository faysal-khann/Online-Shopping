"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/recent";

const TrackView = ({ slug, name, image, price }: { slug: string; name: string; image?: string; price: number }) => {
  useEffect(() => {
    pushRecent({ slug, name, image, price });
  }, [slug, name, image, price]);
  return null;
};

export default TrackView;