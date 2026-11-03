"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { AmazonProduct } from "./AmazonButton";

export function ProductViewTracker({ product }: { product: AmazonProduct }) {
  useEffect(() => {
    track("product_detail_view", { product });
    track("view_item", { product });
  }, [product]);
  return null;
}
