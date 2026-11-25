import type { ReactNode } from "react";

/** No line break inside "Vita C", "vitamin C" or "1 g". */
function glue(text: string) {
  return text.replace(/\b(Vita|vitamin|Vitamin) C\b/g, "$1\u00A0C").replace(/(\d) (g|ml|oz)\b/g, "$1\u00A0$2");
}

/** Keeps hyphenated words and arrow phrases on one line ("7-day", "firmer-looking", "Powder → foam"). */
function keep(raw: string, prefix: string): ReactNode[] {
  const text = glue(raw);
  return text.split(/(\S+-\S+|\S+ → \S+)/g).map((piece, i) =>
    /-|→/.test(piece) ? (
      <span key={`${prefix}${i}`} className="whitespace-nowrap">
        {piece}
      </span>
    ) : (
      piece
    ),
  );
}

/** Headline text with one phrase marked in vitamin yellow (the showreel rule: one keyword per line). */
export function rich(text: string, accent?: string, accentClass = "hl"): ReactNode {
  if (!accent || !text.includes(accent)) return keep(text, "t");
  const [before, ...rest] = text.split(accent);
  return (
    <>
      {keep(before, "b")}
      <span className={accentClass}>{keep(accent, "a")}</span>
      {keep(rest.join(accent), "r")}
    </>
  );
}
