/**
 * The Amazon wordmark (Amazon.com, Inc. trademark), drawn from the official logo
 * artwork. Used only on buttons that link to the UNI&CORE Amazon listings; the
 * trademark notice sits in the page footer.
 */
import type { CSSProperties } from "react";

/** Draws the #amz-logo symbol from SvgSprites (rendered once by the site layout). */
export function AmazonLogo({ className = "", smile = "#FF9900", title }: { className?: string; smile?: string; title?: string }) {
  return (
    <svg viewBox="0 0 603 182" className={`amz-logo ${className}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} fill="currentColor">
      <use href="#amz-logo" style={{ "--amz-smile": smile } as CSSProperties} />
    </svg>
  );
}
