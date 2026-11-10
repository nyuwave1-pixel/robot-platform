import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_PRODUCTS } from "@/content/products";
import { BRAND } from "@/data/brand";
import { SCENES } from "@/data/scenes";

/**
 * Stable Open Graph images (link previews in KakaoTalk, Instagram, iMessage …):
 * /og/home and /og/<product-slug>. Rendered once at build time in the site's
 * obsidian + gold look, with the official product photos (never a rendered stand-in).
 * Override per product with a real photo via CMS → SEO → OG image URL.
 */
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ slug: "home" }, ...DEFAULT_PRODUCTS.map((p) => ({ slug: p.slug }))];
}

const size = { width: 1200, height: 630 };
const ASSETS = path.join(process.cwd(), "src/app/og/assets");
const GOLD = "#E9B94D";
const IVORY = "#F6EFE2";

const asset = (name: string) => readFile(path.join(ASSETS, name));
const photo = async (key: string) => `data:image/png;base64,${(await asset(`${key}.png`)).toString("base64")}`;

async function fonts() {
  const [regular, italic] = await Promise.all([asset("cormorant-garamond-latin-500-normal.woff"), asset("cormorant-garamond-latin-500-italic.woff")]);
  return [
    { name: "Cormorant", data: regular, weight: 500 as const, style: "normal" as const },
    { name: "Cormorant", data: italic, weight: 500 as const, style: "italic" as const },
  ];
}

