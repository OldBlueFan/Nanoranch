/* PLACEHOLDER for the real nanoranch mark.
 *
 * Direction: the };{ glyph — brace, semicolon, brace — with
 * nano•ranch beneath. Two standing rules, enforced in hero.css:
 *   - the };{ glyphs are ALWAYS presented in italic (Crimson
 *     Pro's true italic face; wght-italic import in main.jsx)
 *   - the mark is ALWAYS monochrome — one colour for glyphs and
 *     wordmark alike (white or black by presentation context;
 *     here it inherits --ink), never per-glyph accents Readings the future entrance is built on:
 *   }  and  {   the two birds, converging from left and right
 *   ;           butterfly head-and-body, and equally a sapling
 *               rising from soil (dot = seed-head, comma = the
 *               curl of a new stem/root)
 *
 * The glyphs are separate spans NOW because the entrance stage
 * animates them on three vectors: } in from the left, { in from
 * the right, the semicolon rising from the bottom, with
 * nano•ranch settling in beneath. Keep the structure when the
 * real mark replaces this stub.
 */
export default function Mark() {
  return (
    <div className="mark" role="img" aria-label="nano ranch">
      <span className="mark__glyph" aria-hidden="true">
        <span className="mark__bird mark__bird--left">{'}'}</span>
        <span className="mark__body">;</span>
        <span className="mark__bird mark__bird--right">{'{'}</span>
      </span>
      <span className="mark__wordmark" aria-hidden="true">
        nano<span className="mark__sep">•</span>ranch
      </span>
    </div>
  );
}
