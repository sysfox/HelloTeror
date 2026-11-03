"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  animate,
  EASE,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * HUD 能量束 / 强调线（VOID PROTOCOL）：
 * 替代各 section heading 里的静态 h-px 渐变线。
 *
 *  - 线体：.anime-line 把 scaleX 置 0（transform-origin: left），绘制到 1，
 *    青→洋红渐变 + 双层辉光，像一条被点亮的能量轨道
 *  - 束头：一个带强辉光的亮点随绘制进度从左掠到右，opacity 呈 sin 弧线
 *    （亮起→掠过→熄灭），不靠布局属性（位置用 transform: translateX(px)）
 *
 * transform 不影响布局，绘制期间仍占满 flex 空间，无布局抖动。
 * 命中 prefers-reduced-motion 时 CSS 兜底直接显示满宽；束头 inline opacity:0 保持隐藏。
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
  const lineRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = lineRef.current;
    if (!el) return;

    let anims: JSAnimation[] = [];

    const play = () => {
      const line = lineRef.current;
      const tip = tipRef.current;
      if (!line) return;

      // 束头位移按线体实际像素宽度算（flex-1 宽度运行时才确定）。
      // 必须量外层 wrapper：线体自身带 .anime-line 的 scaleX(0)，
      // getBoundingClientRect() 会返回被缩放到 0 的宽度。
      const width = wrapRef.current?.getBoundingClientRect().width ?? 0;
      // 重播（locale/页面重挂载）前先归零，避免上一次的束头残留一帧
      if (tip) tip.style.opacity = "0";
      const proxy = { p: 0 };

      anims = [
        animate(line, {
          scaleX: [0, 1],
          duration,
          delay,
          ease: EASE.expo,
        }),
        animate(proxy, {
          p: 1,
          duration,
          delay,
          ease: EASE.expo,
          onUpdate: () => {
            if (!tip) return;
            tip.style.transform = `translate3d(${proxy.p * width}px, 0, 0)`;
            tip.style.opacity = String(Math.sin(proxy.p * Math.PI));
          },
          onComplete: () => {
            if (tip) tip.style.opacity = "0";
          },
        }),
      ];
    };

    if (trigger === "mount") {
      const raf = requestAnimationFrame(play);
      return () => {
        cancelAnimationFrame(raf);
        anims.forEach((a) => a.revert());
      };
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
    return () => {
      observer.disconnect();
      anims.forEach((a) => a.revert());
    };
  }, [trigger, threshold, duration, delay]);

  return (
    <span
      ref={wrapRef}
      aria-hidden="true"
      className={`relative h-px flex-1 max-w-[80px] ${className}`}
      style={{ ...style, overflow: "visible" }}
    >
      {/* 线体：anime-line 提供 scaleX:0 初始（FOUC 安全） */}
      <span
        ref={lineRef}
        className="anime-line absolute inset-0 block"
        style={{
          background:
            "linear-gradient(90deg, var(--accent, #5af2ff), var(--accent-2, #ff3ec9))",
          boxShadow:
            "0 0 6px var(--accent-glow, rgba(90,242,255,0.35)), 0 0 18px var(--accent-soft)",
        }}
      />
      {/* 束头亮点：跟随绘制进度掠过 */}
      <span
        ref={tipRef}
        className="pointer-events-none absolute top-1/2 left-0 block w-1 h-1 -mt-0.5 -ml-0.5 rounded-full"
        style={{
          background: "var(--accent, #5af2ff)",
          boxShadow:
            "0 0 8px 2px var(--accent-glow, rgba(90,242,255,0.35))",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
    </span>
  );
}