/** The official UNI&CORE wordmark (white), from /public/brand/unincore-logo.svg. */
const LOGO_SRC =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjkuMywgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDkuMDMgQnVpbGQgNTMzMTMpICAtLT4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSLroIjsnbTslrRfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IgoJIHk9IjBweCIgdmlld0JveD0iMCAwIDIwMS4yNiAyOC4zNSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjAxLjI2IDI4LjM1OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTIyLjEsNy44NWMtMC4wNC0yLjc3LTAuMjUtNC0wLjU4LTQuNTRjLTAuMjktMC40Ny0wLjgzLTAuNzItMi43NC0wLjg2Yy0wLjI1LTAuMDQtMC4yOS0wLjExLTAuMjktMC40MwoJCWMwLTAuNSwwLjA3LTAuNTgsMC4yOS0wLjU4YzEuNDQsMC4wNywyLjg4LDAuMTQsNC4xLDAuMTRzMi43Ny0wLjA3LDQuMDctMC4xNGMwLjI1LDAsMC4zMiwwLjA3LDAuMzIsMC41OAoJCWMwLDAuMzItMC4wNywwLjQtMC4zMiwwLjQzYy0xLjU4LDAuMTgtMi4xNiwwLjM2LTIuNTIsMC45Yy0wLjM2LDAuNTQtMC42MSwxLjczLTAuNjUsNC41bC0wLjA3LDQuMzkKCQljLTAuMDQsMi4yNy0wLjA3LDQuNS0wLjA3LDYuNTVjMCwyLjg0LTEuMDEsNS4wOC0yLjcsNi41MWMtMS44NywxLjU4LTMuODIsMi4zLTYuNTksMi4zYy0zLjQyLDAtNS45Ny0xLjAxLTcuOTItMi44NAoJCUM1LDIzLjQsNC4zNSwyMS43NCw0LjM1LDE5LjMzYzAtMi4wOSwwLjA3LTQuNjEsMC4wNy02LjkxVjcuMTNjMC0yLjg0LTAuMDctMy4zMS0wLjM2LTMuODJDMy44MSwyLjg4LDMuMzEsMi42MywxLjE4LDIuNDUKCQlDMC45MywyLjQyLDAuODYsMi4zNCwwLjg2LDIuMDJjMC0wLjUsMC4wNy0wLjU4LDAuMzItMC41OGMxLjQsMC4wNywzLjI0LDAuMTQsNC42OCwwLjE0YzEuNDgsMCwzLjMxLTAuMDcsNC42NC0wLjE0CgkJYzAuMjUsMCwwLjMyLDAuMDcsMC4zMiwwLjU4YzAsMC4zMi0wLjA3LDAuNC0wLjMyLDAuNDNDOC41NiwyLjYzLDguMTMsMi44MSw3Ljg0LDMuMzFDNy41OSwzLjc1LDcuNDEsNC40Nyw3LjQxLDcuODV2NC42NAoJCWMwLDEuNTEtMC4wNCwzLjA2LTAuMDQsNWMwLDMuNiwwLjU0LDQuOTMsMS43Myw2LjA1YzEuNDgsMS4zNywzLjQ2LDIuMDksNS41MSwyLjA5YzIuNzQsMCw0LjUtMC43Miw1Ljc2LTIuMDUKCQljMS4xMi0xLjE1LDEuNzYtMi43NCwxLjc2LTUuNThjMC0xLjE1LDAtMi4yMywwLTQuMjhMMjIuMSw3Ljg1eiIvPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTM0Ljg4LDUuMjJsMC4xNCwxNS4zM2MwLjA0LDIuODEsMC4yMiw0LjEsMC41OCw0LjY4YzAuMzIsMC41LDAuOSwwLjc2LDIuNzcsMC45CgkJYzAuMjIsMC4wNCwwLjI5LDAuMTEsMC4yOSwwLjQzYzAsMC4zNi0wLjA3LDAuNDMtMC4yOSwwLjQzYy0xLjQ0LTAuMDQtMi44OC0wLjExLTQuMS0wLjExYy0xLjI2LDAtMi45MiwwLjA3LTQuMSwwLjExCgkJYy0wLjI5LDAtMC4zNi0wLjA3LTAuMzYtMC40M2MwLTAuMzIsMC4wNy0wLjQsMC4zNi0wLjQzYzEuNzMtMC4xOCwyLjItMC40MywyLjQ4LTAuOTRjMC4zMi0wLjU4LDAuNTgtMS44LDAuNjEtNC42NGwwLjIyLTEzLjMyCgkJYzAuMDQtMS45NC0wLjIyLTMuMjgtMC41NC0zLjcxYy0wLjM2LTAuNDctMS4xNS0wLjg2LTIuOTUtMS4wNGMtMC4yOS0wLjA0LTAuMzYtMC4xMS0wLjM2LTAuNDNjMC0wLjUsMC4wNy0wLjYxLDAuMzYtMC42MQoJCWMxLjIyLDAuMDcsMi40OCwwLjExLDMuMzEsMC4xMWMwLjksMCwxLjczLDAsMy4yOC0wLjA0YzAuNzYsMS40NCwxLjQ0LDIuNTIsMi43NCw0LjM2bDguMzUsMTEuODhjMS4xNSwxLjY2LDIuMjMsMy4yLDMuNDIsNQoJCWMwLTEuNTUsMC0zLjEsMC00LjQzTDUxLjA0LDcuODVjMC0yLjY2LTAuMjktNC4wNy0wLjYxLTQuNTRjLTAuMzItMC41LTAuOTctMC43Mi0yLjc0LTAuODZjLTAuMjUtMC4wNC0wLjMyLTAuMTEtMC4zMi0wLjQzCgkJYzAtMC41LDAuMDctMC41OCwwLjMyLTAuNThjMS40NCwwLjA3LDIuODEsMC4xNCw0LjAzLDAuMTRjMS4yNiwwLDIuNzctMC4wNyw0LjAzLTAuMTRjMC4yOSwwLDAuMzYsMC4wNywwLjM2LDAuNTgKCQljMCwwLjMyLTAuMDcsMC4zNi0wLjM2LDAuNDNjLTEuNjYsMC4xNC0yLjEyLDAuNC0yLjQ1LDAuODZjLTAuMzIsMC40Ny0wLjU4LDEuODctMC42MSw0LjU0bC0wLjIyLDEyLjcxYzAsMC42NSwwLDEuMjIsMCwxLjgKCQljMCwxLjU4LDAuMDQsMi45OSwwLjA3LDQuMzZjLTEuNDQsMC45LTEuNTEsMC45NC0xLjU4LDAuOTRzLTAuMTgtMC4wNy0wLjI1LTAuMThjLTEuMTItMS44NC0yLjAyLTMuMjQtNC4xLTYuMTlMMzUuMjcsNS4yMkgzNC44OHoKCQkiLz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik02NS4xOSwyMS44NWMwLDIuNDUsMC4xMSwyLjg4LDAuNDMsMy4zNWMwLjMyLDAuNDcsMC43NiwwLjY4LDIuODQsMC44NmMwLjI5LDAuMDQsMC4zNiwwLjExLDAuMzYsMC40NwoJCWMwLDAuNC0wLjA3LDAuNDctMC4zNiwwLjQ3Yy0xLjQ0LTAuMDctMy4zMS0wLjE0LTQuNzktMC4xNGMtMS4zNywwLTMuMiwwLjA3LTQuNSwwLjE0Yy0wLjIyLDAtMC4yOS0wLjA3LTAuMjktMC40NwoJCWMwLTAuMzYsMC4wNy0wLjQzLDAuMjktMC40N2MxLjkxLTAuMTQsMi4zOC0wLjQzLDIuNjMtMC44NmMwLjM2LTAuNjEsMC40Ny0xLjE1LDAuNDctNC43MlY3Ljg1YzAtMy42Ny0wLjA3LTQtMC40My00LjU0CgkJYy0wLjI1LTAuNC0wLjY4LTAuNjgtMi44NC0wLjg2Yy0wLjI1LTAuMDQtMC4yOS0wLjExLTAuMjktMC40M2MwLTAuNSwwLjA3LTAuNTgsMC4yOS0wLjU4YzEuNCwwLjA3LDMuMzEsMC4xOCw0LjY4LDAuMTgKCQljMS40OCwwLDMuMjgtMC4xMSw0LjYxLTAuMThjMC4yOSwwLDAuMzYsMC4wNywwLjM2LDAuNThjMCwwLjMyLTAuMDcsMC40LTAuMzYsMC40M2MtMS43NiwwLjE4LTIuMywwLjM2LTIuNjMsMC44NgoJCWMtMC4zMiwwLjUtMC40NywxLjA4LTAuNDcsNC41NFYyMS44NXoiLz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik03Ni40Niw2Ljk1YzAtMi44OCwyLjIzLTUuNDcsNS43Ni01LjQ3YzMuMjQsMCw1LjMzLDEuOTQsNS4zMyw0LjQ2YzAsMi43Ny0yLjA1LDQuNzEtNi4xNiw2LjAxCgkJYzIuMzgsMy4wMiw0Ljk3LDYuMDUsNy42LDguODZjMC42MS0wLjk0LDEuMjYtMi4xNiwxLjY2LTMuMzFjMC42MS0xLjg3LDAuNjUtMi45MiwwLjQtMy4zOGMtMC40My0wLjc5LTEuNzYtMC44Ni0yLjU5LTAuOTQKCQljLTAuMjUtMC4wNC0wLjMyLTAuMTEtMC4zMi0wLjVjMC0wLjQzLDAuMDctMC41LDAuMzItMC41YzEuMjYsMC4wNywyLjU5LDAuMTQsMy44NSwwLjE0YzEuMywwLDIuMy0wLjA3LDMuNi0wLjE0CgkJYzAuMjUsMCwwLjMyLDAuMDQsMC4zMiwwLjQzYzAsMC40Ny0wLjA3LDAuNTQtMC4zMiwwLjU4Yy0wLjg2LDAuMTQtMS42OSwwLjE4LTIuMzQsMC45N2MtMC41OCwwLjc5LTAuOSwxLjg0LTEuNjksMy42NAoJCWMtMC42OCwxLjQ0LTEuMywyLjc0LTIuMTIsMy43OGMyLjM4LDIuNDgsMy42NywzLjU2LDQuNTcsNC4wM2MwLjY1LDAuMzIsMS41NSwwLjQ3LDIuMjcsMC41NGMwLjI5LDAsMC4zNiwwLDAuMzYsMC40MwoJCWMwLDAuMzYtMC4wNCwwLjQzLTAuMzIsMC40M2MtMC45Ny0wLjA3LTIuMTItMC4xNC0zLjAyLTAuMTRjLTEuMDEsMC0xLjUxLDAtMi42MywwLjA3Yy0wLjY1LTAuOS0xLjQ0LTEuNzYtMi44OC0zLjMxCgkJYy0yLjQ1LDIuNjYtNSw0LjAzLTcuODgsNC4wM2MtNC4zOSwwLTcuODUtMi45NS03Ljg1LTcuMzRjMC0zLjkyLDIuMy02LjA1LDYuMTItOC4xQzc2Ljg1LDEwLjA4LDc2LjQ2LDguNSw3Ni40Niw2Ljk1egoJCSBNNzUuMzQsMTkuM2MwLDMuNzQsMi45NSw2LjIzLDYuMDEsNi4yM2MyLjI3LDAsNC0wLjU0LDUuOTgtMi42M2MtMi44NC0zLjE3LTUuMjItNS45NC04LjIxLTkuNzkKCQlDNzYuODUsMTQuNDcsNzUuMzQsMTYuMiw3NS4zNCwxOS4zeiBNODUuMDYsNS44N2MwLTEuOTEtMS4wOC0zLjM1LTIuODgtMy4zNWMtMS42OSwwLTMuMiwxLjQ4LTMuMiwzLjg1YzAsMS41NSwwLjUsMi44OCwxLjg0LDQuNzUKCQlDODQuMDIsOS43Miw4NS4wNiw4LjI1LDg1LjA2LDUuODd6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTIwLjg0LDcuODFjMCwwLjE0LTAuMjIsMC4yNS0wLjU0LDAuMjVjLTAuMTgsMC0wLjI5LTAuMTEtMC4zNi0wLjI1Yy0wLjc5LTEuODMtMS42OS0zLjItMi45OS00LjIxCgkJYy0xLjM3LTAuOTQtMy4yNC0xLjQ4LTQuOTMtMS40OGMtNS4zMywwLTkuMzIsNC43OS05LjMyLDEyLjAyYzAsNi40OCw0LjA3LDExLjQxLDkuNjUsMTEuNDFjNC4xLDAsNi43My0xLjYyLDguODItNC45MwoJCWMwLjA3LTAuMTEsMC4yMi0wLjE4LDAuMzYtMC4xOGMwLjI5LDAsMC42OCwwLjI1LDAuNjgsMC40N2MwLDAuMTEtMC4wNCwwLjIyLTAuMTEsMC4zMmMtMi4xNiw0LTUuNCw2LjMzLTEwLjE5LDYuMzMKCQljLTcuNDUsMC0xMi43OC01LjQ3LTEyLjc4LTEzLjM1YzAtNy43NCw1LjMzLTEzLjMyLDEyLjg1LTEzLjMyYzEuNTgsMCwzLjEsMC4yMiw0LjIxLDAuNTRjMC45NywwLjI5LDEuOTEsMC41LDIuODQsMC41CgkJYzAuNCwwLDAuNzktMC4wNCwxLjI2LTAuMTFjMC4xNCwxLjg0LDAuMzIsMy44OSwwLjU0LDUuODdWNy44MXoiLz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNTEuNTEsMTQuMTVjMCw3Ljc3LTUuNTEsMTMuNDMtMTMuMDcsMTMuNDNjLTcuNTIsMC0xMy4wMy01LjY1LTEzLjAzLTEzLjM1YzAtNy43LDUuNTEtMTMuMzUsMTMuMDMtMTMuMzUKCQlDMTQ2LjAxLDAuODcsMTUxLjUxLDYuMzcsMTUxLjUxLDE0LjE1eiBNMTI4Ljk1LDE0LjE1YzAsNy4zOCwzLjk2LDEyLjE3LDkuNSwxMi4xN2M1LjUxLDAsOS41NC00Ljc5LDkuNTQtMTIuMDYKCQljMC03LjM4LTQuMS0xMi4xNy05LjU0LTEyLjE3QzEzMi45OCwyLjA5LDEyOC45NSw2Ljk1LDEyOC45NSwxNC4xNXoiLz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNjEuNjcsMjAuNDhjMCwzLjY0LDAuMDcsNC4yMSwwLjQsNC43MmMwLjI5LDAuNDcsMC43NiwwLjcyLDIuNzcsMC44NmMwLjMyLDAuMDQsMC40LDAuMTEsMC40LDAuNDcKCQljMCwwLjQtMC4wNywwLjQ3LTAuMzYsMC40N2MtMS40OC0wLjA3LTMuMjQtMC4xNC00LjY4LTAuMTRjLTEuNCwwLTMuMjQsMC4wNy00LjU3LDAuMTRjLTAuMjUsMC0wLjMyLTAuMDctMC4zMi0wLjQ3CgkJYzAtMC4zNiwwLjA3LTAuNDMsMC4zMi0wLjQ3YzIuMDItMC4xOCwyLjQ1LTAuNDMsMi43LTAuODZjMC4zMi0wLjU4LDAuNDMtMS4xNSwwLjQzLTQuNzJWNy4yN2MwLTMuMDYtMC4wNy0zLjQ5LTAuNC0zLjk2CgkJcy0wLjc5LTAuNjgtMy4wNi0wLjg2Yy0wLjI1LTAuMDQtMC4yOS0wLjExLTAuMjktMC40M2MwLTAuNSwwLjExLTAuNTgsMC4yOS0wLjU4YzEuNDQsMC4wNywzLjM1LDAuMTQsNC43MSwwLjE0CgkJYzEuMjYsMCwzLjUzLTAuMTgsNS45LTAuMThjNi4wNSwwLDguOTMsMi41OSw4LjkzLDYuNDhjMCwyLjg4LTEuODcsNS4yOS01LjY1LDYuMzdjMS4zNywyLjc0LDIuOTIsNS41NCw0Ljg5LDguNjcKCQljMS4wNCwxLjY2LDEuNTUsMi4yMywyLjIsMi42M2MwLjM2LDAuMjIsMC45NywwLjQsMi4xNiwwLjVjMC4yNSwwLjA0LDAuMzIsMC4xMSwwLjMyLDAuNDdjMCwwLjM2LTAuMDcsMC40Ny0wLjI5LDAuNDcKCQljLTEuMy0wLjA3LTIuMzQtMC4xNC0zLjMxLTAuMTRjLTAuOSwwLTEuNDQsMC0yLjQ1LDAuMDRjLTAuMzYtMC45LTAuODYtMS44NC0xLjMzLTIuN2MtMS44LTMuMTMtMy41Ni02LjMzLTUuMjYtOS40NwoJCWMtMC40NywwLjA0LTEuMTksMC4wNy0xLjc2LDAuMDdjLTAuOSwwLTEuODctMC4wNC0yLjctMC4xMVYyMC40OHogTTE2MS42NywxMy40N2MwLjc5LDAuMTEsMS42OSwwLjE4LDIuNjYsMC4xOAoJCWM0Ljc1LDAsNy4yLTIuMTYsNy4yLTUuNTRjMC0zLjQ2LTIuMDUtNS40Ny02LjQxLTUuNDdjLTIuMDIsMC0yLjYzLDAuMjItMi45OSwwLjY4Yy0wLjMyLDAuNDMtMC40NywxLjEyLTAuNDcsNC4xOFYxMy40N3oiLz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMDAuMzcsMjEuMWMtMC40MywxLjkxLTEuMTUsNC4xLTEuODcsNS45Yy0zLjA2LTAuMTEtNS45OC0wLjE4LTguOTMtMC4xOGMtMi45NSwwLTYuMjYsMC4wNy05LjI1LDAuMTgKCQljLTAuMjIsMC0wLjI5LTAuMTEtMC4yOS0wLjQ3YzAtMC4zNiwwLjA3LTAuNDMsMC4yOS0wLjQ3YzEuODMtMC4xOCwyLjI3LTAuMzYsMi42My0wLjg2YzAuMjktMC40MywwLjQzLTEuMzMsMC40My00LjcyVjcuODUKCQljMC0zLjY3LTAuMDctNC4wNy0wLjQtNC41N2MtMC4yOS0wLjQzLTAuODMtMC42OC0yLjg0LTAuODNjLTAuMjUtMC4wNC0wLjMyLTAuMDctMC4zMi0wLjQzYzAtMC40NywwLjA3LTAuNTgsMC4zMi0wLjU4CgkJYzIuOTIsMC4xNCw2LjA4LDAuMTgsOC45NiwwLjE4czUuNjktMC4wNCw4Ljc1LTAuMThjMC4xOCwxLjgsMC4zNiwzLjg1LDAuNjEsNS42OXYwLjExYzAsMC4xOC0wLjIyLDAuMzItMC41OCwwLjMyCgkJYy0wLjE0LDAtMC4yMi0wLjA0LTAuMjktMC4yMmMtMC41LTEuNTEtMS40NC0yLjg4LTIuMy0zLjU2Yy0wLjg2LTAuNjgtMi4wNS0xLjA0LTUuNDQtMS4wNGMtMi4xNiwwLTIuNzcsMC4zMi0zLjEzLDAuODYKCQljLTAuMjUsMC4zNi0wLjQsMS4wNC0wLjQsMi45OXY2LjM3YzAuNjEsMC4wNCwxLjQ4LDAuMDQsMi4zLDAuMDRjMy4xMywwLDQuMTgtMC4yNSw0Ljc1LTAuNzJjMC42OC0wLjU0LDAuOTctMS4xNSwxLjA4LTIuMwoJCWMwLjA0LTAuMjUsMC4xMS0wLjMyLDAuNC0wLjMyYzAuNDcsMCwwLjU0LDAuMDcsMC41NCwwLjMyYy0wLjA0LDEuMjItMC4wNywyLjM0LTAuMDcsMy41M2MwLDEuMzMsMC4wNCwyLjc3LDAuMDcsNC4wMwoJCWMwLDAuMjUtMC4xMSwwLjMyLTAuNTQsMC4zMmMtMC4yNSwwLTAuMzYtMC4wNy0wLjQtMC4zNmMtMC4xMS0xLjMzLTAuNTgtMi4yNy0xLjE1LTIuNjZjLTAuNS0wLjM2LTIuMDUtMC42OC00LjY4LTAuNjgKCQljLTAuODMsMC0xLjY5LDAuMDQtMi4zLDAuMDd2Ni4yNmMwLDIuOTUsMC4xNCwzLjc0LDAuNSw0LjI4YzAuNDcsMC42OCwxLjE1LDAuOTcsMy42LDAuOTdjMy4zNSwwLDQuOTctMC40LDYuMzMtMS4zNwoJCWMxLjA0LTAuNzYsMS44LTEuNzYsMi43LTMuNmMwLjA3LTAuMTgsMC4xNC0wLjI1LDAuMjUtMC4yNWMwLjM2LDAsMC42OCwwLjE4LDAuNjgsMC40TDIwMC4zNywyMS4xeiIvPgo8L2c+Cjwvc3ZnPgo=";

