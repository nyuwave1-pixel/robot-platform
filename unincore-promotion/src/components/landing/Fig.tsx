/**
 * A figure set in the Didone, with its "+" and "-" drawn in the sans: the
 * Didone's are hairlines that disappear at display sizes. The signs stay inline
 * so they share any text fill (chrome) of the figure.
 */
export function Fig({ value }: { value: string }) {
  const lead = value.startsWith("+");
  const trail = !lead && value.endsWith("+");
  const core = value.slice(lead ? 1 : 0, trail ? -1 : undefined);
  const parts = core.split("-");
  return (
    <>
      {lead && <span className="sign relative top-[-0.06em] mr-[0.04em] font-sans text-[0.7em] font-light">+</span>}
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="sign relative top-[-0.08em] mx-[0.02em] font-sans font-light">-</span>}
          {part}
        </span>
      ))}
      {trail && <span className="sign relative top-[-0.55em] ml-[0.06em] font-sans text-[0.5em] font-light">+</span>}
    </>
  );
}
