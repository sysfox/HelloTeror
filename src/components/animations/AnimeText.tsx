"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from "react";
import {
  animate,
  stagger,
  EASE,
  prefersReducedMotion,
  type JSAnimation,
} from "@/lib/anime";

/**
 * 逐字「材质化」入场（VOID PROTOCOL）：
 *  - 主轴：Z 轴从深处（translateZ(-depth)）拉回 + 模糊对焦 + 位移/旋转收敛，
 *    让字符像从体积黑暗里被镜头拉出来，而不是简单的 fade-up
 *  - 不叠加色差幽灵层：此前的青/洋红错位重影会被读成「字体损坏」，已移除；
 *    标题只保留干净的逐字纵深入场，视觉重点交回背景 3D 场景
 *
 * FOUC 策略：父级挂 anime-init-children，CSS 先把直接子级（字符 wrapper）
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
  /** 入场景深起始（px，沿 Z 轴后退），默认 120 */
  depth?: number;
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
  depth = 120,
}: AnimeTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    const anims: JSAnimation[] = [];

    const play = () => {
      const chars = el.querySelectorAll<HTMLElement>("[data-char]");
      if (!chars.length) return;

      const delayFn = stagger(staggerMs, { from, start: delay });

      // 主轴：整字从深处拉回 + 对焦
      anims.push(
        animate(chars, {
          opacity: [0, 1],
          translateY: [y, 0],
          translateZ: [-depth, 0],
          rotateZ: [rotate, 0],
          filter: [`blur(${blur}px)`, "blur(0px)"],
          delay: delayFn,
          duration,
          ease: EASE.expo,
          // 结束后撤掉 blur(0px)：inline filter 会永久建立 backdrop root
          onComplete: () => {
            chars.forEach((c) => {
              c.style.filter = "";
            });
          },
        })
      );
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
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      anims.forEach((a) => a.revert());
    };
  }, [trigger, threshold, text, staggerMs, delay, from, duration, y, rotate, blur, depth]);

  return (
    <Tag
      ref={ref}
      className={`anime-init-children ${className}`}
      style={{ perspective: "1000px", ...style }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => {
        const display = ch === " " ? "\u00A0" : ch;
        return (
          <span
            key={i}
            data-char
            aria-hidden="true"
            className="relative inline-block whitespace-pre"
            style={{ willChange: "transform, opacity, filter" }}
          >
            {display}
          </span>
        );
      })}
    </Tag>
  );
}
