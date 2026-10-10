import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
}

/** Single-line label that scrolls left on hover when truncated. */
export default function MarqueeText({ text }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const measure = () => {
    const container = containerRef.current;
    const inner = textRef.current;
    if (!container || !inner) return;
    const containerWidth = container.clientWidth;
    const textWidth = inner.scrollWidth;
    setScrollAmount(
      textWidth > containerWidth ? textWidth - containerWidth + 24 : 0
    );
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      if (containerRef.current) ro.observe(containerRef.current);
      if (textRef.current) ro.observe(textRef.current);
    }
    // Re-measure after webfonts load, which changes text width.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        measure();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{ overflow: "hidden", width: "100%", flex: 1, minWidth: 0 }}
    >
      <div
        ref={textRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          transition: "transform 2.5s linear",
          transform:
            isHovered && scrollAmount > 0
              ? `translateX(-${scrollAmount}px)`
              : "translateX(0px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
