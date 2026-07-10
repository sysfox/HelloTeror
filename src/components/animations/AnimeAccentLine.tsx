"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";

/**
 * SVG 描边 / 强调线绘制：替代各 section heading 里的静态 h-px 渐变线。
 * anime-line 类把 scaleX 置 0（transform-origin: left），动画到 1 完成绘制。
 * transforms 不影响布局，绘制期间仍占据空间，无布局抖动。
 * 命中 prefers-reduced-motion 时 CSS 兜底直接显示满宽。
 */
type AnimeAccentLineProps = {
  className?: string;
  style?: CSSProperties;
  /** 时长（ms） */
  duration?: number;
  /** 起始延迟（ms） */
  delay?: number;
  /** 触发时机 */
  trigger?: "mount" | "viewport";
  /** viewport 触发阈值 0~1 */
  threshold?: number;
};

export function AnimeAccentLine({
  className = "",
  style,
  duration = 850,
  delay = 120,
  trigger = "mount",
  threshold = 0.4,
}: AnimeAccentLineProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const play = () =>
      animate(el, {
        scaleX: [0, 1],
        duration,
        delay,
        ease: EASE.expo,
      });

    if (trigger === "mount") {
      const raf = requestAnimationFrame(play);
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          play();
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, threshold, duration, delay]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`anime-line h-px flex-1 max-w-[80px] ${className}`}
      style={{
        background:
          "linear-gradient(90deg, var(--accent-border), transparent)",
        ...style,
      }}
    />
  );
}
