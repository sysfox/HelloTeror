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
 *  - 色差：每个字符额外叠两枚青/洋红「幽灵层」，入场时左右错位、随后收束淡出，
 *    模拟镜头色散；终态只剩干净字形，避免长期色差降低可读性
 *  - 幽灵层 inline opacity:0 起步：既防 FOUC，也让 reduced-motion 下
 *    （CSS 只解除 .anime-init-children > * 的隐藏，不会命中嵌套幽灵层）保持不可见
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
  /** 色差分离强度（px），0 关闭幽灵层错位；默认 3 */
  chromatic?: number;
  /** 入场景深起始（px，沿 Z 轴后退），默认 120 */
  depth?: number;
};

/** 幽灵层动画：从错位/模糊收束到目标位置，同时淡出，只在中段可见 */
function ghostKeyframes(dir: number, chromatic: number, blur: number) {
  return {
    opacity: [0, 0.85, 0],
    translateX: [dir * chromatic * 2.2, 0],
    filter: [`blur(${Math.max(blur * 0.6, 2)}px)`, "blur(0px)"],
  };
}

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
  chromatic = 3,
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

      // 色差幽灵层：青向左、洋红向右，与主轴同 delay/duration 同步收束
      if (chromatic > 0) {
        const cyan = el.querySelectorAll<HTMLElement>(
          '[data-ghost][data-ghost-dir="-1"]'
        );
        const magenta = el.querySelectorAll<HTMLElement>(
          '[data-ghost][data-ghost-dir="1"]'
        );
        if (cyan.length) {
          anims.push(
            animate(cyan, {
              ...ghostKeyframes(-1, chromatic, blur),
              delay: delayFn,
              duration,
              ease: "outQuad",
              // 终态兜底归零：多关键帧收尾在不同运行时的处理可能有差异，
              // 显式归零避免残留一点点色边
              onComplete: () => {
                cyan.forEach((g) => {
                  g.style.opacity = "0";
                });
              },
            })
          );
        }
        if (magenta.length) {
          anims.push(
            animate(magenta, {
              ...ghostKeyframes(1, chromatic, blur),
              delay: delayFn,
              duration,
              ease: "outQuad",
              onComplete: () => {
                magenta.forEach((g) => {
                  g.style.opacity = "0";
                });
              },
            })
          );
        }
      }
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
  }, [trigger, threshold, text, staggerMs, delay, from, duration, y, rotate, blur, chromatic, depth]);

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
            {/* 青色幽灵层（向左错位） */}
            <span
              data-ghost
              data-ghost-dir="-1"
              className="pointer-events-none absolute left-0 top-0 select-none whitespace-pre"
              style={{
                color: "var(--accent, #5af2ff)",
                opacity: 0,
                willChange: "transform, opacity, filter",
              }}
            >
              {display}
            </span>
            {/* 洋红幽灵层（向右错位） */}
            <span
              data-ghost
              data-ghost-dir="1"
              className="pointer-events-none absolute left-0 top-0 select-none whitespace-pre"
              style={{
                color: "var(--accent-2, #ff3ec9)",
                opacity: 0,
                willChange: "transform, opacity, filter",
              }}
            >
              {display}
            </span>
            {/* 实心字形：压在幽灵层之上 */}
            <span className="relative" style={{ zIndex: 1 }}>
              {display}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
