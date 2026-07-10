"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from "react";
import { animate, stagger, EASE, prefersReducedMotion } from "@/lib/anime";

/**
 * 逐字揭示文字：将文本拆为字符 <span data-char>，用 anime.js 做
 * 透明度 + 位移 + 旋转 + 模糊的交错入场。
 *
 * FOUC 策略：父级挂 anime-init-children，CSS 先把直接子级（字符 span）
 * 置 opacity:0；动画首帧在不可见状态下写入 transform/filter 起始值，无闪烁。
 * 命中 prefers-reduced-motion 时跳过动画，CSS 兜底直接显示。
 *
 * a11y：父级给 aria-label，字符 span 标 aria-hidden，避免屏幕阅读器逐字朗读。
 */
type AnimeTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** 字符间错峰（ms） */
  staggerMs?: number;
  /** 整体起始延迟（ms） */
  delay?: number;
  /** 错峰起点 */
  from?: "first" | "center" | "last" | "random";
  /** 单字符时长（ms） */
  duration?: number;
  /** 入场位移起始（px） */
  y?: number;
  /** 入场旋转起始（deg） */
  rotate?: number;
  /** 入场模糊起始（px） */
  blur?: number;
  /** 触发时机：mount 立即 / viewport 进入视口 */
  trigger?: "mount" | "viewport";
  /** viewport 触发阈值 0~1 */
  threshold?: number;
};

export function AnimeText({
  text,
  as,
  className = "",
  style,
  staggerMs = 35,
  delay = 0,
  from = "first",
  duration = 1000,
  y = 50,
  rotate = -8,
  blur = 12,
  trigger = "mount",
  threshold = 0.3,
}: AnimeTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const play = () => {
      const chars = el.querySelectorAll<HTMLElement>("[data-char]");
      if (!chars.length) return;
      animate(chars, {
        opacity: [0, 1],
        translateY: [y, 0],
        rotateZ: [rotate, 0],
        filter: [`blur(${blur}px)`, "blur(0px)"],
        delay: stagger(staggerMs, { from, start: delay }),
        duration,
        ease: EASE.expo,
      });
    };

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
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, threshold, text, staggerMs, delay, from, duration, y, rotate, blur]);

  return (
    <Tag
      ref={ref}
      className={`anime-init-children ${className}`}
      style={style}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          data-char
          aria-hidden="true"
          className="inline-block whitespace-pre"
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </Tag>
  );
}
