"use client";

import { useEffect, useRef } from "react";
import { createScope, prefersReducedMotion, type Scope } from "@/lib/anime";

/**
 * anime.js createScope 的 React 集成 hook。
 *
 * - 返回 rootRef，绑到一个块级包裹元素上
 * - mount 时创建 scope 并执行 setup（在 setup 内 scope.add(() => animate(...))）
 * - cleanup 调 scope.revert()，自动恢复被动画改动的 inline 样式，避免残留 transform
 * - prefers-reduced-motion 命中时直接跳过（组件靠 CSS 兜底呈现终态）
 * - setup 用 ref 持有最新版本，避免闭包陈旧；effect 是否重跑由 deps 决定
 *
 * 适用于块级包裹的一次性入场动画（StaggerGroup / SectionReveal / AnimatedBackground 等）。
 * 内联或事件驱动的组件（AnimeText / MagneticButton / TiltCard / EnhancedCursor）请直接用
 * useEffect + 元素 ref + animate / createAnimatable。
 */
export function useAnimeScope(
  setup: (scope: Scope) => void,
  deps: unknown[]
) {
  const rootRef = useRef<HTMLDivElement>(null);
  // 最新 ref 模式：让 effect 总能拿到最新 setup，避免 stale closure；写 ref 在 render 期是安全的（无副作用）
  const setupRef = useRef(setup);
  // eslint-disable-next-line react-hooks/refs
  setupRef.current = setup;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root });
    setupRef.current(scope);
    return () => scope.revert();
    // deps 控制重跑时机；setupRef 已避免陈旧闭包
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return rootRef;
}
