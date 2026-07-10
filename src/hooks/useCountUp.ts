"use client";

import { useEffect, useState } from "react";
import { animate, EASE, prefersReducedMotion } from "@/lib/anime";

/**
 * Count-up animation hook — animates a number from 0 to `end` when triggered.
 *
 * 内部用 anime.js 驱动一个 JS 对象的 v 属性（outExpo 平滑减速），
 * onUpdate 同步到 React state。对外签名与旧版完全一致（StatsSection 零改动）。
 * prefers-reduced-motion 直接置终值。
 *
 * @param end - 目标数值
 * @param options.duration - 动画时长 ms（默认 2000）
 * @param options.start - 何时开始（默认 mount 立即）
 * @param options.decimals - 小数位（默认 0）
 */
export function useCountUp(
  end: number,
  options: {
    duration?: number;
    start?: boolean;
    decimals?: number;
  } = {}
) {
  const { duration = 2000, start = true, decimals = 0 } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (prefersReducedMotion()) {
      // rAF 延迟 setState，避免 effect 内同步触发级联渲染
      const raf = requestAnimationFrame(() => setValue(end));
      return () => cancelAnimationFrame(raf);
    }

    const obj = { v: 0 };
    const anim = animate(obj, {
      v: end,
      duration,
      ease: EASE.expo,
      onUpdate: () => {
        const v = obj.v;
        setValue(
          decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v)
        );
      },
      onComplete: () => setValue(end),
    });

    return () => {
      anim.pause();
    };
  }, [end, duration, start, decimals]);

  return value;
}
