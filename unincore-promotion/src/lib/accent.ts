import type { Accent } from "@/content/types";

/** Full class strings so Tailwind's scanner keeps them. */
export const ACCENT: Record<Accent, { text: string; bg: string; bgLight: string; ring: string; hex: string; hexLight: string; gradient: string; texture: string }> = {
  citrus: {
    text: "text-citrus-deep",
    bg: "bg-citrus",
    bgLight: "bg-citrus-light",
    ring: "ring-citrus/30",
    hex: "#C6A16A",
    hexLight: "#F1E6D2",
    gradient: "from-citrus-light via-ivory to-ivory",
    texture: "from-white to-citrus-light",
  },
  sun: {
    text: "text-[#8E6A1E]",
    bg: "bg-sun",
    bgLight: "bg-sun-light",
    ring: "ring-sun/30",
    hex: "#E9B94D",
    hexLight: "#FBF0CF",
    gradient: "from-sun-light via-ivory to-ivory",
    texture: "from-white to-sun-light",
  },
  peach: {
    text: "text-[#8A6A45]",
    bg: "bg-peach",
    bgLight: "bg-peach-light",
    ring: "ring-peach/30",
    hex: "#D7B48C",
    hexLight: "#F3E8DA",
    gradient: "from-peach-light via-ivory to-ivory",
    texture: "from-white to-peach-light",
  },
};