const Logo = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={LOGO_SRC} width={224} height={32} alt="UNI&CORE" />
);

const Card = ({ src, h, rotate = 0, shift = 0 }: { src: string; h: number; rotate?: number; shift?: number }) => (
  <div
    style={{
      display: "flex",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 30px 70px rgba(0,0,0,0.65), 0 0 60px rgba(233,185,77,0.25)",
      border: "1px solid rgba(233,185,77,0.35)",
      transform: `translateY(${shift}px) rotate(${rotate}deg)`,
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} height={h} width={Math.round(h * 0.8)} alt="" style={{ objectFit: "cover" }} />
  </div>
);

const frame = {
  width: "100%",
  height: "100%",
  display: "flex",
  padding: "64px 72px",
  fontFamily: "Cormorant",
  color: IVORY,
  background: "radial-gradient(ellipse 70% 90% at 78% 50%, #3a2a10 0%, #17120b 45%, #0b0907 100%)",
} as const;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = DEFAULT_PRODUCTS.find((x) => x.slug === slug);
  const opts = { ...size, fonts: await fonts() };

  if (!p) {
    const [wash, mask, ampoule] = await Promise.all([photo("wash"), photo("mask"), photo("ampoule")]);
    return new ImageResponse(
      (
        <div style={frame}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "46%" }}>
            <Logo />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 21, letterSpacing: 6, color: GOLD }}>THE VITA C COLLECTION</div>
              <div style={{ display: "flex", flexDirection: "column", fontSize: 80, lineHeight: 0.98, marginTop: 18 }}>
                <span>{BRAND.hero.headline[0]}</span>
                <span style={{ fontStyle: "italic", color: GOLD }}>{BRAND.hero.headline[1]}</span>
              </div>
              <div style={{ display: "flex", fontSize: 30, marginTop: 22, color: "rgba(246,239,226,0.8)" }}>{BRAND.intro.reveal}</div>
            </div>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: GOLD }}>NOW ON AMAZON.COM</div>
          </div>
          <div style={{ display: "flex", width: "54%", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <Card src={wash} h={205} rotate={-5} shift={26} />
            <Card src={mask} h={240} />
            <Card src={ampoule} h={205} rotate={5} shift={26} />
          </div>
        </div>
      ),
      opts,
    );
  }

  const s = SCENES[p.key];
  const img = await photo(p.key);
  return new ImageResponse(
    (
      <div style={frame}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "60%" }}>
          <Logo />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: GOLD }}>{`${s.step.toUpperCase()} — ${s.verb.toUpperCase()}`}</div>
            <div style={{ display: "flex", fontSize: 80, lineHeight: 1, marginTop: 16, fontStyle: "italic" }}>{s.headline}</div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 22, color: "rgba(246,239,226,0.85)" }}>{p.name}</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: GOLD }}>SHOP ON AMAZON.COM</div>
        </div>
        <div style={{ display: "flex", width: "40%", alignItems: "center", justifyContent: "flex-end" }}>
          <Card src={img} h={470} />
        </div>
      </div>
    ),
    opts,
  );
}
