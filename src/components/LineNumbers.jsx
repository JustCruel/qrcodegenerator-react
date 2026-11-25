/**
 * Gutter of line numbers for a textarea. Rendered through React (no innerHTML).
 * The parent keeps `scrollTop` in sync via the forwarded ref.
 */
export default function LineNumbers({ value, gutterRef }) {
  const count = value.split('\n').length;

  return (
    <div className="line-numbers" ref={gutterRef} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  );
}
