import { AmazonButton, type AmazonProduct } from "@/components/site/AmazonButton";
import { AmazonLogo } from "./AmazonLogo";
import { TikTokShopMark } from "./TikTokShopMark";

/** Amazon-orange button with the Amazon wordmark: "Shop Now on amazon". A TikTok Shop product gets the black TikTok Shop button. */
export function AmazonCta({
  product,
  location,
  label = "Shop Now on",
  size = "lg",
  className = "",
}: {
  product: AmazonProduct;
  location: string;
  label?: string;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const sizeClass = size === "md" ? "amz-md" : size === "sm" ? "amz-sm" : "";
  return (
    <AmazonButton product={product} location={location} className={`amz-btn ${product.shop ? "tts" : ""} ${sizeClass} ${className}`}>
      <span>{label}</span>
      {product.shop ? <TikTokShopMark /> : <AmazonLogo title="Amazon" smile="currentColor" />}
    </AmazonButton>
  );
}
