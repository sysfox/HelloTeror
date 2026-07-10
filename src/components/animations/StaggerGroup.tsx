"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  stagger,
  createScope,
  EASE,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * 交错入场容器：对匹配 selector 的子项做透明度 + 位移 + 缩放的错峰入场。
 *
 * FOUC 策略：根挂 anime-init-children，CSS 把直接子级置 opacity:0。
 * 因此子项应为根的「直接子级」，并在其上标注 data-stagger-item（或自定义 selector）。
 * 命中 prefers-reduced-motion 时跳过，CSS 兜底显示。
 *
 * 用法：
 * <StaggerGroup>
 *   <div data-stagger-item><Card/></div>
 *   <div data-stagger-item><Card/></div>
 * </StaggerGroup>
 */
type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
  /** 子项选择器（相对根），默认 [data-stagger-item] */
  selector?: string;
  /** 子项间错峰（ms） */
  staggerMs?: number;
  /** 错峰起点 */
  from?: "first" | "center" | "last" | "random";
  /** 网格交错 [rows, cols]；非网格留空 */
  grid?: [number, number];
  /** 整体起始延迟（ms） */
  startDelay?: number;
  /** 入场位移起始（px） */
  y?: number;
  /** 入场缩放起始 */
  scale?: number;
  /** 单项时长（ms） */
  duration?: number;
  /** 触发时机 */
  trigger?: "mount" | "viewport";
  /** viewport 触发阈值 0~1 */
  threshold?: number;
};

export function StaggerGroup({
  children,
  className = "",
  selector = "[data-stagger-item]",
  staggerMs = 80,
  from = "first",
  grid,
  startDelay = 0,
  y = 40,
  scale = 0.96,
  duration = 900,
  trigger = "mount",
  threshold = 0.2,
}: StaggerGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root });
    const items = root.querySelectorAll<HTMLElement>(selector);

    const play = () => {
      if (!items.length) return;
      // 块体返回 void：scope.add 期望 ScopeConstructorCallback。
      // animate() 在 scope 上下文内执行会自动注册到 scope，revert 时一并清理。
      scope.add(() => {
        animate(items, {
          opacity: [0, 1],
          translateY: [y, 0],
          scale: [scale, 1],
          delay: stagger(staggerMs, { from, grid, start: startDelay }),
          duration,
          ease: EASE.expo,
        });
      });
    };

    if (trigger === "mount") {
      const raf = requestAnimationFrame(play);
      return () => {
        cancelAnimationFrame(raf);
        scope.revert();
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
    observer.observe(root);
    return () => {
      observer.disconnect();
      scope.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, threshold, selector, staggerMs, from, startDelay, y, scale, duration]);

  return (
    <div ref={rootRef} className={`anime-init-children ${className}`}>
      {children}
    </div>
  );
}
