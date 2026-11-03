import type { Accent } from "@/content/types";

/** Full class strings so Tailwind's scanner keeps them. */
export const ACCENT: Record<Accent, { text: string; bg: string; bgLight: string; ring: string; hex: string; hexLight: string; gradient: string; texture: string }> = {
  citrus: {
    text: "text-citrus-deep",
    bg: "bg-citrus",
    bgLight: "bg-citrus-light",
    ring: "ring-citrus/30",
    hex: "#E98A15",
    hexLight: "#FBE3C2",
    gradient: "from-citrus-light via-ivory to-ivory",
    texture: "from-white to-citrus-light",
  },
  sun: {
    text: "text-[#A97A0C]",
    bg: "bg-sun",
    bgLight: "bg-sun-light",
    ring: "ring-sun/30",
    hex: "#E9B53A",
    hexLight: "#FBF0CF",
    gradient: "from-sun-light via-ivory to-ivory",
    texture: "from-white to-sun-light",
  },
  peach: {
    text: "text-[#B2593A]",
    bg: "bg-peach",
    bgLight: "bg-peach-light",
    ring: "ring-peach/30",
    hex: "#E4936F",
    hexLight: "#F9E1D5",
    gradient: "from-peach-light via-ivory to-ivory",
    texture: "from-white to-peach-light",
  },
};
