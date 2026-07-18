/**
 * Headline text helper. No entrance animation — characters are still wrapped
 * the same way as the original component so stacked block lines keep the
 * original tight display spacing (padding/margin on each glyph box).
 *
 * Pure presentational — safe as a shared module from client parents.
 */

type SplitTextProps = {
  text: string;
  /** Tag rendered as the outer container (h1, h2, span...). */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  delay?: number;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  stagger?: number;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  immediate?: boolean;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  active?: boolean;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  fromY?: number;
  /** Kept for call-site compatibility — entrance animation is disabled. */
  fromRotate?: number;
  /** Per-word className (useful for color spans on parts of the line). */
  highlightWords?: { word: string; className: string }[];
  /**
   * Applied to each per-character span. Needed for effects like
   * `bg-clip-text` gradients on a headline line.
   */
  charClassName?: string;
};

export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  highlightWords = [],
  charClassName = "",
}: SplitTextProps) {
  const highlightMap = new Map(
    highlightWords.map(({ word, className: c }) => [word, c] as const)
  );
  const words = text.split(" ");

  return (
    <Tag
      className={
        className.includes("block") ? className : `inline-block ${className}`
      }
      aria-label={text}
    >
      {words.map((word, wi) => {
        const wordClass = highlightMap.get(word) ?? "";
        return (
          <span
            key={`${wi}-${word}`}
            className={`inline-block whitespace-nowrap ${wordClass}`}
            aria-hidden
          >
            {Array.from(word).map((char, ci) => (
              <span
                key={ci}
                className="relative inline-block align-baseline"
                // Same metrics as the original split layout: extra descender
                // room cancelled by negative margin so stacked block headlines
                // keep the tight display line spacing.
                style={{ marginBottom: "-0.18em" }}
              >
                {/* Descender padding lives on the inner span so bg-clip-text
                    gradients paint under descenders (g, y, p) — on the outer
                    span the background box ends at the baseline strut and the
                    descender renders transparent at tight line-heights. */}
                <span
                  className={`inline-block ${charClassName}`}
                  style={{ paddingBottom: "0.26em" }}
                >
                  {char}
                </span>
              </span>
            ))}
            {wi < words.length - 1 && (
              <span aria-hidden className="inline-block">
                &nbsp;
              </span>
            )}
          </span>
        );
      })}
    </Tag>
  );
}
