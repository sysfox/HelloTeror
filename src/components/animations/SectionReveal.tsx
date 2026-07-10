"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  stagger,
  createTimeline,
  createScope,
  EASE,
  prefersReducedMotion,
} from "@/lib/anime";

/**
 * section 开场时间线协调器：mount 时用 createTimeline 编排
 *   强调线绘制（[data-reveal-line]）→ 子项错峰入场（[data-reveal]）
 * 节点间用相对时间 -={overlap} 衔接，让每次切页都有"开场动作"。
 *
 * FOUC：根挂 section-reveal，CSS 把 [data-reveal]/[data-reveal-line] 置初始隐态。
 * reduced-motion CSS 兜底显示。直接子级应为「普通元素」；自驱动画组件
 * （AnimeText/StaggerGroup/AnimeAccentLine）请作为兄弟而非本组件子级，避免双重控制。
 */
type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  /** 子项间错峰（ms） */
  staggerMs?: number;
  /** 与线尾部的重叠（ms） */
  overlap?: number;
  /** 入场位移（px） */
  y?: number;
  /** 单项时长（ms） */
  duration?: number;
  /** 起始延迟（ms），叠在页面过渡尾声 */
  startDelay?: number;
  lineSelector?: string;
  itemSelector?: string;
};

export function SectionReveal({
  children,
  className = "",
  staggerMs = 160,
  overlap = 200,
  y = 28,
  duration = 700,
  startDelay = 0,
  lineSelector = "[data-reveal-line]",
  itemSelector = "[data-reveal]",
}: SectionRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root });
    const line = root.querySelector<HTMLElement>(lineSelector);
    const items = root.querySelectorAll<HTMLElement>(itemSelector);

    scope.add(() => {
      const tl = createTimeline({ defaults: { ease: EASE.expo } });
      if (line) {
        tl.add(line, { scaleX: [0, 1], duration: 700 }, startDelay);
      }
      if (items.length) {
        tl.add(
          items,
          {
            opacity: [0, 1],
            translateY: [y, 0],
            duration,
            delay: stagger(staggerMs),
          },
          line ? `-=${overlap}` : startDelay
        );
      }
    });

    return () => scope.revert();
  }, [staggerMs, overlap, y, duration, startDelay, lineSelector, itemSelector]);

  return (
    <div ref={rootRef} className={`section-reveal ${className}`}>
      {children}
    </div>
  );
}
