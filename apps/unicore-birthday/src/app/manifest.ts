import type { MetadataRoute } from "next";
import { seo } from "@/data/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: seo.siteName,
    short_name: "1ST BIRTHDAY",
    description: seo.description,
    start_url: "/",
    display: "standalone",
    lang: "ko-KR",
    background_color: "#080706",
    theme_color: "#080706",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }, { src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  };
}
