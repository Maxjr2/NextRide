/** Skip-to-content link — first focusable element on every page (WCAG 2.4.1). */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        absolute -left-full top-0 z-[9999]
        px-6 py-3 bg-offer text-white font-bold text-base rounded-br-btn
        focus:left-0
        transition-[left]
      "
    >
      Zum Inhalt springen
    </a>
  );
}
