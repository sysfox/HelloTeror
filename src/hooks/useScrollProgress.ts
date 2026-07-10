"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks scroll progress through a section element.
 * Returns a value from 0 (section just entered from bottom) to 1 (section fully scrolled past).
 * - 0 = section top is at viewport bottom
 * - 0.5 = section center is at viewport center
 * - 1 = section bottom is at viewport top
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    const updateProgress = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Section top relative to viewport bottom
      const sectionTop = rect.top;
      const sectionHeight = rect.height;

      // Total scroll distance from section entering to section leaving
      const totalDistance = sectionHeight + windowHeight;

      // How far we've scrolled into the section (negative when below viewport)
      const scrolled = windowHeight - sectionTop;

      const raw = scrolled / totalDistance;
      const clamped = Math.max(0, Math.min(1, raw));

      setProgress(clamped);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}
