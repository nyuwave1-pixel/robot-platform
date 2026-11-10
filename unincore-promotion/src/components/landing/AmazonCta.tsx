import { AmazonButton, type AmazonProduct } from "@/components/site/AmazonButton";
import { AmazonLogo } from "./AmazonLogo";

/** Amazon-orange button with the Amazon wordmark: "Shop Now on amazon". */
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
    <AmazonButton product={product} location={location} className={`amz-btn ${sizeClass} ${className}`}>
      <span>{label}</span>
      <AmazonLogo title="Amazon" smile="currentColor" />
    </AmazonButton>
  );
}
