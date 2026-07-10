"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Parallax hook — returns a translateY offset based on element's position in viewport.
 * @param speed - Parallax speed factor. Positive = moves slower (background-like),
 *                negative = moves faster (foreground-like). Range: -1 to 1 typically.
 *                0.3 means the element moves at 30% of scroll speed in opposite direction.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.3) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    const updateOffset = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Element center relative to viewport center
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;

      // Apply parallax: element shifts opposite to scroll direction
      setOffset(distanceFromCenter * speed);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateOffset);
    };

    updateOffset();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return { ref, offset };
}
