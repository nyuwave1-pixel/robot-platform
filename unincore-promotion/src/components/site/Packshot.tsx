import Image from "next/image";
import type { ProductKey } from "@/content/types";

/**
 * Product visual. Uses real photography when `image` is set in the CMS;
 * otherwise renders an illustrated packshot so pages never show broken images.
 */
export function Packshot({
  kind,
  image,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 80vw, 40vw",
}: {
  kind: ProductKey;
  image?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (image) {
    return (
      <div className={`relative aspect-[4/5] overflow-hidden rounded-[12%] shadow-[0_24px_60px_-30px_rgba(60,40,10,0.45)] ${className}`}>
        <Image src={image} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative aspect-[4/5] ${className}`} role="img" aria-label={alt}>
      {kind === "ampoule" && <AmpouleArt />}
      {kind === "mask" && <MaskArt />}
      {kind === "wash" && <WashArt />}
    </div>
  );
}

function AmpouleArt() {
  return (
    <svg viewBox="0 0 400 500" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="amp-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#C4690A" />
          <stop offset="0.35" stopColor="#F2A447" />
          <stop offset="0.6" stopColor="#E98A15" />
          <stop offset="1" stopColor="#A85607" />
        </linearGradient>
        <linearGradient id="amp-cap" x1="0" x2="1">
          <stop offset="0" stopColor="#E9E3DA" />
          <stop offset="0.45" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D8D0C4" />
        </linearGradient>
        <radialGradient id="amp-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1D1B18" stopOpacity="0.25" />
          <stop offset="1" stopColor="#1D1B18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="468" rx="120" ry="16" fill="url(#amp-shadow)" />
      {/* dropper bulb + collar */}
      <rect x="172" y="40" width="56" height="92" rx="28" fill="url(#amp-cap)" />
      <rect x="150" y="122" width="100" height="58" rx="10" fill="url(#amp-cap)" />
      <rect x="150" y="170" width="100" height="8" fill="#CFC6B8" />
      {/* bottle */}
      <path d="M140 186 h120 q22 0 22 22 v238 q0 20 -20 20 h-124 q-20 0 -20 -20 v-238 q0 -22 22 -22z" fill="url(#amp-glass)" />
      <rect x="150" y="196" width="10" height="250" rx="5" fill="#fff" opacity="0.25" />
      {/* label */}
      <rect x="140" y="262" width="120" height="150" rx="4" fill="#FBF8F3" />
      <text x="200" y="290" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="600" fill="#1D1B18" letterSpacing="1.5">UNI&amp;CORE</text>
      <line x1="170" y1="300" x2="230" y2="300" stroke="#E98A15" strokeWidth="1.5" />
      <text x="200" y="336" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill="#C4690A">13.5</text>
      <text x="200" y="356" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="9" fill="#4A4540" letterSpacing="2">VITA C</text>
      <text x="200" y="376" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="7" fill="#7A726A" letterSpacing="1.4">SUPER BRIGHTENING</text>
      <text x="200" y="388" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="7" fill="#7A726A" letterSpacing="1.4">AMPOULE · 30 g</text>
    </svg>
  );
}

function MaskArt() {
  return (
    <svg viewBox="0 0 400 500" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="mask-pouch" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="0.5" stopColor="#F6D274" />
          <stop offset="1" stopColor="#E9B53A" />
        </linearGradient>
        <linearGradient id="mask-pouch2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBF0CF" />
          <stop offset="1" stopColor="#EBC75E" />
        </linearGradient>
        <radialGradient id="mask-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1D1B18" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1D1B18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="470" rx="140" ry="16" fill="url(#mask-shadow)" />
      {/* back pouch */}
      <g transform="rotate(-8 200 260)">
        <rect x="92" y="70" width="210" height="370" rx="10" fill="url(#mask-pouch2)" />
      </g>
      {/* front pouch */}
      <g transform="rotate(4 200 260)">
        <rect x="104" y="64" width="210" height="380" rx="10" fill="url(#mask-pouch)" />
        <path d="M104 92 h210" stroke="#fff" strokeOpacity="0.7" strokeDasharray="4 5" />
        <path d="M104 74 l10 8 -10 8" fill="none" stroke="#C49A23" strokeWidth="1.5" />
        <circle cx="209" cy="210" r="62" fill="#fff" opacity="0.55" />
        <circle cx="209" cy="210" r="44" fill="#F3C64B" opacity="0.8" />
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1="209" y1="210" x2={209 + 44 * Math.cos((i * Math.PI) / 5)} y2={210 + 44 * Math.sin((i * Math.PI) / 5)} stroke="#fff" strokeWidth="2" opacity="0.8" />
        ))}
        <circle cx="209" cy="210" r="10" fill="#fff" />
        <text x="209" y="318" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="600" fill="#1D1B18" letterSpacing="1.5">UNI&amp;CORE</text>
        <text x="209" y="344" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="10" fill="#4A4540" letterSpacing="2.4">VITA C</text>
        <text x="209" y="362" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="8" fill="#4A4540" letterSpacing="1.6">SUPER BRIGHTENING MASK</text>
        <text x="209" y="404" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#A97A0C">2%</text>
        <text x="209" y="420" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="7" fill="#7A726A" letterSpacing="1.4">PURE VITAMIN C</text>
      </g>
    </svg>
  );
}

function WashArt() {
  return (
    <svg viewBox="0 0 400 500" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="wash-box" x1="0" x2="1">
          <stop offset="0" stopColor="#F9E1D5" />
          <stop offset="0.55" stopColor="#FFF6F1" />
          <stop offset="1" stopColor="#EFC3AC" />
        </linearGradient>
        <linearGradient id="wash-side" x1="0" x2="1">
          <stop offset="0" stopColor="#E4936F" />
          <stop offset="1" stopColor="#C97553" />
        </linearGradient>
        <linearGradient id="wash-stick" x1="0" x2="1">
          <stop offset="0" stopColor="#F3B193" />
          <stop offset="0.5" stopColor="#FFE9DE" />
          <stop offset="1" stopColor="#E4936F" />
        </linearGradient>
        <radialGradient id="wash-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1D1B18" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1D1B18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="470" rx="150" ry="16" fill="url(#wash-shadow)" />
      {/* box */}
      <path d="M110 120 l150 0 l34 -22 l-150 0z" fill="#FCEDE5" />
      <path d="M260 120 l34 -22 v330 l-34 22z" fill="url(#wash-side)" />
      <rect x="110" y="120" width="150" height="330" fill="url(#wash-box)" />
      <text x="185" y="190" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="600" fill="#1D1B18" letterSpacing="1.5">UNI&amp;CORE</text>
      <line x1="155" y1="202" x2="215" y2="202" stroke="#E4936F" strokeWidth="1.5" />
      <text x="185" y="236" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="10" fill="#4A4540" letterSpacing="2.4">VITA C</text>
      <text x="185" y="256" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="9" fill="#4A4540" letterSpacing="1.8">ENZYME</text>
      <text x="185" y="272" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="9" fill="#4A4540" letterSpacing="1.8">POWDER WASH</text>
      <circle cx="185" cy="340" r="34" fill="#fff" opacity="0.7" />
      {Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={185 + 22 * Math.cos(i * 0.9) * ((i % 3) / 3 + 0.3)} cy={340 + 22 * Math.sin(i * 0.9) * ((i % 3) / 3 + 0.3)} r={1.6} fill="#E4936F" opacity="0.7" />
      ))}
      <text x="185" y="410" textAnchor="middle" fontFamily="Helvetica, Arial" fontSize="8" fill="#7A726A" letterSpacing="1.4">30 × SINGLE-USE</text>
      {/* sticks */}
      <g transform="rotate(14 320 330)">
        <rect x="292" y="220" width="40" height="230" rx="6" fill="url(#wash-stick)" />
        <path d="M292 236 h40" stroke="#fff" strokeOpacity="0.8" strokeDasharray="3 4" />
        <text x="312" y="370" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#1D1B18" transform="rotate(-90 312 370)" letterSpacing="1.4">UNI&amp;CORE</text>
      </g>
      <g transform="rotate(26 340 350)">
        <rect x="320" y="250" width="40" height="210" rx="6" fill="url(#wash-stick)" opacity="0.9" />
      </g>
    </svg>
  );
}
